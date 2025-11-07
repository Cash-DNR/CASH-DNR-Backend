# 📄 Registration & Document Upload Flow Documentation

## Overview

This document describes the complete flow for user registration followed by document upload **without requiring login**. Users register first, receive a JWT token, and then use that token to upload their required documents.

---

## 🔄 Complete User Flow

```
1. User fills registration form
   ↓
2. POST /api/auth/citizen (with password + info)
   ↓
3. ✅ Receives JWT token + user data
   ↓
4. POST /api/upload/registration-documents (with JWT token)
   ↓
5. ✅ Documents uploaded & user verified
   ↓
6. User can now use the app (or login later when token expires)
```

---

## 📋 Step 1: User Registration

### **Endpoint Details**

- **URL**: `/api/auth/citizen`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Authentication**: ❌ Not required

### **Request Body**

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

### **Field Requirements**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `idNumber` | string | ✅ Yes | Exactly 13 digits (SA ID format) |
| `contactInfo.email` | string | ✅ Yes | Valid email format |
| `contactInfo.phone` | string | ✅ Yes | Format: `+27 XX XXX XXXX` |
| `homeAddress.streetAddress` | string | ✅ Yes | Street address |
| `homeAddress.town` | string | ✅ Yes | Town/Suburb name |
| `homeAddress.city` | string | ✅ Yes | City name |
| `homeAddress.province` | string | ✅ Yes | Province name |
| `homeAddress.postalCode` | string | ✅ Yes | Postal code |
| `password` | string | ✅ Yes | Minimum 6 characters |

### **Success Response (201 Created)**

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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpZE51bWJlciI6IjkxMDUyODkwMTIwODgiLCJpYXQiOjE2OTk5MDAwMDAsImV4cCI6MTY5OTk4NjQwMH0.xxxxx",
    "registrationComplete": true,
    "missingInfo": {
      "phoneNumber": false
    }
  }
}
```

### **Error Responses**

#### **Missing Required Fields (400)**
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

#### **User Already Exists (400)**
```json
{
  "success": false,
  "message": "User already registered",
  "details": "Email already in use"
}
```

#### **Home Affairs Verification Failed (400)**
```json
{
  "success": false,
  "message": "ID verification failed",
  "details": "ID verification failed"
}
```

#### **Invalid Content Type (400)**
```json
{
  "success": false,
  "error": "Invalid content type",
  "message": "Request must be application/json"
}
```

#### **Server Error (500)**
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Registration failed due to server error",
  "details": "Error message here (only in development mode)"
}
```

---

## 📤 Step 2: Upload Documents

### **Endpoint Details**

- **URL**: `/api/upload/registration-documents`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Authentication**: ✅ **Required** (JWT token from registration)

### **Headers**

```
Authorization: Bearer <JWT_TOKEN_FROM_REGISTRATION>
Content-Type: multipart/form-data
```

### **Request Body (Form Data)**

| Field Name | Type | Required | Max Count | Description |
|------------|------|----------|-----------|-------------|
| `id_document` | File(s) | ✅ Yes | 5 files | ID document (passport, ID card) |
| `proof_of_residence` | File(s) | ✅ Yes | 5 files | Proof of residence (utility bill, lease) |
| `bank_statement` | File(s) | ✅ Yes | 5 files | Bank statement |
| `other_documents` | File(s) | ❌ No | 20 files | Any other supporting documents |

### **Allowed File Types**

- **PDF**: `.pdf`
- **Images**: `.jpeg`, `.jpg`, `.png`, `.gif`
- **Documents**: `.doc`, `.docx`
- **Spreadsheets**: `.xls`, `.xlsx`

### **File Size Limits**

- **Per file**: 400MB maximum
- **Total files**: Up to 10 files per request (excluding other_documents field which allows up to 20)

### **Success Response (201 Created)**

**All Required Documents Uploaded:**

```json
{
  "success": true,
  "message": "Documents uploaded and registration completed",
  "data": {
    "uploaded": [
      {
        "id": "file-uuid-1",
        "originalName": "id_card.pdf",
        "fileName": "1699900000000-123456789-user-id.pdf",
        "category": "id_documents"
      },
      {
        "id": "file-uuid-2",
        "originalName": "utility_bill.pdf",
        "fileName": "1699900001000-987654321-user-id.pdf",
        "category": "proof_of_address"
      },
      {
        "id": "file-uuid-3",
        "originalName": "bank_statement.pdf",
        "fileName": "1699900002000-456789123-user-id.pdf",
        "category": "bank_statements"
      }
    ],
    "requirements": {
      "id_documents": 1,
      "proof_of_address": 1,
      "bank_statements": 1
    },
    "isVerified": true
  }
}
```

