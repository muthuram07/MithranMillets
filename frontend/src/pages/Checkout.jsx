/*
  src/pages/Checkout.jsx

  Purpose:
  - Checkout flow: select address, review items and place order.
  - Handles address add/edit and order summary.
*/

/**
 * Checkout
 * Renders checkout form and payment summary.
 */

import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import {
  Container, TextField, Button, Typography, Paper, Box, Divider,
  Radio, RadioGroup, FormControlLabel, FormControl, CircularProgress,
  Chip, Collapse, Grow, LinearProgress, IconButton, Avatar, Grid
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import apiOrder from '../services/apiOrder';
import apiPayment from '../services/apiPayment';

const Checkout = () => {
  const { cart, refreshCartFromServer, clearLocalCart } = useContext(CartContext);
  const navigate = useNavigate();

  // Address & UI
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [newAddress, setNewAddress] = useState(null);
  const [selectedAddressValue, setSelectedAddressValue] = useState('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', street: '', city: '', state: '', pincode: '' });
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Start gate for form
  const [formStarted, setFormStarted] = useState(false);

  // Validation errors
  const [formErrors, setFormErrors] = useState({});

  // Payment & order
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Summary & totals
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // Cart items returned by backend (GET /order/cart)
  const [serverCartItems, setServerCartItems] = useState([]);
  const [loadingCartItems, setLoadingCartItems] = useState(true);

  // authoritative totals endpoint
  const [cartTotals, setCartTotals] = useState({ totalQuantity: 0, subtotal: 0 });
  const [loadingTotals, setLoadingTotals] = useState(true);

  // sound ref for success chime
  const audioCtxRef = useRef(null);

  // UI helpers
  const show = (text, type = 'info') => {
    setStatusMessage({ text, type });
    clearTimeout(show._t);
    show._t = setTimeout(() => setStatusMessage(null), 4200);
  };

  const formatLabel = (addr) => {
    if (!addr) return '';
    return [
      addr.name,
      addr.phone,
      addr.street,
      addr.city,
      addr.state ? `${addr.state} - ${addr.pincode || ''}` : addr.pincode
    ]
      .filter(Boolean)
      .join(', ');
  };

  // cart preview (client fallback)
  const cartPreview = useMemo(() => {
    if (!Array.isArray(cart)) return [];
    return cart.map(ci => ({
      productId: ci.id ?? ci.productId,
      quantity: ci.qty ?? ci.quantity ?? 1,
      unitPrice: ci.price ?? ci.unitPrice ?? 0,
      name: ci.name ?? ci.productName,
    }));
  }, [cart]);

  // fetch saved address
  useEffect(() => {
    let mounted = true;
    apiOrder.get('/order/address')
      .then(res => {
        if (!mounted) return;
        const d = res?.data;
        const addr = d?.address ?? (Array.isArray(d) ? d[0] : d);
        if (addr && typeof addr === 'object') {
          setDefaultAddress(addr);
          setSelectedAddressValue(JSON.stringify(addr));
        }
      })
      .catch(err => console.error('address fetch', err));
    return () => { mounted = false; };
  }, []);

  // fetch server-side summary (GET /order/summary or POST preview)
  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const resp = await apiOrder.get('/order/cart-totals');
      if (resp?.data) {
        setSummary(resp.data);
        setLoadingSummary(false);
        return;
      }
    } catch (error) {
      console.warn("GET summary failed → trying POST preview", error);
    }

    try {
      const resp2 = await apiOrder.post('/order/summary', { items: cartPreview });
      setSummary(resp2?.data ?? null);
    } catch (error) {
      console.error("POST summary failed", error);
      setSummary(null);
      show("❌ Failed to load order summary", 'error');
    } finally {
      setLoadingSummary(false);
    }
  };

  // fetch cart items from backend (GET /order/cart)
  const fetchServerCartItems = async () => {
    setLoadingCartItems(true);
    try {
      const resp = await apiOrder.get('/order/cart'); // GET /order/cart
      setServerCartItems(Array.isArray(resp?.data) ? resp.data : []);
    } catch (err) {
      console.error('fetch server cart items', err);
      setServerCartItems(cartPreview);
    } finally { setLoadingCartItems(false); }
  };

  // fetch authoritative totals
  const fetchCartTotals = async () => {
    setLoadingTotals(true);
    try {
      const resp = await apiOrder.get('/order/cart-totals'); // GET /order/cart-totals
      const d = resp?.data;
      if (d) {
        setCartTotals({
          totalQuantity: Number(d.totalQuantity ?? d.totalQty ?? d.totalItems ?? 0),
          subtotal: Number(d.subtotal ?? d.subTotal ?? d.amount ?? 0),
        });
      } else {
        const q = cartPreview.reduce((s, it) => s + (it.quantity ?? 1), 0);
        const ssum = cartPreview.reduce((s, it) => s + ((it.unitPrice ?? 0) * (it.quantity ?? 1)), 0);
        setCartTotals({ totalQuantity: q, subtotal: ssum });
      }
    } catch (err) {
      console.error('fetch cart totals', err);
      const q = cartPreview.reduce((s, it) => s + (it.quantity ?? 1), 0);
      const ssum = cartPreview.reduce((s, it) => s + ((it.unitPrice ?? 0) * (it.quantity ?? 1)), 0);
      setCartTotals({ totalQuantity: q, subtotal: ssum });
    } finally { setLoadingTotals(false); }
  };

  // initial loads and when cart changes
  useEffect(() => {
    fetchSummary();
    fetchServerCartItems();
    fetchCartTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartPreview.length, JSON.stringify(cartPreview), cart?.length]);

  const handleFormChange = async (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'pincode') {
      const p = String(value || '').trim();
      if (p.length === 6) {
        try {
          const r = await fetch(`https://api.postalpincode.in/pincode/${p}`);
          const j = await r.json();
          const postOffice = j?.[0]?.PostOffice?.[0];
          if (postOffice) setFormData(prev => ({ ...prev, city: postOffice.District || prev.city, state: postOffice.State || prev.state }));
        } catch (e) { console.error('pincode', e); }
      }
    }
  };

  // validation helpers (mirror server-side)
  const phoneRegex = /^[6-9]\d{9}$/;
  const pincodeRegex = /^\d{6}$/;

  const validateForm = (data) => {
    const errs = {};
    if (!data.name || data.name.trim() === '') errs.name = 'Name is required';
    if (!data.phone || data.phone.trim() === '') errs.phone = 'Phone number is required';
    else if (!phoneRegex.test(data.phone.trim())) errs.phone = 'Invalid Indian phone number';
    if (!data.street || data.street.trim() === '') errs.street = 'Street is required';
    if (!data.city || data.city.trim() === '') errs.city = 'City is required';
    if (!data.state || data.state.trim() === '') errs.state = 'State is required';
    if (!data.pincode || data.pincode.trim() === '') errs.pincode = 'Pincode is required';
    else if (!pincodeRegex.test(data.pincode.trim())) errs.pincode = 'Pincode must be 6 digits';
    return errs;
  };

  const handleStartForm = () => {
    setFormStarted(true);
    setFormErrors({});
  };

  const handleCancelNewAddress = () => {
    setFormStarted(false);
    setShowNewAddressForm(false);
    setFormErrors({});
    setFormData({ name: '', phone: '', street: '', city: '', state: '', pincode: '' });
    setEditingAddressId(null);
  };

  const handleSaveNewAddress = async () => {
    if (!formStarted) {
      show('Press Start to enable the form', 'error');
      return;
    }
    const errs = validateForm(formData);
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    const { name, phone, street, city, state, pincode } = formData;

    try {
      let res;
      if (editingAddressId) {
        // edit existing address via PATCH
        res = await apiOrder.patch(`/order/address/${editingAddressId}`, { name, phone, street, city, state, pincode });
      } else {
        // create new address
        res = await apiOrder.post('/order/address', { name, phone, street, city, state, pincode });
      }
      const saved = res?.data ?? { name, phone, street, city, state, pincode };
      setNewAddress(saved);
      // update primary/default address immediately so UI reflects the change
      setDefaultAddress(saved);
      setSelectedAddressValue(JSON.stringify(saved));
      setShowNewAddressForm(false);
      setFormStarted(false);
      setFormData({ name: '', phone: '', street: '', city: '', state: '', pincode: '' });
      setFormErrors({});
      setEditingAddressId(null);
      show('Address saved', 'success');
      // Refresh dependent data
      fetchSummary();
      fetchCartTotals();
      fetchServerCartItems();
    } catch (err) {
      console.error('save address', err);
      show('Failed to save address', 'error');
    }
  };

  const mapCartToServerItems = (clientCart) => clientCart.map(ci => ({
    productId: ci.productId ?? ci.id,
    quantity: ci.quantity ?? ci.qty ?? 1,
    price: ci.unitPrice ?? ci.price ?? 0,
  }));

  // Play a short success melody using WebAudio (no external file)
  const playSuccessChime = () => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const now = ctx.currentTime;

      const freqs = [660, 880, 990]; // simple pleasant ascending tones
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, now + i * 0.12);
        g.gain.setValueAtTime(0, now + i * 0.12);
        g.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.01);
        g.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.22);
        o.connect(g).connect(ctx.destination);
        o.start(now + i * 0.12);
        o.stop(now + i * 0.12 + 0.25);
      });
    } catch (e) {
      console.warn('audio failed', e);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressValue) { show('Select an address', 'error'); return; }
    let selectedObj = null;
    try { selectedObj = JSON.parse(selectedAddressValue); } catch { show('Invalid address', 'error'); return; }
    if (!cart || cart.length === 0) { show('Cart is empty', 'error'); return; }

    const payload = {
      items: mapCartToServerItems(cartPreview),
      paymentMethod,
      address: selectedObj,
    };

    setPlacingOrder(true);
    show('Placing order…', 'info');

    try {
      clearLocalCart(); // optimistic
      const res = await apiOrder.post('/order/place', payload);
      const order = res?.data;
      if (!order) throw new Error('No order returned');

      if (paymentMethod === 'COD') {
        setOrderPlaced(true);
        await refreshCartFromServer();
        playSuccessChime();
        // funny popup message (non-blocking)
        show('🎉 Your millet party starts soon!', 'success');
        // redirect to a dedicated success page with order info
        setTimeout(() => navigate('/order/success', { state: { order }, replace: true }), 900);        return;
      }

      // Prefer server amount if present, else use our computed grandTotal
      const amount = Number(
        order?.totalAmount ??
        order?.total ??
        summary?.grandTotal ??
        cartTotals.subtotal ?? 0
      );

      const paymentState = {
        orderId: order?.id ?? order?.orderNo ?? null,
        razorpayOrderId: order?.razorpayOrderId ?? order?.payment?.razorpayOrderId ?? null,
        amount,
        currency: 'INR',
      };
      playSuccessChime();
      navigate('/payment', { state: paymentState });
    } catch (err) {
      console.error('place order', err);
      try { await refreshCartFromServer(); } catch (e) { console.error(e); }
      show(err?.response?.data?.message ?? err?.message ?? 'Failed to place order', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  // format helpers
  const currency = (n) => `₹${(Number(n) || 0).toFixed(2)}`;

  // UI totals (prefer server totals for subtotal, but tax/delivery are computed here)
  const totalItems = (cartTotals?.totalQuantity ?? (cartPreview.reduce((s, it) => s + (it.quantity ?? 1), 0) ?? 0));
  const computedSubtotal = summary?.subtotal ?? cartTotals.subtotal ?? cartPreview.reduce((s, it) => s + ((it.unitPrice ?? 0) * (it.quantity ?? 1)), 0);

  // Always compute tax as 5% of subtotal
  const tax = computedSubtotal * 0.05;

  // Keep discount from server if available (else 0)
  const discount = summary?.discount ?? 0;

  // Delivery: free if subtotal >= 499, else ₹40
  const delivery = computedSubtotal >= 499 ? 0 : 40;

  // Grand total based on our rules
  const grandTotal = computedSubtotal + tax + delivery - discount;

  // styles
  const pageBg = { background: 'radial-gradient(circle at 10% 10%, #fffaf0 0%, #f3e7d6 30%, #efe6d4 100%)', minHeight: '100vh', py: 8, px: 2 };
  const card = { p: { xs: 3, md: 4 }, borderRadius: 3, background: 'linear-gradient(180deg,#fff,#fbfaf6)', border: '1px solid rgba(13,60,45,0.06)', boxShadow: '0 16px 48px rgba(11,61,46,0.08)' };
  const invoiceSx = { mt: 3, p: 3, borderRadius: 2, background: 'linear-gradient(180deg,#ffffff,#fffaf3)', border: '1px solid rgba(13,60,45,0.04)', boxShadow: '0 8px 30px rgba(11,61,46,0.06)' };
  const company = { color: '#0b3d2e', fontFamily: 'Georgia, serif', fontWeight: 900 };

  return (
    <Box sx={pageBg}>
      <Container maxWidth="md">
        <Grow in timeout={600}>
          <Paper elevation={10} sx={card}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h4" sx={{ fontFamily: 'Georgia, serif', fontWeight: 900, color: '#153b2e' }}>Checkout</Typography>
              <Chip label={`${totalItems} items`} sx={{ ml: 'auto', fontWeight: 800, bgcolor: '#eef6ef' }} />
              <IconButton onClick={() => { fetchSummary(); fetchCartTotals(); fetchServerCartItems(); }} size="small" aria-label="refresh summary"><RefreshIcon /></IconButton>
            </Box>

            <Collapse in={Boolean(statusMessage)} sx={{ mb: 2 }}>
              <Box sx={{ px: 2, py: 1, borderRadius: 1.5, background: statusMessage?.type === 'error' ? '#ffece6' : '#e9f7ee', color: statusMessage?.type === 'error' ? '#8a1f11' : '#134a2b', fontWeight: 700, textAlign: 'center' }}>
                {statusMessage?.text}
              </Box>
            </Collapse>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
              {/* left column */}
              <Box>
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Shipping Address</Typography>

                  {defaultAddress ? (
                    <Paper sx={{ p: 2, borderRadius: 2, background: '#fffdf7', border: '1px solid rgba(13,60,45,0.03)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 800 }}>{defaultAddress.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#6b6b6b' }}>{formatLabel(defaultAddress)}</Typography>
                        </Box>
                        <Radio checked={selectedAddressValue === JSON.stringify(defaultAddress)} onChange={() => setSelectedAddressValue(JSON.stringify(defaultAddress))} />
                      </Box>

                      {newAddress && (
                        <Box sx={{ mt: 1 }}>
                          <Radio checked={selectedAddressValue === JSON.stringify(newAddress)} onChange={() => setSelectedAddressValue(JSON.stringify(newAddress))} />
                        </Box>
                      )}

                      <Divider sx={{ my: 1 }} />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          // Open form immediately for editing the saved address (prefill), or for adding new
                          setShowNewAddressForm(true);
                          setFormStarted(true);
                          if (defaultAddress && typeof defaultAddress === 'object') {
                            setFormData({
                              name: defaultAddress.name || '',
                              phone: defaultAddress.phone || '',
                              street: defaultAddress.street || '',
                              city: defaultAddress.city || '',
                              state: defaultAddress.state || '',
                              pincode: defaultAddress.pincode || ''
                            });
                            setEditingAddressId(defaultAddress.id ?? null);
                          } else {
                            setFormData({ name: '', phone: '', street: '', city: '', state: '', pincode: '' });
                            setEditingAddressId(null);
                          }
                        }}
                      >
                        Edit address
                      </Button>
                    </Paper>
                  ) : (
                    <Paper sx={{ p: 2, borderRadius: 2, background: '#fffdf7', border: '1px solid rgba(13,60,45,0.03)' }}>
                      <Typography>No saved address</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setShowNewAddressForm(true);
                          setFormStarted(true);
                          setEditingAddressId(null);
                          setFormData({ name: '', phone: '', street: '', city: '', state: '', pincode: '' });
                        }}
                        sx={{ mt: 1 }}
                      >Add address</Button>
                    </Paper>
                  )}
                </FormControl>

                <Collapse in={showNewAddressForm} sx={{ mt: 2 }}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>New Address</Typography>

                    {/* Start gate */}
                    {!formStarted ? null : (
                       /* Actual form (enabled only after Start) */
                       <Box sx={{ display: 'grid', gap: 1, mt: 1 }}>
                        <TextField
                          label="Name"
                          value={formData.name}
                          onChange={e => handleFormChange('name', e.target.value)}
                          fullWidth
                          error={!!formErrors.name}
                          helperText={formErrors.name}
                        />
                        <TextField
                          label="Phone"
                          value={formData.phone}
                          onChange={e => handleFormChange('phone', e.target.value)}
                          fullWidth
                          inputProps={{ maxLength: 10 }}
                          error={!!formErrors.phone}
                          helperText={formErrors.phone}
                        />
                        <TextField
                          label="Street"
                          value={formData.street}
                          onChange={e => handleFormChange('street', e.target.value)}
                          fullWidth
                          error={!!formErrors.street}
                          helperText={formErrors.street}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            label="Pincode"
                            value={formData.pincode}
                            onChange={e => handleFormChange('pincode', e.target.value)}
                            fullWidth
                            inputProps={{ maxLength: 6 }}
                            error={!!formErrors.pincode}
                            helperText={formErrors.pincode}
                          />
                          <TextField
                            label="City"
                            value={formData.city}
                            onChange={e => handleFormChange('city', e.target.value)}
                            fullWidth
                            error={!!formErrors.city}
                            helperText={formErrors.city}
                          />
                        </Box>
                        <TextField
                          label="State"
                          value={formData.state}
                          onChange={e => handleFormChange('state', e.target.value)}
                          fullWidth
                          error={!!formErrors.state}
                          helperText={formErrors.state}
                        />

                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Button
                            variant="contained"
                            onClick={async () => {
                              const errs = validateForm(formData);
                              if (Object.keys(errs).length) {
                                setFormErrors(errs);
                                return;
                              }
                              await handleSaveNewAddress();
                            }}
                          >
                            Save address
                          </Button>

                          <Button variant="text" onClick={() => {
                            setFormStarted(false);
                            setShowNewAddressForm(false);
                            setEditingAddressId(null);
                            setFormErrors({});
                            setFormData({ name: '', phone: '', street: '', city: '', state: '', pincode: '' });
                          }}>
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Collapse>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6">Payment Method</Typography>
                <RadioGroup value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} sx={{ mb: 2 }}>
                  <FormControlLabel value="COD" control={<Radio />} label="Cash on Delivery" />
                  <FormControlLabel value="RAZORPAY" control={<Radio />} label="Online Payment (Razorpay)" />
                </RadioGroup>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="outlined" onClick={() => navigate(-1)} disabled={placingOrder}>Back</Button>
                  <Button variant="contained" color="primary" onClick={handlePlaceOrder} disabled={placingOrder} sx={{ px: 3, fontWeight: 800 }}>
                    {placingOrder ? 'Processing…' : (paymentMethod === 'RAZORPAY' ? 'Pay Online' : 'Place Order')}
                  </Button>
                </Box>

                {placingOrder && <LinearProgress sx={{ mt: 2 }} />}

                {/* Invoice / Bill-like section (tile layout) */}
                <Box sx={invoiceSx}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Avatar sx={{ bgcolor: '#e8f6ef', color: '#0b3d2e' }}><ReceiptLongIcon /></Avatar>
                    <Box>
                      <Typography sx={company} variant="h6">Mithran Millets</Typography>
                      <Typography variant="caption" sx={{ color: '#6b6b6b', display: 'block' }}>Premium Millets — Invoice</Typography>
                    </Box>
                    <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Invoice</Typography>
                      <Typography variant="caption" sx={{ color: '#7a8a7a' }}>{new Date().toLocaleString()}</Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={7}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Ship To</Typography>
                      <Typography variant="body2" sx={{ color: '#274c3f' }}>{defaultAddress ? formatLabel(defaultAddress) : (newAddress ? formatLabel(newAddress) : 'No address selected')}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <Paper elevation={0} sx={{ p: 1, borderRadius: 1, background: '#fffef9' }}>
                        <Typography variant="caption" sx={{ color: '#6b6b6b' }}>Summary</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Items</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{totalItems}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Subtotal</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{currency(computedSubtotal)}</Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* tile header */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 1fr 1fr 1fr' }, gap: 1, mb: 1 }}>
                    <Box sx={{ fontWeight: 800 }}>Product</Box>
                    <Box sx={{ textAlign: 'right', fontWeight: 800 }}>Qty</Box>
                    <Box sx={{ textAlign: 'right', fontWeight: 800 }}>Unit</Box>
                    <Box sx={{ textAlign: 'right', fontWeight: 800 }}>Line</Box>
                  </Box>

                  {/* items as tiles */}
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    {(loadingCartItems ? (cartPreview) : (serverCartItems.length ? serverCartItems : cartPreview)).map((it, i) => {
                      const name = it.name ?? it.productName ?? it.title ?? `Item ${i + 1}`;
                      const qty = it.quantity ?? it.qty ?? it.qtyOrdered ?? 1;
                      const unit = Number(it.unitPrice ?? it.price ?? it.amount ?? 0);
                      const line = unit * qty;
                      return (
                        <Box key={i} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 1fr 1fr 1fr' }, gap: 1, p: 1, alignItems: 'center', borderRadius: 1, background: '#fff', border: '1px solid rgba(13,60,45,0.03)' }}>
                          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: 1 }}>{name}</Box>
                          <Box sx={{ textAlign: 'right' }}>{qty}</Box>
                          <Box sx={{ textAlign: 'right' }}>{currency(unit)}</Box>
                          <Box sx={{ textAlign: 'right', fontWeight: 800 }}>{currency(line)}</Box>
                        </Box>
                      );
                    })}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* totals tiles */}
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Subtotal</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{currency(computedSubtotal)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Tax (5%)</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{currency(tax)}</Typography>
                    </Box>
                    {discount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Discount</Typography>
                        <Typography sx={{ fontWeight: 800, color: '#1b7a5a' }}>-{currency(discount)}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2">Delivery</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{delivery > 0 ? currency(delivery) : 'Free'}</Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Total</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#153b2e' }}>{currency(grandTotal)}</Typography>
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button variant="outlined" size="small" onClick={() => fetchSummary()}>Recalculate</Button>
                      <Button variant="text" size="small" onClick={() => navigate('/cart')}>Edit Cart</Button>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {/* <Typography variant="caption" sx={{ color: '#7a8a7a' }}>This is a system-generated invoice preview. Final invoice is issued after payment and confirmation.</Typography> */}
                    <Box>
                      {/* <Button size="small" variant="outlined" onClick={() => { fetchSummary(); fetchCartTotals(); fetchServerCartItems(); }}>Refresh</Button> */}
                      <Button size="small" variant="contained" sx={{ ml: 1 }} onClick={() => window.print()}>Print</Button>
                    </Box>
                  </Box>
                </Box>
                {/* end invoice */}
              </Box>

              {/* right column: summary card */}
              <Box>
                <Paper sx={{ p: 2, borderRadius: 2, background: '#fff' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Order Summary</Typography>
                  {loadingSummary ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2">Subtotal</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{currency(computedSubtotal)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2">Tax (5%)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{currency(tax)}</Typography>
                      </Box>
                      {discount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="body2">Discount</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#1b7a5a' }}>-{currency(discount)}</Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2">Delivery</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{delivery > 0 ? currency(delivery) : 'Free'}</Typography>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Total</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#153b2e' }}>{currency(grandTotal)}</Typography>
                      </Box>

                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button variant="outlined" size="small" onClick={() => fetchSummary()}>Recalculate</Button>
                        <Button variant="text" size="small" onClick={() => navigate('/cart')}>Edit Cart</Button>
                      </Box>
                    </>
                  )}
                </Paper>
              </Box>
            </Box>
          </Paper>
        </Grow>
      </Container>
    </Box>
  );
};

export default Checkout;
