# Comprehensive Test Cases - Mithran Millets E-Commerce Platform

This document contains critical-path test cases for all microservices and the frontend application, ensuring system reliability, data consistency, and proper error handling.

---

## Table of Contents

1. [Auth Service Test Cases](#1-auth-service-test-cases)
2. [Product Service Test Cases](#2-product-service-test-cases)
3. [Cart Service Test Cases](#3-cart-service-test-cases)
4. [Order Service Test Cases](#4-order-service-test-cases)
5. [Payment Service Test Cases](#5-payment-service-test-cases)
6. [Frontend Application Test Cases](#6-frontend-application-test-cases)
7. [Cross-Service Integration Test Cases](#7-cross-service-integration-test-cases)

---

## 1. Auth Service Test Cases

### 1.1 API Contract Validation

#### TC-AUTH-001: User Registration - Valid Request
**Priority:** Critical  
**Objective:** Verify successful user registration with valid data

**Preconditions:**
- Auth service is running
- Database is accessible
- User does not exist

**Test Steps:**
1. Send POST request to `/auth/signup` with valid user data:
   ```json
   {
     "username": "testuser",
     "email": "test@example.com",
     "password": "Test@1234",
     "fullName": "Test User",
     "phone": "1234567890"
   }
   ```

**Expected Results:**
- HTTP 201 Created
- Response contains JWT token
- User is created in database with USER role
- Password is hashed (not plain text)
- Returns user object without sensitive data

**Postconditions:**
- User can login with registered credentials

---

#### TC-AUTH-002: User Registration - Duplicate Username
**Priority:** Critical  
**Objective:** Verify system prevents duplicate username registration

**Preconditions:**
- User with username "existinguser" exists

**Test Steps:**
1. Attempt to register with existing username "existinguser"

**Expected Results:**
- HTTP 409 Conflict
- Error message: "Username already exists" (user-friendly)
- No duplicate user created
- Database integrity maintained

---

#### TC-AUTH-003: User Registration - Invalid Email Format
**Priority:** High  
**Objective:** Verify email validation

**Test Steps:**
1. Send POST request with invalid email: "invalid-email"

**Expected Results:**
- HTTP 400 Bad Request
- Validation error message for email field
- No user created

---

#### TC-AUTH-004: User Registration - Weak Password
**Priority:** High  
**Objective:** Verify password strength validation

**Test Steps:**
1. Send POST request with password: "123"

**Expected Results:**
- HTTP 400 Bad Request
- Validation error indicating minimum password requirements
- No user created

---

#### TC-AUTH-005: User Login - Valid Credentials (Username)
**Priority:** Critical  
**Objective:** Verify successful login with username

**Preconditions:**
- Valid user exists in database

**Test Steps:**
1. Send POST request to `/auth/login`:
   ```json
   {
     "username": "testuser",
     "password": "Test@1234"
   }
   ```

**Expected Results:**
- HTTP 200 OK
- Response contains JWT token
- Token contains user ID and role claims
- Token expiration time is valid

---

#### TC-AUTH-006: User Login - Valid Credentials (Email)
**Priority:** Critical  
**Objective:** Verify login with email

**Test Steps:**
1. Send POST request with email instead of username

**Expected Results:**
- HTTP 200 OK
- JWT token returned
- Same token structure as username login

---

#### TC-AUTH-007: User Login - Invalid Credentials
**Priority:** Critical  
**Objective:** Verify login failure with wrong password

**Test Steps:**
1. Send POST request with correct username but wrong password

**Expected Results:**
- HTTP 401 Unauthorized
- Error message: "Invalid username or password" (generic, no user enumeration)
- No JWT token returned
- Failed login attempt logged

---

#### TC-AUTH-008: User Login - Non-existent User
**Priority:** High  
**Objective:** Verify login failure for non-existent user

**Test Steps:**
1. Send POST request with non-existent username

**Expected Results:**
- HTTP 401 Unauthorized
- Same error message as invalid password (prevents user enumeration)
- No information leak about user existence

---

### 1.2 Business Logic Correctness

#### TC-AUTH-009: JWT Token Validation
**Priority:** Critical  
**Objective:** Verify JWT token structure and claims

**Test Steps:**
1. Login successfully
2. Decode JWT token
3. Verify token claims: userId, role, exp, iat

**Expected Results:**
- Token contains required claims
- Expiration time is reasonable (e.g., 24 hours)
- Token signature is valid

---

#### TC-AUTH-010: Password Hashing
**Priority:** Critical  
**Objective:** Verify passwords are hashed, not stored in plain text

**Test Steps:**
1. Register a new user
2. Query database directly
3. Check password field

**Expected Results:**
- Password in database is hashed (BCrypt format)
- No plain text password visible
- Hash is different for same password (salt included)

---

#### TC-AUTH-011: Admin Account Creation
**Priority:** Critical  
**Objective:** Verify admin can create other admin accounts

**Preconditions:**
- Authenticated admin user

**Test Steps:**
1. Send POST request to `/auth/admin/create` with admin token in Authorization header
2. Include new admin user data

**Expected Results:**
- HTTP 201 Created
- New user created with ADMIN role
- Only accessible by existing admin

---

#### TC-AUTH-012: Regular User Cannot Create Admin
**Priority:** Critical  
**Objective:** Verify authorization for admin creation

**Preconditions:**
- Authenticated regular user (USER role)

**Test Steps:**
1. Send POST request to `/auth/admin/create` with regular user token

**Expected Results:**
- HTTP 403 Forbidden
- Error message: "Access denied. You don't have permission to perform this action."
- No admin created

---

### 1.3 Error Handling and Security

#### TC-AUTH-013: SQL Injection Prevention
**Priority:** Critical  
**Objective:** Verify system prevents SQL injection attacks

**Test Steps:**
1. Attempt login with username: `admin' OR '1'='1`
2. Attempt registration with SQL injection in fields

**Expected Results:**
- No SQL errors exposed
- Requests rejected as invalid input
- Generic error messages
- No database breach

---

#### TC-AUTH-014: XSS Prevention
**Priority:** High  
**Objective:** Verify XSS attack prevention

**Test Steps:**
1. Attempt registration with username: `<script>alert('XSS')</script>`

**Expected Results:**
- Input sanitized or rejected
- No script execution in stored data
- Proper encoding in responses

---

#### TC-AUTH-015: Rate Limiting
**Priority:** High  
**Objective:** Verify rate limiting on login endpoint

**Test Steps:**
1. Send 10+ rapid login attempts

**Expected Results:**
- After threshold, HTTP 429 Too Many Requests
- Rate limit headers included
- Legitimate users not blocked indefinitely

---

#### TC-AUTH-016: Token Expiration Handling
**Priority:** Critical  
**Objective:** Verify expired tokens are rejected

**Test Steps:**
1. Login and receive token
2. Wait for token expiration
3. Use expired token in protected endpoint

**Expected Results:**
- HTTP 401 Unauthorized
- Clear error message about token expiration
- Token cannot be refreshed without re-login

---

### 1.4 Integration with Dependent Services

#### TC-AUTH-017: Service Discovery Integration
**Priority:** High  
**Objective:** Verify auth service registers with Eureka

**Test Steps:**
1. Start Eureka server
2. Start auth service
3. Check Eureka dashboard

**Expected Results:**
- Auth service appears in Eureka registry
- Service health status is UP
- Other services can discover auth service

---

#### TC-AUTH-018: Database Connection Resilience
**Priority:** High  
**Objective:** Verify graceful handling of database failures

**Test Steps:**
1. Stop database service
2. Attempt user registration

**Expected Results:**
- HTTP 503 Service Unavailable or 500 Internal Server Error
- User-friendly error message
- Service remains stable
- Detailed error logged server-side

---

## 2. Product Service Test Cases

### 2.1 API Contract Validation

#### TC-PROD-001: Get All Products
**Priority:** Critical  
**Objective:** Verify product listing endpoint

**Test Steps:**
1. Send GET request to `/products`

**Expected Results:**
- HTTP 200 OK
- Returns array of products
- Each product contains: id, name, description, price, stock, category, imageUrl
- Products sorted by relevance or ID

---

#### TC-PROD-002: Get Product by ID - Valid ID
**Priority:** Critical  
**Objective:** Verify single product retrieval

**Preconditions:**
- Product with ID 1 exists

**Test Steps:**
1. Send GET request to `/products/1`

**Expected Results:**
- HTTP 200 OK
- Returns single product object
- All required fields present

---

#### TC-PROD-003: Get Product by ID - Invalid ID
**Priority:** High  
**Objective:** Verify 404 for non-existent product

**Test Steps:**
1. Send GET request to `/products/99999`

**Expected Results:**
- HTTP 404 Not Found
- Error message: "The requested product was not found. It may have been removed or does not exist."
- No stack trace or technical details exposed

---

#### TC-PROD-004: Create Product - Admin Only
**Priority:** Critical  
**Objective:** Verify admin can create products

**Preconditions:**
- Authenticated admin user

**Test Steps:**
1. Send POST request to `/products` with admin token:
   ```json
   {
     "name": "Test Millet",
     "description": "Test product",
     "price": 100.00,
     "stock": 50,
     "category": "Grain"
   }
   ```

**Expected Results:**
- HTTP 201 Created
- Product created with generated ID
- Returns created product object
- Product persisted in database

---

#### TC-PROD-005: Create Product - Unauthorized User
**Priority:** Critical  
**Objective:** Verify regular users cannot create products

**Preconditions:**
- Authenticated regular user

**Test Steps:**
1. Send POST request to `/products` with regular user token

**Expected Results:**
- HTTP 403 Forbidden
- Error message indicates insufficient permissions
- No product created

---

#### TC-PROD-006: Update Product - Valid Data
**Priority:** Critical  
**Objective:** Verify product update functionality

**Preconditions:**
- Product exists
- Authenticated admin

**Test Steps:**
1. Send PUT request to `/products/1` with updated data

**Expected Results:**
- HTTP 200 OK
- Product updated in database
- Returns updated product object
- All fields updated correctly

---

#### TC-PROD-007: Delete Product - Valid ID
**Priority:** High  
**Objective:** Verify product deletion

**Preconditions:**
- Product exists
- Authenticated admin
- Product not in any active orders

**Test Steps:**
1. Send DELETE request to `/products/1`

**Expected Results:**
- HTTP 200 OK or 204 No Content
- Product removed from database
- Subsequent GET returns 404

---

#### TC-PROD-008: Delete Product - Product in Use
**Priority:** High  
**Objective:** Verify deletion prevented for products in orders

**Preconditions:**
- Product exists in order items

**Test Steps:**
1. Attempt to delete product

**Expected Results:**
- HTTP 400 Bad Request or 409 Conflict
- Error message indicates product cannot be deleted
- Product remains in database

---

### 2.2 Business Logic Correctness

#### TC-PROD-009: Stock Management - Decrease Stock
**Priority:** Critical  
**Objective:** Verify stock decreases on order placement

**Preconditions:**
- Product with stock = 50

**Test Steps:**
1. Place order with quantity = 5
2. Verify product stock

**Expected Results:**
- Product stock = 45
- Stock updated atomically
- No race conditions

---

#### TC-PROD-010: Stock Management - Out of Stock
**Priority:** Critical  
**Objective:** Verify orders cannot exceed available stock

**Preconditions:**
- Product with stock = 2

**Test Steps:**
1. Attempt to add quantity 5 to cart

**Expected Results:**
- Error returned
- Cart addition rejected
- Stock remains unchanged

---

#### TC-PROD-011: Price Validation
**Priority:** High  
**Objective:** Verify price constraints

**Test Steps:**
1. Attempt to create product with negative price
2. Attempt to create product with price = 0
3. Attempt to create product with extremely high price

**Expected Results:**
- Negative price: HTTP 400 Bad Request
- Zero price: Valid (for free products) or rejected based on business rules
- Very high price: Valid if within decimal limits

---

#### TC-PROD-012: Category Filtering
**Priority:** Medium  
**Objective:** Verify products can be filtered by category

**Test Steps:**
1. Send GET request to `/products?category=Grain`

**Expected Results:**
- HTTP 200 OK
- Returns only products in "Grain" category
- Empty array if no matches

---

### 2.3 Integration with Dependent Services

#### TC-PROD-013: Cart Service Integration - Stock Check
**Priority:** Critical  
**Objective:** Verify cart service receives accurate stock information

**Test Steps:**
1. Cart service requests product details
2. Verify product service responds with current stock

**Expected Results:**
- Real-time stock information provided
- No stale data cached
- Consistent stock values across services

---

#### TC-PROD-014: Order Service Integration - Stock Deduction
**Priority:** Critical  
**Objective:** Verify stock deducted when order service confirms order

**Test Steps:**
1. Order service notifies product service of order
2. Verify stock updated correctly

**Expected Results:**
- Stock deducted atomically
- No double deduction
- Transaction rolled back if order fails

---

### 2.4 Error Handling

#### TC-PROD-015: Database Connection Failure
**Priority:** High  
**Objective:** Verify graceful degradation when database unavailable

**Test Steps:**
1. Stop database
2. Attempt to retrieve products

**Expected Results:**
- HTTP 503 Service Unavailable
- User-friendly error message
- Service logs detailed error
- Service remains stable

---

#### TC-PROD-016: Concurrent Stock Updates
**Priority:** Critical  
**Objective:** Verify race condition handling

**Test Steps:**
1. Two simultaneous orders for same product
2. Product stock = 5, both orders quantity = 3

**Expected Results:**
- One order succeeds, one fails or both adjust correctly
- Stock never goes negative
- Database integrity maintained
- No lost updates

---

## 3. Cart Service Test Cases

### 3.1 API Contract Validation

#### TC-CART-001: Get Cart - Authenticated User
**Priority:** Critical  
**Objective:** Verify cart retrieval for logged-in user

**Preconditions:**
- User authenticated
- Cart has items

**Test Steps:**
1. Send GET request to `/cart` with valid JWT token

**Expected Results:**
- HTTP 200 OK
- Returns array of cart items
- Each item contains: id, productId, productName, quantity, price, subtotal

---

#### TC-CART-002: Get Cart - Empty Cart
**Priority:** High  
**Objective:** Verify empty cart returns empty array

**Preconditions:**
- User authenticated
- Cart is empty

**Test Steps:**
1. Send GET request to `/cart`

**Expected Results:**
- HTTP 200 OK
- Returns empty array []
- Not null or error

---

#### TC-CART-003: Add Item to Cart - Valid Product
**Priority:** Critical  
**Objective:** Verify adding item to cart

**Preconditions:**
- Product exists with stock > 0
- User authenticated

**Test Steps:**
1. Send POST request to `/cart/add/{productId}/{quantity}`

**Expected Results:**
- HTTP 200 OK or 201 Created
- Item added to cart
- Returns updated cart or cart item
- Quantity matches request

---

#### TC-CART-004: Add Item to Cart - Product Unavailable
**Priority:** Critical  
**Objective:** Verify cannot add out-of-stock product

**Preconditions:**
- Product stock = 0

**Test Steps:**
1. Attempt to add product to cart

**Expected Results:**
- HTTP 404 Not Found or 400 Bad Request
- Error message: "The requested product is currently unavailable."
- Item not added to cart

---

#### TC-CART-005: Add Item to Cart - Quantity Exceeds Stock
**Priority:** Critical  
**Objective:** Verify quantity validation against stock

**Preconditions:**
- Product stock = 5
- Requested quantity = 10

**Test Steps:**
1. Attempt to add quantity 10

**Expected Results:**
- HTTP 400 Bad Request
- Error message indicates insufficient stock
- Current stock value provided
- Item not added

---

#### TC-CART-006: Update Cart Item Quantity
**Priority:** Critical  
**Objective:** Verify quantity update

**Preconditions:**
- Item exists in cart
- User authenticated

**Test Steps:**
1. Send PATCH request to `/cart/update/{productId}`:
   ```json
   { "quantity": 3 }
   ```

**Expected Results:**
- HTTP 200 OK
- Cart item quantity updated
- Returns updated cart item
- Subtotal recalculated

---

#### TC-CART-007: Update Cart Item - Reduce Quantity
**Priority:** High  
**Objective:** Verify quantity can be reduced

**Test Steps:**
1. Cart item has quantity = 5
2. Update to quantity = 2

**Expected Results:**
- HTTP 200 OK
- Quantity reduced to 2
- Cart total updated correctly

---

#### TC-CART-008: Update Cart Item - Set Quantity to Zero
**Priority:** Medium  
**Objective:** Verify zero quantity behavior

**Test Steps:**
1. Update cart item quantity to 0

**Expected Results:**
- Item removed from cart OR
- HTTP 400 Bad Request (depending on implementation)
- Cart total updated

---

#### TC-CART-009: Remove Item from Cart
**Priority:** Critical  
**Objective:** Verify item removal

**Preconditions:**
- Cart has items
- User authenticated

**Test Steps:**
1. Send DELETE request to `/cart/remove/{itemId}`

**Expected Results:**
- HTTP 200 OK or 204 No Content
- Item removed from cart
- Cart total updated
- Subsequent GET returns cart without item

---

#### TC-CART-010: Remove Item - Invalid ID
**Priority:** High  
**Objective:** Verify error for non-existent cart item

**Test Steps:**
1. Attempt to delete non-existent cart item

**Expected Results:**
- HTTP 404 Not Found
- Error message: "The cart item was not found. It may have been removed."
- Cart unchanged

---

### 3.2 Business Logic Correctness

#### TC-CART-011: Cart Persistence Across Sessions
**Priority:** Critical  
**Objective:** Verify cart persists after user logout/login

**Preconditions:**
- User adds items to cart
- User logs out

**Test Steps:**
1. User logs out
2. User logs in again
3. Retrieve cart

**Expected Results:**
- Cart items still present
- Quantities unchanged
- Prices may be updated (if product prices changed)

---

#### TC-CART-012: Multiple Items in Cart
**Priority:** Critical  
**Objective:** Verify cart supports multiple products

**Test Steps:**
1. Add product A (quantity 2)
2. Add product B (quantity 3)
3. Retrieve cart

**Expected Results:**
- Cart contains both items
- Quantities correct
- Total is sum of all item subtotals

---

#### TC-CART-013: Duplicate Product Addition
**Priority:** High  
**Objective:** Verify adding same product updates quantity

**Preconditions:**
- Cart has Product A (quantity 2)

**Test Steps:**
1. Add Product A again (quantity 1)

**Expected Results:**
- Quantity updated to 3 (merged) OR
- New cart item created (depending on implementation)
- No duplicate entries

---

#### TC-CART-014: Price Consistency
**Priority:** High  
**Objective:** Verify prices match current product prices

**Test Steps:**
1. Add product to cart (price = 100)
2. Admin updates product price to 150
3. Retrieve cart

**Expected Results:**
- Cart shows updated price OR
- Cart shows original price (frozen)
- Business logic determines behavior
- Total recalculated correctly

---

### 3.3 Integration with Product Service

#### TC-CART-015: Real-time Stock Validation
**Priority:** Critical  
**Objective:** Verify stock checked before adding to cart

**Test Steps:**
1. Product stock = 1
2. User A adds to cart
3. User B attempts to add same product

**Expected Results:**
- User A: Success
- User B: Failure or wait-list (depending on reservation logic)
- Stock validated in real-time

---

#### TC-CART-016: Product Deletion Handling
**Priority:** High  
**Objective:** Verify cart handles deleted products

**Preconditions:**
- Product in user's cart
- Admin deletes product

**Test Steps:**
1. User retrieves cart

**Expected Results:**
- Deleted product removed from cart OR
- Product marked as unavailable
- Error message displayed to user
- Cart total adjusted

---

### 3.4 Error Handling

#### TC-CART-017: Unauthenticated Access
**Priority:** Critical  
**Objective:** Verify cart requires authentication

**Test Steps:**
1. Send GET request to `/cart` without token

**Expected Results:**
- HTTP 401 Unauthorized
- Error message prompts login
- No cart data exposed

---

#### TC-CART-018: Invalid Product ID
**Priority:** High  
**Objective:** Verify error for non-existent product

**Test Steps:**
1. Attempt to add product with ID 99999

**Expected Results:**
- HTTP 404 Not Found
- User-friendly error message
- No partial cart state created

---

## 4. Order Service Test Cases

### 4.1 API Contract Validation

#### TC-ORDER-001: Place Order - Valid Cart
**Priority:** Critical  
**Objective:** Verify order creation from cart

**Preconditions:**
- User authenticated
- Cart has items
- Address exists

**Test Steps:**
1. Send POST request to `/order/place`

**Expected Results:**
- HTTP 201 Created
- Order created with unique order ID
- Order status = PLACED
- Cart cleared or order items copied
- Order persisted in database

---

#### TC-ORDER-002: Place Order - Empty Cart
**Priority:** Critical  
**Objective:** Verify order rejected for empty cart

**Preconditions:**
- Cart is empty

**Test Steps:**
1. Attempt to place order

**Expected Results:**
- HTTP 400 Bad Request
- Error message: "Your cart is empty. Please add items to your cart before placing an order."
- No order created

---

#### TC-ORDER-003: Place Order - No Address
**Priority:** Critical  
**Objective:** Verify address required for order

**Preconditions:**
- User has no address

**Test Steps:**
1. Attempt to place order

**Expected Results:**
- HTTP 400 Bad Request
- Error message: "No address found. Please add a delivery address to continue."
- No order created

---

#### TC-ORDER-004: Get User Orders
**Priority:** Critical  
**Objective:** Verify order history retrieval

**Preconditions:**
- User has placed orders

**Test Steps:**
1. Send GET request to `/order/history`

**Expected Results:**
- HTTP 200 OK
- Returns array of user's orders
- Orders sorted by date (newest first)
- Each order contains: id, orderDate, totalAmount, status, items

---

#### TC-ORDER-005: Get Order by ID - Valid Order
**Priority:** Critical  
**Objective:** Verify single order retrieval

**Preconditions:**
- Order exists
- User owns the order

**Test Steps:**
1. Send GET request to `/order/{orderId}`

**Expected Results:**
- HTTP 200 OK
- Returns complete order details
- Includes all order items, address, payment info

---

#### TC-ORDER-006: Get Order by ID - Unauthorized Access
**Priority:** Critical  
**Objective:** Verify users cannot access others' orders

**Preconditions:**
- Order belongs to User A
- User B authenticated

**Test Steps:**
1. User B attempts to get User A's order

**Expected Results:**
- HTTP 403 Forbidden or 404 Not Found
- Error message indicates unauthorized access
- No order data exposed

---

#### TC-ORDER-007: Get Order by ID - Admin Access
**Priority:** High  
**Objective:** Verify admin can access any order

**Preconditions:**
- Admin authenticated
- Order belongs to regular user

**Test Steps:**
1. Admin sends GET request to `/order/admin/{orderId}`

**Expected Results:**
- HTTP 200 OK
- Returns order details
- Admin can see all order information

---

#### TC-ORDER-008: Add Address
**Priority:** Critical  
**Objective:** Verify address creation

**Test Steps:**
1. Send POST request to `/order/address`:
   ```json
   {
     "street": "123 Main St",
     "city": "Mumbai",
     "state": "Maharashtra",
     "zipCode": "400001",
     "isDefault": true
   }
   ```

**Expected Results:**
- HTTP 201 Created
- Address saved for user
- Returns address object with ID

---

#### TC-ORDER-009: Update Address
**Priority:** High  
**Objective:** Verify address update

**Preconditions:**
- Address exists

**Test Steps:**
1. Send PATCH request to `/order/address/{addressId}` with updated data

**Expected Results:**
- HTTP 200 OK
- Address updated in database
- Returns updated address

---

#### TC-ORDER-010: Get Default Address
**Priority:** High  
**Objective:** Verify default address retrieval

**Preconditions:**
- User has default address

**Test Steps:**
1. Send GET request to `/order/address`

**Expected Results:**
- HTTP 200 OK
- Returns default address
- Used in checkout process

---

#### TC-ORDER-011: Update Order Status - Admin Only
**Priority:** Critical  
**Objective:** Verify admin can update order status

**Preconditions:**
- Order exists
- Admin authenticated

**Test Steps:**
1. Send PATCH request to `/order/{orderId}/status`:
   ```json
   { "status": "SHIPPED" }
   ```

**Expected Results:**
- HTTP 200 OK
- Order status updated
- Status history tracked (if implemented)
- User notified (if implemented)

---

### 4.2 Business Logic Correctness

#### TC-ORDER-012: Order Total Calculation
**Priority:** Critical  
**Objective:** Verify order total accuracy

**Preconditions:**
- Cart has: Item A (qty 2, price 100), Item B (qty 1, price 150)

**Test Steps:**
1. Place order

**Expected Results:**
- Order total = 350 (2*100 + 1*150)
- Total matches sum of item subtotals
- No calculation errors

---

#### TC-ORDER-013: Stock Deduction on Order
**Priority:** Critical  
**Objective:** Verify stock reduced when order placed

**Preconditions:**
- Product stock = 10
- Order quantity = 3

**Test Steps:**
1. Place order
2. Verify product stock

**Expected Results:**
- Product stock = 7
- Stock updated atomically
- Order confirmed only if stock available

---

#### TC-ORDER-014: Concurrent Order Processing
**Priority:** Critical  
**Objective:** Verify handling of simultaneous orders

**Preconditions:**
- Product stock = 5
- Two users attempt to order quantity 3 each

**Test Steps:**
1. Place both orders simultaneously

**Expected Results:**
- One order succeeds, one fails
- Stock never goes negative
- Both orders handled correctly
- No race conditions

---

#### TC-ORDER-015: Order Status Flow
**Priority:** High  
**Objective:** Verify valid status transitions

**Test Steps:**
1. Order created: PLACED
2. Update to: SHIPPED
3. Update to: DELIVERED
4. Attempt invalid transition: DELIVERED → PLACED

**Expected Results:**
- Valid transitions succeed
- Invalid transition rejected
- Status history maintained

---

#### TC-ORDER-016: Order Cancellation
**Priority:** High  
**Objective:** Verify order cancellation

**Preconditions:**
- Order status = PLACED
- User authenticated

**Test Steps:**
1. Cancel order

**Expected Results:**
- Order status = CANCELLED
- Stock restored (if not shipped)
- Payment refunded (if paid)
- User notified

---

### 4.3 Integration with Other Services

#### TC-ORDER-017: Cart Service Integration - Order from Cart
**Priority:** Critical  
**Objective:** Verify order created from cart items

**Test Steps:**
1. Cart has 3 items
2. Place order

**Expected Results:**
- Order contains all cart items
- Quantities match cart
- Cart cleared after order
- Cart service notified

---

#### TC-ORDER-018: Product Service Integration - Stock Check
**Priority:** Critical  
**Objective:** Verify stock validated before order confirmation

**Test Steps:**
1. Cart item product stock = 0
2. Attempt to place order

**Expected Results:**
- Order rejected
- Error message about unavailable product
- Cart updated or user notified

---

#### TC-ORDER-019: Payment Service Integration - Payment Processing
**Priority:** Critical  
**Objective:** Verify payment service called during order

**Test Steps:**
1. Place order with payment method
2. Verify payment service invoked

**Expected Results:**
- Payment service called
- Order created only after payment success
- Payment ID linked to order
- Transaction atomic

---

#### TC-ORDER-020: Auth Service Integration - User Validation
**Priority:** High  
**Objective:** Verify order service validates user token

**Test Steps:**
1. Use expired token to place order

**Expected Results:**
- HTTP 401 Unauthorized
- Order rejected
- Auth service validates token

---

### 4.4 Error Handling

#### TC-ORDER-021: Service Failure - Product Service Down
**Priority:** High  
**Objective:** Verify graceful handling when product service unavailable

**Test Steps:**
1. Stop product service
2. Attempt to place order

**Expected Results:**
- HTTP 503 Service Unavailable or appropriate error
- User-friendly error message
- Order not created
- Service logs error for retry

---

#### TC-ORDER-022: Service Failure - Payment Service Down
**Priority:** Critical  
**Objective:** Verify order handling when payment service fails

**Test Steps:**
1. Stop payment service
2. Attempt to place order

**Expected Results:**
- Order in pending state OR
- Order rejected with clear message
- User can retry payment
- Order rolled back if needed

---

#### TC-ORDER-023: Database Transaction Rollback
**Priority:** Critical  
**Objective:** Verify transaction rollback on failure

**Test Steps:**
1. Place order
2. Simulate failure after stock deduction but before order save

**Expected Results:**
- Transaction rolled back
- Stock restored
- No partial order created
- Database integrity maintained

---

## 5. Payment Service Test Cases

### 5.1 API Contract Validation

#### TC-PAY-001: Initiate Payment - Valid Order
**Priority:** Critical  
**Objective:** Verify payment initiation

**Preconditions:**
- Order exists
- Order amount = 500
- User authenticated

**Test Steps:**
1. Send POST request to `/payment/initiate`:
   ```json
   {
     "orderId": 1,
     "amount": 500.00,
     "paymentMethod": "RAZORPAY"
   }
   ```

**Expected Results:**
- HTTP 200 OK
- Returns payment gateway details (Razorpay order ID, key)
- Payment status = PENDING
- Payment record created

---

#### TC-PAY-002: Initiate Payment - Invalid Order
**Priority:** Critical  
**Objective:** Verify payment rejected for non-existent order

**Test Steps:**
1. Attempt payment for order ID 99999

**Expected Results:**
- HTTP 404 Not Found
- Error message about order not found
- No payment record created

---

#### TC-PAY-003: Initiate Payment - Amount Mismatch
**Priority:** Critical  
**Objective:** Verify amount validation

**Preconditions:**
- Order amount = 500
- Requested amount = 400

**Test Steps:**
1. Attempt payment with wrong amount

**Expected Results:**
- HTTP 400 Bad Request
- Error message about amount mismatch
- Payment rejected

---

#### TC-PAY-004: Payment Callback - Success
**Priority:** Critical  
**Objective:** Verify payment success callback handling

**Test Steps:**
1. Razorpay sends success callback
2. Verify payment status updated

**Expected Results:**
- Payment status = SUCCESS
- Order status updated (if linked)
- Transaction ID stored
- User notified

---

#### TC-PAY-005: Payment Callback - Failure
**Priority:** Critical  
**Objective:** Verify payment failure handling

**Test Steps:**
1. Razorpay sends failure callback

**Expected Results:**
- Payment status = FAILED
- Order status remains PLACED
- Failure reason logged
- User notified to retry

---

#### TC-PAY-006: Verify Payment Status
**Priority:** High  
**Objective:** Verify payment status retrieval

**Preconditions:**
- Payment exists

**Test Steps:**
1. Send GET request to `/payment/{paymentId}/status`

**Expected Results:**
- HTTP 200 OK
- Returns payment status and details
- Includes transaction ID if successful

---

#### TC-PAY-007: Process COD Payment
**Priority:** High  
**Objective:** Verify Cash on Delivery payment

**Test Steps:**
1. Place order with payment method = COD

**Expected Results:**
- Payment status = PENDING
- Order confirmed
- Payment marked for collection on delivery
- No gateway interaction

---

### 5.2 Business Logic Correctness

#### TC-PAY-008: Payment Amount Security
**Priority:** Critical  
**Objective:** Verify payment amount cannot be tampered

**Preconditions:**
- Order amount = 500

**Test Steps:**
1. Attempt to initiate payment with amount = 1

**Expected Results:**
- Amount validated against order
- Payment rejected if mismatch
- Security maintained

---

#### TC-PAY-009: Duplicate Payment Prevention
**Priority:** Critical  
**Objective:** Verify same order cannot be paid twice

**Preconditions:**
- Order already paid

**Test Steps:**
1. Attempt to initiate payment again

**Expected Results:**
- HTTP 409 Conflict or 400 Bad Request
- Error message: "Payment already processed"
- No duplicate payment

---

#### TC-PAY-010: Payment Refund
**Priority:** High  
**Objective:** Verify refund processing (if implemented)

**Preconditions:**
- Payment successful
- Order cancelled

**Test Steps:**
1. Process refund

**Expected Results:**
- Refund initiated with gateway
- Payment status updated
- User notified
- Refund tracked

---

### 5.3 Integration with Order Service

#### TC-PAY-011: Order Status Update on Payment
**Priority:** Critical  
**Objective:** Verify order status updated after payment

**Test Steps:**
1. Payment succeeds
2. Verify order status

**Expected Results:**
- Order status = CONFIRMED or PAID
- Order service notified
- Status synchronized

---

#### TC-PAY-012: Payment Failure - Order Status
**Priority:** Critical  
**Objective:** Verify order handling on payment failure

**Test Steps:**
1. Payment fails
2. Verify order status

**Expected Results:**
- Order remains PLACED
- User can retry payment
- Order not shipped

---

### 5.4 Error Handling and Security

#### TC-PAY-013: Payment Gateway Timeout
**Priority:** High  
**Objective:** Verify handling of gateway timeouts

**Test Steps:**
1. Simulate Razorpay timeout

**Expected Results:**
- Payment status = PENDING
- Error logged
- User can retry
- No partial payment state

---

#### TC-PAY-014: Payment Callback Verification
**Priority:** Critical  
**Objective:** Verify callback signature validation

**Test Steps:**
1. Send fake callback with invalid signature

**Expected Results:**
- Callback rejected
- Payment status unchanged
- Security breach prevented
- Attempt logged

---

#### TC-PAY-015: Sensitive Data Protection
**Priority:** Critical  
**Objective:** Verify payment details not exposed

**Test Steps:**
1. Retrieve payment details

**Expected Results:**
- No sensitive card details in response
- Only payment status and transaction ID
- Security best practices followed

---

#### TC-PAY-016: Service Failure - Gateway Unavailable
**Priority:** High  
**Objective:** Verify handling when payment gateway down

**Test Steps:**
1. Payment gateway unavailable
2. Attempt payment

**Expected Results:**
- HTTP 503 Service Unavailable
- User-friendly error message
- Payment retry mechanism available
- Service remains stable

---

## 6. Frontend Application Test Cases

### 6.1 UI Consistency Between Admin and Customer Dashboards

#### TC-FRONT-001: Theme Consistency
**Priority:** High  
**Objective:** Verify Admin and Customer dashboards use same theme

**Test Steps:**
1. Open Customer dashboard
2. Note color scheme, typography, spacing
3. Open Admin dashboard
4. Compare styling

**Expected Results:**
- Same primary color (#2d6a4f)
- Same font family (Georgia for headings)
- Consistent button styles
- Consistent card/Paper component styling
- Same background gradients

---

#### TC-FRONT-002: Component Consistency
**Priority:** High  
**Objective:** Verify same UI components used across dashboards

**Test Steps:**
1. Compare buttons, inputs, cards, modals

**Expected Results:**
- Material-UI components used consistently
- Same elevation and shadow styles
- Consistent border radius
- Same icon styles

---

#### TC-FRONT-003: Navigation Consistency
**Priority:** Medium  
**Objective:** Verify navigation patterns match

**Test Steps:**
1. Compare Admin sidebar and Customer navbar

**Expected Results:**
- Same color scheme in navigation
- Consistent hover states
- Same active state indicators
- Mobile-responsive navigation

---

### 6.2 Responsive Behavior

#### TC-FRONT-004: Mobile View - Customer Dashboard
**Priority:** Critical  
**Objective:** Verify Customer dashboard works on mobile

**Test Steps:**
1. Open Customer dashboard on mobile (375px width)
2. Test navigation, product list, cart, checkout

**Expected Results:**
- All content visible and accessible
- Navigation menu responsive
- Product cards stack vertically
- Buttons minimum 44x44px
- Text readable without zoom
- No horizontal scroll

---

#### TC-FRONT-005: Mobile View - Admin Dashboard
**Priority:** Critical  
**Objective:** Verify Admin dashboard works on mobile

**Test Steps:**
1. Open Admin dashboard on mobile
2. Test sidebar, charts, tables

**Expected Results:**
- Sidebar collapses to drawer
- Charts resize appropriately
- Tables scroll horizontally if needed
- All admin functions accessible
- Touch targets adequate

---

#### TC-FRONT-006: Tablet View
**Priority:** High  
**Objective:** Verify responsive behavior on tablets

**Test Steps:**
1. Test on tablet size (768px)

**Expected Results:**
- Layout adapts to medium screens
- Navigation optimized for tablet
- Content uses available space efficiently

---

#### TC-FRONT-007: Desktop View - Large Screens
**Priority:** Medium  
**Objective:** Verify desktop optimization

**Test Steps:**
1. Test on large desktop (1920px)

**Expected Results:**
- Content doesn't stretch too wide
- Max-width containers used
- Proper spacing maintained

---

### 6.3 Data Rendering from Microservices

#### TC-FRONT-008: Product List Rendering
**Priority:** Critical  
**Objective:** Verify products display correctly from Product Service

**Test Steps:**
1. Navigate to Products page
2. Verify products load and display

**Expected Results:**
- Products fetched from Product Service
- All product fields displayed: name, price, image, stock
- Loading state shown while fetching
- Error handled if service fails

---

#### TC-FRONT-009: Cart Data Rendering
**Priority:** Critical  
**Objective:** Verify cart displays data from Cart Service

**Test Steps:**
1. Add items to cart
2. View cart page

**Expected Results:**
- Cart items displayed correctly
- Quantities accurate
- Totals calculated correctly
- Real-time updates work

---

#### TC-FRONT-010: Order History Rendering
**Priority:** Critical  
**Objective:** Verify orders display from Order Service

**Test Steps:**
1. Navigate to Orders page
2. View order history

**Expected Results:**
- Orders fetched from Order Service
- Order details accurate
- Status displayed correctly
- Items in each order shown

---

#### TC-FRONT-011: Admin Dashboard Stats
**Priority:** High  
**Objective:** Verify admin dashboard aggregates data from multiple services

**Test Steps:**
1. Open Admin Dashboard
2. Check stats cards

**Expected Results:**
- Product count from Product Service
- Order count from Order Service
- User count from Auth Service
- Revenue calculated correctly
- Charts display order data

---

### 6.4 Error Message Display

#### TC-FRONT-012: Backend Error Display - Network Error
**Priority:** Critical  
**Objective:** Verify user-friendly error when backend unavailable

**Test Steps:**
1. Stop backend services
2. Attempt to load products

**Expected Results:**
- User-friendly error message displayed
- No technical details (stack traces, URLs)
- Message: "Unable to connect to the server. Please check your internet connection and try again."
- Toast notification shown
- UI remains functional

---

#### TC-FRONT-013: Backend Error Display - 404 Error
**Priority:** High  
**Objective:** Verify 404 errors handled gracefully

**Test Steps:**
1. Attempt to access non-existent product

**Expected Results:**
- Error message: "The requested resource was not found. It may have been moved or deleted."
- User can navigate back
- No stack trace shown

---

#### TC-FRONT-014: Backend Error Display - 401 Unauthorized
**Priority:** Critical  
**Objective:** Verify unauthorized access handled

**Test Steps:**
1. Use expired token
2. Attempt API call

**Expected Results:**
- User redirected to login
- Message: "You are not authorized to perform this action. Please log in and try again."
- Token cleared from storage

---

#### TC-FRONT-015: Backend Error Display - 500 Server Error
**Priority:** Critical  
**Objective:** Verify server errors don't expose details

**Test Steps:**
1. Trigger server error

**Expected Results:**
- Message: "An internal server error occurred. Please try again later."
- No technical error details
- User can retry action

---

#### TC-FRONT-016: Frontend Error Boundary
**Priority:** High  
**Objective:** Verify React Error Boundary catches errors

**Test Steps:**
1. Trigger JavaScript error in component

**Expected Results:**
- Error Boundary displays fallback UI
- Message: "Something Went Wrong"
- Options to try again or go home
- Error logged (development only)
- Application doesn't crash

---

#### TC-FRONT-017: Form Validation Errors
**Priority:** High  
**Objective:** Verify form validation errors display correctly

**Test Steps:**
1. Submit form with invalid data

**Expected Results:**
- Field-level errors shown
- Error messages user-friendly
- No technical jargon
- Errors clear on correction

---

### 6.5 Role-Based UI Behavior

#### TC-FRONT-018: Customer Access - Customer Routes
**Priority:** Critical  
**Objective:** Verify customers can access customer routes

**Preconditions:**
- User logged in as CUSTOMER

**Test Steps:**
1. Navigate to /products, /cart, /orders, /profile

**Expected Results:**
- All customer routes accessible
- Customer layout displayed
- Navigation shows customer options

---

#### TC-FRONT-019: Customer Access - Admin Routes Blocked
**Priority:** Critical  
**Objective:** Verify customers cannot access admin routes

**Preconditions:**
- User logged in as CUSTOMER

**Test Steps:**
1. Attempt to navigate to /admin/dashboard

**Expected Results:**
- Redirected to unauthorized page OR
- Redirected to login OR
- Error message displayed
- Admin routes not accessible

---

#### TC-FRONT-020: Admin Access - Admin Routes
**Priority:** Critical  
**Objective:** Verify admins can access admin routes

**Preconditions:**
- User logged in as ADMIN

**Test Steps:**
1. Navigate to /admin/dashboard, /admin/products, etc.

**Expected Results:**
- All admin routes accessible
- Admin layout displayed
- Sidebar navigation shown

---

#### TC-FRONT-021: Admin Access - Customer Routes
**Priority:** Medium  
**Objective:** Verify admins can access customer routes (optional)

**Preconditions:**
- User logged in as ADMIN

**Test Steps:**
1. Navigate to /products, /cart

**Expected Results:**
- Access granted (if business rule allows) OR
- Access denied (if business rule restricts)
- Consistent with business requirements

---

#### TC-FRONT-022: Protected Route Component
**Priority:** Critical  
**Objective:** Verify ProtectedRoute component works

**Test Steps:**
1. Test with authenticated admin
2. Test with authenticated customer
3. Test with unauthenticated user

**Expected Results:**
- Admin: Admin routes accessible
- Customer: Admin routes blocked, customer routes accessible
- Unauthenticated: Redirected to login

---

#### TC-FRONT-023: Token-Based Authorization
**Priority:** Critical  
**Objective:** Verify JWT token used for authorization

**Test Steps:**
1. Check network requests
2. Verify Authorization header

**Expected Results:**
- Bearer token included in requests
- Token validated on backend
- Unauthorized requests rejected

---

### 6.6 Mobile-Specific Features

#### TC-FRONT-024: Touch Interactions
**Priority:** High  
**Objective:** Verify touch interactions work on mobile

**Test Steps:**
1. Test button taps, swipes, scrolls

**Expected Results:**
- All buttons respond to touch
- No hover-dependent features
- Swipe gestures work (if implemented)
- Smooth scrolling

---

#### TC-FRONT-025: Mobile Form Inputs
**Priority:** High  
**Objective:** Verify forms work on mobile

**Test Steps:**
1. Test form inputs on mobile

**Expected Results:**
- Inputs don't trigger zoom (16px font size)
- Keyboard types appropriate (email, number, etc.)
- Submit buttons accessible
- Form validation works

---

#### TC-FRONT-026: Mobile Navigation
**Priority:** Critical  
**Objective:** Verify mobile navigation functional

**Test Steps:**
1. Test mobile menu/drawer

**Expected Results:**
- Menu opens/closes smoothly
- All links accessible
- Overlay doesn't block interaction
- Close button works

---

## 7. Cross-Service Integration Test Cases

### 7.1 End-to-End Order Flow

#### TC-INT-001: Complete Order Placement Flow
**Priority:** Critical  
**Objective:** Verify complete order flow across all services

**Preconditions:**
- All services running
- User authenticated
- Product exists with stock
- Address available

**Test Steps:**
1. User adds product to cart (Cart Service)
2. User views cart (Cart Service)
3. User proceeds to checkout (Order Service)
4. User selects payment method (Payment Service)
5. Payment processed (Payment Service)
6. Order created (Order Service)
7. Stock deducted (Product Service)
8. Cart cleared (Cart Service)
9. Order confirmation shown

**Expected Results:**
- All steps succeed
- Data consistent across services
- Order ID tracked through all services
- User receives confirmation
- Stock accurately deducted
- Payment recorded

---

#### TC-INT-002: Order Flow - Service Failure Recovery
**Priority:** Critical  
**Objective:** Verify system handles service failures gracefully

**Test Steps:**
1. Start order placement
2. Stop Product Service mid-flow
3. Verify error handling

**Expected Results:**
- Order not partially created
- User sees friendly error
- Stock not deducted
- Cart remains intact
- User can retry

---

### 7.2 Data Consistency

#### TC-INT-003: Stock Consistency Across Services
**Priority:** Critical  
**Objective:** Verify stock consistent in Product and Cart services

**Test Steps:**
1. Product stock = 10
2. User adds 5 to cart
3. Verify stock in Product Service
4. Verify cart validation

**Expected Results:**
- Product Service shows stock = 10
- Cart validates against real stock
- No stale data
- Real-time validation

---

#### TC-INT-004: Order Total Consistency
**Priority:** Critical  
**Objective:** Verify order totals match across Order and Payment services

**Test Steps:**
1. Create order with total = 500
2. Initiate payment
3. Verify amounts match

**Expected Results:**
- Payment Service validates amount
- Amounts match exactly
- No discrepancy
- Payment rejected if mismatch

---

### 7.3 Service Discovery and Communication

#### TC-INT-005: Service Discovery via Eureka
**Priority:** High  
**Objective:** Verify all services register with Eureka

**Test Steps:**
1. Start all services
2. Check Eureka dashboard

**Expected Results:**
- All 5 services registered
- Health status UP
- Services discoverable by name

---

#### TC-INT-006: Inter-Service Communication
**Priority:** Critical  
**Objective:** Verify services communicate correctly

**Test Steps:**
1. Order Service calls Product Service for stock check
2. Order Service calls Cart Service for items
3. Order Service calls Payment Service for payment

**Expected Results:**
- All inter-service calls succeed
- Proper error handling if service unavailable
- Circuit breaker pattern (if implemented)
- Timeout handling

---

### 7.4 Error Propagation

#### TC-INT-007: Error Propagation - Product Service Error
**Priority:** High  
**Objective:** Verify errors propagate correctly

**Test Steps:**
1. Product Service returns error
2. Verify error reaches frontend

**Expected Results:**
- Error propagated through Order Service (if applicable)
- Frontend receives user-friendly error
- Technical details hidden
- Error logged at each service

---

#### TC-INT-008: Cascading Failure Handling
**Priority:** High  
**Objective:** Verify system handles cascading failures

**Test Steps:**
1. Stop dependent service
2. Trigger operation requiring that service

**Expected Results:**
- Graceful degradation
- User-friendly error message
- Services remain stable
- No cascade to other services

---

## Test Execution Guidelines

### Test Environment Setup
1. All microservices running on designated ports
2. Eureka Server running for service discovery
3. MySQL databases for each service
4. Frontend running on development server
5. Test user accounts created (admin and customer)

### Test Data Requirements
- Sample products with various stock levels
- Test users with different roles
- Test addresses
- Sample orders in various states

### Priority Definitions
- **Critical**: Must pass for system to function (blocking)
- **High**: Important for user experience (should pass)
- **Medium**: Nice to have (acceptable to fail in MVP)
- **Low**: Edge cases (non-blocking)

### Test Execution Order
1. Unit tests for each service
2. Integration tests for service-to-service communication
3. API contract tests
4. End-to-end tests
5. Frontend UI tests
6. Cross-service integration tests

### Success Criteria
- All Critical priority tests pass
- At least 90% of High priority tests pass
- No security vulnerabilities identified
- Error messages user-friendly across all failures
- Mobile responsiveness verified on actual devices
- Performance acceptable under normal load

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Maintained By:** Development Team
