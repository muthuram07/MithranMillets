export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = '/login';
};
