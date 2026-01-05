import React, { createContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// AuthContext provides:
// - isAuthenticated (boolean)
// - token (string|null)
// - user (object|null)
// - login(token, user) -> stores token and user, marks authenticated
// - logout() -> clears auth state
// - restore() -> tries to restore from localStorage (auto-run on mount)

export const AuthContext = createContext({
  isAuthenticated: false,
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
  restore: () => {},
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  // Persist helper
  const persist = useCallback((tok, usr) => {
    if (tok) {
      localStorage.setItem('token', tok);
      setToken(tok);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('token');
      setToken(null);
      setIsAuthenticated(false);
    }

    if (usr) {
      localStorage.setItem('user', JSON.stringify(usr));
      setUser(usr);
    } else {
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  // Public API: login
  const login = useCallback((tok, usr, redirectTo) => {
    // tok: JWT or auth token string
    // usr: user object { username, email, ... } or null
    persist(tok, usr);
    if (redirectTo) {
      navigate(redirectTo);
    }
  }, [navigate, persist]);

  // Public API: logout
  const logout = useCallback((redirectTo = '/login') => {
    persist(null, null);
    // optionally notify server about logout if needed
    navigate(redirectTo);
  }, [navigate, persist]);

  // Try restoring from localStorage on mount (keeps token/user in state)
  const restore = useCallback(() => {
    const tok = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    setToken(tok);
    setUser(u ? JSON.parse(u) : null);
    setIsAuthenticated(!!tok);
  }, []);

  useEffect(() => {
    restore();
  }, [restore]);

  // Listen for global auth change events (e.g. Login page dispatches 'authChanged')
  useEffect(() => {
    const onAuthChanged = () => {
      restore();
    };
    window.addEventListener('authChanged', onAuthChanged);
    return () => window.removeEventListener('authChanged', onAuthChanged);
  }, [restore]);

  // Keep isAuthenticated in sync if token changes externally
  useEffect(() => {
    setIsAuthenticated(!!token);
  }, [token]);

  const value = {
    isAuthenticated,
    token,
    user,
    login,
    logout,
    restore,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node,
};
