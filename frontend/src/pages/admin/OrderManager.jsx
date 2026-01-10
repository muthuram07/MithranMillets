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
  Checkbox,
  CircularProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import apiOrder from '../../services/apiOrder';
import { saveAs } from 'file-saver';

const escapeCsv = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const statusOptions = [
    'PLACED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  // Fetch all orders (admin)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiOrder.get('/order/admin/all');
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders for search
  const filteredOrders = orders.filter((order) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = (order.user?.fullName ?? order.username ?? '')
      .toString()
      .toLowerCase();
    const status = (order.status ?? '').toLowerCase();
    const id = String(order.id ?? '').toLowerCase();
    return name.includes(q) || status.includes(q) || id.includes(q);
  });

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    (page + 1) * rowsPerPage
  );

  // CSV Export
  const handleExport = () => {
    const header = ['id', 'user', 'total', 'status', 'date'].join(',');
    const rows = filteredOrders.map((o) =>
      [
        escapeCsv(o.id),
        escapeCsv(o.user?.fullName ?? o.username ?? ''),
        escapeCsv(o.totalAmount ?? o.total ?? 0),
        escapeCsv(o.status),
        escapeCsv(o.orderDate ?? o.createdAt ?? ''),
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'orders.csv');
    console.log('Orders exported!');
  };

  // Select / deselect
  const handleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAllOnPage = (event) => {
    const idsOnPage = paginatedOrders.map((o) => o.id);
    if (event.target.checked) {
      setSelected((prev) => Array.from(new Set([...prev, ...idsOnPage])));
    } else {
      setSelected((prev) => prev.filter((id) => !idsOnPage.includes(id)));
    }
  };

  const allOnPageSelected =
    paginatedOrders.length > 0 && paginatedOrders.every((o) => selected.includes(o.id));

  // Bulk delete using dialog
  const handleBulkDeleteClick = () => {
    if (selected.length === 0) return;
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await Promise.all(selected.map((id) => apiOrder.delete(`/order/${id}`)));
      console.log('Selected orders deleted');
      setSelected([]);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to delete selected orders', err);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Update shipment status
  const handleStatusChange = async (orderId, nextStatus) => {
    try {
      await apiOrder.put(`/order/admin/${orderId}/shipment-status`, { status: nextStatus });
      console.log(`Status updated to ${nextStatus}`);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data || 'Failed to update status';
      console.error(String(msg));
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Manage Orders
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField
          label="Search Orders (id, user, status)"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 260, flex: 1 }}
        />

        <Button variant="outlined" onClick={handleExport}>
          Export CSV
        </Button>

        <Button
          variant="outlined"
          color="error"
          disabled={selected.length === 0}
          onClick={handleBulkDeleteClick}
        >
          Delete Selected
        </Button>
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
                    inputProps={{ 'aria-label': 'select all orders on page' }}
                  />
                </TableCell>
                <TableCell>Order ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Shipment Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(order.id)}
                      onChange={() => handleSelect(order.id)}
                    />
                  </TableCell>

                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.user?.fullName ?? order.username ?? '—'}</TableCell>
                  <TableCell>₹{Number(order.totalAmount ?? order.total ?? 0).toFixed(2)}</TableCell>
                  <TableCell>{order.status ?? '—'}</TableCell>
                  <TableCell>
                    <TextField
                      select
                      SelectProps={{ native: true }}
                      size="small"
                      value={(order.status || 'PLACED').toUpperCase()}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.replaceAll('_', ' ')}
                        </option>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>{new Date(order.orderDate ?? order.createdAt ?? '').toLocaleString()}</TableCell>
                </TableRow>
              ))}

              {paginatedOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No orders found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={filteredOrders.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20]}
            sx={{ mt: 2 }}
          />
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selected.length} selected order(s)? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderManager;
