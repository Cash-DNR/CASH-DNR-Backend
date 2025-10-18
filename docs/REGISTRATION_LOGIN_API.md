# 🔐 CASH-DNR Authentication API Documentation

## Overview
The CASH-DNR Authentication API provides secure user registration and login functionality with South African Home Affairs verification, automatic tax number generation, and comprehensive user management.

## Base URLs
- **Production**: `https://cash-dnr-backend.onrender.com/api/auth`
- **Development**: `http://localhost:3000/api/auth`

## 📋 Quick Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Main user registration with Home Affairs verification | No |
| POST | `/verify-id` | Verify South African ID number | No |
| POST | `/login` | User login with credentials | No |
| POST | `/citizen` | Legacy registration endpoint | No |
| PUT | `/complete-profile` | Complete user profile | Yes |

---

## 🚀 Getting Started

### Prerequisites
- Valid South African ID number (13 digits)
- Valid email address
- Phone number in South African format: `+27 XX XXX XXXX`
- Strong password (minimum 6 characters)

### Authentication Flow
1. **Register** → Verify ID with Home Affairs → Generate tax number → Create account
2. **Login** → Validate credentials → Generate JWT token
3. **Use APIs** → Include JWT token in Authorization header

---

## 📝 API Endpoints

### 1. POST `/register` - User Registration

Complete user registration with Home Affairs verification and automatic tax number generation.

**URL**: `/api/auth/register`  
**Method**: `POST`  
**Auth Required**: No  
**Content-Type**: `application/json`

#### Request Body

```json
{
  "idNumber": "9105289012088",
  "contactInfo": {
    "email": "john.doe@example.com",
    "phone": "+27 82 123 4567"
  },
  "homeAddress": {
    "streetAddress": "123 Main Street",
    "town": "Sandton",
    "city": "Johannesburg", 
    "province": "Gauteng",
    "postalCode": "2196"
  },
  "phoneNumber": "+27821234567"
}
```

#### Field Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `idNumber` | string | Yes | Exactly 13 digits |
| `contactInfo.email` | string | Yes | Valid email format |
| `contactInfo.phone` | string | Yes | Format: `+27 XX XXX XXXX` |
| `homeAddress` | object | Optional | Complete address object |
| `phoneNumber` | string | Optional | 10-20 characters |

#### Success Response (201)

```json
{
  "success": true,
  "message": "User registered successfully with Home Affairs and SARS verification",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john.doe91052",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "idNumber": "9105289012088",
      "dateOfBirth": "1991-05-28",
      "gender": "Male",
      "phoneNumber": "+27821234567",
      "taxNumber": "9105289012088001",
      "homeAffairsVerified": true,
      "isActive": true,
      "isVerified": false,
      "registrationPhase": "phase_1_complete",
      "cashNotesEnabled": true,
      "digitalWalletEnabled": true,
      "cashHoldingLimit": "25000.00",
      "createdAt": "2025-10-17T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenExpiresIn": "24h",
    "registrationComplete": true,
    "homeAffairsVerification": {
      "verified": true,
      "source": "home_affairs_api",
      "verificationDate": "2025-10-17T12:00:00.000Z"
    },
    "taxGeneration": {
      "taxNumber": "9105289012088001",
      "source": "sars_api",
      "generatedAt": "2025-10-17T12:00:00.000Z"
    }
  }
}
```

#### Error Responses

**Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "msg": "South African ID number must be exactly 13 digits",
      "path": "idNumber",
      "location": "body"
    }
  ]
}
```

**ID Already Registered (400)**
```json
{
  "success": false,
  "message": "This ID number is already registered"
}
```

**Home Affairs Verification Failed (400)**
```json
{
  "success": false,
  "message": "ID number not found in Home Affairs database",
  "details": "Unable to verify identity with Home Affairs"
}
```

---

### 2. POST `/verify-id` - ID Verification

Verify a South African ID number with Home Affairs database before registration.

**URL**: `/api/auth/verify-id`  
**Method**: `POST`  
**Auth Required**: No  
**Content-Type**: `application/json`

#### Request Body

```json
{
  "idNumber": "9105289012088"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "ID verification successful",
  "data": {
    "idNumber": "9105289012088",
    "isValid": true,
    "isRegistered": false,
    "homeAffairsData": {
      "firstName": "John",
      "lastName": "Doe", 
      "dateOfBirth": "1991-05-28",
      "gender": "Male",
      "citizenship": "South African",
      "idStatus": "Valid"
    },
    "extractedInfo": {
      "dateOfBirth": "1991-05-28",
      "gender": "Male",
      "citizenship": "ZA",
      "age": 34
    },
    "validationDetails": {
      "checksumValid": true,
      "dateValid": true,
      "formatValid": true
    },
    "fallbackUsed": false
  }
}
```

#### Error Response (400)

```json
{
  "success": false,
  "message": "ID number not found in Home Affairs database",
  "data": {
    "idNumber": "9105289012088",
    "isValid": false,
    "validationDetails": {
      "checksumValid": false,
      "error": "Invalid ID number checksum"
    }
  }
}
```

---

### 3. POST `/login` - User Login

Authenticate user with email and password.

**URL**: `/api/auth/login`  
**Method**: `POST`  
**Auth Required**: No  
**Content-Type**: `application/json`

#### Request Body

```json
{
  "email": "john.doe@example.com",
  "password": "userPassword123"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john.doe91052",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "role": "user",
      "isActive": true,
      "isVerified": false,
      "homeAffairsVerified": true,
      "registrationPhase": "phase_1_complete",
      "cashNotesEnabled": true,
      "digitalWalletEnabled": true,
      "lastLogin": "2025-10-17T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenExpiresIn": "24h",
    "loginTime": "2025-10-17T12:00:00.000Z"
  }
}
```

#### Error Responses

**Invalid Credentials (401)**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Account Inactive (403)**
```json
{
  "success": false,
  "message": "Account is deactivated. Please contact support."
}
```

---

### 4. PUT `/complete-profile` - Profile Completion

Complete user profile with additional information.

**URL**: `/api/auth/complete-profile`  
**Method**: `PUT`  
**Auth Required**: Yes  
**Headers**: `Authorization: Bearer <jwt-token>`

#### Request Body

```json
{
  "phoneNumber": "+27821234567",
  "homeAddress": {
    "streetAddress": "456 Oak Avenue",
    "town": "Cape Town",
    "city": "Cape Town",
    "province": "Western Cape",
    "postalCode": "8001"
  },
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phoneNumber": "+27823456789"
  }
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Profile completed successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "profileComplete": true,
      "completedAt": "2025-10-17T12:00:00.000Z"
    }
  }
}
```

---

## 🔒 Authentication & Authorization

### JWT Token Usage

Include the JWT token in the Authorization header for protected routes:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Payload

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "role": "user",
  "iat": 1697539200,
  "exp": 1697625600
}
```

---

## 🏗️ Integration Examples

### JavaScript/Frontend

```javascript
// Registration
const registerUser = async (userData) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Store token
      localStorage.setItem('cashDnrToken', result.data.token);
      return result.data.user;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

// Login
const loginUser = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      localStorage.setItem('cashDnrToken', result.data.token);
      return result.data.user;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Making authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('cashDnrToken');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

### cURL Examples

```bash
# Register User
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "9105289012088",
    "contactInfo": {
      "email": "john.doe@example.com",
      "phone": "+27 82 123 4567"
    },
    "homeAddress": {
      "streetAddress": "123 Main Street",
      "town": "Sandton",
      "city": "Johannesburg",
      "province": "Gauteng",
      "postalCode": "2196"
    }
  }'

# Login User
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "userPassword123"
  }'

# Access Protected Route
curl -X GET http://localhost:3000/api/cash-notes/my-notes \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔧 Environment Configuration

Required environment variables:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Database Configuration
PROD_DB_HOST=your-db-host
PROD_DB_PORT=5432
PROD_DB_NAME=cash_dnr
PROD_DB_USER=your-db-user
PROD_DB_PASSWORD=your-db-password

# Home Affairs API
HOME_AFFAIRS_API_URL=https://api.homeaffairs.gov.za
HOME_AFFAIRS_API_KEY=your-api-key

# SARS API
SARS_API_URL=https://api.sars.gov.za
SARS_API_KEY=your-sars-api-key
```

---

## 📊 Phase 1 Features

The authentication system includes Phase 1 foundational features:

- ✅ **Home Affairs Verification**: Real-time ID verification
- ✅ **Automatic Tax Number Generation**: SARS integration
- ✅ **Digital Wallet Setup**: R25,000 cash holding limit
- ✅ **Cash Notes Enabled**: Ready for digital cash management
- ✅ **Audit Logging**: Complete authentication audit trail
- ✅ **Secure Password Hashing**: bcrypt with salt rounds
- ✅ **JWT Token Management**: 24-hour expiration with refresh capability

---

## 🛡️ Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Cross-origin request security
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization

---

## 🚨 Error Codes Reference

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad request / Validation error |
| 401 | Unauthorized / Invalid credentials |
| 403 | Forbidden / Account inactive |
| 404 | Not found |
| 409 | Conflict / Already exists |
| 500 | Internal server error |

---

## 📞 Support

For API support or questions:
- **Email**: support@cash-dnr.com
- **Documentation**: `/docs`
- **Status**: Check server health at `/health`

---

**Last Updated**: October 17, 2025  
**API Version**: Phase 1 - Foundational Operations  
**Environment**: Production Ready
