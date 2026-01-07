import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, Paper, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { AdminPanelSettings, Security, Dashboard, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import api from '../../services/api';

const AdminLanding = () => {
  const navigate = useNavigate();
  const [hasAdmin, setHasAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      const res = await api.get('/auth/admin/check');
      setHasAdmin(res.data?.hasAdmin || false);
    } catch (err) {
      console.error('Error checking admin:', err);
      setHasAdmin(false);
    } finally {
      setChecking(false);
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
        <Typography sx={{ color: '#fefae0' }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
        pt: { xs: 4, md: 8 },
        pb: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={6} alignItems="center">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ width: '100%', textAlign: 'center' }}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 900,
                fontFamily: 'Georgia, serif',
                color: '#fefae0',
                mb: 2,
              }}
            >
              Admin Portal
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(254,250,224,0.9)',
                maxWidth: 600,
                mx: 'auto',
                mb: 4,
              }}
            >
              Secure access to manage products, orders, and users
            </Typography>
          </motion.div>

          {/* Features Grid */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            sx={{ width: '100%', maxWidth: 900, mb: 4 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ flex: 1 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(6px)',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <Dashboard sx={{ fontSize: 48, color: '#e9c46a', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#fefae0', mb: 1, fontWeight: 700 }}>
                  Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(254,250,224,0.8)' }}>
                  Monitor sales, revenue, and key metrics in real-time
                </Typography>
              </Paper>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ flex: 1 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(6px)',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <AdminPanelSettings sx={{ fontSize: 48, color: '#e9c46a', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#fefae0', mb: 1, fontWeight: 700 }}>
                  Management
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(254,250,224,0.8)' }}>
                  Manage products, orders, and user accounts efficiently
                </Typography>
              </Paper>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ flex: 1 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(6px)',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <Security sx={{ fontSize: 48, color: '#e9c46a', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#fefae0', mb: 1, fontWeight: 700 }}>
                  Security
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(254,250,224,0.8)' }}>
                  Enterprise-grade security with role-based access control
                </Typography>
              </Paper>
            </motion.div>
          </Stack>

          {/* Login Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ width: '100%', maxWidth: 500 }}
          >
            <AdminLogin />
          </motion.div>

          {/* Setup Link (if no admin exists) */}
          {!hasAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background: 'rgba(233,196,106,0.1)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(233,196,106,0.3)',
                }}
              >
                <Stack spacing={2} alignItems="center">
                  <Typography variant="body1" sx={{ color: '#fefae0', textAlign: 'center' }}>
                    No admin account found. Create the first administrator account to get started.
                  </Typography>
                  <Button
                    variant="contained"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/admin/setup')}
                    sx={{
                      bgcolor: '#d4a373',
                      color: '#1b4332',
                      fontWeight: 700,
                      '&:hover': { bgcolor: '#e9c46a' },
                    }}
                  >
                    Setup Admin Account
                  </Button>
                </Stack>
              </Paper>
            </motion.div>
          )}

          {/* Footer */}
          <Typography variant="caption" sx={{ color: 'rgba(254,250,224,0.6)', textAlign: 'center', mt: 4 }}>
            Mithran Millets Admin Portal © {new Date().getFullYear()}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default AdminLanding;
