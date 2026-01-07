// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManager from './pages/admin/ProductManager';
import OrderManager from './pages/admin/OrderManager';
import UserManager from './pages/admin/UserManager';
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLanding from './pages/admin/AdminLanding';
import AdminSetup from './pages/admin/AdminSetup';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import AboutPage from './pages/AboutPage';
import ForgotPassword from './pages/ForgotPassword';
import OrderSuccess from './pages/OrderSuccess';
import ResetPassword from './pages/ResetPassword';
import Support from './pages/Support';
import OrderDetail from './pages/OrderDetail';

// add providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

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
      <Router>
        <AuthProvider>
          <CartProvider>
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
          </CartProvider>
        </AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </>
  );
};

export default App;
