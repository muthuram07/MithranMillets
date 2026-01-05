import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Typography, Grid, Avatar, List, ListItem, Divider, Chip, Button, Stack } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import apiOrder from '../services/apiOrder';

const palette = {
  primary: '#245a43',
  border: 'rgba(13,60,45,0.08)'
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

const normalizeOrder = (o = {}) => {
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
      productId: it?.productId ?? it?.id ?? it?.product?.id ?? `${idx}`,
      name: it?.productName ?? it?.name ?? it?.product?.name ?? 'Product',
      qty: Number.isFinite(detectQty) ? detectQty : 0,
      unitPrice: Number.isFinite(detectPrice) ? detectPrice : 0,
      imageUrl: it?.imageUrl ?? it?.image ?? it?.product?.imageUrl ?? '/default-product.jpg',
    };
  });

  return {
    id: o?.id ?? o?.orderId ?? o?._id ?? 'order-unknown',
    status: o?.status ?? o?.orderStatus ?? o?.statusCode ?? 'UNKNOWN',
    orderDate: o?.orderDate ?? o?.createdAt ?? null,
    paymentMethod: o?.paymentMethod ?? o?.payment_mode ?? '—',
    address: o?.address ?? o?.shippingAddress ?? null,
    items,
    raw: o,
  };
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiOrder.get(`/order/${id}`)
      .then(res => {
        if (!mounted) return;
        const data = res?.data ?? {};
        setOrder(normalizeOrder(data));
      })
      .catch(err => {
        console.error('Order fetch error', err);
        if (mounted) setError('Unable to load order.');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  const getTotal = (ord) => {
    if (!ord) return 0;
    return (Array.isArray(ord.items) ? ord.items : []).reduce((s, it) => s + (it.unitPrice || 0) * (it.qty || 0), 0);
  };

  return (
    <Box sx={{ minHeight: '80vh', py: 6, background: 'linear-gradient(180deg, #fbf7ef 0%, #f6efe0 50%, #efe6d4 100%)' }}>
      <Container maxWidth="md">
        <Button variant="text" onClick={() => navigate(-1)} sx={{ mb: 2 }}>← Back</Button>

        <Paper elevation={6} sx={{ p: 3, borderRadius: 3 }}>
          {loading && <Typography>Loading order…</Typography>}
          {error && <Typography color="error">{error}</Typography>}

          {!loading && !error && order && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: palette.primary }}>Order #{order.id}</Typography>
                <Chip label={statusMeta(order.status).label} sx={{ bgcolor: statusMeta(order.status).bg, color: statusMeta(order.status).color, fontWeight: 800 }} />
              </Box>

              <Typography variant="body2" sx={{ color: '#556864', mb: 2 }}>Payment: {order.paymentMethod}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <List disablePadding>
                    {order.items.map((it, i) => (
                      <ListItem key={`${it.productId}-${i}`} sx={{ py: 1.25, px: 0, alignItems: 'center', borderBottom: i < order.items.length - 1 ? '1px solid rgba(13,60,45,0.06)' : 'none' }}>
                        <Avatar src={it.imageUrl} alt={it.name} variant="rounded" sx={{ width: 72, height: 56, bgcolor: '#f6f5f1', mr: 2 }} imgProps={{ onError: (e) => { e.currentTarget.src = '/default-product.jpg'; } }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 700 }}>{it.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#556864' }}>{it.qty} × {currency(it.unitPrice)}</Typography>
                        </Box>
                        <Box sx={{ minWidth: 110, textAlign: 'right' }}>
                          <Typography sx={{ fontWeight: 800, color: palette.primary }}>{currency((it.unitPrice || 0) * (it.qty || 1))}</Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: palette.border }}>
                    <Typography variant="subtitle2" sx={{ color: '#556864', fontWeight: 700 }}>Shipping to</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>{formatAddress(order.address)}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ color: '#556864', fontWeight: 700 }}>Order summary</Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Subtotal</Typography>
                        <Typography variant="body2">{currency(getTotal(order))}</Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                        <Typography variant="body1">Total</Typography>
                        <Typography variant="body1">{currency(getTotal(order))}</Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ mt: 2 }}>
                      <Button fullWidth variant="contained" onClick={() => navigate('/support')} sx={{ backgroundColor: palette.primary, color: '#fff' }}>Contact Support</Button>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default OrderDetail;
