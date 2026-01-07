import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AdminSetup = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.body.classList.add('no-navbar');
    checkAdminExists();
    return () => {
      document.body.classList.remove('no-navbar');
    };
  }, []);

  const checkAdminExists = async () => {
    try {
      const res = await api.get('/auth/admin/check');
      setAdminExists(res.data?.hasAdmin || false);
      if (res.data?.hasAdmin) {
        // Admin exists, redirect to admin login after 3 seconds
        setTimeout(() => {
          navigate('/admin/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Error checking admin:', err);
      toast.error('Failed to check admin status');
    } finally {
      setChecking(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.fullName || !form.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (form.fullName.length > 100) {
      newErrors.fullName = 'Full name must be under 100 characters';
    }
    if (!form.username || !form.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (form.username.length > 50) {
      newErrors.username = 'Username must be under 50 characters';
    }
    if (!form.email || !form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Email should be valid';
    }
    if (!form.password || form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        username: form.username.trim(),
        password: form.password,
        role: 'ADMIN',
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone || null,
      };

      await api.post('/auth/admin/setup', payload);
      toast.success('First admin created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/admin/login');
      }, 2000);
    } catch (err) {
      console.error('Admin setup error:', err);
      const errorMsg = err?.response?.data?.message || 'Failed to create admin';
      toast.error(errorMsg);
      if (err?.response?.status === 403) {
        // Admin already exists, redirect
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
      }
    } finally {
      setCreating(false);
    }
  };

  if (checking) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#fefae0' }} />
      </Box>
    );
  }

  if (adminExists) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 3,
            maxWidth: 500,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
            backdropFilter: 'blur(6px)',
            color: '#fefae0',
          }}
        >
          <Alert severity="info" sx={{ mb: 2 }}>
            An admin account already exists. Redirecting to admin login...
          </Alert>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/admin/login')}
            sx={{
              bgcolor: '#d4a373',
              color: '#1b4332',
              '&:hover': { bgcolor: '#e9c46a' },
            }}
          >
            Go to Admin Login
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 3,
          maxWidth: 600,
          width: '100%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
          backdropFilter: 'blur(6px)',
          color: '#fefae0',
        }}
      >
        <Typography variant="h4" align="center" sx={{ mb: 1, fontWeight: 800, fontFamily: 'Georgia, serif' }}>
          Admin Setup
        </Typography>
        <Typography variant="body2" align="center" sx={{ mb: 3, color: 'rgba(254,250,224,0.9)' }}>
          Create the first administrator account
        </Typography>

        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Full Name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            error={Boolean(errors.fullName)}
            helperText={errors.fullName}
            InputLabelProps={{ style: { color: '#fefae0' } }}
            InputProps={{ style: { color: '#fefae0', background: 'rgba(255,255,255,0.02)' } }}
            required
          />
          <TextField
            fullWidth
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            error={Boolean(errors.username)}
            helperText={errors.username}
            InputLabelProps={{ style: { color: '#fefae0' } }}
            InputProps={{ style: { color: '#fefae0', background: 'rgba(255,255,255,0.02)' } }}
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={Boolean(errors.email)}
            helperText={errors.email}
            InputLabelProps={{ style: { color: '#fefae0' } }}
            InputProps={{ style: { color: '#fefae0', background: 'rgba(255,255,255,0.02)' } }}
            required
          />
          <TextField
            fullWidth
            label="Phone (10 digits)"
            value={form.phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              setForm({ ...form, phone: digits });
            }}
            error={Boolean(errors.phone)}
            helperText={errors.phone || 'Optional'}
            inputProps={{ maxLength: 10 }}
            InputLabelProps={{ style: { color: '#fefae0' } }}
            InputProps={{ style: { color: '#fefae0', background: 'rgba(255,255,255,0.02)' } }}
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={Boolean(errors.password)}
            helperText={errors.password || 'Minimum 8 characters'}
            required
            InputLabelProps={{ style: { color: '#fefae0' } }}
            InputProps={{
              style: { color: '#fefae0', background: 'rgba(255,255,255,0.02)' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: '#fefae0' }}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleCreate}
            disabled={creating}
            endIcon={creating ? <CircularProgress size={20} sx={{ color: '#1b4332' }} /> : <ArrowForward />}
            sx={{
              mt: 2,
              py: 1.25,
              fontSize: '1rem',
              backgroundColor: '#d4a373',
              color: '#1b4332',
              fontWeight: 700,
              borderRadius: '28px',
              '&:hover': { backgroundColor: '#e9c46a' },
            }}
          >
            {creating ? 'Creating Admin...' : 'Create First Admin'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default AdminSetup;
