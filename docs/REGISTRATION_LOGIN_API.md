# 🔐 CASH-DNR Authentication API Documentation

## Overview
The CASH-DNR Authentication API provides secure user registration and login functionality with South African Home Affairs verification, automatic tax number generation, and comprehensive user management.

## Base URLs
- **Production**: `https://cash-dnr-backend.onrender.com/api/auth`
- **Development**: `http://localhost:3000/api/auth`

## 📋 Quick Reference

| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| POST | `/citizen` | **🔒 Registration with password** (Your use case) | No | **Active** |
| POST | `/verify-id` | Verify South African ID number | No | Active |
| POST | `/login` | User login with credentials | No | Active |
| POST | `/login/verify-credentials` | Step 1: Verify credentials & send OTP | No | Active |
| POST | `/login/verify-otp` | Step 2: Verify OTP & complete login | No | Active |
| POST | `/login/resend-otp` | Resend OTP to phone number | No | Active |
| POST | `/register-with-documents` | **📄 Registration + Document Upload** | No | Active |
| PUT | `/complete-profile` | Complete user profile | Yes | Active |

## 🎯 **Endpoint Recommendations**

### **🔒 PASSWORD REQUIRED: Use `/citizen`** 
- **Password in registration** request (your requirement)
- **Complete Phase 1 features** 
- **Home Affairs & SARS integration**
- **Immediate login capability**
- **Full address collection**
- **⚠️ NO document upload** - Basic info only

### **� DOCUMENT UPLOAD: Use `/register-with-documents`**
- **Password + Documents** in one request
- **Required documents**: ID, Proof of residence
- **Optional documents**: Bank statements, other docs
- **Complete registration** with verification
- **Multipart/form-data** format required

**💡 For passwords + documents: Use `/register-with-documents`**  
**💡 For passwords only: Use `/citizen`**

---

## 🚀 Getting Started

### Prerequisites
- Valid South African ID number (13 digits)
- Valid email address
- Phone number in South African format: `+27 XX XXX XXXX`
- **Strong password** (minimum 6 characters)
- Complete home address (required for `/citizen` endpoint)

### Authentication Flow (With Password)
1. **Register** → Provide password + details → Verify ID with Home Affairs → Generate tax number → Create account
2. **Login** → Use email + password → Generate JWT token  
3. **Use APIs** → Include JWT token in Authorization header

### Two-Factor Authentication (2FA) Flow
1. **Step 1**: Call `/login/verify-credentials` with email, ID/business number, and password
2. **Step 2**: System verifies credentials and sends 6-digit OTP to registered phone number
3. **Step 3**: Call `/login/verify-otp` with the received OTP and `otpKey`
4. **Complete**: Receive JWT token for authenticated API access
5. **Optional**: Use `/login/resend-otp` if OTP expires or is not received

### Password Requirements
- **Minimum length**: 6 characters
- **Security**: Password is hashed with bcrypt (10 salt rounds)
- **Usage**: Required for `/citizen` endpoint, optional for `/register`

---

## 📝 API Endpoints

### 1. POST `/citizen` - Registration with Password (Your Use Case)

Complete user registration with password, Home Affairs verification, and Phase 1 features.

