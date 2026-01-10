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
  TablePagination,
  CircularProgress,
  Box,
  Stack,
} from '@mui/material';
import api from '../../services/api';
import { saveAs } from 'file-saver';

/**
 * UserManager.jsx
 * - Read-only view of users.
 * - Removed selection checkboxes and delete functionality.
 * - Uses 'username' as unique identifier per backend Entity.
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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/admin/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
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
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Manage Users</Typography>

        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={handleExport}>Export CSV</Button>
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
        <Paper elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedUsers.map(user => (
                <TableRow key={user.username} hover>
                  <TableCell>{user.fullName ?? '—'}</TableCell>
                  <TableCell>{user.username ?? '—'}</TableCell>
                  <TableCell>{user.email ?? '—'}</TableCell>
                  <TableCell>{user.phone ?? '—'}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: user.role === 'ADMIN' ? 'primary.main' : 'grey.300',
                        color: user.role === 'ADMIN' ? 'white' : 'black',
                        textTransform: 'uppercase'
                      }}
                    >
                      {user.role || 'USER'}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}

              {paginatedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
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
            sx={{ borderTop: '1px solid #e0e0e0' }}
          />
        </Paper>
      )}
    </Container>
  );
};

export default UserManager;