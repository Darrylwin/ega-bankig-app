# EGA Banking System - Backend API

RESTful API for banking management system built with Spring Boot and Supabase.

---

## Table of Contents

- [Description](#description)
- [Technologies](#technologies)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security](#security)
- [Testing](#testing)
- [Contributing](#contributing)

---

## Description

EGA Banking System provides a complete backend solution for banking operations including customer management, account handling, and transaction processing. The system automatically generates valid IBAN account numbers and ensures transactional integrity through Spring's transaction management.

---

## Technologies

### Core
- Java 17
- Spring Boot 4.0.1
    - Spring Web (REST API)
    - Spring Data JPA (Persistence)
    - Spring Security (Authentication/Authorization)
    - Spring Validation
- Supabase PostgreSQL (Database)

### Libraries
- JWT (JSON Web Tokens) for authentication
- IBAN4J for IBAN generation
- iText7 for PDF generation
- Lombok for boilerplate reduction
- SpringDoc OpenAPI for documentation
- Maven for dependency management

---

## Features

### Authentication
- User registration and login with JWT
- Role-based access control (ADMIN, USER)
- Password change functionality
- Secure password hashing with BCrypt
- Admin creation (by existing admins or console script)

### Customer Management
- Full CRUD operations
- Data validation (unique email/phone, age verification)
- Pagination and sorting
- Email search

### Account Management
- Create savings and current accounts
- Automatic IBAN generation
- Account status management (ACTIVE, BLOCKED, CLOSED)
- Account listing by customer

### Transaction Processing
- Deposits
- Withdrawals (with balance verification)
- Inter-account transfers
- Transaction history with period filtering
- Atomic operations with automatic rollback

### Reporting
- PDF bank statement generation
- Dashboard statistics (daily, weekly, monthly)
- Transaction summaries

---

## Prerequisites

- Java JDK 17 or higher
- Maven 3.6+
- Supabase account with PostgreSQL database
- Git

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Darrylwin/ega-banking-app
cd ega-banking-app
```

### 2. Configure Supabase database

Create a new project in Supabase and note your connection details.

### 3. Install dependencies

```bash
./mvnw clean install
```

---

## Configuration

### Database Configuration

Create `src/main/resources/application.properties`:

```properties
# ========================================
# CONFIGURATION DU SERVEUR
# ========================================
server.port=8080

# ========================================
# CONFIGURATION BASE DE DONNÉES SUPABASE
# ========================================
# Remplacez spring.datasource.password] par le vrai mot de passe Supabase
spring.datasource.url=jdbc:postgresql://aws-1-eu-north-1.pooler.supabase.com:5432/postgres
spring.datasource.username=postgres.tzubemfqoiphqztmkzbb
spring.datasource.password=[MOT-DE-PASSE-SUPABASE]
spring.datasource.driver-class-name=org.postgresql.Driver

# ========================================
# CONFIGURATION JPA/HIBERNATE POUR POSTGRESQL
# ========================================
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.jdbc.lob.non_contextual_creation=true

# ========================================
# CONFIGURATION JWT
# ========================================
jwt.secret=uneCleSecreteTresLongueEtSecuriseePourLaSignatureDesTokensJWT123456789
jwt.expiration=86400000

# ========================================
# CONFIGURATION CORS
# ========================================
cors.allowed-origins=http://localhost:4200

# ========================================
# CONFIGURATION SWAGGER/OPENAPI
# ========================================
springdoc.api-docs.enabled=true
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.enabled=true
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.swagger-ui.operationsSorter=method
springdoc.swagger-ui.tagsSorter=alpha
springdoc.swagger-ui.tryItOutEnabled=true
springdoc.packages-to-scan=com.ega.banking.controller
springdoc.paths-to-match=/api/**

# ========================================
# CONFIGURATION DES LOGS
# ========================================
logging.level.com.ega.banking=INFO
logging.level.org.springframework.web=INFO
logging.level.org.hibernate.SQL=DEBUG
```

---

## Running the Application

### Development Mode

```bash
./mvnw spring-boot:run
```

### First Run - Admin Creation

On first startup, the application will prompt for admin credentials in the console:

```
Creation du compte administrateur
Email (used for login): admin@ega-bank.com
Username (for display): admin
Password (min 6 characters): ********
```

### Production Mode

```bash
./mvnw clean package
java -jar target/banking-0.0.1-SNAPSHOT.jar
```

The application will be available at `http://localhost:8080`

---

## API Documentation

### Swagger UI

Access interactive API documentation at:
```
http://localhost:8080/swagger-ui/index.html
```

### Main Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (email + password)
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/admin/create` - Create admin (ADMIN only)

#### Customers (`/api/customers`) - ADMIN only
- `POST /api/customers` - Create customer
- `GET /api/customers?page=0&size=10&sort=lastName,asc` - List customers (paginated)
- `GET /api/customers/{id}` - Get customer details
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

#### Accounts (`/api/accounts`)
- `POST /api/accounts` - Create account (ADMIN)
- `GET /api/accounts?page=0&size=10` - List accounts (paginated, ADMIN)
- `GET /api/accounts/{id}` - Get account details
- `GET /api/accounts/customer/{customerId}` - Get customer's accounts
- `GET /api/accounts/{accountId}/statement` - Generate PDF statement

#### Transactions (`/api/transactions`)
- `POST /api/transactions/deposit` - Make deposit
- `POST /api/transactions/withdraw` - Make withdrawal
- `POST /api/transactions/transfer` - Make transfer
- `GET /api/transactions/account/{accountId}` - Transaction history
- `GET /api/transactions/account/{accountId}/period` - Transactions by period

#### Dashboard (`/api/dashboard`) - ADMIN only
- `GET /api/dashboard/stats` - Get dashboard statistics

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

---

## Project Structure

```
src/main/java/com/ega/banking/
├── config/               # Application configuration
│   ├── CorsConfig.java
│   ├── DataInitializer.java
│   ├── OpenApiConfig.java
│   └── SecurityConfig.java
├── controller/           # REST controllers
│   ├── AccountController.java
│   ├── AuthController.java
│   ├── CustomerController.java
│   ├── DashboardController.java
│   └── TransactionController.java
├── dto/                  # Data Transfer Objects
├── entity/              # JPA entities
│   ├── Account.java
│   ├── Customer.java
│   ├── Role.java
│   ├── Transaction.java
│   └── User.java
├── exception/           # Custom exceptions
├── repository/          # JPA repositories
├── security/            # Security configuration
│   ├── AuthEntryPointJwt.java
│   ├── JwtAuthenticationFilter.java
│   ├── JwtUtils.java
│   ├── UserDetailsImpl.java
│   └── UserDetailsServiceImpl.java
├── service/             # Business logic
└── EgaApplication.java  # Main application class
```

---

## Security

### Authentication Flow

1. User logs in with email and password
2. Server validates credentials and generates JWT token (valid 24h)
3. Client stores token in localStorage
4. Client sends token in Authorization header for protected requests
5. Server validates token and authorizes access

### Roles and Permissions

- `ROLE_USER`: Can manage own accounts and transactions
- `ROLE_ADMIN`: Full access to all resources

### Data Validation

- Server-side validation with `@Valid` annotations
- Entity constraints: `@NotBlank`, `@Email`, `@Past`, etc.
- Global exception handling with custom error responses

---

## Testing

### Run Unit Tests

```bash
./mvnw test
```

### Test Collections

API test collection is available in `src/test/resources/api-tests.http`

Use with REST Client extension in VSCode or IntelliJ IDEA HTTP Client.

### Example Requests

#### Login
```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "admin@ega-bank.com",
  "password": "your_password"
}
```

#### Create Customer
```http
POST http://localhost:8080/api/customers
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "lastName": "Dupont",
  "firstName": "Jean",
  "dateOfBirth": "1990-05-15",
  "gender": "MALE",
  "address": "123 Rue de la Paix, Paris",
  "phoneNumber": "+33612345678",
  "email": "jean.dupont@example.com",
  "nationality": "French"
}
```

---

## Contributing

### Team Members
- LOGOSSOU Ekoué Darryl-win
- Academic Year: 2025-2026
- Course: Java EE Programming

### Commit Guidelines

- Use meaningful commit messages
- Create feature branches for development
- Submit pull requests for review
- All team members must have visible commits

---

## Troubleshooting

### Port 8080 already in use

Change the port in `application.properties`:
```properties
server.port=8081
```

### Supabase connection timeout

Verify your Supabase project is active and connection details are correct. Check the connection pooler URL in your Supabase dashboard.

### JWT token invalid

Ensure:
- Token has not expired (24h validity)
- Header format is correct: `Authorization: Bearer <token>`
- JWT secret matches between token generation and validation

---

## License

This project is an academic assignment for Java EE course.

---

## Contact

For questions regarding this project, please open an issue on GitHub.

---

**Academic Project - GLSI 2025-2026*