import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  TablePagination,
  Checkbox,
  CircularProgress,
  Avatar,
  Box,
  Stack,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import apiProduct from '../../services/apiProduct';
import { saveAs } from 'file-saver';

const rowsPerPageDefault = 10;

const emptyForm = {
  name: '',
  price: '',
  description: '',
  stock: '',
  category: '',
};

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageDefault);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  // file handling state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiProduct.get(`/products?ts=${Date.now()}`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      const detail = e?.response?.data?.message || e?.message || 'Failed to load products';
      console.error(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    clearFile();
  };

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFile(null);
  };

  const validateForm = () => {
    if (!form.name || form.name.trim().length === 0) {
      console.info('Please enter a product name');
      return false;
    }
    const price = parseFloat(form.price);
    if (Number.isNaN(price) || price <= 0) {
      console.info('Price must be a number greater than zero');
      return false;
    }
    if (!form.category || form.category.trim().length === 0) {
      console.info('Please provide a category');
      return false;
    }
    const stock = parseInt(form.stock === '' ? '0' : form.stock, 10);
    if (Number.isNaN(stock) || stock < 0) {
      console.info('Stock must be 0 or a positive integer');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const productDto = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      description: form.description?.trim() || '',
      stock: parseInt(form.stock === '' ? '0' : form.stock, 10),
      category: form.category.trim(),
    };

    try {
      const formData = new FormData();
      formData.append('product', new Blob([JSON.stringify(productDto)], { type: 'application/json' }));
      if (file) formData.append('image', file);

      if (editId) {
        await apiProduct.put(`/products/${editId}`, formData);
        console.log('Product updated!');
      } else {
        await apiProduct.post('/products', formData);
        console.log('Product added!');
      }
      setOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error(err);
      console.error(err?.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name ?? '',
      price: String(product.price ?? ''),
      description: product.description ?? '',
      stock: String(product.stock ?? 0),
      category: product.category ?? '',
    });
    setEditId(product.id);
    // do not preload image bytes; show download URL preview if available
    if (product.imageDownloadUrl) {
      setPreviewUrl(product.imageDownloadUrl);
      setFile(null); // editing without selecting new file
    } else {
      clearFile();
    }
    setOpen(true);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('Delete this product? This action cannot be undone.');
    if (!ok) return;
    try {
      await apiProduct.delete(`/products/${id}`);
      console.log('Product deleted!');
      fetchProducts();
      setSelected(prev => prev.filter(x => x !== id));
    } catch (err) {
      console.error(err);
      console.error('Failed to delete product');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) {
      console.info('No products selected');
      return;
    }
    const ok = window.confirm(`Delete ${selected.length} selected product(s)?`);
    if (!ok) return;
    try {
      await Promise.all(selected.map(id => apiProduct.delete(`/products/${id}`)));
      console.log('Selected products deleted');
      fetchProducts();
      setSelected([]);
    } catch (err) {
      console.error(err);
      console.error('Failed to delete selected products');
    }
  };

  const escapeCsv = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const handleExport = () => {
    const data = filteredProducts.map(p => ({
      name: p.name,
      price: p.price,
      imageUrl: p.imageDownloadUrl || '',
      description: p.description,
      stock: p.stock,
      category: p.category,
    }));
    const header = ['name', 'price', 'imageUrl', 'description', 'stock', 'category'].join(',');
    const csv = [header, ...data.map(r => [
      escapeCsv(r.name),
      escapeCsv(r.price),
      escapeCsv(r.imageUrl),
      escapeCsv(r.description),
      escapeCsv(r.stock),
      escapeCsv(r.category),
    ].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'products.csv');
    console.log('Exported CSV');
  };

  const handleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const paginatedProducts = (() => {
    const filtered = products
      .slice()
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase())
      || (p.category ?? '').toLowerCase().includes(search.toLowerCase())
    );
    const start = page * rowsPerPage;
    return {
      allFiltered: filtered,
      pageItems: filtered.slice(start, start + rowsPerPage),
    };
  })();

  const filteredProducts = paginatedProducts.allFiltered;
  const pageItems = paginatedProducts.pageItems;

  const handleSelectAllOnPage = (e) => {
    const idsOnPage = pageItems.map(p => p.id);
    if (e.target.checked) {
      setSelected(prev => Array.from(new Set([...prev, ...idsOnPage])));
    } else {
      setSelected(prev => prev.filter(id => !idsOnPage.includes(id)));
    }
  };

  const allOnPageSelected = pageItems.length > 0 && pageItems.every(p => selected.includes(p.id));

  // file input change handler
  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) {
      clearFile();
      return;
    }
    if (!f.type.startsWith('image/')) {
      console.error('Please select an image file');
      return;
    }
    if (f.size > 5 * 1024 * 1024) { // 5MB limit
      console.error('Image must be under 5MB');
      return;
    }
    // revoke previous preview if we created it
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  // Fetch raw image and trigger download
  const handleDownloadImage = async (product) => {
    if (!product.imageDownloadUrl) {
      console.info('No image available');
      return;
    }
    try {
      const res = await apiProduct.get(product.imageDownloadUrl, { responseType: 'blob' });
      const ct = res.headers['content-type'] || 'image/jpeg';
      const blob = new Blob([res.data], { type: ct });
      saveAs(blob, `${product.name || 'image'}.${ct.split('/')[1] || 'jpg'}`);
    } catch (err) {
      console.error(err);
      console.error('Failed to download image');
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Manage Products</Typography>

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
          <Button variant="contained" onClick={() => { resetForm(); setOpen(true); }}>
            Add New Product
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Search Products"
          variant="outlined"
          size="small"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1 }}
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
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Image</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pageItems.map(prod => (
                <TableRow key={prod.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(prod.id)}
                      onChange={() => handleSelect(prod.id)}
                    />
                  </TableCell>

                  <TableCell sx={{ maxWidth: 240 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        src={prod.imageDownloadUrl || undefined}
                        variant="rounded"
                        sx={{ width: 64, height: 48, bgcolor: '#f6f5f1' }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {prod.description ?? ''}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>{prod.category}</TableCell>
                  <TableCell>₹{Number(prod.price).toFixed(2)}</TableCell>
                  <TableCell>{prod.stock ?? 0}</TableCell>

                  <TableCell>
                    {prod.imageDownloadUrl ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button size="small" onClick={() => window.open(prod.imageDownloadUrl, '_blank', 'noopener')}>
                          View
                        </Button>
                        <Button size="small" onClick={() => handleDownloadImage(prod)}>
                          Download
                        </Button>
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#666' }}>No image</Typography>
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(prod)} aria-label="edit"><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(prod.id)} aria-label="delete"><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No products found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={filteredProducts.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 20]}
            sx={{ mt: 2 }}
          />
        </Paper>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            margin="dense"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            fullWidth
            label="Price"
            margin="dense"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            inputProps={{ inputMode: 'decimal' }}
          />
          <TextField
            fullWidth
            label="Description"
            margin="dense"
            multiline
            minRows={2}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <TextField
            fullWidth
            label="Stock"
            margin="dense"
            value={form.stock}
            onChange={e => setForm({ ...form, stock: e.target.value })}
            inputProps={{ inputMode: 'numeric' }}
          />
          <TextField
            fullWidth
            label="Category"
            margin="dense"
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
          />

          {/* image chooser */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="product-image">
              <Button variant="outlined" component="span">Choose Image</Button>
            </label>
            {file && <Typography variant="body2">{file.name}</Typography>}
            {(!file && previewUrl) && <Typography variant="body2">Using existing image</Typography>}
            {(file || previewUrl) && (
              <Button variant="text" onClick={clearFile}>Remove</Button>
            )}
          </Box>

          {/* small preview */}
          {previewUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Avatar src={previewUrl} variant="rounded" sx={{ width: 120, height: 90, bgcolor: '#f6f5f1' }} />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductManager;
