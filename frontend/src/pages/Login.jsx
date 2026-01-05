/*
  src/pages/Login.jsx

  Purpose:
  - Login page for Mithran Millets. Renders a compact, accessible sign-in form supporting
    username or email authentication, remember-me storage, and friendly inline validation.
  - Keeps UI consistent with site theme and integrates with the app's auth flow by
    persisting tokens to storage and dispatching a global 'authChanged' event.

  Notes:
  - Do not store raw passwords in long-term storage in production. This project uses
    session/local storage for convenience in development only.
*/

import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  Checkbox,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import {jwtDecode} from 'jwt-decode';

/*
  Login.jsx

  - Keeps your existing theme and layout.
  - Adds a centered custom ToggleSwitch (no explanatory text).
  - ToggleSwitch sits in the middle of its row.
  - Remember-me behavior and storage logic retained.
  - No automatic login on page load; remember only autofills fields when checked.

  SECURITY NOTE: storing raw passwords in localStorage/sessionStorage is insecure.
*/

const STORAGE_KEY = {
  REMEMBER: 'auth_remember',
  CRED: 'auth_credentials',
  TOKEN: 'token',
  SESSION_TOKEN: 'session_token'
};

function lockHistoryToCurrent() {
  window.history.pushState(null, '', window.location.href);
  const onPopState = () => {
    window.history.pushState(null, '', window.location.href);
  };
  window.addEventListener('popstate', onPopState);
  return () => window.removeEventListener('popstate', onPopState);
}

// small custom toggle component (inline)
const ToggleSwitch = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    aria-pressed={checked}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      padding: 0
    }}
  >
    <div style={{
      width: 52,
      height: 30,
      borderRadius: 18,
      background: checked ? 'rgba(212,163,115,0.95)' : 'rgba(255,255,255,0.12)',
      boxShadow: checked ? 'inset 0 0 6px rgba(0,0,0,0.08)' : 'inset 0 0 6px rgba(0,0,0,0.12)',
      display: 'flex',
      alignItems: 'center',
      padding: 4,
      transition: 'background 160ms ease'
    }}>
      <div style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: checked ? '#fff' : '#f2f2f2',
        transform: checked ? 'translateX(22px)' : 'translateX(0)',
        transition: 'transform 160ms cubic-bezier(.2,.9,.2,1)',
        boxShadow: '0 2px 6px rgba(11,61,46,0.12)'
      }} />
    </div>
  </button>
);

