/*
  src/pages/Cart.jsx

  Purpose:
  - Cart page: displays cart items, allows quantity updates and proceed-to-checkout flow.
  - Interacts with CartContext for optimistic updates and AuthContext for gated actions.
*/

/**
 * Cart
 * Shows the user's cart and provides controls to update quantities or proceed to checkout.
 */

import React, { useContext, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
  Box,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const fallbackImage = '/default-product.jpg'; // ✅ fallback image path

const Cart = () => {
  const {
    cart,
    increaseQty,
    decreaseQty,
    refreshCartFromServer,
  } = useContext(CartContext);

  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const isAuthenticated = auth ? Boolean(auth.isAuthenticated) : Boolean(localStorage.getItem('token'));

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);

  const getProductId = (item) => item.id;

  const handleDecrease = async (item) => {
    try {
      await decreaseQty(item);
    } catch {
      await refreshCartFromServer();
    }
  };

  const handleIncrease = async (item) => {
    try {
      await increaseQty(item);
    } catch {
      await refreshCartFromServer();
    }
  };

  const handleRemove = async (item) => {
    try {
      await decreaseQty({ ...item, qty: 1 });
    } catch {
      await refreshCartFromServer();
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to right, #fefae0, #e9c46a)', py: 6 }}>
      <Container maxWidth="md">
        <Paper elevation={6} sx={{ p: 4, borderRadius: 4, backgroundColor: '#fff8e1', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1b4332', textAlign: 'center', mb: 4 }}>
            🛒 Your Cart
          </Typography>

          {cart.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>Your cart is empty.</Typography>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Product</strong></TableCell>
                    <TableCell><strong>Price</strong></TableCell>
                    <TableCell><strong>Quantity</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.map(item => (
                    <TableRow key={getProductId(item)}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            variant="square"
                            src={item.image || fallbackImage}
                            alt={item.name}
                            sx={{ width: 48, height: 48, borderRadius: 2 }}
                            onError={(e) => { e.target.src = fallbackImage; }}
                          />
                          <Typography>{item.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>₹{item.price}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button variant="outlined" size="small" onClick={() => handleDecrease(item)} sx={{ minWidth: '32px', px: 0 }}>−</Button>
                          <Typography>{item.qty}</Typography>
                          <Button variant="outlined" size="small" onClick={() => handleIncrease(item)} sx={{ minWidth: '32px', px: 0 }}>+</Button>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button variant="text" color="error" onClick={() => handleRemove(item)}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Typography variant="h6" sx={{ mt: 4, textAlign: 'right' }}>Total: ₹{total}</Typography>

              <Box sx={{ textAlign: 'right', mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (!isAuthenticated) {
                      setLoginDialogOpen(true);
                      return;
                    }
                    navigate('/checkout');
                  }}
                  sx={{
                    backgroundColor: '#d4a373', color: '#1b4332', fontWeight: 'bold', borderRadius: '30px', '&:hover': { backgroundColor: '#e9c46a' },
                  }}
                >
                  Proceed to Checkout
                </Button>
              </Box>
            </>
          )}
        </Paper>
        <Dialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)}>
          <DialogTitle>Please log in</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You must be signed in to proceed to checkout. Would you like to sign in now?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLoginDialogOpen(false)} color="inherit">Cancel</Button>
            <Button onClick={() => { setLoginDialogOpen(false); navigate('/login', { state: { from: '/cart' } }); }} variant="contained" sx={{ backgroundColor: '#245a43', color: '#fff' }}>Go to Login</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Cart;
