// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
// toast notifications removed — using console logs instead
import api from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      console.log('Reset link is invalid');
    }
  }, [token]);

  const submit = async () => {
    if (!token) return console.log('Reset link is invalid');
    if (password.length < 8) return console.log('Password should be at least 8 characters');
    if (password !== confirm) return console.log('Passwords do not match');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      console.log('Password updated — please log in with your new password');
      navigate('/login', { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.message || 'Reset failed or link expired';
      console.log(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Paper elevation={8} sx={{ maxWidth: 480, width: '100%', p: 4, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>Reset password</Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>Enter a new password for your account.</Typography>

        <TextField
          fullWidth
          label="New password"
          variant="filled"
          size="small"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Confirm password"
          variant="filled"
          size="small"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          fullWidth
          onClick={submit}
          disabled={loading}
          sx={{ py: 1.25 }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Set new password'}
        </Button>
      </Paper>
    </Box>
  );
}
