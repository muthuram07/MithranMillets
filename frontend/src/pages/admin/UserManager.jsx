import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  TablePagination,
  Checkbox,
  CircularProgress,
  Box,
  Stack,
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import api from '../../services/api';
import { saveAs } from 'file-saver';

/**
 * UserManager.jsx
 *
 * Adjusted to call admin endpoints and use safer request paths:
 * - GET /auth/admin/users       -> fetch all users (admin)
 * - DELETE /auth/admin/users/{id} -> delete user (admin)
 * - PUT /auth/admin/users/{id}    -> update user role (admin)
 *
 * Make sure your backend controller exposes these endpoints and secures them for ADMIN role.
 */

const escapeCsv = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // admin endpoint - adjust backend to expose this route and secure it
      const res = await api.get('/auth/admin/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      // toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (user.fullName ?? '').toString().toLowerCase().includes(q) ||
      (user.username ?? '').toString().toLowerCase().includes(q) ||
      (user.role ?? '').toString().toLowerCase().includes(q) ||
      (user.email ?? '').toString().toLowerCase().includes(q)
    );
  });

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const handleExport = () => {
    const header = ['fullName', 'username', 'email', 'phone', 'role'].join(',');
    const rows = filteredUsers.map(u => [
      escapeCsv(u.fullName),
      escapeCsv(u.username),
      escapeCsv(u.email),
      escapeCsv(u.phone),
      escapeCsv(u.role),
    ].join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'users.csv');
    // toast.success('Users exported!');
  };

  const handleSelect = (id) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const handleSelectAllOnPage = (e) => {
    const idsOnPage = paginatedUsers.map(u => u.id);
    if (e.target.checked) {
      setSelected(prev => Array.from(new Set([...prev, ...idsOnPage])));
    } else {
      setSelected(prev => prev.filter(id => !idsOnPage.includes(id)));
    }
  };

  const allOnPageSelected = paginatedUsers.length > 0 && paginatedUsers.every(u => selected.includes(u.id));

  const handleBulkDelete = async () => {
    if (selected.length === 0) {
      // toast.info('No users selected');
      return;
    }
    if (!window.confirm(`Delete ${selected.length} selected user(s)? This cannot be undone.`)) return;
    try {
      // admin delete endpoint
      await Promise.all(selected.map(id => api.delete(`/auth/admin/users/${id}`)));
      // toast.success('Selected users deleted');
      setSelected([]);
      await fetchUsers();
    } catch (err) {
      console.error(err);
      // toast.error('Failed to delete selected users');
    }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setNewRole(user.role ?? 'USER');
    setEditDialogOpen(true);
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;
    try {
      // admin update endpoint -- adjust backend to accept PUT /auth/admin/users/{id} with body { role: 'ADMIN' }
      await api.put(`/auth/admin/users/${selectedUser.id}`, { role: newRole });
      // toast.success('Role updated!');
      setEditDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
      await fetchUsers();
    } catch (err) {
      console.error(err);
      // toast.error('Failed to update role');
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Manage Users</Typography>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleExport}>Export CSV</Button>
          <Button
            variant="outlined"
            color="error"
            disabled={selected.length === 0}
            onClick={handleBulkDelete}
          >
            Delete Selected
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search Users (name, username, email, role)"
          variant="outlined"
          size="small"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, minWidth: 260 }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allOnPageSelected}
                    onChange={handleSelectAllOnPage}
                    inputProps={{ 'aria-label': 'select all users on page' }}
                  />
                </TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedUsers.map(user => (
                <TableRow key={user.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(user.id)}
                      onChange={() => handleSelect(user.id)}
                    />
                  </TableCell>
                  <TableCell>{user.fullName ?? '—'}</TableCell>
                  <TableCell>{user.username ?? '—'}</TableCell>
                  <TableCell>{user.email ?? '—'}</TableCell>
                  <TableCell>{user.phone ?? '—'}</TableCell>
                  <TableCell>{user.role ?? 'USER'}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => openEditDialog(user)} aria-label="edit">
                      <Edit />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {paginatedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No users found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 20]}
            sx={{ mt: 2 }}
          />
        </Paper>
      )}

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, fontWeight: 700 }}>{selectedUser?.fullName ?? ''}</Typography>
          <Select
            fullWidth
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            size="small"
          >
            <MenuItem value="USER">USER</MenuItem>
            <MenuItem value="ADMIN">ADMIN</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRoleUpdate} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManager;
