/*
  src/pages/Signup.jsx

  Purpose:
  - Signup page: user registration with validation and token handling.
  - Provides client-side validators and posts signup payload to /auth/signup.
*/

/**
 * Signup
 * Renders registration form and handles signup flow.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

/**
 * Signup.jsx (address removed)
 *
 * - Signup now sends only user fields: username, password, role, email, fullName, phone
 * - All address fields, validators and UI are removed
 * - Keeps validation, token handling, and optimistic navigation behavior
 */

function lockHistoryToCurrent() {
  window.history.pushState(null, '', window.location.href);
  const onPopState = () => {
    window.history.pushState(null, '', window.location.href);
  };
  window.addEventListener('popstate', onPopState);
  return () => window.removeEventListener('popstate', onPopState);
}

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04 } }),
};

const initialForm = {
  username: '',
  password: '',
  email: '',
  fullName: '',
  phone: '',
};

const Signup = () => {
  const navigate = useNavigate();
  const usernameRef = useRef(null);
  const cleanupRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    document.body.classList.add('no-navbar');
    usernameRef.current?.focus();
    return () => {
      document.body.classList.remove('no-navbar');
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  const validators = {
    username: (v) => {
      if (!v || !v.toString().trim()) return 'Username is required';
      if (v.toString().length > 50) return 'Username must be under 50 characters';
      return null;
    },
    password: (v) => {
      if (!v) return 'Password is required';
      if (v.length < 8) return 'Password must be at least 8 characters';
      return null;
    },
    email: (v) => {
      if (!v || !v.toString().trim()) return 'Email is required';
      const re = /^\S+@\S+\.\S+$/;
      if (!re.test(v)) return 'Email should be valid';
      return null;
    },
    fullName: (v) => {
      if (!v || !v.toString().trim()) return 'Full name is required';
      if (v.toString().length > 100) return 'Full name must be under 100 characters';
      return null;
    },
    phone: (v) => {
      if (!v) return null;
      const re = /^\d{10}$/;
      if (!re.test(v)) return 'Phone number must be 10 digits';
      return null;
    },
  };

  const validateAll = () => {
    const fieldErrors = {};
    ['username', 'password', 'email', 'fullName', 'phone'].forEach((k) => {
      const err = validators[k] ? validators[k](form[k]) : null;
      if (err) fieldErrors[k] = err;
    });
    setErrors(fieldErrors);
    setGlobalError(null);
    return Object.keys(fieldErrors).length === 0;
  };

  const validateField = (key, value) => {
    const err = validators[key] ? validators[key](value) : null;
    setErrors((prev) => ({ ...prev, [key]: err }));
  };

  const handleSignup = async () => {
    if (!validateAll()) {
      toast.info('Please fix the highlighted errors');
      return;
    }

    setLoading(true);
    setGlobalError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        username: form.username,
        password: form.password,
        role: 'USER',
        email: form.email,
        fullName: form.fullName,
        phone: form.phone || null,
      };

      const res = await api.post('/auth/signup', payload);

      const token = res.data?.token;
      const returnedRole = res.data?.role;

      if (token) {
        try {
          const decoded = jwtDecode(token);
          const inferredRole = returnedRole ?? decoded?.role ?? 'USER';
          localStorage.setItem('token', token);
          localStorage.setItem('role', inferredRole);
        } catch {
          localStorage.setItem('token', token);
          if (returnedRole) localStorage.setItem('role', returnedRole);
        }

        setSuccessMessage('Registration successful — redirecting...');
        toast.success('Account created');
        window.dispatchEvent(new Event('authChanged'));

        const roleToRedirect = returnedRole ?? localStorage.getItem('role') ?? 'USER';
        const target = roleToRedirect === 'ADMIN' ? '/admin/dashboard' : '/products';
        navigate(target, { replace: true });
        cleanupRef.current = lockHistoryToCurrent();
      } else {
        setSuccessMessage('Registration successful. Please log in.');
        toast.success('Account created — please log in');
        navigate('/login', { replace: true });
        cleanupRef.current = lockHistoryToCurrent();
      }
    } catch (err) {
      console.error('Signup error:', err?.response?.data || err?.message);
      const data = err?.response?.data;
      if (data) {
        if (typeof data === 'object' && (data.fieldErrors || data.errors || data.message)) {
          if (data.fieldErrors && typeof data.fieldErrors === 'object') {
            setErrors(data.fieldErrors);
          } else if (Array.isArray(data.errors)) {
            const fe = {};
            data.errors.forEach((e) => {
              if (e.field) fe[e.field] = e.message || e.defaultMessage || JSON.stringify(e);
            });
            setErrors(fe);
          } else if (typeof data.message === 'string') {
            setGlobalError(data.message);
          } else {
            setGlobalError('Signup failed. Please check your input.');
          }
        } else if (typeof data === 'string') {
          setGlobalError(data);
        } else {
          setGlobalError('Signup failed. Please try again.');
        }
      } else {
        setGlobalError('Network or server error. Please try again.');
      }
      toast.error('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(90deg, #1b4332 0%, #2d6a4f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
      }}
    >
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Paper
          elevation={9}
          sx={{
            width: '100%',
            maxWidth: 640,
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
            color: '#fefae0',
          }}
        >
          <Typography variant="h4" align="center" sx={{ mb: 1.5, fontWeight: 800, fontFamily: 'Georgia, serif' }}>
            Create your account
          </Typography>

          <Typography variant="body2" align="center" sx={{ mb: 3, color: 'rgba(254,250,224,0.9)' }}>
            Join Mithran Millets — secure your account
          </Typography>

          {globalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {globalError}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          <Stack spacing={2}>
            <motion.div custom={0} initial="hidden" animate="visible" variants={fieldVariants}>
              <TextField
                inputRef={usernameRef}
                fullWidth
                label="Full name"
                value={form.fullName}
                onChange={(e) => {
                  setForm((s) => ({ ...s, fullName: e.target.value }));
                  validateField('fullName', e.target.value);
                }}
                onBlur={(e) => validateField('fullName', e.target.value)}
                error={Boolean(errors.fullName)}
                helperText={errors.fullName}
                InputLabelProps={{ style: { color: '#fefae0' } }}
                InputProps={{ style: { color: '#fefae0', background: 'rgba(255,255,255,0.02)' } }}
              />
            </motion.div>

            <motion.div custom={1} initial="hidden" animate="visible" variants={fieldVariants}>
              <TextField
                fullWidth
                label="Username"
                value={form.username}
                onChange={(e) => {
                  setForm((s) => ({ ...s, username: e.target.value }));
                  validateField('username', e.target.value);
                }}
                onBlur={(e) => validateField('username', e.target.value)}
                error={Boolean(errors.username)}
                helperText={errors.username}
                InputLabelProps={{ style: { color: '#fefae0' } }}
                InputProps={{ style: { color: '#fefae0', background: 'rgba(255,255,255,0.02)' } }}
              />
            </motion.div>

            <motion.div custom={2} initial="hidden" animate="visible" variants={fieldVariants}>
              <TextField
                fullWidth
                label="Email"
                value={form.email}
                onChange={(e) => {
                  setForm((s) => ({ ...s, email: e.target.value }));
                  validateField('email', e.target.value);
                }}
                onBlur={(e) => validateField('email', e.target.value)}
                error={Boolean(errors.email)}
                helperText={errors.email}
                InputLabelProps={{ style: { color: '#fefae0' } }}
                InputProps={{ style: { color: '#fefae0', background: 'rgba(255,255,255,0.02)' } }}
              />
            </motion.div>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1 }} />

            <motion.div custom={3} initial="hidden" animate="visible" variants={fieldVariants}>
              <TextField
                fullWidth
                label="Phone (10 digits)"
                value={form.phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setForm((s) => ({ ...s, phone: digits }));
                  validateField('phone', digits);
                }}
                onBlur={(e) => validateField('phone', e.target.value)}
                error={Boolean(errors.phone)}
                helperText={errors.phone || 'Optional'}
                InputLabelProps={{ style: { color: '#fefae0' } }}
                InputProps={{ style: { color: '#fefae0', background: 'rgba(255,255,255,0.02)' } }}
              />
            </motion.div>

            <motion.div custom={4} initial="hidden" animate="visible" variants={fieldVariants}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => {
                  setForm((s) => ({ ...s, password: e.target.value }));
                  validateField('password', e.target.value);
                }}
                onBlur={(e) => validateField('password', e.target.value)}
                error={Boolean(errors.password)}
                helperText={errors.password}
                InputLabelProps={{ style: { color: '#fefae0' } }}
                InputProps={{
                  style: { color: '#fefae0', background: 'rgba(255,255,255,0.02)' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((s) => !s)} sx={{ color: '#fefae0' }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSignup}
                disabled={loading}
                sx={{
                  mt: 1.5,
                  py: 1.25,
                  fontSize: '1rem',
                  backgroundColor: '#d4a373',
                  color: '#1b4332',
                  fontWeight: 700,
                  borderRadius: '28px',
                  '&:hover': { backgroundColor: '#e9c46a' },
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: '#1b4332' }} /> : 'Create account'}
              </Button>
            </motion.div>

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(254,250,224,0.85)' }}>
                Already have an account?{' '}
                <Button variant="text" onClick={() => navigate('/login')} sx={{ color: '#e9c46a', textTransform: 'none' }}>
                  Sign in
                </Button>
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default Signup;