**Partial Upload (Missing Some Required Documents):**

```json
{
  "success": true,
  "message": "Documents uploaded. Awaiting remaining required documents",
  "data": {
    "uploaded": [
      {
        "id": "file-uuid-1",
        "originalName": "id_card.pdf",
        "fileName": "1699900000000-123456789-user-id.pdf",
        "category": "id_documents"
      }
    ],
    "requirements": {
      "id_documents": 1,
      "proof_of_address": 0,
      "bank_statements": 0
    },
    "isVerified": false
  }
}
```

### **Error Responses**

#### **No Token (401)**
```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

#### **Invalid Token (401)**
```json
{
  "success": false,
  "message": "Token is not valid",
  "error": "jwt malformed"
}
```

#### **No Documents Uploaded (400)**
```json
{
  "success": false,
  "message": "No documents uploaded"
}
```

#### **Invalid File Type (400)**
```json
{
  "success": false,
  "message": "File type application/exe not allowed. Allowed types: PDF, JPEG, PNG, GIF, DOC, DOCX, XLS, XLSX"
}
```

#### **File Too Large (413)**
```json
{
  "success": false,
  "message": "File size exceeds limit of 400MB"
}
```

---

## 🔐 Authentication & Security

### **JWT Token Details**

- **Token Type**: Bearer token
- **Expiration**: 24 hours
- **Payload**: Contains `userId` and `idNumber`
- **Secret**: Stored in `JWT_SECRET` environment variable

### **Token Usage**

The JWT token received from registration must be included in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Security Features**

✅ Password hashed with bcrypt (10 salt rounds)  
✅ JWT token signed with secret key  
✅ Token expiration (24 hours)  
✅ File type validation  
✅ File size limits (400MB per file)  
✅ Home Affairs ID verification  
✅ Automatic tax number generation  

---

## 📝 Example Implementation

### **JavaScript/Fetch Example**

```javascript
// Step 1: Register User
async function registerUser() {
  const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      idNumber: '9105289012088',
      contactInfo: {
        email: 'john.doe@example.com',
        phone: '+27 82 123 4567'
      },
      homeAddress: {
        streetAddress: '123 Main Street',
        town: 'Sandton',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2196'
      },
      password: 'SecurePassword123!'
    })
  });

  const data = await response.json();
  
  if (data.success) {
    // Save token for document upload
    const token = data.data.token;
    return token;
  } else {
    throw new Error(data.message);
  }
}

// Step 2: Upload Documents
async function uploadDocuments(token, files) {
  const formData = new FormData();
  
  // Add files to form data
  formData.append('id_document', files.idDocument);
  formData.append('proof_of_residence', files.proofOfResidence);
  formData.append('bank_statement', files.bankStatement);
  
  // Optional: Add other documents
  if (files.otherDocuments) {
    files.otherDocuments.forEach(file => {
      formData.append('other_documents', file);
    });
  }

  const response = await fetch('https://cash-dnr-backend.onrender.com/api/upload/registration-documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('Documents uploaded successfully!');
    console.log('User verified:', data.data.isVerified);
    return data;
  } else {
    throw new Error(data.message);
  }
}

