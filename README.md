# 🌾 Mithran Millets: E-Commerce Platform

![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Spring%20Boot%20%7C%20MySQL-blue)
![Architecture](https://img.shields.io/badge/Architecture-Microservices-orange)
![Security](https://img.shields.io/badge/Security-JWT%20%26%20Spring%20Security-green)

**Mithran Millets** is a modern, high-performance e-commerce platform dedicated to promoting healthy living through millet products. The system is built using a scalable microservices architecture, ensuring high availability, secure transactions, and a seamless shopping experience.

---

## 🏗️ Architecture & Tech Stack

This project follows a decoupled microservices design to handle specific business domains independently. Communication between services is managed via REST and service discovery.



### **Core Technologies**
* **Frontend:** React.js (Hooks, Axios, Responsive UI)
* **Backend:** Java Spring Boot, Spring Cloud
* **Service Discovery:** Netflix Eureka
* **Communication:** Feign Client (Inter-service calls)
* **Security:** JWT (JSON Web Tokens) & Spring Security
* **Database:** MySQL (Relational data management)

---

## ⚙️ The 5 Core Microservices

1.  **Auth Service:** Manages user registration, login, and JWT token generation/validation.
2.  **Product Service:** Handles the digital catalog, including millet varieties, pricing, and category management.
3.  **Cart Service:** Manages user shopping baskets, persisting items across sessions until checkout.
4.  **Order Service:** Handles the checkout process, order generation, and historical purchase tracking.
5.  **Payment Service:** Secured transaction processing and payment status integration.

---

## ✨ Key Features

* **Secure Authentication:** Role-based access control using JWT to protect user and admin endpoints.
* **Service Discovery:** All services are registered with **Eureka Server** for dynamic routing and load balancing.
* **Dynamic Cart Management:** Real-time updates to shopping sessions via the dedicated Cart Microservice.
* **Responsive Design:** Fully optimized for mobile, tablet, and desktop viewing.
* **Inter-Service Communication:** Efficient data exchange between services using **Feign Client** and **RestTemplate**.

---

## 🚀 Getting Started

### Prerequisites
* Java 17+
* Node.js & npm
* MySQL Server
* Maven

### 🛠️ Installation

1.  **Clone the repo:**
    ```bash
    git clone [https://github.com/muthuram07/MithranMillets.git](https://github.com/muthuram07/MithranMillets.git)
    ```

2.  **Database Setup:**
    The five services connect to the Aiven databases `authdb`, `productdb`,
    `cartdb`, `orderdb`, and `paymentdb`. Configure these environment variables
    before starting the backend:
    ```text
    DB_HOST=mithranmillets-muthuraman31-db0d.e.aivencloud.com
    DB_PORT=24610
    DB_USERNAME=avnadmin
    DB_PASSWORD=your_aiven_password
    ```
    `DB_HOST`, `DB_PORT`, and `DB_USERNAME` have Aiven defaults in the Spring
    configuration. `DB_PASSWORD` is required and must be configured in the
    hosting platform rather than committed to source control.

3.  **Run the Eureka Server:**
    Navigate to the discovery-server directory and run:
    ```bash
    mvn spring-boot:run
    ```

4.  **Start Microservices:**
    Navigate to each service folder (Auth, Product, Cart, Order, Payment) and run:
    ```bash
    mvn spring-boot:run
    ```

5.  **Start the Frontend:**
    ```bash
    cd frontend
    npm install
    npm start
    ```

---

## 📁 Project Structure

```text
MithranMillets/
├── frontend/             # React Application
├── auth-service/         # Security & User Management (JWT)
├── product-service/      # Catalog Management
├── cart-service/         # Shopping Basket Management
├── order-service/        # Order Processing & History
├── payment-service/      # Transaction Handling
└── discovery-server/     # Eureka Service Registry
