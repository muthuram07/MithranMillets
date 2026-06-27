# Render Backend Deployment

Create one Docker Web Service for each Spring application. Docker services do
not need Build Command or Start Command values because each Dockerfile defines
the complete build and startup process.

## Services

| Render service | Root directory |
| --- | --- |
| Eureka | `backend/EurekaServer` |
| Auth | `backend/auth-service` |
| Product | `backend/product-service` |
| Cart | `backend/cart-service` |
| Order | `backend/order-service` |
| Payment | `backend/payment-service` |

Choose `Docker` as the runtime for every service. Render supplies `PORT`
automatically, and every Spring application now reads it.

## Shared environment variables

Set these on Auth, Product, Cart, Order, and Payment:

```text
DB_HOST=mithranmillets-muthuraman31-db0d.e.aivencloud.com
DB_PORT=24610
DB_USERNAME=avnadmin
DB_PASSWORD=<Aiven password>
JWT_SECRET=<the same random value of at least 32 characters on every service>
CORS_ALLOWED_ORIGINS=https://<your-frontend-host>
EUREKA_ENABLED=false
```

The services call each other directly, so Eureka can be disabled on Render.
This is also more reliable on Render's free web services, which cannot receive
private-network requests. Eureka remains available for local development.

## Service URLs

After Render assigns each public URL, configure these variables without a
trailing slash:

| Service | Variables |
| --- | --- |
| Product | `AUTH_SERVICE_URL=https://<auth-service>.onrender.com` |
| Cart | `AUTH_SERVICE_URL=https://<auth-service>.onrender.com`, `PRODUCT_SERVICE_URL=https://<product-service>.onrender.com` |
| Order | `AUTH_SERVICE_URL=https://<auth-service>.onrender.com`, `PRODUCT_SERVICE_URL=https://<product-service>.onrender.com`, `CART_SERVICE_URL=https://<cart-service>.onrender.com`, `PAYMENT_SERVICE_URL=https://<payment-service>.onrender.com` |
| Payment | `AUTH_SERVICE_URL=https://<auth-service>.onrender.com`, `ORDER_SERVICE_URL=https://<order-service>.onrender.com` |

## Additional secrets

Auth:

```text
FRONTEND_BASE_URL=https://<your-frontend-host>
MAIL_USERNAME=<SMTP username>
MAIL_PASSWORD=<SMTP app password>
INTERNAL_AUTH_TOKEN=<shared random internal token>
```

Product:

```text
INTERNAL_AUTH_TOKEN=<same internal token used by Auth>
```

Order:

```text
FRONTEND_BASE_URL=https://<your-frontend-host>
MAIL_USERNAME=<SMTP username>
MAIL_PASSWORD=<SMTP app password>
MAIL_FROM=Mithran Millets <your-email@example.com>
```

Payment:

```text
RAZORPAY_KEY=<Razorpay key>
RAZORPAY_SECRET=<Razorpay secret>
```

Rotate any database, Razorpay, JWT, or SMTP credentials that were previously
stored in source code or shared outside the hosting secret manager.
