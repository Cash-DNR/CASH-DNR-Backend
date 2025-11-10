# Registration API - Request/Response Reference

## Base URL
```
https://cash-dnr-backend.onrender.com
```

## 🎯 **Recommended Registration Flow**

### Step 1: User Registration
**Use `/api/auth/citizen`** - User completes basic registration and gets immediate access with JWT token

### Step 2: Document Upload (Optional)
**Use `/api/upload/registration-documents`** - User can upload documents later using their JWT token

### Why This Flow Works Best:
- ✅ **Immediate Access**: User gets JWT token right after registration
- ✅ **Flexible UX**: User can skip documents and upload later
- ✅ **Progressive Onboarding**: Complete registration then enhance account with documents
- ✅ **Mobile Friendly**: Simple JSON registration first, complex file uploads when convenient

## How Registration Works

### Registration Process:
1. **ID Verification**: South African ID number verified with Home Affairs API
2. **Data Extraction**: Name, gender, date of birth automatically extracted
3. **Account Creation**: User account created with verified personal information
4. **JWT Token**: Immediate authentication token provided
5. **Document Upload**: Optional step that can be done immediately or later

### User Journey Options:

#### Option A: Register → Login Immediately (Skip Documents)
```
1. POST /api/auth/citizen (get JWT token)
2. User starts using the app immediately
3. Documents can be uploaded anytime later
```

#### Option B: Register → Upload Documents → Enhanced Account
```
1. POST /api/auth/citizen (get JWT token)  
2. POST /api/upload/registration-documents (using JWT)
3. Account marked as verified with documents
```

## � **API Usage Scenarios**

### Scenario 1: Quick Registration + Later Document Upload
**Use Case**: User wants immediate access, will upload documents when convenient

**Step 1 - Register:**
```
POST /api/auth/citizen
Content-Type: application/json

{
  "idNumber": "8203141234089",
  "contactInfo": {...},
  "password": "..."
}
```
**Returns**: JWT token for immediate use

**Step 2 - Upload Documents (Later):**
```
POST /api/upload/registration-documents  
Authorization: Bearer [JWT_TOKEN]
Content-Type: multipart/form-data

id_document=[FILE]
proof_of_residence=[FILE]
bank_statement=[FILE] (optional)
```
**Result**: Account becomes verified with documents

### Alternative: Single-Step Registration (Legacy)
**Use Case**: Register and upload documents in one step (no immediate token)

```
POST /api/auth/register-with-documents
Content-Type: multipart/form-data

idNumber=8203141234089
password=...
id_document=[FILE]
proof_of_residence=[FILE]
```
**Result**: Account created with documents, must login separately

## Registration Endpoints

### 1. Basic Registration (Recommended First Step)

**POST** `/api/auth/citizen`

#### Request Format
**Content-Type:** `application/json`

