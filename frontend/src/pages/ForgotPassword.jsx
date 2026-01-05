// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, CircularProgress } from '@mui/material';
import api from '../services/api'; // axios instance

// Enable verbose client logging by setting localStorage.debug = "true" (or remove in production)
const isDebug = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('debug') === 'true';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.info('Please enter a valid email');
      if (isDebug) console.debug('[ForgotPassword] invalid email:', email);
      return;
    }

    setLoading(true);
    if (isDebug) console.debug('[ForgotPassword] submit start for email:', email);

    try {
      const resp = await api.post('/auth/forgot-password', { email });

      // Debug: show response status and data when debug mode on
      if (isDebug) {
        console.debug('[ForgotPassword] POST /auth/forgot-password response:', {
          status: resp?.status,
          data: resp?.data,
        });
      }

      // Generic success message (avoid account enumeration)
      console.log('If an account with that email exists, a reset link has been sent');
    } catch (err) {
      // Safe, useful debugging info without exposing request payload
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message || err?.response?.data || null;

      if (isDebug) {
        console.error('[ForgotPassword] request error:', {
          message: err?.message,
          status,
          serverMessage,
          // do not log full err.config.data (may contain PII)
        });
      }

      // Show user-friendly message. If server provides a friendly message, show it in debug only.
      console.log('If an account with that email exists, a reset link has been sent');

      // If you want to show an explicit error for network issues in non-production:
      if (!err?.response) {
        // network / CORS / no connection
        console.error('Network error: could not reach the server. Check your connection or server logs.');
      } else if (status >= 500) {
        console.error('Server error occurred. Try again later.');
      } else if (status >= 400 && isDebug && serverMessage) {
        // show server message only when debug is enabled
        console.info(`Server: ${serverMessage}`);
      }
    } finally {
      setLoading(false);
      if (isDebug) console.debug('[ForgotPassword] submit finished for email:', email);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Paper elevation={8} sx={{ maxWidth: 480, width: '100%', p: 4, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>Forgot password</Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Enter the email associated with your account. We'll send reset instructions.
          {isDebug && <span style={{ marginLeft: 8, color: '#9e9e9e' }}> (debug mode)</span>}
        </Typography>

        <TextField
          fullWidth
          label="Email"
          variant="filled"
          size="small"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          fullWidth
          onClick={submit}
          disabled={loading}
          sx={{ py: 1.25 }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Send reset link'}
        </Button>
      </Paper>
    </Box>
  );
}
