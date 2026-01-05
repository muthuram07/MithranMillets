Mithran Millets — One‑Page Cheat‑Sheet

Quick Run
- npm install
- npm run dev (Vite)
- Open http://localhost:5173 (or shown port)

Key Libraries
- React 19, Vite — UI + bundler
- @mui/material + @mui/icons-material — UI components
- axios — HTTP client (service wrappers)
- react-router-dom — Routing (BrowserRouter, Routes, useNavigate)
- react-toastify — Toasts
- framer-motion — page transitions
- jwt-decode — decode JWT for roles

Project Layout (important files)
- src/main.jsx — app bootstrap (renders <App />)
- src/App.jsx — Router + Routes; providers (AuthProvider, CartProvider) wrap Routes
- src/context/AuthContext.jsx — auth state, login/logout, restore, listens for 'authChanged'
- src/context/CartContext.jsx — cart state, optimistic updates, refresh from server
- src/services/* — apiProduct, apiCart, apiOrder, apiPayment (axios instances with Authorization interceptor)
- src/pages/ProductList.jsx — product listing, search, add to cart, login prompt
- src/pages/Checkout.jsx — address form (POST / PATCH), order placement, COD & Razorpay flows
- src/components/ProtectedRoute.jsx — route guard for admin routes
- src/styles/*.css — page-specific CSS (productlist.css)

Auth Flow (how to explain)
1. Login page posts credentials -> backend returns JWT
2. Login stores token (localStorage) and dispatches window 'authChanged'
3. AuthContext.restore() reads localStorage -> sets isAuthenticated and user
4. axios interceptors in services attach Authorization: Bearer <token>
5. ProtectedRoute checks AuthContext or JWT role to allow admin routes

Cart Flow (how to explain)
- addToCart(product, qty): optimistic local update then apiCart.addItem(productId, qty)
- on success: refreshCartFromServer(); on failure: rollback previous local state
- cart stored in CartContext and used across pages

Checkout & Address
- GET /order/address -> sets defaultAddress
- Add address: POST /order/address (new) -> update defaultAddress immediately
- Edit address: PATCH /order/address/{id} -> update defaultAddress immediately
- Place order: POST /order/place with items, paymentMethod, address
  - COD: display success, refresh cart, navigate /order/success
  - Razorpay: use server provided razorpayOrderId/amount, navigate to /payment

Important API Endpoints (frontend expectations)
- Products: GET /products
- Cart: apiCart.getCart(), POST /cart/add/{productId}/{qty}, PATCH /cart/update/{productId}
- Order: GET /order/cart, GET /order/cart-totals, POST /order/summary, POST /order/place
- Address: GET /order/address, POST /order/address, PATCH /order/address/{id}

UI/UX Notes to Mention
- Optimistic UI for cart (immediate feedback)
- Snackbar + dialog prompts on 401/403 to ask user to login
- Image handling: <img> with object-fit:cover and fixed aspect-ratio to keep card sizes uniform

Common Demo Script (2–3 minutes)
1. Show product list, search, open product detail
2. Click Add to Cart while logged out -> login dialog appears
3. Login -> token saved -> add to cart -> optimistic update -> open Cart
4. Go to Checkout -> Add address -> Save -> Place Order (COD) -> show order success
5. Show admin route (if admin role available) to demonstrate ProtectedRoute

Troubleshooting Quick Checks
- "useNavigate can only be used inside a Router": ensure a single BrowserRouter wraps the app; providers inside Router
- Token not picked up after login: ensure login dispatches `window.dispatchEvent(new Event('authChanged'))` or call AuthContext.login
- Address not showing after save: confirm POST/PATCH returns saved address object (including id)
- CORS/Backend errors: check browser network tab and baseURL in src/services/*

Security Notes (be ready to discuss)
- localStorage JWT is vulnerable to XSS; production should prefer HttpOnly secure cookies + refresh token flow
- Validate server responses and avoid trusting client-side totals for payment

One-line improvements you can propose
- Use react-query for caching/fetch state and background refetches
- Use HttpOnly refresh token cookie strategy for secure auth
- Centralize API error handling and show consistent UX for 401 -> auto-redirect to login

Need a printable PDF? Save/print this Markdown file to PDF from your editor or browser.

Good luck with your interview — if you want, I can also generate a 2‑slide checklist (demo steps + key talking points).
