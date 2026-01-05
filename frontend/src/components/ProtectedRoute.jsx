import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; 

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');

  if (!token) return <Navigate to="/login" />;

  try {
    const decoded = jwtDecode(token);
    const role = decoded.role;
    const exp = decoded.exp;

    // ⏳ Check token expiration
    if (Date.now() >= exp * 1000) {
      localStorage.clear();
      return <Navigate to="/login" />;
    }

    // 🔐 Check role authorization
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" />;
    }

    return children;
  } catch (err) {
    console.error('Invalid token:', err);
    localStorage.clear();
    return <Navigate to="/login" />;
  }
};

export default ProtectedRoute;
