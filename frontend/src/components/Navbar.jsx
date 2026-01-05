import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const Navbar = () => {
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();

  const [isAuth, setIsAuth] = useState(Boolean(localStorage.getItem('token')));
  const lastTokenRef = useRef(localStorage.getItem('token'));

  useEffect(() => {
    // If the page requests navbar hidden via body.no-navbar, keep state in sync
    const handler = () => {
      const token = localStorage.getItem('token');
      lastTokenRef.current = token;
      setIsAuth(Boolean(token));
    };

    window.addEventListener('authChanged', handler);
    window.addEventListener('storage', handler);

    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (lastTokenRef.current !== token) {
        lastTokenRef.current = token;
        setIsAuth(Boolean(token));
      }
    }, 500);

    return () => {
      window.removeEventListener('authChanged', handler);
      window.removeEventListener('storage', handler);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.dispatchEvent(new Event('authChanged'));
    navigate('/login');
  };

  // NEW: if any page sets body.no-navbar, hide the Navbar entirely
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // force re-render if body class list changes (so the component reacts immediately)
      // by toggling a local state derived from class presence
      // we won't store that state here to keep logic simple; instead, call force update via state
      // but simplest is to use this approach to trigger a rerender:
      setRenderTrigger(t => t + 1);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // local state to force rerenders when body class changes
  const [renderTrigger, setRenderTrigger] = useState(0);

  if (document.body.classList.contains('no-navbar')) {
    return null;
  }

  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(to right, #1b4332, #2d6a4f)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: '#fefae0',
            fontWeight: 'bold',
            fontFamily: 'Georgia, serif',
          }}
        >
          Mithran Millets
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button component={Link} to="/products" sx={{ color: '#fefae0', fontWeight: 500, '&:hover': { color: '#d4a373' } }}>
            Products
          </Button>
          <Button component={Link} to="/orders" sx={{ color: '#fefae0', fontWeight: 500, '&:hover': { color: '#d4a373' } }}>
            Orders
          </Button>
          <Button component={Link} to="/profile" sx={{ color: '#fefae0', fontWeight: 500, '&:hover': { color: '#d4a373' } }}>
            Profile
          </Button>

          {!isAuth ? (
            <>
              <Button component={Link} to="/login" sx={{ color: '#fefae0', fontWeight: 500, '&:hover': { color: '#d4a373' } }}>
                Login
              </Button>
              <Button component={Link} to="/signup" sx={{ color: '#fefae0', fontWeight: 500, '&:hover': { color: '#d4a373' } }}>
                Register
              </Button>
            </>
          ) : (
            <Button onClick={handleLogout} sx={{ color: 'error.main', fontWeight: 500, '&:hover': { color: 'error.dark' } }}>
              Logout
            </Button>
          )}

          <IconButton component={Link} to="/cart" sx={{ color: '#fefae0' }}>
            <Badge badgeContent={cart.length} color="error">
              <ShoppingCart />
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
