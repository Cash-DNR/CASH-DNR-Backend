# Registration API - One Flexible Endpoint

## Base URL
```
https://cash-dnr-backend.onrender.com
```

## 🎯 **Single Endpoint Registration**

### `/api/auth/citizen` - Handles All Registration Scenarios

This endpoint intelligently handles both registration modes:
- **JSON Mode**: Basic registration with immediate JWT token
- **Multipart Mode**: Registration with documents and immediate JWT token

### Key Benefits:
- ✅ **Always Returns JWT Token** - Immediate access in both modes
- ✅ **One Endpoint** - Simplifies frontend integration
- ✅ **Flexible Content-Type** - Supports JSON OR multipart
- ✅ **Progressive Enhancement** - Basic registration + optional documents

## Registration Endpoint

### **POST** `/api/auth/citizen`

#### Mode 1: Basic Registration (JSON)

**Content-Type:** `application/json`

**Request:**
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

**Response:**
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

#### Mode 2: Registration with Documents (Multipart)

**Content-Type:** `multipart/form-data`

**Required Form Fields:**
```
idNumber: "8203141234089"
email: "user@example.com" 
phone: "+27 82 555 1234"
streetAddress: "123 Main Street"
town: "Sandton"
city: "Johannesburg"
province: "Gauteng"
postalCode: "2196"
password: "YourPassword123!"
```

**Required Files:**
```
id_document: [PDF/Image file]
proof_of_residence: [PDF/Image file]
```

**Optional Files:**
```
bank_statement: [PDF/Image file]
```

**Response:**
```json
{
  "success": true,
  "message": "Citizen registered successfully with documents",
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
      "isVerified": true,
      "status": "active",
      "userType": "Individual"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "registrationComplete": true,
    "missingInfo": {
      "phoneNumber": false
    },
    "documents": {
      "uploaded": [
        {
          "id": "a3708a62-97bb-47ff-a31a-2e13ae3494c2",
          "originalName": "id_document.pdf",
          "storedName": "1762799863603-35197684.pdf",
          "fileType": "id_document",
          "fieldName": "id_document"
        },
        {
          "id": "78d723ef-e9ed-4380-87e3-c19fb940e236",
          "originalName": "proof_of_residence.pdf",
          "storedName": "1762799863603-310093832.pdf", 
          "fileType": "proof_of_address",
          "fieldName": "proof_of_residence"
        }
      ],
      "count": 2,
      "verificationStatus": "pending_review"
    }
  }
}
```

## Frontend Implementation

### JavaScript Example:

#### Basic Registration:
```javascript
// Mode 1: JSON Registration
const registerBasic = async (userData) => {
  const response = await fetch('/api/auth/citizen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  const result = await response.json();
  if (result.success) {
    // User gets immediate access with JWT token
    localStorage.setItem('authToken', result.data.token);
    localStorage.setItem('userId', result.data.user.id);
    return result;
  }
  throw new Error(result.message);
};
```

#### Registration with Documents:
```javascript
// Mode 2: Multipart Registration with Files
const registerWithDocs = async (userData, files) => {
  const formData = new FormData();
  
  // Add user data
  formData.append('idNumber', userData.idNumber);
  formData.append('email', userData.email);
  formData.append('phone', userData.phone);
  formData.append('streetAddress', userData.address.streetAddress);
  formData.append('town', userData.address.town);
  formData.append('city', userData.address.city);
  formData.append('province', userData.address.province);
  formData.append('postalCode', userData.address.postalCode);
  formData.append('password', userData.password);
  
  // Add files
  formData.append('id_document', files.idDocument);
  formData.append('proof_of_residence', files.proofOfResidence);
  if (files.bankStatement) {
    formData.append('bank_statement', files.bankStatement);
  }
  
  const response = await fetch('/api/auth/citizen', {
    method: 'POST',
    body: formData // No Content-Type header - browser sets it automatically
  });
  
  const result = await response.json();
  if (result.success) {
    // User gets immediate access with JWT token + documents processed
    localStorage.setItem('authToken', result.data.token);
    localStorage.setItem('userId', result.data.user.id);
    return result;
  }
  throw new Error(result.message);
};
```

#### Dynamic Usage:
```javascript
// Let user choose their registration flow
const register = async (userData, files = null) => {
  if (files && (files.idDocument && files.proofOfResidence)) {
    // User has documents - use multipart mode
    return await registerWithDocs(userData, files);
  } else {
    // Basic registration - user can upload documents later
    return await registerBasic(userData);
  }
};
```

## Error Responses

### Common Errors:
```json
{
  "success": false,
  "message": "User already registered",
  "details": "Email already in use"
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
  "missing": ["idNumber", "email"]
}
```

## Key Features

### Automatic Processing:
- **ID Verification**: Home Affairs API validation
- **Data Extraction**: Name, gender, DOB from ID number
- **Username Generation**: Automatic unique usernames
- **Tax Number**: Auto-generated South African tax numbers
- **File Processing**: Documents stored and linked to user account

### User Experience:
- **Immediate Access**: JWT token provided in all cases
- **Flexible Upload**: Documents optional during registration
- **Progressive Enhancement**: Basic account → Enhanced with documents
- **Single Integration**: One endpoint handles all scenarios

### Security:
- **JWT Tokens**: 24-hour expiration
- **Password Hashing**: bcrypt with salt rounds
- **File Validation**: Type and size restrictions
- **Rate Limiting**: Built-in request throttling

## Test Data
**Valid South African ID Numbers:**
- `8203141234089` (Michelle White, Female, DOB: 1982-03-14)
- `8012094321085` (Christopher White, Male, DOB: 1980-12-09)