**URL**: `/api/auth/citizen`  
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
  "password": "SecurePassword123!"
}
```

#### Field Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `idNumber` | string | Yes | Exactly 13 digits |
| `contactInfo.email` | string | Yes | Valid email format |
| `contactInfo.phone` | string | Yes | Format: `+27 XX XXX XXXX` |
| `homeAddress` | object | Yes | Complete address object required |
| `password` | string | Yes | Minimum 6 characters |

#### Success Response (201)

```json
{
  "success": true,
  "message": "Citizen registered successfully",
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
      "status": "pending_verification",
      "userType": "Individual"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "registrationComplete": true,
    "missingInfo": {
      "phoneNumber": false
    }
  }
}
```

#### Error Responses

**Missing Required Fields (400)**
```json
{
  "success": false,
  "error": "Missing required fields",
  "missingFields": ["password", "homeAddress.streetAddress"],
  "debug": {
    "receivedFields": ["idNumber", "contactInfo"],
    "contentType": "application/json"
  }
}
```

**User Already Exists (400)**
```json
{
  "success": false,
  "message": "User already registered",
  "details": "Email already in use"
}
```

**Home Affairs Verification Failed (400)**
```json
{
  "success": false,
  "message": "ID verification failed",
  "details": "ID verification failed"
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

### 4. POST `/login/verify-credentials` - Two-Factor Authentication Step 1

Verify user credentials (email, ID/business number, password) and send OTP to registered phone number.

**URL**: `/api/auth/login/verify-credentials`  
**Method**: `POST`  
**Auth Required**: No  
**Content-Type**: `application/json`

#### Request Body

```json
{
  "email": "john.doe@example.com",
  "identifier": "9105289012088",
  "password": "userPassword123"
}
```

#### Field Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email format |
| `identifier` | string | Yes | 13-digit ID number OR business registration number |
| `password` | string | Yes | Minimum 6 characters |

#### Success Response (200)

```json
{
  "success": true,
  "message": "Credentials verified. OTP sent to your registered phone number.",
  "data": {
    "otpKey": "550e8400-e29b-41d4-a716-446655440000_1697539200000",
    "phoneNumber": "***4567",
    "expiresIn": 60
  }
}
```

#### Error Responses

**Account Not Found (404)**
```json
{
  "success": false,
  "message": "Account not found",
  "code": "ACCOUNT_NOT_FOUND"
}
```

**Invalid Identifier (401)**
```json
{
  "success": false,
  "message": "Invalid ID number or business registration number",
  "code": "INVALID_IDENTIFIER"
}
```

**Invalid Password (401)**
```json
{
  "success": false,
  "message": "Invalid password",
  "code": "INVALID_PASSWORD"
}
```

**No Phone Number (400)**
```json
{
  "success": false,
  "message": "No phone number associated with this account. Please contact support.",
  "code": "NO_PHONE_NUMBER"
}
```

---

### 5. POST `/login/verify-otp` - Two-Factor Authentication Step 2

Verify the OTP code and complete the login process.

**URL**: `/api/auth/login/verify-otp`  
**Method**: `POST`  
**Auth Required**: No  
**Content-Type**: `application/json`

#### Request Body

```json
{
  "otpKey": "550e8400-e29b-41d4-a716-446655440000_1697539200000",
  "otp": "123456"
}
```

#### Field Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `otpKey` | string | Yes | OTP session key from step 1 |
| `otp` | string | Yes | 6-digit numeric code |

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
      "idNumber": "9105289012088",
      "businessNumber": null,
      "dateOfBirth": "1991-05-28",
      "gender": "Male",
      "phoneNumber": "+27821234567",
      "taxNumber": "9105289012088001",
      "homeAffairsVerified": true,
      "isActive": true,
      "isVerified": false,
      "accountType": "individual",
      "lastLogin": "2025-10-18T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

#### Error Responses

**Invalid OTP Session (400)**
```json
{
  "success": false,
  "message": "Invalid or expired OTP session",
  "code": "INVALID_OTP_SESSION"
}
```

**OTP Expired (400)**
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new one.",
  "code": "OTP_EXPIRED"
}
```

**Invalid OTP (401)**
```json
{
  "success": false,
  "message": "Invalid OTP. 2 attempts remaining.",
  "code": "INVALID_OTP",
  "attemptsRemaining": 2
}
```

**Too Many Attempts (429)**
```json
{
  "success": false,
  "message": "Too many failed attempts. Please start login process again.",
  "code": "TOO_MANY_ATTEMPTS"
}
```

---

### 6. POST `/login/resend-otp` - Resend OTP

Resend OTP to the user's registered phone number if the previous OTP expired or was not received.

**URL**: `/api/auth/login/resend-otp`  
**Method**: `POST`  
**Auth Required**: No  
**Content-Type**: `application/json`

#### Request Body

```json
{
  "otpKey": "550e8400-e29b-41d4-a716-446655440000_1697539200000"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "OTP resent successfully",
  "data": {
    "phoneNumber": "***4567",
    "expiresIn": 60
  }
}
```

#### Error Responses

**Invalid OTP Session (400)**
```json
{
  "success": false,
  "message": "Invalid OTP session. Please start login process again.",
  "code": "INVALID_OTP_SESSION"
}
```

**User Not Found (404)**
```json
{
  "success": false,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

---

### 7. POST `/register-with-documents` - Registration with Document Upload

Complete user registration with password and required documents in a single request.

**URL**: `/api/auth/register-with-documents`  
**Method**: `POST`  
**Auth Required**: No  
**Content-Type**: `multipart/form-data`

#### Request Body (Form Data)

```javascript
// Form fields
email: "john.doe@example.com"
password: "SecurePassword123!"
idNumber: "9105289012088"
phoneNumber: "+27821234567"
homeAddress: JSON.stringify({
  "streetAddress": "123 Main Street",
  "town": "Sandton", 
  "city": "Johannesburg",
  "province": "Gauteng",
  "postalCode": "2196"
})

// Required file uploads
id_document: [File] (up to 5 files)
proof_of_residence: [File] (up to 5 files)

// Optional file uploads  
bank_statement: [File] (up to 5 files)
other_documents: [File] (up to 20 files)
```

#### Field Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Minimum 6 characters |
| `idNumber` | string | Yes | Exactly 13 digits |
| `phoneNumber` | string | Optional | South African format |
| `homeAddress` | JSON string | Optional | Complete address object |
| `id_document` | Files | Yes | Up to 5 files (PDF, JPG, PNG) |
| `proof_of_residence` | Files | Yes | Up to 5 files (PDF, JPG, PNG) |
| `bank_statement` | Files | Optional | Up to 5 files |
| `other_documents` | Files | Optional | Up to 20 files |

#### Success Response (201)

```json
{
  "success": true,
  "message": "User registered successfully with documents uploaded",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john.doe91052",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "idNumber": "9105289012088",
      "phoneNumber": "+27821234567",
      "taxNumber": "9105289012088001",
      "homeAffairsVerified": true,
      "isActive": true,
      "documentsUploaded": true,
      "documentCount": 4
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "uploadedFiles": {
      "id_document": ["id_front_550e8400.jpg", "id_back_550e8400.jpg"],
      "proof_of_residence": ["utility_bill_550e8400.pdf"],
      "bank_statement": ["statement_550e8400.pdf"]
    },
    "homeAffairsVerification": {
      "verified": true,
      "verificationDate": "2025-10-18T12:00:00.000Z"
    }
  }
}
```

#### Error Responses

**Missing Required Documents (400)**
```json
{
  "success": false,
  "message": "id_document and proof_of_residence are required"
}
```

**User Already Exists (400)**
```json
{
  "success": false,
  "message": "This email is already registered"
}
```

**File Upload Error (400)**
```json
{
  "success": false,
  "message": "File upload failed",
  "details": "Unsupported file type. Only PDF, JPG, PNG allowed"
}
```

---

### 8. Document Upload Endpoints (After Registration)

For users who registered without documents and need to upload them later.

#### 8a. POST `/upload/single` - Upload Single Document

**URL**: `http://localhost:3000/api/upload/single`  
**Method**: `POST`  
**Auth Required**: Yes  
**Content-Type**: `multipart/form-data`  
**Headers**: `Authorization: Bearer <jwt-token>`

```javascript
// Form data
file: [File] // Single file upload
category: "id_document" // Optional category
description: "Front side of ID document" // Optional description
```

#### 8b. POST `/upload/multiple` - Upload Multiple Documents

**URL**: `http://localhost:3000/api/upload/multiple`  
**Method**: `POST`  
**Auth Required**: Yes  
**Content-Type**: `multipart/form-data`  
**Headers**: `Authorization: Bearer <jwt-token>`

```javascript
// Form data
files: [File, File, File] // Multiple files (up to 10)
category: "bank_statements" // Optional category
```

#### Document Upload Success Response

```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "uploadedFiles": [
      {
        "id": "file_550e8400",
        "filename": "document_550e8400.pdf",
        "originalName": "my_document.pdf",
        "size": 245760,
        "category": "id_document",
        "uploadedAt": "2025-10-18T12:00:00.000Z"
      }
    ],
    "totalUploaded": 1
  }
}
```

---

### 9. PUT `/complete-profile` - Profile Completion

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
// Registration with Password (Recommended for your use case)
const registerUser = async (userData) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/citizen', {
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

// Registration with Documents Upload
const registerWithDocuments = async (formData) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register-with-documents', {
      method: 'POST',
      body: formData // FormData object with files and fields
      // Note: Don't set Content-Type header, browser will set it automatically for FormData
    });
    
    const result = await response.json();
    
    if (result.success) {
      localStorage.setItem('cashDnrToken', result.data.token);
      console.log(`Uploaded ${result.data.uploadedFiles.length} documents`);
      return result.data.user;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Registration with documents failed:', error);
    throw error;
  }
};

