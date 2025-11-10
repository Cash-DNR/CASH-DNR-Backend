# CASH DNR Registration Flow Documentation

## Overview

The CASH DNR system provides two primary registration endpoints for user onboarding, both integrated with the Home Affairs API for identity verification. This document details the complete registration flow, authentication process, and technical implementation.

---

## Table of Contents

1. [Registration Options](#registration-options)
2. [Basic Citizen Registration](#basic-citizen-registration)
3. [File Upload Registration](#file-upload-registration)
4. [Login Flow](#login-flow)
5. [Home Affairs Integration](#home-affairs-integration)
6. [Database Schema](#database-schema)
7. [Error Handling](#error-handling)
8. [Testing](#testing)

---

## Registration Options

### Option 1: Basic Citizen Registration
**Endpoint:** `POST /api/auth/citizen`  
**Purpose:** Quick registration without document upload  
**Best For:** Initial user registration, mobile apps, fast onboarding

### Option 2: File Upload Registration
**Endpoint:** `POST /api/auth/register-with-documents`  
**Purpose:** Complete registration with required documents  
**Best For:** Full KYC compliance, verified users from start

---

## Basic Citizen Registration

### Endpoint Details
```
POST https://cash-dnr-backend.onrender.com/api/auth/citizen
Content-Type: application/json
```

### Request Body
```json
{
  "idNumber": "8203141234089",
  "contactInfo": {
    "email": "user@example.com",
    "phone": "+27 82 555 1234"
  },
  "password": "SecurePass123!",
  "homeAddress": {
    "streetAddress": "123 Main Street",
    "town": "Sandton",
    "city": "Johannesburg",
    "province": "Gauteng",
    "postalCode": "2196"
  }
}
```

### Field Requirements

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `idNumber` | String | ✅ Yes | 13-digit South African ID number |
| `contactInfo.email` | String | ✅ Yes | Valid email address |
| `contactInfo.phone` | String | ❌ Optional | Phone number (E.164 format recommended) |
| `password` | String | ✅ Yes | Minimum 6 characters |
| `homeAddress.streetAddress` | String | ✅ Yes | Street address |
| `homeAddress.town` | String | ✅ Yes | Town/Suburb |
| `homeAddress.city` | String | ✅ Yes | City |
| `homeAddress.province` | String | ✅ Yes | South African province |
| `homeAddress.postalCode` | String | ✅ Yes | Postal code |

### Response (201 Created)
```json
{
  "success": true,
  "message": "Citizen registered successfully",
  "data": {
    "user": {
      "id": "cc42fe90-9ee0-469f-8998-a3aaec487a22",
      "username": "michelle.white",
      "email": "michelle.test@example.com",
      "fullName": "Michelle White",
      "firstName": "Michelle",
      "lastName": "White",
      "idNumber": "8203141234089",
      "dateOfBirth": "1982-03-14",
      "gender": "F",
      "taxNumber": "T1412340896",
      "homeAffairsVerified": true,
      "isActive": true,
      "isVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Client sends registration request                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Server validates input fields                            │
│    - Email format                                            │
│    - ID number format (13 digits)                           │
│    - Password requirements                                   │
│    - Required address fields                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Check for duplicate registration                         │
│    - Query database for existing email                      │
│    - Query database for existing ID number                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Verify ID with Home Affairs API                          │
│    GET /home-affairs/citizens/{idNumber}                    │
│    - Validate citizen exists                                │
│    - Extract fullName, gender, dateOfBirth                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Parse citizen data                                        │
│    - Split fullName into firstName/lastName                 │
│    - Convert gender: "Male"/"Female" → "M"/"F"             │
│    - Extract date of birth from ID number                   │
│    - Generate tax number if not provided                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Create user in database                                  │
│    - Hash password (bcrypt, 12 rounds)                      │
│    - Generate unique username                               │
│    - Set homeAffairsVerified = true                         │
│    - Set isVerified = false (no documents yet)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Generate JWT token (24h expiration)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Return user data + token                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## File Upload Registration

### Endpoint Details
```
POST https://cash-dnr-backend.onrender.com/api/auth/register-with-documents
Content-Type: multipart/form-data
```

### Request Form Data

**Text Fields:**
```
idNumber: "8012094321085"
email: "christopher.test@example.com"
password: "SecurePass123!"
phoneNumber: "+27 83 555 5678"
streetAddress: "456 Oak Avenue"
town: "Sandton"
city: "Johannesburg"
province: "Gauteng"
postalCode: "2196"
```

**File Fields:**
```
id_document: [File] (PDF, JPG, PNG - Required)
proof_of_residence: [File] (PDF, JPG, PNG - Required)
bank_statement: [File] (PDF, JPG, PNG - Optional but recommended)
other_documents: [File(s)] (Multiple files allowed - Optional)
```

### File Requirements

| Field | Required | Max Files | Max Size | Accepted Formats |
|-------|----------|-----------|----------|------------------|
| `id_document` | ✅ Yes | 5 | 400MB total | PDF, JPG, PNG |
| `proof_of_residence` | ✅ Yes | 5 | 400MB total | PDF, JPG, PNG |
| `bank_statement` | ❌ Optional | 5 | 400MB total | PDF, JPG, PNG |
| `other_documents` | ❌ Optional | 20 | 400MB total | PDF, JPG, PNG |

### Response (201 Created)
```json
{
  "success": true,
  "message": "User registered and documents uploaded",
  "data": {
    "user": {
      "id": "5b93110d-d36f-4be0-8186-d151c691fa5c",
      "username": "christopher.white",
      "email": "christopher.test@example.com",
      "firstName": "Christopher",
      "lastName": "White",
      "idNumber": "8012094321085",
      "dateOfBirth": "1980-12-09",
      "gender": "M",
      "taxNumber": "T0912094328",
      "homeAffairsVerified": true,
      "isActive": true,
      "isVerified": true
    },
    "uploaded": [
      {
        "id": "35476007-97bc-47c3-b2fc-faa13bd99bc4",
        "originalName": "id_document.pdf",
        "storedName": "1762779738311-438237564-anonymous.pdf",
        "fileType": "id_document"
      },
      {
        "id": "1df647c2-0b9f-496d-9638-874cc5b26aca",
        "originalName": "proof_of_residence.pdf",
        "storedName": "1762779738311-690437790-anonymous.pdf",
        "fileType": "proof_of_address"
      },
      {
        "id": "a531eaec-a19f-4227-935c-53f68bdb2035",
        "originalName": "bank_statement.pdf",
        "storedName": "1762779738311-390978413-anonymous.pdf",
        "fileType": "bank_statement"
      }
    ]
  }
}
```

### Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Client sends multipart form with files + data            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Multer middleware processes files                         │
│    - Validate file types (PDF, JPG, PNG)                    │
│    - Check file sizes (max 400MB total)                     │
│    - Store files in uploads/{category}/ directory           │
│    - Generate unique filenames                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Validate required fields and files                       │
│    - Email, password, idNumber present                      │
│    - id_document file present                               │
│    - proof_of_residence file present                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Check for duplicate registration                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Verify ID with Home Affairs API                          │
│    - Parse fullName → firstName/lastName                    │
│    - Convert gender to M/F                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Create user record                                        │
│    - homeAffairsVerified = true                             │
│    - isVerified = false initially                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Create file records in database                          │
│    - Link files to user_id                                  │
│    - Map field names to file_type enum                      │
│    - Store metadata (upload date, user agent, IP)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Check if all required documents uploaded                 │
│    - id_document present?                                   │
│    - proof_of_address present?                              │
│    - bank_statement present?                                │
│    If YES → Set isVerified = true                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Return user data + file list (NO TOKEN issued)           │
└─────────────────────────────────────────────────────────────┘
```

### Key Differences from Basic Registration

| Feature | Basic Registration | File Upload Registration |
|---------|-------------------|--------------------------|
| **Files Required** | None | id_document + proof_of_residence |
| **Token Issued** | ✅ Yes | ❌ No (must login) |
| **isVerified Status** | Always `false` | `true` if all required docs uploaded |
| **Content-Type** | application/json | multipart/form-data |
| **Use Case** | Quick signup | Complete KYC compliance |

---

## Login Flow

The login process uses a **multi-step authentication** with OTP verification for enhanced security.

### Step 1: Check Email
```
POST /api/auth/login/check-email
Content-Type: application/json

{
  "email": "michelle.test@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email found. Please provide your credentials.",
  "data": {
    "requiresIdentifier": true,
    "accountType": "citizen"
  }
}
```

### Step 2: Verify Credentials
```
POST /api/auth/login/verify-credentials
Content-Type: application/json

{
  "email": "michelle.test@example.com",
  "identifier": "8203141234089",
  "password": "SecurePass123!"
}
```

**Field Notes:**
- `identifier`: Can be 13-digit ID number OR business registration number (YYYY/NNNNNN/NN format)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Credentials verified. OTP sent to your phone.",
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "expiresIn": 300,
    "phoneLastDigits": "1234"
  }
}
```

### Step 3: Verify OTP
```
POST /api/auth/login/verify-otp
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cc42fe90-9ee0-469f-8998-a3aaec487a22",
      "username": "michelle.white",
      "email": "michelle.test@example.com",
      "fullName": "Michelle White",
      "isVerified": true,
      "isActive": true,
      "lastLogin": "2025-11-10T12:34:56.789Z"
    }
  }
}
```

### Login Flow Diagram

```
┌──────────────┐
│ Check Email  │
│ POST /check  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Verify Credentials   │
│ POST /verify-creds   │
│ (email+ID+password)  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Send OTP via SMS     │
│ (in production)      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Verify OTP           │
│ POST /verify-otp     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Issue JWT Token      │
│ Update last_login    │
└──────────────────────┘
```

---

## Home Affairs Integration

### API Endpoint
```
GET https://cash-dnr-api.onrender.com/home-affairs/citizens/{idNumber}
```

### Request Example
```javascript
const response = await fetch(
  'https://cash-dnr-api.onrender.com/home-affairs/citizens/8203141234089',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
);
```

### Response Format
```json
{
  "success": true,
  "citizen": {
    "idNumber": "8203141234089",
    "firstName": "Michelle",
    "lastName": "White",
    "fullName": "Michelle White",
    "dateOfBirth": "1982-03-14",
    "gender": "Female",
    "nationality": "South African",
    "maritalStatus": "Married",
    "spouseIdNumber": "8012094321085",
    "isDeceased": false,
    "address": {
      "street": "198 Church Street",
      "suburb": "Polokwane",
      "city": "Polokwane",
      "province": "Limpopo",
      "postalCode": "0700"
    }
  }
}
```

### Data Transformations

The system transforms Home Affairs data to match the internal database schema:

```javascript
// 1. Parse fullName
const nameParts = citizen.fullName.trim().split(' ');
const firstName = nameParts[0];
const lastName = nameParts.slice(1).join(' ') || 'Unknown';

// 2. Convert gender
const gender = citizen.gender.charAt(0).toUpperCase(); // "Female" → "F"

// 3. Extract date of birth from ID number
// Format: YYMMDDGGGGSAAZ
// Example: 8203141234089
//   82 = Year (1982)
//   03 = Month (March)
//   14 = Day (14th)
function extractDateOfBirth(idNumber) {
  const year = parseInt(idNumber.substring(0, 2));
  const month = idNumber.substring(2, 4);
  const day = idNumber.substring(4, 6);
  const fullYear = year > 30 ? `19${year}` : `20${year}`;
  return `${fullYear}-${month}-${day}`;
}

// 4. Generate tax number if not provided
function generateTaxNumber(idNumber) {
  const day = idNumber.substring(4, 6);
  const month = idNumber.substring(2, 4);
  const sequence = idNumber.substring(6, 10);
  return `T${day}${month}${sequence}${idNumber.charAt(12)}`;
}
```

### Error Handling

| Error | Status | Response |
|-------|--------|----------|
| ID not found | 400 | `{ success: false, error: "Citizen not found" }` |
| Invalid ID format | 400 | `{ success: false, error: "ID number must be exactly 13 digits" }` |
| API timeout | 400 | `{ success: false, error: "Home Affairs API request timed out" }` |
| Service unavailable | 400 | `{ success: false, error: "Home Affairs verification service is currently unavailable" }` |

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  id_number VARCHAR(13) UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  gender CHAR(1) CHECK (gender IN ('M', 'F')),
  tax_number VARCHAR(50),
  phone_number VARCHAR(20),
  home_address JSONB,
  home_affairs_verified BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Files Table
```sql
CREATE TYPE file_type_enum AS ENUM (
  'id_document',
  'proof_of_address',
  'bank_statement',
  'tax_document',
  'business_document',
  'other'
);

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(1024) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_type file_type_enum NOT NULL DEFAULT 'other',
  description TEXT,
  is_verified BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Important Field Notes

**Gender Field:**
- Database type: `CHAR(1)`
- Valid values: `'M'` or `'F'`
- Home Affairs returns: `"Male"` or `"Female"`
- Conversion required during registration

**Home Address:**
- Stored as JSONB in database
- Structure:
  ```json
  {
    "streetAddress": "123 Main Street",
    "town": "Sandton",
    "city": "Johannesburg",
    "province": "Gauteng",
    "postalCode": "2196"
  }
  ```

**File Type Enum:**
- Must use singular forms: `id_document`, `bank_statement`, `tax_document`
- NOT plural: ~~`id_documents`~~, ~~`bank_statements`~~

---

## Error Handling

### Common Registration Errors

#### 1. Duplicate Registration
```json
{
  "success": false,
  "message": "This email is already registered"
}
```

#### 2. Invalid ID Number
```json
{
  "success": false,
  "message": "ID verification failed",
  "details": "Citizen not found"
}
```

#### 3. Missing Required Fields
```json
{
  "success": false,
  "error": "Missing required fields",
  "missingFields": [
    "homeAddress.streetAddress",
    "homeAddress.town"
  ]
}
```

#### 4. Missing Required Files
```json
{
  "success": false,
  "message": "id_document and proof_of_residence are required"
}
```

#### 5. File Upload Error
```json
{
  "success": false,
  "error": "Upload interrupted",
  "message": "File upload was interrupted or incomplete"
}
```

### HTTP Status Codes

| Status | Meaning | When Used |
|--------|---------|-----------|
| 200 | OK | Successful login step |
| 201 | Created | Successful registration |
| 400 | Bad Request | Validation errors, missing fields, duplicate email/ID |
| 404 | Not Found | Email not found during login |
| 500 | Internal Server Error | Database errors, unexpected failures |

---

## Testing

### Test Users (from Home Affairs API)

| ID Number | Name | Gender | DOB | Marital Status |
|-----------|------|--------|-----|----------------|
| 8203141234089 | Michelle White | Female | 1982-03-14 | Married |
| 8012094321085 | Christopher White | Male | 1980-12-09 | Married |

### Running Tests

```bash
# Comprehensive test suite
node full-registration-test.js

# Individual endpoint tests
node test-file-upload-complete.js
node test-production-register.js

# Database cleanup
node delete-production-users.js
```

### Test Coverage

The `full-registration-test.js` script covers:

1. ✅ Basic citizen registration
2. ✅ File upload registration with 3 documents
3. ✅ Duplicate ID/email prevention
4. ✅ Invalid ID number rejection
5. ✅ Multi-step login process
6. ✅ Database verification (users + files)

**Expected Result:** 100% success rate (6/6 tests passing)

---

## Security Considerations

### Password Security
- Hashed using bcrypt with 12 salt rounds
- Minimum 6 characters required (consider increasing to 8+)
- Never stored in plain text
- Never returned in API responses

### JWT Tokens
- Expiration: 24 hours
- Issued on registration (basic) or successful login
- Contains: user ID, email, username
- Stored in HTTP-only cookies recommended

### File Upload Security
- File type validation (PDF, JPG, PNG only)
- File size limits (400MB total per request)
- Unique filename generation to prevent overwrites
- Files stored outside public web root
- Virus scanning recommended for production

### Home Affairs Verification
- All registrations must pass Home Affairs verification
- No fallback/demo data in production
- 30-second timeout on API calls
- Failed verification blocks registration

---

## Production Deployment

### Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/database

# JWT
JWT_SECRET=your-secret-key-here

# Home Affairs API
HOME_AFFAIRS_API_URL=https://cash-dnr-api.onrender.com

# Server
NODE_ENV=production
PORT=3000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=419430400  # 400MB in bytes
```

### Deployment Checklist

- [ ] Database migrations run
- [ ] Environment variables configured
- [ ] Upload directories created with proper permissions
- [ ] JWT secret set (strong random value)
- [ ] Home Affairs API accessible
- [ ] SSL/TLS certificate installed
- [ ] CORS configured for frontend domains
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error monitoring setup (Sentry, etc.)
- [ ] Backup strategy in place

---

## API Summary

### Registration Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/citizen` | POST | Public | Basic registration |
| `/api/auth/register-with-documents` | POST | Public | File upload registration |

### Login Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/login/check-email` | POST | Public | Step 1: Verify email exists |
| `/api/auth/login/verify-credentials` | POST | Public | Step 2: Verify ID + password |
| `/api/auth/login/verify-otp` | POST | Public | Step 3: Verify OTP code |
| `/api/auth/login/resend-otp` | POST | Public | Resend OTP if expired |

---

## Support & Troubleshooting

### Common Issues

**Issue:** "ID verification failed"  
**Solution:** Verify the ID number is valid in Home Affairs API. Test with known valid IDs: 8203141234089, 8012094321085

**Issue:** "Upload interrupted"  
**Solution:** Check that body parser middleware is not consuming multipart form data. Ensure multer is configured correctly.

**Issue:** "Invalid enum value for file_type"  
**Solution:** Use singular form: `id_document` not `id_documents`, `bank_statement` not `bank_statements`

**Issue:** "Column 'gender' invalid"  
**Solution:** Ensure gender is converted to 'M' or 'F' (single character), not "Male"/"Female"

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-10 | Initial documentation - All endpoints operational |

---

## Contact

For technical issues or questions:
- GitHub: https://github.com/Cash-DNR/CASH-DNR-Backend
- Production URL: https://cash-dnr-backend.onrender.com

---

**Document Status:** ✅ Complete and Tested  
**Last Updated:** November 10, 2025  
**System Status:** 🟢 Fully Operational (100% test success rate)
