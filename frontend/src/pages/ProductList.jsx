/*
  src/pages/ProductList.jsx

  Purpose:
  - ProductList page: fetches and renders product grid with Add to Cart actions.
  - Responsible for product layout and interactions with Cart/Auth contexts.
*/

/**
 * ProductList
 * Renders a responsive grid of products and handles add-to-cart interactions.
 */

import React, { useEffect, useState, useContext } from 'react';
import {
  Container,
  Grid,
  TextField,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  CircularProgress,
  Paper,
  Stack,
  IconButton,
  Snackbar,
  Alert as MuiAlert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import apiProduct from '../services/apiProduct';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import '../styles/productlist.css';

const BASE_URL = import.meta.env.VITE_PRODUCT_API_BASE_URL || 'http://localhost:8081';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [addedProductIds, setAddedProductIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext ? Boolean(authContext.isAuthenticated) : Boolean(localStorage.getItem('token'));

  // Snack / dialog state
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('info');
  const [showLoginAction, setShowLoginAction] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiProduct
      .get(`/products?ts=${Date.now()}`)
      .then(res => {
        if (!mounted) return;
        setProducts(res.data || []);
      })
      .catch(err => {
        const msg = err?.response?.data?.message || err?.message || 'Failed to fetch products';
        console.error('Failed to fetch products', err);
        setProducts([]);
        setSnackMsg(msg);
        setSnackSeverity('error');
        setShowLoginAction(false);
        setSnackOpen(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const filtered = products
    .filter(p => (p.name || '').toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (b.id || 0) - (a.id || 0));

  const tryAddOrPromptLogin = (product) => {
    if (!isAuthenticated) {
      setPendingProduct(product);
      setLoginDialogOpen(true);
      return;
    }
    handleAdd(product);
  };

  const handleAdd = async (product) => {
    try {
      await addToCart(product, 1);
      setAddedProductIds(prev => prev.includes(product.id) ? prev : [...prev, product.id]);
      setSnackMsg('Added to cart');
      setSnackSeverity('success');
      setShowLoginAction(false);
      setSnackOpen(true);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.message || 'Failed to add to cart';
      setSnackMsg(message);
      setSnackSeverity('error');
      setShowLoginAction(status === 401 || status === 403);
      setSnackOpen(true);
      if (status === 401 || status === 403) {
        setPendingProduct(product);
        setLoginDialogOpen(true);
      }
    }
  };

  const handleDialogLogin = () => {
    setLoginDialogOpen(false);
    const returnTo = window.location.pathname;
    navigate('/login', { state: { from: returnTo, attemptedProductId: pendingProduct?.id } });
    setPendingProduct(null);
  };

  const handleDialogCancel = () => {
    setLoginDialogOpen(false);
    setPendingProduct(null);
  };

  return (
    <Box className="pl-page">
      <Container maxWidth="lg">
        <Typography variant="h4" className="pl-title">Premium Millets Collection</Typography>

        <Paper elevation={3} className="pl-search-paper">
          <Stack direction="row" spacing={1} alignItems="center" className="pl-search-stack">
            <TextField
              placeholder="Search products, e.g. Barnyard millet"
              value={search}
              onChange={e => setSearch(e.target.value)}
              variant="outlined"
              size="medium"
              fullWidth
              InputProps={{
                startAdornment: (
                  <IconButton size="small" className="pl-search-icon"><SearchIcon /></IconButton>
                ),
              }}
              className="pl-search-field"
            />
            <Button onClick={() => setSearch('')} variant="outlined" className="pl-reset-btn">Reset</Button>
          </Stack>
        </Paper>

        {loading ? (
          <Box className="pl-loading-wrap"><CircularProgress size={48} thickness={4} /></Box>
        ) : (
          <Grid container spacing={4} alignItems="stretch" className="pl-grid">
            {filtered.length === 0 ? (
              <Grid item xs={12}>
                <Paper elevation={1} className="pl-no-products"><Typography variant="h6">No products found.</Typography></Paper>
              </Grid>
            ) : (
              filtered.map(product => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id} className="pl-grid-item">
                  <Card className="pl-card">
                    {/* fixed image box: always same size, image cropped with object-fit:cover */}
                    <div className="pl-image-wrap">
                      {/* using plain img inside wrapper ensures CSS object-fit works consistently */}
                      <img
                        src={product.imageDownloadUrl ? `${BASE_URL}${product.imageDownloadUrl}` : '/default-product.jpg'}
                        alt={product.name}
                        className="pl-image"
                        loading="lazy"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/default-product.jpg'; }}
                      />
                      {product.category && <div className="pl-badge">{product.category}</div>}
                    </div>

                    <CardContent className="pl-card-content">
                      <Typography variant="h6" className="pl-name">{product.name}</Typography>

                      <Typography variant="subtitle1" className="pl-price">₹{product.price?.toFixed?.(2) ?? product.price}</Typography>

                      <Typography variant="body2" className="pl-desc">{product.description ? product.description : 'Premium quality millet.'}</Typography>

                      <Typography variant="caption" className="pl-stock">{product.stock > 0 ? `In stock: ${product.stock}` : 'Out of stock'}</Typography>
                    </CardContent>

                    <Box className="pl-actions">
                      <Button variant="contained" className="pl-view-btn" onClick={() => navigate(`/products/${product.id}`)}>View</Button>

                      <Button
                        variant={addedProductIds.includes(product.id) ? 'outlined' : 'contained'}
                        className={`pl-add-btn ${addedProductIds.includes(product.id) ? 'pl-added' : ''}`}
                        onClick={() => {
                          if (addedProductIds.includes(product.id)) navigate('/cart');
                          else tryAddOrPromptLogin(product);
                        }}
                        disabled={product.stock === 0}
                      >
                        {addedProductIds.includes(product.id) ? 'Go to Cart' : 'Add to Cart'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </Container>

      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackOpen(false)}
          severity={snackSeverity}
          action={
            showLoginAction ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setSnackOpen(false);
                  setLoginDialogOpen(true);
                }}
              >
                Login
              </Button>
            ) : null
          }
        >
          {snackMsg}
        </MuiAlert>
      </Snackbar>

      <Dialog open={loginDialogOpen} onClose={handleDialogCancel}>
        <DialogTitle>Please log in</DialogTitle>
        <DialogContent>
          <DialogContentText>You need to be logged in to add items to your cart. Would you like to sign in now?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogCancel} color="inherit">Cancel</Button>
          <Button onClick={handleDialogLogin} variant="contained" className="pl-login-btn">Go to Login</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductList;
