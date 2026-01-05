import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Divider,
  Avatar,
  LinearProgress,
  Chip,
  Collapse,
  Grow,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import apiPayment from '../services/apiPayment';
import apiOrder from '../services/apiOrder';
import CloseIcon from '@mui/icons-material/Close';

/*
  Payment.jsx — Dedicated Razorpay payment page

  Expected incoming location.state:
    {
      orderId: string|number,
      razorpayOrderId: string|null,
      amount: number,        // in rupees (e.g., 499.00)
      currency: 'INR',
      productSummary: [ { name, quantity, unitPrice } ]  // optional
    }

  Behavior:
  - If razorpayOrderId is missing, calls POST /payment/create-order { orderId, amount }
    via apiPayment to create a Razorpay order on server.
  - Shows a polished order card with product lines and totals.
  - Opens Razorpay checkout popup when user clicks Pay Now.
  - On successful popup, calls POST /payment/verify with payment details to verify server-side.
  - Redirects to /order/history on success.
  - Provides retry, cancel, and lightweight inline status UI.
  - Requires the Razorpay script to be present in index.html:
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
*/

const Payment = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const state = loc.state || {};

  const [orderId, setOrderId] = useState(state.orderId ?? null);
  const [razorpayOrderId, setRazorpayOrderId] = useState(state.razorpayOrderId ?? null);
  const [amount, setAmount] = useState(Number(state.amount ?? 0));
  const [currency, setCurrency] = useState(state.currency ?? 'INR');
  const [items, setItems] = useState(state.productSummary ?? []);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'info' | 'success' | 'error', text }
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // If amount missing but orderId present, fetch order snapshot
        if ((!amount || amount <= 0) && orderId) {
          setStatus({ type: 'info', text: 'Loading order details…' });
          const resp = await apiOrder.get(`/order/${orderId}`);
          if (!mounted) return;
          const order = resp?.data;
          const derived = order?.totalAmount ?? order?.total ?? order?.items?.reduce?.((s, it) => s + (Number(it.price ?? it.unitPrice ?? 0) * (Number(it.quantity ?? it.qty ?? 1))), 0) ?? 0;
          setAmount(Number(derived));
          setItems(order?.items ?? items);
          setStatus({ type: 'success', text: 'Order details loaded' });
        }

        // If no razorpayOrderId create one via server
        if (!razorpayOrderId && amount > 0) {
          setStatus({ type: 'info', text: 'Preparing secure payment…' });
          const resp = await apiPayment.post('/payment/create-order', { orderId, amount });
          if (!mounted) return;
          const data = resp?.data ?? {};
          const id = data?.razorpayOrderId ?? data?.order?.razorpayOrderId ?? null;
          if (id) {
            setRazorpayOrderId(id);
            setStatus({ type: 'success', text: 'Payment ready' });
          } else {
            // server returned something else; keep whatever available
            setRazorpayOrderId(data?.razorpayOrderId ?? null);
            setStatus({ type: 'error', text: 'Failed to prepare payment on server' });
          }
        }
      } catch (err) {
        console.error('Init payment failed', err);
        setStatus({ type: 'error', text: 'Failed to prepare payment. Please retry.' });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, amount, razorpayOrderId, attempts]);

  const show = (text, type = 'info') => {
    setStatus({ type, text });
    clearTimeout(show._t);
    show._t = setTimeout(() => setStatus(null), 5000);
  };

  const openRazorpay = () => {
    if (!razorpayOrderId || !amount) {
      show('Payment not ready. Please try again', 'error');
      return;
    }

    if (!window.Razorpay) {
      show('Razorpay SDK not available. Ensure script is added.', 'error');
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_RaY9z3R9tBZW8H',
      amount: Math.round(Number(amount) * 100),
      currency: currency || 'INR',
      name: 'Mithran Millets',
      description: `Order ${orderId ?? ''}`,
      order_id: razorpayOrderId,
      handler: async function (response) {
        setProcessing(true);
        show('Verifying payment…', 'info');
        try {
          // Send server the payment response for verification
          const verification = await apiPayment.post('/payment/verify', { ...response, orderId, razorpayOrderId });
          const ok = verification?.data?.verified || verification?.data?.status === 'OK' || verification.status === 200;
          if (ok) {
            show('Payment verified — Thank you!', 'success');
            // short delay to show success then navigate
            setTimeout(() => navigate('/order/history'), 900);
          } else {
            console.warn('Verification unexpected:', verification);
            show('Payment verification failed. Contact support.', 'error');
            setProcessing(false);
          }
        } catch (err) {
          console.error('Payment verification error', err);
          show(err?.response?.data?.message ?? 'Payment verification failed', 'error');
          setProcessing(false);
        }
      },
      modal: {
        ondismiss: function () {
          show('Payment cancelled', 'info');
        }
      },
      prefill: {
        name: '', contact: '',
      },
      theme: { color: '#1b4332' },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Razorpay open error', err);
      show('Failed to open payment dialog', 'error');
    }
  };

  const tryAgain = () => {
    setAttempts(a => a + 1);
    setLoading(true);
    setRazorpayOrderId(null);
    setStatus(null);
  };

  const cancel = async () => {
    // optional: inform server to cancel or unlock order; graceful fallback to go back
    setStatus({ type: 'info', text: 'Cancelling and returning to checkout…' });
    setTimeout(() => navigate('/checkout'), 500);
  };

  const formattedAmount = (n) => `₹${(Number(n) || 0).toFixed(2)}`;

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg,#fbf7ef,#f0e6cf)', py: 10 }}>
      <Container maxWidth="md">
        <Grow in timeout={600}>
          <Paper elevation={10} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, background: 'linear-gradient(180deg,#fff,#fbfaf6)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar sx={{ bgcolor: '#e8f6ef', color: '#0b3d2e' }}>💳</Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0b3d2e' }}>Secure Payment</Typography>
                <Typography variant="caption" sx={{ color: '#7a8a7a' }}>Powered by Razorpay — your transaction is encrypted and secure</Typography>
              </Box>
              <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                <Chip label={formattedAmount(amount)} color="primary" sx={{ fontWeight: 800 }} />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Collapse in={Boolean(status)} sx={{ mb: 2 }}>
              <Box sx={{
                px: 2, py: 1, borderRadius: 1.5,
                background: status?.type === 'error' ? '#ffece6' : status?.type === 'success' ? '#e8f7ee' : '#fff8e6',
                border: status?.type === 'error' ? '1px solid #ffb4a9' : '1px solid rgba(13,60,45,0.06)',
                color: status?.type === 'error' ? '#8a1f11' : '#134a2b',
                fontWeight: 700,
              }}>
                {status?.text}
                <IconButton size="small" onClick={() => setStatus(null)} sx={{ ml: 1, float: 'right' }}><CloseIcon fontSize="small" /></IconButton>
              </Box>
            </Collapse>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
              <Box>
                <Paper sx={{ p: 2, borderRadius: 2, background: '#fffef9', border: '1px solid rgba(13,60,45,0.03)' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Order Details</Typography>

                  <List disablePadding>
                    {Array.isArray(items) && items.length ? items.map((it, idx) => {
                      const name = it.name ?? it.productName ?? `Item ${idx + 1}`;
                      const qty = it.quantity ?? it.qty ?? 1;
                      const unit = Number(it.unitPrice ?? it.price ?? 0);
                      const line = unit * qty;
                      return (
                        <ListItem key={idx} sx={{ py: 0.75 }}>
                          <ListItemText
                            primary={<Typography sx={{ fontWeight: 700 }}>{name}</Typography>}
                            secondary={<Typography variant="caption" sx={{ color: '#6b6b6b' }}>{qty} × {formattedAmount(unit)}</Typography>}
                          />
                          <Typography sx={{ fontWeight: 800 }}>{formattedAmount(line)}</Typography>
                        </ListItem>
                      );
                    }) : (
                      <ListItem>
                        <ListItemText primary="No item details available" />
                      </ListItem>
                    )}

                    <Divider sx={{ my: 1 }} />

                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText primary="Amount" />
                      <Typography sx={{ fontWeight: 900 }}>{formattedAmount(amount)}</Typography>
                    </ListItem>
                  </List>
                </Paper>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="outlined" onClick={cancel} disabled={processing}>Cancel</Button>
                  <Button variant="contained" onClick={openRazorpay} disabled={loading || processing} sx={{ px: 3, fontWeight: 800 }}>
                    {processing ? 'Processing…' : 'Pay Now'}
                  </Button>
                </Box>

                <Box sx={{ mt: 2 }}>
                  {loading && <LinearProgress />}
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Button variant="text" onClick={tryAgain} disabled={loading} sx={{ color: '#6b6b6b' }}>Try preparing payment again</Button>
                </Box>
              </Box>

              <Box>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Payment Summary</Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#546c60' }}>Amount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{formattedAmount(amount)}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#546c60' }}>Gateway</Typography>
                    <Typography variant="body2">Razorpay</Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="caption" sx={{ color: '#8b918a', display: 'block' }}>
                    By clicking Pay Now you will be redirected to Razorpay's secure popup to complete the payment. After successful payment your transaction will be verified by the server.
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Button variant="outlined" size="small" onClick={() => window.open('https://razorpay.com', '_blank')}>About Razorpay</Button>
                    <Button variant="text" size="small" onClick={() => window.open('/terms', '_self')} sx={{ ml: 1 }}>Terms</Button>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Paper>
        </Grow>
      </Container>
    </Box>
  );
};

export default Payment;
