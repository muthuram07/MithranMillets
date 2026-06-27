# Render Deployment - Environment Setup Guide

This guide explains how to configure environment variables for Render deployment.

## Frontend Environment Variables (.env.production)

When deploying to Render, you have two approaches:

### Approach 1: Update .env.production Before Building
Edit `frontend/.env.production` with your actual Render service URLs:

```env
VITE_AUTH_API_BASE_URL=https://mithran-auth.onrender.com
VITE_PRODUCT_API_BASE_URL=https://mithran-product.onrender.com
VITE_CART_API_BASE_URL=https://mithran-cart.onrender.com
VITE_ORDER_API_BASE_URL=https://mithran-order.onrender.com
VITE_PAYMENT_API_BASE_URL=https://mithran-payment.onrender.com
```

Then push to GitHub and redeploy.

### Approach 2: Use Render Build Environment Variables (Recommended)
1. In Render dashboard, go to your **Frontend Static Site**
2. Go to **Environment** tab
3. Add environment variables:
   - `VITE_AUTH_API_BASE_URL=https://mithran-auth.onrender.com`
   - `VITE_PRODUCT_API_BASE_URL=https://mithran-product.onrender.com`
   - `VITE_CART_API_BASE_URL=https://mithran-cart.onrender.com`
   - `VITE_ORDER_API_BASE_URL=https://mithran-order.onrender.com`
   - `VITE_PAYMENT_API_BASE_URL=https://mithran-payment.onrender.com`
4. Redeploy the service

This way, you don't need to commit `.env.production` to git.

## Backend Environment Variables

All 5 microservices (Auth, Product, Cart, Order, Payment) need these shared variables:

### Shared Variables (All Services)
```env
DB_HOST=mithranmillets-muthuraman31-db0d.e.aivencloud.com
DB_PORT=24610
DB_USERNAME=avnadmin
DB_PASSWORD=<your-aiven-password>
JWT_SECRET=<32-character-random-string>
CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>.onrender.com
EUREKA_ENABLED=false
```

### Service-Specific Variables

**Auth Service:**
```env
FRONTEND_BASE_URL=https://<your-frontend-domain>.onrender.com
MAIL_USERNAME=<your-email@gmail.com>
MAIL_PASSWORD=<your-app-password>
INTERNAL_AUTH_TOKEN=<random-token>
```

**Product Service:**
```env
AUTH_SERVICE_URL=https://mithran-auth.onrender.com
INTERNAL_AUTH_TOKEN=<same-token-as-auth>
```

**Cart Service:**
```env
AUTH_SERVICE_URL=https://mithran-auth.onrender.com
PRODUCT_SERVICE_URL=https://mithran-product.onrender.com
```

**Order Service:**
```env
AUTH_SERVICE_URL=https://mithran-auth.onrender.com
PRODUCT_SERVICE_URL=https://mithran-product.onrender.com
CART_SERVICE_URL=https://mithran-cart.onrender.com
PAYMENT_SERVICE_URL=https://mithran-payment.onrender.com
FRONTEND_BASE_URL=https://<your-frontend-domain>.onrender.com
MAIL_USERNAME=<your-email@gmail.com>
MAIL_PASSWORD=<your-app-password>
MAIL_FROM=Mithran Millets <noreply@yourdomain.com>
```

**Payment Service:**
```env
AUTH_SERVICE_URL=https://mithran-auth.onrender.com
ORDER_SERVICE_URL=https://mithran-order.onrender.com
RAZORPAY_KEY=<your-razorpay-key>
RAZORPAY_SECRET=<your-razorpay-secret>
```

## Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create Render services for all 6 backend microservices
- [ ] Deploy Eureka Server first, note its URL
- [ ] Deploy remaining services and configure their environment variables
- [ ] Deploy frontend and configure its environment variables
- [ ] Test health endpoints: `https://<service>.onrender.com/actuator/health`
- [ ] Test authentication: POST to `https://mithran-auth.onrender.com/api/auth/login`
- [ ] Test frontend loads and can communicate with backend
- [ ] Verify database connections work
- [ ] Monitor logs for any errors

## Troubleshooting

**Services can't communicate with each other:**
- Check that `CORS_ALLOWED_ORIGINS` is set correctly on all services
- Verify service URLs are accessible and correct

**Frontend can't reach backend:**
- Ensure environment variables are set in Render
- Check browser console for CORS errors
- Verify backend service is running (check Render logs)

**Database connection fails:**
- Verify credentials are correct
- Check if Aiven allows connections from Render IP addresses
- Test connection string locally first

**Email/Payment not working:**
- Verify SMTP credentials are correct
- Verify Razorpay keys are correct
- Check service logs for detailed error messages
