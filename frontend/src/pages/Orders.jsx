/*
  src/pages/Orders.jsx

  Purpose:
  - Orders page: lists past orders, normalizes backend payloads, and provides actions like Manage and Help.
  - Polls periodically and refetches on window focus to keep statuses fresh.
*/

/**
 * Orders
 * Displays user's order history and allows navigation to order detail pages.
 */

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  Grid,
  Divider,
  List,
  ListItem,
  Chip,
  Avatar,
  Stack,
  Skeleton,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Grow from '@mui/material/Grow';
import apiOrder from '../services/apiOrder';

/*
  Orders.jsx
  - Dynamically renders all items per order (no fixed row count)
  - Keeps visual consistency via minHeight, consistent paddings, and shared tokens
  - Minimal actions: Manage (per order) and Continue Shopping
*/

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    let mounted = true;

    const normalize = (raw = []) =>
      raw.map((o, oi) => {
        const sourceItems = Array.isArray(o.items)
          ? o.items
          : Array.isArray(o.orderItems)
            ? o.orderItems
            : Array.isArray(o.order_items)
              ? o.order_items
              : Array.isArray(o.products)
                ? o.products
                : Array.isArray(o.product_items)
                  ? o.product_items
                  : [];

        const items = sourceItems.map((it, idx) => {
          const detectQty = (() => {
            if (!it) return 0;
            if (typeof it.quantity === 'number') return it.quantity;
            if (typeof it.qty === 'number') return it.qty;
            if (typeof it.count === 'number') return it.count;
            if (typeof it.quantity === 'string' && it.quantity.trim() !== '') return Number(it.quantity);
            if (typeof it.qty === 'string' && it.qty.trim() !== '') return Number(it.qty);
            if (it.orderItem && (it.orderItem.quantity != null)) return Number(it.orderItem.quantity);
            if (it.product && (it.product.quantity != null)) return Number(it.product.quantity);
            return 0;
          })();

          const detectPrice = (() => {
            if (!it) return 0;
            if (typeof it.unitPrice === 'number') return it.unitPrice;
            if (typeof it.price === 'number') return it.price;
            if (typeof it.unitPrice === 'string' && it.unitPrice.trim() !== '') return Number(it.unitPrice);
            if (typeof it.price === 'string' && it.price.trim() !== '') return Number(it.price);
            if (it.orderItem && (it.orderItem.price != null)) return Number(it.orderItem.price);
            if (it.product && (it.product.price != null)) return Number(it.product.price);
            return 0;
          })();

          return {
            productId: it?.productId ?? it?.id ?? it?.product?.id ?? `${oi}-${idx}`,
            name: it?.productName ?? it?.name ?? it?.product?.name ?? 'Product',
            qty: Number.isFinite(detectQty) ? detectQty : 0,
            unitPrice: Number.isFinite(detectPrice) ? detectPrice : 0,
            imageUrl: it?.imageUrl ?? it?.image ?? it?.product?.imageUrl ?? '/default-product.jpg',
          };
        });

        return {
          id: o?.id ?? o?.orderId ?? o?._id ?? `order-${oi}-${Math.random().toString(36).slice(2, 8)}`,
          // prefer explicit status fields from backend; avoid assuming 'PLACED' when missing
          status: o?.status ?? o?.orderStatus ?? o?.statusCode ?? 'UNKNOWN',
          orderDate: o?.orderDate ?? o?.createdAt ?? null,
          paymentMethod: o?.paymentMethod ?? o?.payment_mode ?? '—',
          address: o?.address ?? o?.shippingAddress ?? null,
          items,
          raw: o,
        };
      });

    const fetch = () => {
      apiOrder.get('/order/history')
        .then(res => {
          if (!mounted) return;
          const raw = Array.isArray(res.data) ? res.data : [];
          const normalized = normalize(raw);
          normalized.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
          setOrders(normalized);
        })
        .catch(() => setOrders([]))
        .finally(() => { if (mounted) setLoading(false); });
    };

    setLoading(true);
    fetch();
    const id = setInterval(fetch, 15000);
    // Refetch when window/tab regains focus so statuses reflect recent backend changes
    window.addEventListener('focus', fetch);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const palette = {
    primary: '#245a43',
    muted: '#8fa49a',
    border: 'rgba(13,60,45,0.08)',
  };

  const pageBg = {
    backgroundImage: 'linear-gradient(180deg, #fbf7ef 0%, #f6efe0 50%, #efe6d4 100%)',
    minHeight: '100vh',
    py: { xs: 5, md: 8 },
  };

  const cardSx = {
    p: { xs: 2.5, md: 3.5 },
    borderRadius: 3,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,249,244,0.98))',
    border: `1px solid ${palette.border}`,
    boxShadow: '0 8px 24px rgba(11,61,46,0.06)',
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      return dt.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch { return String(d); }
  };

  const getTotal = (order) => {
    if (!order) return 0;
    const sum = (Array.isArray(order.items) ? order.items : []).reduce((s, it) => s + (it.unitPrice || 0) * (it.qty || 0), 0);
    return Number.isFinite(sum) ? sum : 0;
  };

  const currency = (n) => `₹${(Number(n) || 0).toFixed(2)}`;

  const formatAddress = (a) => {
    if (!a) return 'Address not provided';
    return [a.name, a.phone, a.street, a.city, a.state ? `${a.state} - ${a.pincode || ''}` : a.pincode].filter(Boolean).join(', ') || 'Address not provided';
  };

  const statusMeta = (s) => {
    const st = String(s || 'UNKNOWN').toUpperCase();
    switch (st) {
      case 'PLACED': case 'CONFIRMED': return { label: st, color: palette.primary, bg: '#eaf6ef' };
      case 'SHIPPED': return { label: st, color: '#2c6e49', bg: '#e6f4ee' };
      case 'DELIVERED': return { label: st, color: '#1e5631', bg: '#e9f7ee' };
      case 'CANCELLED': return { label: st, color: '#8b1d1d', bg: '#fdecec' };
      default: return { label: st, color: '#6b6b6b', bg: '#f2f2f2' };
    }
  };

  const Loading = (
    <Stack spacing={3}>
      {[1,2,3].map(i => (
        <Grow in key={i}>
          <Paper sx={cardSx}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Skeleton variant="rectangular" width={180} height={36} />
                  <Skeleton width={120} />
                  <Skeleton width={220} />
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
                  <Skeleton width={120} height={32} />
                  <Skeleton width={80} />
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Box sx={{ display: 'flex', gap: 2, py: 1 }}>
                    <Skeleton variant="rectangular" width={64} height={48} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="45%" />
                      <Skeleton width="30%" />
                    </Box>
                    <Skeleton width={80} />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grow>
      ))}
    </Stack>
  );

  return (
    <Box sx={pageBg}>
      <Container maxWidth="md">
        <Typography variant="h4" align="center" sx={{ fontFamily: 'Georgia, serif', fontWeight: 800, color: palette.primary, mb: 1 }}>
          📦 Your Orders
        </Typography>
        

        {loading && Loading}

        {!loading && (!Array.isArray(orders) || orders.length === 0) && (
          <Paper sx={{ p: 6, borderRadius: 4, background: 'linear-gradient(180deg,#fff,#fff8e1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#274c3f', mb: 1 }}>
              No orders yet
            </Typography>
            <Typography variant="body1" sx={{ color: '#556864', mb: 3 }}>
              Start shopping to see orders here.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button variant="contained" onClick={() => navigate('/products')} sx={{ background: palette.primary, color: '#fff', fontWeight: 700, borderRadius: 28 }}>
                🛍️ Continue Shopping
              </Button>
            </Box>
          </Paper>
        )}

        {!loading && Array.isArray(orders) && orders.length > 0 && (
          <Stack spacing={3}>
            {orders.map((order, idx) => {
              const items = Array.isArray(order.items) ? order.items : [];
              const total = getTotal(order);
              const status = statusMeta(order.status);

              return (
                <Grow in timeout={200 + idx * 60} key={order.id}>
                  <Paper sx={cardSx}>
                    <Grid container spacing={2} alignItems="stretch">
                      {/* left header */}
                      <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', minHeight: 56 }}>
                          <Box sx={{ minWidth: 200 }}>
                            <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>
                              Order #{order.id}
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.disabled, mt: 0.5 }}>
                              {formatDate(order.orderDate)}
                            </Typography>
                          </Box>

                          <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', md: 'block' } }} />

                          <Box sx={{ minWidth: 160 }}>
                            <Typography variant="body2" sx={{ color: '#4b6b59', fontWeight: 700 }}>
                              {items.length} item{items.length !== 1 ? 's' : ''}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.disabled, display: 'block', maxWidth: 420, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {items.length ? items.map(i => i.name).slice(0, 6).filter(Boolean).join(', ') : '—'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* header right */}
                      <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', gap: 2, minHeight: 56 }}>
                          <Chip label={status.label} sx={{ fontWeight: 800, bgcolor: status.bg, color: status.color, borderRadius: 2, minWidth: 110 }} />
                          <Box sx={{ textAlign: 'right', minWidth: 110 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: palette.primary }}>{currency(total)}</Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>{order.paymentMethod}</Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                      </Grid>

                      {/* items list: dynamic length */}
                      <Grid item xs={12} md={8}>
                        <List disablePadding>
                          {items.map((it, i) => (
                            <ListItem key={`${order.id}-item-${it.productId ?? i}`} sx={{ py: 1.25, px: 0, alignItems: 'center', borderBottom: i < items.length - 1 ? '1px solid rgba(13,60,45,0.06)' : 'none', minHeight: 68 }}>
                              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar src={it.imageUrl} alt={it.name} variant="rounded" sx={{ width: 64, height: 48, bgcolor: '#f6f5f1', flexShrink: 0 }} imgProps={{ onError: (e) => { e.currentTarget.src = '/default-product.jpg'; } }} />
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#274c3f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 420 }}>
                                    {it.name ?? '—'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    {it.qty} × {currency(it.unitPrice)}
                                  </Typography>
                                </Box>
                              </Box>

                              <Box sx={{ ml: 2, textAlign: 'right', minWidth: 110 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: palette.primary }}>
                                  {currency((it.unitPrice || 0) * (it.qty || 1))}
                                </Typography>
                              </Box>
                            </ListItem>
                          ))}

                          {/* if an order has zero items, show a placeholder row to avoid collapse */}
                          {items.length === 0 && (
                            <ListItem sx={{ py: 1.25, px: 0, alignItems: 'center', minHeight: 68 }}>
                              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar variant="rounded" sx={{ width: 64, height: 48, bgcolor: '#f6f5f1' }} />
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#274c3f' }}>No items</Typography>
                                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>This order has no items</Typography>
                                </Box>
                              </Box>
                            </ListItem>
                          )}
                        </List>

                        <Box sx={{ mt: 2, p: 2, borderRadius: 2, background: '#fbfbf7', border: `1px solid ${palette.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 72 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#274c3f' }}>Shipping to</Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatAddress(order.address)}</Typography>
                          </Box>
                          <Button size="small" variant="text" onClick={() => navigate(`/order/${order.id}`)} sx={{ color: palette.primary, fontWeight: 700 }}>Manage</Button>
                        </Box>
                      </Grid>

                      {/* summary column: fixed minHeight to keep visual alignment */}
                      <Grid item xs={12} md={4}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: palette.border, minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700, mb: 1 }}>Order summary</Typography>
                            <Stack spacing={1}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Subtotal</Typography>
                                <Typography variant="body2" sx={{ color: palette.primary }}>{currency(total)}</Typography>
                              </Box>
                              <Divider sx={{ my: 1 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>Total</Typography>
                                <Typography variant="body1" sx={{ color: palette.primary, fontWeight: 800 }}>{currency(total)}</Typography>
                              </Box>
                            </Stack>
                          </Box>

                          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Button fullWidth size="small" onClick={() => navigate('/products')} sx={{ borderRadius: 2, color: palette.primary }}>Continue Shopping</Button>
                            <Button fullWidth size="small" variant="contained" onClick={() => navigate('/support')} sx={{ borderRadius: 2, background: palette.primary, color: '#fff' }}>Help</Button>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grow>
              );
            })}
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default Orders;
