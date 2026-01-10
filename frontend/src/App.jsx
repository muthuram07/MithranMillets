// src/App.jsx
import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// add providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Lazy load pages for code splitting and faster initial load
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ProductList = lazy(() => import('./pages/ProductList'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Profile = lazy(() => import('./pages/Profile'));
const Orders = lazy(() => import('./pages/Orders'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ProductManager = lazy(() => import('./pages/admin/ProductManager'));
const OrderManager = lazy(() => import('./pages/admin/OrderManager'));
const UserManager = lazy(() => import('./pages/admin/UserManager'));
const AdminLanding = lazy(() => import('./pages/admin/AdminLanding'));
const AdminSetup = lazy(() => import('./pages/admin/AdminSetup'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Payment = lazy(() => import('./pages/Payment'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Support = lazy(() => import('./pages/Support'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    sx={{
      background: 'linear-gradient(180deg, #fbf7ef 0%, #f0e6cf 100%)'
    }}
  >
    <CircularProgress size={60} sx={{ color: '#2d6a4f' }} />
  </Box>
);

const STORAGE_KEY = {
  REMEMBER: 'auth_remember',
  CRED: 'auth_credentials',
  TOKEN: 'token'
};

const App = () => {
  useEffect(() => {
    // When the window is closed (or reloaded), if user did NOT choose "remember",
    // remove tokens/credentials from localStorage so they do not persist across browser restarts.
    const handleBeforeUnload = () => {
      try {
        const remembered = localStorage.getItem(STORAGE_KEY.REMEMBER) === 'true';
        if (!remembered) {
          localStorage.removeItem(STORAGE_KEY.TOKEN);
          localStorage.removeItem(STORAGE_KEY.CRED);
          localStorage.removeItem(STORAGE_KEY.REMEMBER);
        }
      } catch (e) {
        console.error('beforeunload cleanup', e);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <>
      <ErrorBoundary>
        <Router>
          <AuthProvider>
            <CartProvider>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
              {/* 🌿 Public Customer Routes */}
              <Route path="/" element={<CustomerLayout><Landing /></CustomerLayout>} />
              <Route path="/login" element={<CustomerLayout><Login /></CustomerLayout>} />
              <Route path="/signup" element={<CustomerLayout><Signup /></CustomerLayout>} />
              <Route path="/products" element={<CustomerLayout><ProductList /></CustomerLayout>} />
              <Route path="/product" element={<CustomerLayout><ProductList /></CustomerLayout>} />
              <Route path="/products/:id" element={<CustomerLayout><ProductDetail /></CustomerLayout>} />
              <Route path="/cart" element={<CustomerLayout><Cart /></CustomerLayout>} />
              <Route path="/profile" element={<CustomerLayout><Profile /></CustomerLayout>} />
              <Route path="/orders" element={<CustomerLayout><Orders /></CustomerLayout>} />
              <Route path="/checkout" element={<CustomerLayout><Checkout /></CustomerLayout>} />
              <Route path="/order/history" element={<CustomerLayout><Orders /></CustomerLayout>} />
              <Route path="/payment" element={<CustomerLayout><Payment /></CustomerLayout>} />
              <Route path="/about" element={<CustomerLayout><AboutPage /></CustomerLayout>} />
              <Route path="/forgot-password" element={<CustomerLayout><ForgotPassword /></CustomerLayout>} />
              <Route path="/order/success" element={<CustomerLayout><OrderSuccess /></CustomerLayout>} />
              <Route path="/order/:id" element={<CustomerLayout><OrderDetail /></CustomerLayout>} />
              <Route path="/support" element={<CustomerLayout><Support /></CustomerLayout>} />

              {/* Accept reset token via query string: /reset-password?token=... */}
              <Route path="/reset-password" element={<CustomerLayout><ResetPassword /></CustomerLayout>} />

              {/* Accept reset token via path param: /reset-password/:token */}
              <Route path="/reset-password/:token" element={<CustomerLayout><ResetPassword /></CustomerLayout>} />

              {/* 🔐 Public Admin Routes */}
              <Route path="/admin" element={<AdminLanding />} />
              <Route path="/admin/login" element={<AdminLanding />} />
              <Route path="/admin/setup" element={<AdminSetup />} />

              {/* 🔐 Protected Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminLayout><AdminDashboard /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminLayout><ProductManager /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminLayout><OrderManager /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminLayout><UserManager /></AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* 🚫 Unauthorized Access */}
              <Route
                path="/unauthorized"
                element={
                  <CustomerLayout>
                    <h2 style={{ textAlign: 'center', marginTop: '2rem' }}>Access Denied</h2>
                  </CustomerLayout>
                }
              />
                </Routes>
              </Suspense>
            </CartProvider>
          </AuthProvider>
          <ToastContainer 
            position="top-right" 
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastStyle={{
              fontSize: '14px',
              maxWidth: '400px'
            }}
          />
        </Router>
      </ErrorBoundary>
    </>
  );
};

export default App;
