import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  AppBar,
  Typography,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory2 as ProductsIcon,
  ShoppingCart as OrdersIcon,
  People as UsersIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../utils/auth';

const drawerWidth = 260;

const AdminLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Products', icon: <ProductsIcon />, path: '/admin/products' },
    { text: 'Orders', icon: <OrdersIcon />, path: '/admin/orders' },
    { text: 'Users', icon: <UsersIcon />, path: '/admin/users' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand Section */}
      <Toolbar
        sx={{
          background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
          color: '#fefae0',
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            fontWeight: 800,
            fontFamily: 'Georgia, serif',
            flexGrow: 1,
          }}
        >
          Mithran Millets
        </Typography>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="close drawer"
            edge="end"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>
      
      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: 1 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive}
                onClick={isMobile ? handleDrawerToggle : undefined}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(45, 106, 79, 0.15)',
                    color: '#2d6a4f',
                    fontWeight: 700,
                    '&:hover': {
                      backgroundColor: 'rgba(45, 106, 79, 0.2)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: '#2d6a4f',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(45, 106, 79, 0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#2d6a4f' : 'inherit',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Logout Button */}
      <List sx={{ pb: 2 }}>
        <ListItem disablePadding sx={{ px: 1, pt: 1 }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.1)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: 'linear-gradient(to right, #1b4332, #2d6a4f)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              color: '#fefae0',
              fontWeight: 700,
              fontFamily: 'Georgia, serif',
            }}
          >
            Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(0,0,0,0.08)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, md: 8 },
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #fbf7ef 0%, #f0e6cf 100%)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
