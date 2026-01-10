# Test Implementation Guide

## Overview
This document provides guidance on implementing and running the comprehensive test suites for the Mithran Millets e-commerce platform.

## Test Structure

```
backend/
├── auth-service/src/test/java/.../
│   ├── controller/AuthControllerTest.java
│   ├── service/AuthServiceTest.java
│   └── integration/AuthServiceIntegrationTest.java
├── product-service/src/test/java/.../
│   ├── controller/ProductControllerTest.java
│   └── service/ProductServiceTest.java
├── cart-service/src/test/java/.../
│   ├── controller/CartControllerTest.java
│   └── service/CartServiceTest.java
├── order-service/src/test/java/.../
│   ├── controller/OrderControllerTest.java
│   └── service/OrderServiceTest.java
└── payment-service/src/test/java/.../
    ├── controller/PaymentControllerTest.java
    └── service/PaymentServiceTest.java
```

## Test Execution

### Running Tests

#### Individual Service Tests
```bash
# Auth Service
cd backend/auth-service
mvn test

# Product Service
cd backend/product-service
mvn test

# Cart Service
cd backend/cart-service
mvn test

# Order Service
cd backend/order-service
mvn test

# Payment Service
cd backend/payment-service
mvn test
```

#### All Tests
```bash
# From root directory
cd backend
mvn test
```

### Test Coverage Goals
- Controller Tests: 80%+ coverage
- Service Tests: 90%+ coverage
- Integration Tests: Critical paths only

## Test Categories

### 1. Unit Tests
- Test individual components in isolation
- Use mocks for dependencies
- Fast execution

### 2. Integration Tests
- Test component interactions
- Use in-memory database (H2)
- Test real business flows

### 3. Controller Tests
- Test HTTP endpoints
- Use MockMvc for web layer testing
- Verify request/response handling

## Test Data Management
- Use @BeforeEach for test setup
- Use @AfterEach for cleanup
- Use test fixtures for common data

## Mocking Strategy
- Mock external services (Feign clients)
- Mock repositories for unit tests
- Use real repositories for integration tests with H2

## Notes
- All tests follow naming convention: TC-SERVICE-### from TEST_CASES.md
- Tests are organized by test case priority (Critical, High, Medium)
- Error handling tests verify user-friendly messages