// Complete Flow
async function completeRegistration() {
  try {
    // Step 1: Register
    const token = await registerUser();
    console.log('Registration successful! Token:', token);
    
    // Step 2: Upload documents
    const files = {
      idDocument: document.getElementById('id-file').files[0],
      proofOfResidence: document.getElementById('proof-file').files[0],
      bankStatement: document.getElementById('bank-file').files[0]
    };
    
    const uploadResult = await uploadDocuments(token, files);
    console.log('Upload result:', uploadResult);
    
    if (uploadResult.data.isVerified) {
      console.log('Registration complete! User is verified.');
    } else {
      console.log('Some documents still needed.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### **cURL Examples**

```bash
# Step 1: Register User
curl -X POST https://cash-dnr-backend.onrender.com/api/auth/citizen \
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

# Step 2: Upload Documents (replace <TOKEN> with token from Step 1)
curl -X POST https://cash-dnr-backend.onrender.com/api/upload/registration-documents \
  -H "Authorization: Bearer <TOKEN>" \
  -F "id_document=@/path/to/id_card.pdf" \
  -F "proof_of_residence=@/path/to/utility_bill.pdf" \
  -F "bank_statement=@/path/to/bank_statement.pdf" \
  -F "other_documents=@/path/to/additional_doc.pdf"
```

### **Python Example**

```python
import requests

# Step 1: Register User
def register_user():
    url = "https://cash-dnr-backend.onrender.com/api/auth/citizen"
    payload = {
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
    
    response = requests.post(url, json=payload)
    data = response.json()
    
    if data.get('success'):
        return data['data']['token']
    else:
        raise Exception(data.get('message'))

# Step 2: Upload Documents
def upload_documents(token, file_paths):
    url = "https://cash-dnr-backend.onrender.com/api/upload/registration-documents"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    files = {
        'id_document': open(file_paths['id_document'], 'rb'),
        'proof_of_residence': open(file_paths['proof_of_residence'], 'rb'),
        'bank_statement': open(file_paths['bank_statement'], 'rb')
    }
    
    response = requests.post(url, headers=headers, files=files)
    data = response.json()
    
    # Close file handles
    for file in files.values():
        file.close()
    
    if data.get('success'):
        print(f"Documents uploaded! Verified: {data['data']['isVerified']}")
        return data
    else:
        raise Exception(data.get('message'))

# Complete Flow
if __name__ == "__main__":
    try:
        # Register
        token = register_user()
        print(f"Registration successful! Token: {token[:50]}...")
        
        # Upload documents
        files = {
            'id_document': './documents/id_card.pdf',
            'proof_of_residence': './documents/utility_bill.pdf',
            'bank_statement': './documents/bank_statement.pdf'
        }
        
        result = upload_documents(token, files)
        print("Upload complete:", result)
        
    except Exception as e:
        print(f"Error: {e}")
```

---

## 🎯 Key Points

### **Benefits of This Flow**

✅ **Seamless Onboarding**: Users register and upload documents without interruption  
✅ **No Login Required**: JWT token from registration allows immediate document upload  
✅ **Secure**: Password hashed, JWT token expires in 24 hours  
✅ **Automatic Verification**: User is automatically verified when all documents are uploaded  
✅ **Flexible**: Users can upload documents in multiple requests if needed  
✅ **Progressive**: System tracks which documents are still needed  

### **What Happens After Registration**

1. ✅ User account created with basic information
2. ✅ Password securely hashed using bcrypt
3. ✅ ID verified with Home Affairs
4. ✅ Tax number automatically generated
5. ✅ JWT token provided (valid 24 hours)
6. ✅ User status set to `pending_verification`

### **What Happens After Document Upload**

1. ✅ Documents stored in categorized folders
2. ✅ File metadata saved to database
3. ✅ System checks if all required documents uploaded
4. ✅ If complete: User automatically verified (`isVerified: true`)
5. ✅ User can now access protected features

### **Required Documents for Verification**

To be fully verified, users must upload at least one file from each category:

- ✅ **ID Document** (id_documents)
- ✅ **Proof of Residence** (proof_of_address)
- ✅ **Bank Statement** (bank_statements)

---

## 🔄 User Status Lifecycle

```
1. Registration
   status: "pending_verification"
   isVerified: false
   ↓
2. Upload ID Document
   status: "pending_verification"
   isVerified: false
   ↓
3. Upload Proof of Residence
   status: "pending_verification"
   isVerified: false
   ↓
4. Upload Bank Statement
   status: "pending_verification"
   isVerified: true ✅ (Auto-verified)
   ↓
5. User can now access all features
```

---

## 📞 Support & Additional Information

For more information about:
- **Login Flow**: See `REGISTRATION_LOGIN_API.md`
- **Authentication Routes**: See `AUTH_ROUTES_DOCUMENTATION.md`
- **Phase 1 Features**: See `PHASE_1_FOUNDATIONAL_OPERATIONS.md`

---

## 🚨 Important Notes

### **Token Expiration**

- JWT tokens expire after **24 hours**
- If token expires before document upload, user must:
  1. Login using OTP-based authentication
  2. Use the new token to upload documents

### **Document Categories**

Files are automatically categorized based on the field name:
- `id_document` → Stored in `uploads/id_documents/`
- `proof_of_residence` → Stored in `uploads/proof_of_address/`
- `bank_statement` → Stored in `uploads/bank_statements/`
- `other_documents` → Stored in `uploads/other/`

### **File Naming Convention**

Uploaded files are renamed with the pattern:
```
{timestamp}-{random-number}-{user-id}.{extension}
```

Example: `1699900000000-123456789-user-uuid.pdf`

---

## 📊 Testing Checklist

- [ ] Register user with valid SA ID number
- [ ] Verify JWT token is returned
- [ ] Upload only ID document (should not verify user)
- [ ] Upload proof of residence (should not verify user)
- [ ] Upload bank statement (should verify user)
- [ ] Try uploading without token (should fail)
- [ ] Try uploading with invalid token (should fail)
- [ ] Try uploading invalid file type (should fail)
- [ ] Verify user status changes to verified after all docs uploaded
- [ ] Test with expired token (should fail)

---

**Last Updated**: November 7, 2025  
**API Version**: 1.0  
**Base URL**: `https://cash-dnr-backend.onrender.com`
