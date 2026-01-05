import React from 'react';
import { Drawer, List, ListItem, ListItemText, Toolbar, AppBar, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { logout } from '../utils/auth';

const drawerWidth = 240;

const AdminLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}>
        <Toolbar>
          <Typography variant="h6" noWrap>Admin Panel</Typography>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ width: drawerWidth, [`& .MuiDrawer-paper`]: { width: drawerWidth } }}>
        <Toolbar />
        <List>
          <ListItem button component={Link} to="/admin/dashboard"><ListItemText primary="Dashboard" /></ListItem>
          <ListItem button component={Link} to="/admin/products"><ListItemText primary="Products" /></ListItem>
          <ListItem button component={Link} to="/admin/orders"><ListItemText primary="Orders" /></ListItem>
          <ListItem button component={Link} to="/admin/users"><ListItemText primary="Users" /></ListItem>
          <ListItem button onClick={logout}> <ListItemText primary="Logout" /></ListItem>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