**Required Fields:**
```json
{
  "idNumber": "8203141234089",
  "contactInfo": {
    "email": "user@example.com",
    "phone": "+27 82 555 1234"
  },
  "homeAddress": {
    "streetAddress": "123 Main Street",
    "town": "Sandton", 
    "city": "Johannesburg",
    "province": "Gauteng",
    "postalCode": "2196"
  },
  "password": "YourPassword123!"
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Citizen registered successfully",
  "data": {
    "user": {
      "id": "718d687d-fe92-41be-86cc-415efdd9e4bc",
      "username": "michelle.white",
      "email": "user@example.com",
      "firstName": "Michelle",
      "lastName": "White",
      "fullName": "Michelle White",
      "idNumber": "8203141234089",
      "dateOfBirth": "1982-03-14",
      "gender": "F",
      "phoneNumber": "+27 82 555 1234",
      "taxNumber": "T1412340896",
      "homeAffairsVerified": true,
      "isActive": true,
      "isVerified": false,
      "status": "active",
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

### 2. Document Upload (Optional Second Step)

**POST** `/api/upload/registration-documents`

#### Request Format
**Content-Type:** `multipart/form-data`
**Authorization:** `Bearer [JWT_TOKEN]` *(from Step 1)*

**Required Fields:**
```
id_document: [FILE] (PDF/Image - South African ID)
proof_of_residence: [FILE] (PDF/Image - Utility bill, bank statement, etc.)
```

**Optional Fields:**
```
bank_statement: [FILE] (PDF/Image)
other_documents: [FILES] (Multiple files up to 20)
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Registration documents uploaded successfully",
  "data": {
    "uploadedFiles": [
      {
        "fieldName": "id_document",
        "originalName": "id_copy.pdf",
        "storedName": "1762799863603-id-document.pdf",
        "fileType": "id_document",
        "fileId": "a3708a62-97bb-47ff-a31a-2e13ae3494c2"
      },
      {
        "fieldName": "proof_of_residence", 
        "originalName": "utility_bill.pdf",
        "storedName": "1762799863603-proof-residence.pdf",
        "fileType": "proof_of_address",
        "fileId": "78d723ef-e9ed-4380-87e3-c19fb940e236"
      }
    ],
    "userVerificationStatus": "pending_review",
    "documentsReceived": {
      "id_document": true,
      "proof_of_residence": true,
      "bank_statement": false
    }
  }
}
```

#### Error Response (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

#### Error Response (400)
```json
{
  "success": false,
  "message": "Missing required documents",
  "details": "id_document and proof_of_residence are required"
}
```

### 3. Complete Registration with Documents (Alternative Single-Step)

**POST** `/api/auth/register-with-documents`

### Request Format
**Content-Type:** `multipart/form-data`

**Required Fields:**
```
idNumber: "8203141234089"
email: "user@example.com" 
password: "YourPassword123!"
id_document: [FILE] (PDF/Image)
proof_of_residence: [FILE] (PDF/Image)
```

**Optional Fields:**
```
phoneNumber: "+27 82 555 1234"
bank_statement: [FILE] (PDF/Image)
other_documents: [FILE] (PDF/Image)
```

### Success Response (201)
```json
{
  "success": true,
  "message": "User registered and documents uploaded",
  "data": {
    "user": {
      "id": "718d687d-fe92-41be-86cc-415efdd9e4bc",
      "username": "michelle.white",
      "email": "user@example.com",
      "firstName": "Michelle",
      "lastName": "White",
      "idNumber": "8203141234089",
      "dateOfBirth": "1982-03-14",
      "gender": "F",
      "taxNumber": "T1412340896",
      "homeAffairsVerified": true,
      "isActive": true,
      "isVerified": true
    },
    "uploaded": [
      {
        "id": "a3708a62-97bb-47ff-a31a-2e13ae3494c2",
        "originalName": "id_document.pdf",
        "storedName": "1762799863603-35197684-anonymous.pdf",
        "fileType": "id_document"
      },
      {
        "id": "78d723ef-e9ed-4380-87e3-c19fb940e236",
        "originalName": "proof_of_residence.pdf",
        "storedName": "1762799863603-310093832-anonymous.pdf", 
        "fileType": "proof_of_address"
      }
    ]
  }
}
```

### Error Response (400)
```json
{
  "success": false,
  "message": "This email is already registered"
}
```

```json
{
  "success": false,
  "message": "ID verification failed",
  "details": "Invalid ID number format"
}
```

```json
{
  "success": false,
  "error": "Missing required fields",
  "missing": ["idNumber", "contactInfo.email"]
}
```

## Common Error Responses
```json
{
  "success": false,
  "message": "This email is already registered"
}
```

```json
{
  "success": false,
  "message": "ID verification failed",
  "details": "Invalid ID number format"
}
```

```json
{
  "success": false,
  "message": "id_document and proof_of_residence are required"
}
```

## Test Data
**Valid South African ID Numbers:**
- `8203141234089` (Michelle White, Female, DOB: 1982-03-14)
- `8012094321085` (Christopher White, Male, DOB: 1980-12-09)

## Implementation Strategy

### Recommended User Flow:
```
1. User registers with /api/auth/citizen
   └── Receives JWT token immediately 
   └── Can start using the app right away

2. App prompts for document upload (optional)
   └── User can skip and do it later
   └── Or upload immediately using /api/upload/registration-documents

3. Account verification happens in background
   └── Documents reviewed by admin
   └── User notified of verification status
```

### Frontend Implementation Tips:

#### Option 1: Two-Step Registration (Recommended)
```javascript
// Step 1: Basic registration
const registerResponse = await fetch('/api/auth/citizen', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userData)
});

if (registerResponse.ok) {
  const { token } = await registerResponse.json();
  // User is now logged in and can use the app
  
  // Step 2: Optional document upload
  const uploadResponse = await fetch('/api/upload/registration-documents', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData // multipart with files
  });
}
```

#### Option 2: Skip Documents Flow
```javascript
// Register user 
const response = await fetch('/api/auth/citizen', userData);
const { token } = await response.json();

// Redirect to dashboard immediately
// Show "Upload documents later" prompt in UI
```

## Key Differences Summary

| Feature | Basic Registration | Document Upload | Complete Registration |
|---------|-------------------|------------------|----------------------|
| **Endpoint** | `/api/auth/citizen` | `/api/upload/registration-documents` | `/api/auth/register-with-documents` |
| **Authorization** | None | Bearer Token Required | None |
| **Content-Type** | `application/json` | `multipart/form-data` | `multipart/form-data` |
| **Returns Token** | ✅ Yes | ❌ No | ❌ No |
| **File Uploads** | ❌ No | ✅ Yes | ✅ Yes |
| **Account Status** | `isVerified: false` | Depends on review | `isVerified: true` |
| **Use Case** | Quick access | Progressive onboarding | One-step compliance |

## User Scenarios

### Scenario: "I want immediate access, will upload documents later"
**Solution:** Use 2-step flow
1. `POST /api/auth/citizen` → Get JWT token
2. User starts using app immediately  
3. `POST /api/upload/registration-documents` → Upload when convenient

### Scenario: "I want to complete everything at once"
**Solution:** Use complete registration  
1. `POST /api/auth/register-with-documents` → Register + upload
2. User must login separately after registration

### Scenario: "I want to skip documents entirely" 
**Solution:** Just basic registration
1. `POST /api/auth/citizen` → Get JWT token
2. User can use app indefinitely without uploading documents
3. Optionally prompt for document upload later
4. Account remains unverified until documents uploaded

### After Document Registration:
1. User account created with uploaded documents
2. Account marked as verified 
3. Redirect to login page
4. User completes login flow to access dashboard