// Upload documents after registration
const uploadDocuments = async (files, category = '') => {
  const token = localStorage.getItem('cashDnrToken');
  const formData = new FormData();
  
  if (Array.isArray(files)) {
    files.forEach(file => formData.append('files', file));
  } else {
    formData.append('file', files);
  }
  
  if (category) formData.append('category', category);
  
  try {
    const endpoint = Array.isArray(files) ? '/multiple' : '/single';
    const response = await fetch(`http://localhost:3000/api/upload${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`Uploaded ${result.data.totalUploaded} files`);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Document upload failed:', error);
    throw error;
  }
};

// Two-Factor Authentication Login Flow
const loginWithTwoFactor = async (email, identifier, password) => {
  try {
    // Step 1: Verify credentials and get OTP
    const credentialsResponse = await fetch('http://localhost:3000/api/auth/login/verify-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, identifier, password })
    });
    
    const credentialsResult = await credentialsResponse.json();
    
    if (!credentialsResult.success) {
      throw new Error(credentialsResult.message);
    }
    
    console.log(`OTP sent to ${credentialsResult.data.phoneNumber}`);
    const otpKey = credentialsResult.data.otpKey;
    
    // Step 2: Get OTP from user input (you'll need to implement this UI)
    const userOtp = prompt('Enter the 6-digit OTP sent to your phone:');
    
    // Step 3: Verify OTP and complete login
    const otpResponse = await fetch('http://localhost:3000/api/auth/login/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otpKey, otp: userOtp })
    });
    
    const otpResult = await otpResponse.json();
    
    if (otpResult.success) {
      // Store token
      localStorage.setItem('cashDnrToken', otpResult.data.token);
      return otpResult.data.user;
    } else {
      throw new Error(otpResult.message);
    }
    
  } catch (error) {
    console.error('Two-factor login failed:', error);
    throw error;
  }
};

// Resend OTP if needed
const resendOTP = async (otpKey) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login/resend-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otpKey })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('OTP resent successfully');
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Failed to resend OTP:', error);
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
# Register User with Password (Basic info only)
curl -X POST http://localhost:3000/api/auth/citizen \
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
    },
    "password": "SecurePassword123!"
  }'

# Register User with Documents (Password + Files)
curl -X POST http://localhost:3000/api/auth/register-with-documents \
  -F "email=john.doe@example.com" \
  -F "password=SecurePassword123!" \
  -F "idNumber=9105289012088" \
  -F "phoneNumber=+27821234567" \
  -F 'homeAddress={"streetAddress":"123 Main Street","town":"Sandton","city":"Johannesburg","province":"Gauteng","postalCode":"2196"}' \
  -F "id_document=@/path/to/id_front.jpg" \
  -F "id_document=@/path/to/id_back.jpg" \
  -F "proof_of_residence=@/path/to/utility_bill.pdf" \
  -F "bank_statement=@/path/to/bank_statement.pdf"

# Upload Documents After Registration (requires auth token)
curl -X POST http://localhost:3000/api/upload/multiple \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "files=@/path/to/document1.pdf" \
  -F "files=@/path/to/document2.jpg" \
  -F "category=additional_documents"



# Two-Factor Authentication Login (2FA)
curl -X POST http://localhost:3000/api/auth/login/verify-credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "identifier": "9105289012088",
    "password": "userPassword123"
  }'

# Verify OTP (use otpKey from previous response)
curl -X POST http://localhost:3000/api/auth/login/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "otpKey": "550e8400-e29b-41d4-a716-446655440000_1697539200000",
    "otp": "123456"
  }'

# Resend OTP if needed
curl -X POST http://localhost:3000/api/auth/login/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "otpKey": "550e8400-e29b-41d4-a716-446655440000_1697539200000"
  }'

# Login User (Basic Authentication)
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
- ✅ **Two-Factor Authentication**: OTP-based 2FA for enhanced security

---

## 🛡️ Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Two-Factor Authentication**: SMS OTP verification for login
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
