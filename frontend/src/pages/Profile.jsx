/*
  src/pages/Profile.jsx

  Purpose:
  - Profile page: view and edit user profile fields with client-side validation.
  - Uses authenticated API endpoints to update the current user's profile.
*/

/**
 * Profile
 * Renders profile form and handles profile updates.
 */

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Stack,
  IconButton,
  Divider,
} from '@mui/material';
import { Edit, Save, Close } from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../services/api';

const Profile = () => {
  const [user, setUser] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
  });

  const [editMode, setEditMode] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api
      .get('/auth/profile')
      .then(res => setUser(res.data || {}))
      .catch(err => console.error('Failed to fetch profile:', err));
  }, []);

  const handleChange = (field, value) => {
    // clear validation error for this field when user edits it
    setErrors(prev => {
      if (!prev || !prev[field]) return prev;
      const n = { ...prev };
      delete n[field];
      return n;
    });
    setEditedFields(prev => ({ ...prev, [field]: value }));
    setUser(prev => ({ ...prev, [field]: value }));
  };

  const validateAll = (fields = {}) => {
    const e = {};
    const fullName = (fields.fullName ?? user.fullName ?? '').toString().trim();
    const email = (fields.email ?? user.email ?? '').toString().trim();
    const phone = (fields.phone ?? user.phone ?? '').toString().trim();

    if (!fullName) e.fullName = 'Full name is required';
    else if (fullName.length > 100) e.fullName = 'Full name must be under 100 characters';

    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';

    if (phone) {
      if (!/^\d{10}$/.test(phone)) e.phone = 'Phone number must be 10 digits';
    }

    return e;
  };

  const handleSave = async () => {
    if (Object.keys(editedFields).length === 0) {
      return;
    }

    // validate before sending
    const validation = validateAll(editedFields);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    try {
      const res = await api.patch('/auth/profile', editedFields);
      setUser(res.data);
      setEditedFields({});
      setErrors({});
      setEditMode(false);
    } catch (err) {
      console.error('Failed to update profile', err);
      // if server returns validation errors, attempt to map them
      const serverMsg = err?.response?.data?.message || err?.response?.data?.errors;
      if (serverMsg) {
        // server returned validation info; map to field errors when possible
        if (typeof serverMsg === 'object' && serverMsg !== null) {
          try {
            setErrors(prev => ({ ...prev, ...serverMsg }));
          } catch {}
        }
      }
    }
  };

  // New light color that pairs with the deep green theme:
  // - valueColor: soft mint / cream for field text
  // - labelColor: slightly warmer mint for labels
  const valueColor = '#eaf6ef';    // soft mint/cream (for input values)
  const labelColor = '#dff2e6';    // lighter label tint
  const inputBg = 'rgba(234,246,239,0.04)';

  // shared TextField sx to force the chosen light colors for value, label, disabled and autofill
  const inputSx = {
    '& .MuiFilledInput-root': { background: inputBg },
    '& .MuiFilledInput-input, & .MuiInputBase-input, & input, & textarea': { color: valueColor },
    '& .MuiFilledInput-root.Mui-disabled .MuiFilledInput-input': { color: valueColor, WebkitTextFillColor: valueColor },
    '& .MuiInputLabel-root': { color: labelColor },
    '& input:-webkit-autofill, & textarea:-webkit-autofill': {
      WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset`,
      WebkitTextFillColor: valueColor,
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(1200px 600px at 10% 10%, rgba(233,196,106,0.06), transparent), radial-gradient(900px 400px at 90% 90%, rgba(212,163,115,0.04), transparent), linear-gradient(135deg, #0f351f 0%, #163f2a 100%)',
        py: { xs: 6, md: 10 },
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="sm">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Paper
            elevation={12}
            sx={{
              p: { xs: 4, md: 6 },
              borderRadius: 3,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))',
              backdropFilter: 'blur(8px) saturate(120%)',
              boxShadow: '0 20px 50px rgba(8,20,15,0.6)',
              color: valueColor,
              border: '1px solid rgba(233,196,106,0.06)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ color: '#fff8ea', fontFamily: 'Georgia, serif', fontWeight: 800 }}>
                  Your Profile
                </Typography>
              </Box>

              {!editMode ? (
                <IconButton
                  onClick={() => setEditMode(true)}
                  sx={{
                    bgcolor: 'rgba(233,196,106,0.08)',
                    color: '#e9c46a',
                    '&:hover': { bgcolor: 'rgba(233,196,106,0.14)' },
                    borderRadius: 2,
                  }}
                  aria-label="edit profile"
                >
                  <Edit />
                </IconButton>
              ) : (
                <Stack direction="row" spacing={1}>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <IconButton
                      onClick={handleSave}
                      color="success"
                      sx={{
                        bgcolor: 'rgba(212,163,115,0.06)',
                        color: '#d4a373',
                        '&:hover': { bgcolor: 'rgba(212,163,115,0.12)' },
                      }}
                      aria-label="save"
                    >
                      <Save />
                    </IconButton>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <IconButton
                      onClick={() => {
                        setEditMode(false);
                        setEditedFields({});
                        api.get('/auth/profile').then(res => setUser(res.data || {})).catch(() => {});
                      }}
                      sx={{ bgcolor: 'transparent', color: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}
                      aria-label="cancel"
                    >
                      <Close />
                    </IconButton>
                  </motion.div>
                </Stack>
              )}
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', mb: 3 }} />

            <Stack spacing={2}>
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
                <TextField
                  fullWidth
                  label="Username"
                  variant="filled"
                  size="small"
                  value={user.username || ''}
                  InputProps={{
                    readOnly: true,
                  }}
                  InputLabelProps={{ style: { color: labelColor } }}
                  sx={inputSx}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  variant="filled"
                  size="small"
                  value={user.fullName || ''}
                  onChange={e => handleChange('fullName', e.target.value)}
                  disabled={!editMode}
                  error={Boolean(errors.fullName)}
                  helperText={errors.fullName}
                  InputLabelProps={{ style: { color: labelColor } }}
                  sx={inputSx}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }}>
                <TextField
                  fullWidth
                  label="Email"
                  variant="filled"
                  size="small"
                  value={user.email || ''}
                  onChange={e => handleChange('email', e.target.value)}
                  disabled={!editMode}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  InputLabelProps={{ style: { color: labelColor } }}
                  sx={inputSx}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  variant="filled"
                  size="small"
                  value={user.phone || ''}
                  onChange={e => handleChange('phone', e.target.value)}
                  disabled={!editMode}
                  error={Boolean(errors.phone)}
                  helperText={errors.phone}
                  InputLabelProps={{ style: { color: labelColor } }}
                  sx={inputSx}
                />
              </motion.div>

              {editMode && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    startIcon={<Save />}
                    sx={{
                      background: 'linear-gradient(90deg,#d4a373,#e9c46a)',
                      color: '#072b1f',
                      fontWeight: 700,
                      borderRadius: 28,
                      px: 3,
                      '&:hover': { filter: 'brightness(1.03)' },
                    }}
                  >
                    Save Changes
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditMode(false);
                      setEditedFields({});
                      api.get('/auth/profile').then(res => setUser(res.data || {})).catch(() => {});
                    }}
                    startIcon={<Close />}
                    sx={{
                      color: valueColor,
                      borderColor: 'rgba(255,255,255,0.06)',
                      borderRadius: 28,
                      px: 3,
                      '&:hover': { borderColor: 'rgba(255,255,255,0.12)' },
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Stack>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Profile;