const Login = () => {
  const [mode, setMode] = useState('USERNAME'); // 'USERNAME' or 'EMAIL'
  const [form, setForm] = useState({ username: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // { identifier: '', password: '', general: '' }
  const identifierRef = useRef(null);
  const cleanupRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('no-navbar');
    identifierRef.current?.focus();

    try {
      const remembered = localStorage.getItem(STORAGE_KEY.REMEMBER) === 'true';
      if (remembered) {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY.CRED) || 'null');
        if (saved) {
          setMode(saved.mode === 'EMAIL' ? 'EMAIL' : 'USERNAME');
          setForm({ username: saved.identifier || saved.username || '', password: saved.password || '', remember: true });
        }
      } else {
        const sessionCred = JSON.parse(sessionStorage.getItem(STORAGE_KEY.CRED) || 'null');
        if (sessionCred) {
          setMode(sessionCred.mode === 'EMAIL' ? 'EMAIL' : 'USERNAME');
          setForm({ username: sessionCred.identifier || sessionCred.username || '', password: sessionCred.password || '', remember: false });
        } else {
          const savedCred = JSON.parse(localStorage.getItem(STORAGE_KEY.CRED) || 'null');
          if (savedCred?.username || savedCred?.identifier) {
            setForm(prev => ({ ...prev, username: savedCred.username || savedCred.identifier || '' }));
          }
        }
      }
    } catch (e) {
      console.error('restore creds', e);
    }

    return () => {
      document.body.classList.remove('no-navbar');
      if (cleanupRef.current) cleanupRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    const id = (form.username || '').trim();
    const next = {};
    if (!id) {
      next.identifier = mode === 'EMAIL' ? 'Please enter your email' : 'Please enter your username';
    } else {
      if (mode === 'USERNAME') {
        if (id.length < 3) next.identifier = 'Please enter a valid username (at least 3 characters)';
      } else {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id);
        if (!ok) next.identifier = 'Please enter a valid email address';
      }
    }

    if (!form.password || form.password.length < 6) {
      next.password = 'Password must be at least 6 characters';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const persistAfterLogin = (token) => {
    localStorage.setItem(STORAGE_KEY.TOKEN, token);

    if (form.remember) {
      localStorage.setItem(STORAGE_KEY.REMEMBER, 'true');
      localStorage.setItem(STORAGE_KEY.CRED, JSON.stringify({ mode, identifier: form.username, password: form.password }));
      sessionStorage.removeItem(STORAGE_KEY.SESSION_TOKEN);
      sessionStorage.removeItem(STORAGE_KEY.CRED);
    } else {
      localStorage.setItem(STORAGE_KEY.REMEMBER, 'false');
      sessionStorage.setItem(STORAGE_KEY.SESSION_TOKEN, token);
      sessionStorage.setItem(STORAGE_KEY.CRED, JSON.stringify({ mode, identifier: form.username, password: form.password }));
      localStorage.removeItem(STORAGE_KEY.CRED);
    }

    window.dispatchEvent(new Event('authChanged'));
  };

  const handleModeToggle = () => {
    setMode(prev => prev === 'USERNAME' ? 'EMAIL' : 'USERNAME');
  };

  const handleLogin = async () => {
    setErrors({});
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        password: form.password,
        username: mode === 'USERNAME' ? form.username.trim() : undefined,
        email: mode === 'EMAIL' ? form.username.trim() : undefined
      };

      const res = await api.post('/auth/login', payload);
      const token = res.data?.token;
      if (!token) throw new Error('No token returned from server');

      persistAfterLogin(token);

      let role = 'USER';
      try {
        const decoded = jwtDecode(token);
        role = decoded?.role ?? decoded?.roles ?? role;
      } catch {
        role = res.data?.role ?? role;
      }
      localStorage.setItem('role', role);

      const target = role === 'ADMIN' ? '/admin/dashboard' : '/';
      navigate(target, { replace: true });

      cleanupRef.current = lockHistoryToCurrent();
      // show brief success message inline
      setErrors({ general: 'Login successful' });
    } catch (err) {
      console.error('Login error:', err?.response?.data || err.message);
      const status = err?.response?.status;
      // Map server responses to friendly messages
      if (status === 401 || status === 403) {
        // invalid credentials
        const msg = mode === 'EMAIL' ? 'Incorrect email or password' : 'Incorrect username or password';
        setErrors({ general: msg });
      } else if (err?.response?.data?.message) {
        // server-provided message, but if it mentions email format treat accordingly
        const serverMsg = String(err.response.data.message || 'Authentication failed');
        if (/email/i.test(serverMsg) && /invalid/i.test(serverMsg)) {
          setErrors({ identifier: 'Please enter a valid email address' });
        } else if (/not found|no user/i.test(serverMsg)) {
          setErrors({ general: mode === 'EMAIL' ? 'Incorrect email or password' : 'Incorrect username or password' });
        } else {
          setErrors({ general: serverMsg });
        }
      } else {
        setErrors({ general: err?.message || 'Invalid credentials' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

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
      <div style={{ width: '100%', maxWidth: 480 }}>
        <Paper
          elevation={8}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            mx: 'auto',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            color: '#fefae0',
          }}
        >
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ color: '#fefae0', fontFamily: 'Georgia, serif', fontWeight: 800 }}
          >
            Welcome back
          </Typography>

          <Typography variant="body2" align="center" sx={{ color: 'rgba(254,250,224,0.85)', mb: 3 }}>
            Sign in to continue to Mithran Millets
          </Typography>

          <Stack spacing={2}>
            {/* Centered toggle only (no extra text) */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
  <Typography sx={{ color: '#fefae0', fontWeight: 600, minWidth: 70, textAlign: 'right' }}>
    Username
  </Typography>

  <Box sx={{ display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}>
    <ToggleSwitch checked={mode === 'EMAIL'} onChange={handleModeToggle} />
  </Box>

  <Typography sx={{ color: '#fefae0', fontWeight: 600, minWidth: 70, textAlign: 'left' }}>
    Email
  </Typography>
</Box>


            <TextField
              inputRef={identifierRef}
              label={mode === 'USERNAME' ? 'Username' : 'Email'}
              fullWidth
              variant="filled"
              size="small"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              onKeyDown={handleKeyDown}
              InputLabelProps={{ style: { color: 'rgba(254,250,224,0.9)' } }}
              InputProps={{ sx: { background: 'rgba(255,255,255,0.04)', color: '#fefae0' } }}
              error={Boolean(errors.identifier)}
              helperText={errors.identifier}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              variant="filled"
              size="small"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={handleKeyDown}
              error={Boolean(errors.password)}
              helperText={errors.password}
              InputLabelProps={{ style: { color: 'rgba(254,250,224,0.9)' } }}
              InputProps={{
                sx: { background: 'rgba(255,255,255,0.04)', color: '#fefae0' },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      sx={{ color: '#fefae0' }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {errors.general && (
              <Typography sx={{ color: errors.general === 'Login successful' ? 'success.main' : 'error.main', mt: 1, textAlign: 'center' }}>{errors.general}</Typography>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.remember}
                    onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                    sx={{ color: '#fefae0' }}
                  />
                }
                label={<Typography sx={{ color: '#fefae0' }}>Remember me</Typography>}
              />

              <Button variant="text" size="small" onClick={() => navigate('/forgot-password')} sx={{ color: '#fefae0', textTransform: 'none' }}>
                Forgot password?
              </Button>
            </Box>

            <Button
              variant="contained"
              fullWidth
              disabled={loading}
              onClick={handleLogin}
              sx={{
                mt: 1,
                py: 1.25,
                fontSize: '1rem',
                backgroundColor: '#d4a373',
                color: '#1b4332',
                fontWeight: 700,
                borderRadius: '28px',
                '&:hover': { backgroundColor: '#e9c46a' },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#1b4332' }} /> : 'Sign in'}
            </Button>

            <Typography align="center" sx={{ color: 'rgba(254,250,224,0.85)' }}>
              Don’t have an account?{' '}
              <Button variant="text" onClick={() => navigate('/signup')} sx={{ color: '#e9c46a', textTransform: 'none' }}>
                Sign up
              </Button>
            </Typography>
          </Stack>
        </Paper>
      </div>
    </Box>
  );
};

export default Login;
