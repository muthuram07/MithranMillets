import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Typography,
  Container,
  Paper,
  CircularProgress,
  Box,
  Button,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Inventory2 as InventoryIcon,
  ShoppingCart as OrdersIcon,
  People as UsersIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiProduct from '../../services/apiProduct';
import apiOrder from '../../services/apiOrder';
import api from '../../services/api';
import { toast } from 'react-toastify';

/* Recharts (install: npm i recharts) */
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const COLORS = {
  primary: '#2d6a4f',
  muted: '#9aa',
  cardBg: '#ffffff',
  cardSurface: '#f6f7f6',
};

const StatCardFull = ({ title, value, delta, icon }) => (
  <Paper
    elevation={3}
    sx={{
      p: 2.5,
      borderRadius: 2,
      display: 'flex',
      gap: 2,
      alignItems: 'center',
      width: '100%',
    }}
  >
    <Box sx={{ bgcolor: COLORS.cardSurface, p: 1.25, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </Box>

    <Box sx={{ flex: 1 }}>
      <Typography variant="caption" sx={{ color: COLORS.muted, fontWeight: 700 }}>{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0b3d2e' }}>{value}</Typography>
    </Box>

    <Box sx={{ textAlign: 'right', minWidth: 96 }}>
      <Typography variant="body2" sx={{ color: delta >= 0 ? '#2e7d32' : '#b00020', fontWeight: 700 }}>
        {delta >= 0 ? `+${delta}` : delta}
      </Typography>
      <Typography variant="caption" sx={{ color: COLORS.muted }}>since last</Typography>
    </Box>
  </Paper>
);

const formatDateKey = (d) => {
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}`;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0 });
  const [prev, setPrev] = useState({ products: 0, orders: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  
  // Admin creation dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [adminForm, setAdminForm] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminFormErrors, setAdminFormErrors] = useState({});

  const fetchAllStats = useCallback(async (showToast = false) => {
    setLoading(true);
    try {
      const [prodRes, orderRes, userRes] = await Promise.allSettled([
        apiProduct.get('/products'),
        apiOrder.get('/order/admin/all'),
        api.get('/auth/admin/users'),
      ]);

      const prodList = prodRes.status === 'fulfilled' && Array.isArray(prodRes.value.data) ? prodRes.value.data : [];
      const orderList = orderRes.status === 'fulfilled' && Array.isArray(orderRes.value.data) ? orderRes.value.data : [];
      const userList = userRes.status === 'fulfilled' && Array.isArray(userRes.value.data) ? userRes.value.data : [];

      setPrev({ ...stats });
      setProducts(prodList);
      setOrders(orderList);
      setUsers(userList);
      setStats({
        products: prodList.length,
        orders: orderList.length,
        users: userList.length,
      });

      if (showToast) console.log('Dashboard refreshed');
    } catch (err) {
      console.error(err);
      console.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, [stats]);

  useEffect(() => {
    fetchAllStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + Number(o.totalAmount ?? o.total ?? 0), 0), [orders]);

  const ordersByStatus = useMemo(() => {
    const map = {};
    for (const o of orders) {
      const s = (o.status ?? 'UNKNOWN').toUpperCase();
      map[s] = (map[s] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const salesLast7Days = useMemo(() => {
    const map = new Map();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      map.set(formatDateKey(d), 0);
    }
    for (const o of orders) {
      const key = formatDateKey(o.orderDate ?? o.createdAt ?? Date.now());
      if (map.has(key)) {
        map.set(key, map.get(key) + Number(o.totalAmount ?? o.total ?? 0));
      }
    }
    return Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const sales = new Map();
    for (const o of orders) {
      const items = o.items ?? [];
      for (const it of items) {
        const name = it.productName ?? it.name ?? `#${it.productId ?? it.id ?? 'unknown'}`;
        const qty = Number(it.quantity ?? it.qty ?? 1);
        sales.set(name, (sales.get(name) || 0) + qty);
      }
    }
    return Array.from(sales.entries()).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [orders]);

  const pieColors = ['#2d6a4f', '#e9c46a', '#f4a261', '#e76f51', '#8ab17d'];

  const validateAdminForm = () => {
    const errors = {};
    if (!adminForm.username || !adminForm.username.trim()) {
      errors.username = 'Username is required';
    } else if (adminForm.username.length > 50) {
      errors.username = 'Username must be under 50 characters';
    }
    if (!adminForm.password || adminForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!adminForm.email || !adminForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(adminForm.email)) {
      errors.email = 'Email should be valid';
    }
    if (!adminForm.fullName || !adminForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (adminForm.fullName.length > 100) {
      errors.fullName = 'Full name must be under 100 characters';
    }
    if (adminForm.phone && !/^\d{10}$/.test(adminForm.phone)) {
      errors.phone = 'Phone number must be 10 digits';
    }
    setAdminFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAdmin = async () => {
    if (!validateAdminForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setCreatingAdmin(true);
    try {
      const payload = {
        username: adminForm.username.trim(),
        password: adminForm.password,
        role: 'ADMIN',
        email: adminForm.email.trim(),
        fullName: adminForm.fullName.trim(),
        phone: adminForm.phone || null,
      };

      await api.post('/auth/admin/create', payload);
      toast.success('Admin created successfully!');
      setOpenDialog(false);
      setAdminForm({ username: '', password: '', email: '', fullName: '', phone: '' });
      setAdminFormErrors({});
      // Refresh stats to update user count
      fetchAllStats();
    } catch (err) {
      console.error('Admin creation error:', err);
      const errorMsg = err?.response?.data?.message || 'Failed to create admin';
      toast.error(errorMsg);
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setAdminForm({ username: '', password: '', email: '', fullName: '', phone: '' });
    setAdminFormErrors({});
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0b3d2e' }}>Admin Dashboard</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            startIcon={<PersonAddIcon />}
            onClick={() => setOpenDialog(true)}
            variant="contained"
            size="small"
            sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#1b4332' } }}
          >
            Create Admin
          </Button>
          <Button startIcon={<RefreshIcon />} onClick={() => fetchAllStats(true)} variant="outlined" size="small">
            Refresh
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={3}>
        {/* Full-width stat cards stacked vertically */}
        <StatCardFull title="Total Products" value={stats.products} delta={stats.products - (prev.products ?? 0)} icon={<InventoryIcon sx={{ color: COLORS.primary }} />} />
        <StatCardFull title="Total Orders" value={stats.orders} delta={stats.orders - (prev.orders ?? 0)} icon={<OrdersIcon sx={{ color: COLORS.primary }} />} />
        <StatCardFull title="Total Users" value={stats.users} delta={stats.users - (prev.users ?? 0)} icon={<UsersIcon sx={{ color: COLORS.primary }} />} />

        <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Revenue (total)</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0b3d2e' }}>₹{totalRevenue.toFixed(2)}</Typography>
          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Sales last 7 days</Typography>
          <Box sx={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesLast7Days}>
                <XAxis dataKey="date" tick={{ fill: '#556' }} />
                <YAxis tick={{ fill: '#556' }} />
                <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                <Line type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Orders by status</Typography>
          <Box sx={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ordersByStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4} label>
                  {ordersByStatus.map((entry, idx) => <Cell key={`c-${idx}`} fill={pieColors[idx % pieColors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Top selling products (by quantity)</Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" tick={{ fill: '#556' }} />
                <YAxis dataKey="name" type="category" width={160} tick={{ fill: '#556' }} />
                <Tooltip />
                <Bar dataKey="qty" fill={COLORS.primary} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Quick stats</Typography>
          <Stack spacing={1}>
            <Box>
              <Typography variant="body2" sx={{ color: COLORS.muted }}>Average order value</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>₹{(orders.length ? (totalRevenue / orders.length) : 0).toFixed(2)}</Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ color: COLORS.muted }}>Open orders</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{ordersByStatus.find(s => s.name === 'PLACED')?.value ?? 0}</Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ color: COLORS.muted }}>Fulfilled / Cancelled</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {ordersByStatus.find(s => s.name === 'DELIVERED')?.value ?? 0} / {ordersByStatus.find(s => s.name === 'CANCELLED')?.value ?? 0}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ color: COLORS.muted }}>Products low in stock</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{products.filter(p => (p.stock ?? 0) <= 5).length}</Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>

      {/* Admin Creation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0b3d2e' }}>Create New Admin</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={adminForm.fullName}
              onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
              error={Boolean(adminFormErrors.fullName)}
              helperText={adminFormErrors.fullName}
              required
            />
            <TextField
              fullWidth
              label="Username"
              value={adminForm.username}
              onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
              error={Boolean(adminFormErrors.username)}
              helperText={adminFormErrors.username}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={adminForm.email}
              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
              error={Boolean(adminFormErrors.email)}
              helperText={adminFormErrors.email}
              required
            />
            <TextField
              fullWidth
              label="Phone (10 digits)"
              value={adminForm.phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                setAdminForm({ ...adminForm, phone: digits });
              }}
              error={Boolean(adminFormErrors.phone)}
              helperText={adminFormErrors.phone || 'Optional'}
              inputProps={{ maxLength: 10 }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              error={Boolean(adminFormErrors.password)}
              helperText={adminFormErrors.password || 'Minimum 8 characters'}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={creatingAdmin}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateAdmin}
            variant="contained"
            disabled={creatingAdmin}
            sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#1b4332' } }}
          >
            {creatingAdmin ? <CircularProgress size={20} /> : 'Create Admin'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
