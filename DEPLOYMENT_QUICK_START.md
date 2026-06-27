# Quick Start: Render Deployment Checklist

Follow these steps to deploy Mithran Millets to Render.

## 1. Prerequisites

- [ ] GitHub account with repo pushed
- [ ] Render account (free tier available)
- [ ] Aiven MySQL credentials (from existing RENDER_DEPLOYMENT.md)
- [ ] Razorpay API keys
- [ ] SMTP credentials (Gmail app password recommended)

## 2. Deployment Step-by-Step

### Step 1: Deploy Backend Services (In This Order)

**A. Eureka Server**
```
Service Name: mithran-eureka
Root Directory: backend/EurekaServer
Runtime: Docker
Region: Pick your region
```
⏱️ Wait for deployment (~5-10 min)  
📝 Note the URL: `https://mithran-eureka.onrender.com`

**B. Auth Service**
```
Service Name: mithran-auth
Root Directory: backend/auth-service
Runtime: Docker
```
Set Environment Variables (see RENDER_ENV_SETUP.md for complete list)
```
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD
JWT_SECRET
CORS_ALLOWED_ORIGINS=https://<your-frontend>.onrender.com
EUREKA_ENABLED=false
```
⏱️ Wait for deployment  
📝 Note URL: `https://mithran-auth.onrender.com`

**C. Product, Cart, Order, Payment Services**
Repeat the same process with their respective:
- Root directories
- Service-specific environment variables (from RENDER_ENV_SETUP.md)
- Shared environment variables (same DB, JWT_SECRET, CORS)

### Step 2: Deploy Frontend

**Static Site Option:**
```
Service Name: mithran-frontend
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

Set Environment Variables:
```
VITE_AUTH_API_BASE_URL=https://mithran-auth.onrender.com
VITE_PRODUCT_API_BASE_URL=https://mithran-product.onrender.com
VITE_CART_API_BASE_URL=https://mithran-cart.onrender.com
VITE_ORDER_API_BASE_URL=https://mithran-order.onrender.com
VITE_PAYMENT_API_BASE_URL=https://mithran-payment.onrender.com
```

**OR Docker Option:**
```
Service Name: mithran-frontend
Root Directory: frontend
Runtime: Docker
```
(Same environment variables as above)

## 3. Post-Deployment Testing

```bash
# Test Auth Service
curl https://mithran-auth.onrender.com/actuator/health

# Test Product Service
curl https://mithran-product.onrender.com/actuator/health

# Test Frontend
Open in browser: https://mithran-frontend.onrender.com
```

## 4. Verify Everything Works

- [ ] Frontend loads without errors
- [ ] Can register a new account
- [ ] Can login
- [ ] Can browse products
- [ ] Can add items to cart
- [ ] Can checkout (test with Razorpay test keys)

## Environment Variables Reference

**Complete list in:** [RENDER_ENV_SETUP.md](RENDER_ENV_SETUP.md)

**Quick reference:**
- All services need: `DB_*`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `EUREKA_ENABLED=false`
- Auth/Order need: `MAIL_*`, `FRONTEND_BASE_URL`
- Product needs: `INTERNAL_AUTH_TOKEN`
- Cart/Order need: Service URL environment variables
- Payment needs: `RAZORPAY_*`

## Important Notes

⚠️ **Security:**
- Use strong random values for `JWT_SECRET` (32+ characters)
- Use app-specific passwords for email (not main password)
- Rotate credentials that were previously in code

🔄 **After First Deployment:**
- Update `CORS_ALLOWED_ORIGINS` on each backend service with actual frontend URL
- Test inter-service communication
- Monitor logs for errors

📝 **Documentation:**
- Full deployment guide: [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
- Environment setup: [RENDER_ENV_SETUP.md](RENDER_ENV_SETUP.md)

## Troubleshooting

**Build fails:**
- Check Render logs for error details
- Ensure root directory is correct
- Verify pom.xml exists for backend services

**Services can't communicate:**
- Check `CORS_ALLOWED_ORIGINS` on each service
- Verify service URLs in environment variables
- Check Render logs for CORS errors

**Frontend shows errors:**
- Open browser DevTools (F12)
- Check Network tab for failed API calls
- Check Console tab for error messages
- Verify environment variables are set

**Database connection fails:**
- Verify `DB_*` credentials are correct
- Check if Aiven firewall allows Render IPs
- Test credentials locally first

## Support Resources

- Render Docs: https://render.com/docs
- Spring Boot: https://spring.io/projects/spring-boot
- Vite: https://vitejs.dev/
- Aiven MySQL: https://aiven.io/mysql

---

**Next Steps:**
1. Ensure all changes are pushed to GitHub
2. Create Render account at https://render.com
3. Follow deployment steps above
4. Refer to RENDER_ENV_SETUP.md for detailed environment variable configuration
