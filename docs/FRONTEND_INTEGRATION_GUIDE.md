# Frontend Integration Guide

> 📚 **For API overview and quick start, see [README.md](../README.md)**
> 
> Complete guide for integrating with the CASH-DNR Backend API

## Base URLs

- **Production**: `https://cash-dnr-backend.onrender.com`
- **Development**: `http://localhost:3000`

---

## 🎯 Recommended Integration Pattern

### Two-Step Registration Flow
1. **Basic Registration** (`/api/auth/citizen`) - Get JWT token immediately
2. **Document Upload** (Optional) - Upload documents using JWT token

This pattern provides the best user experience:
- ✅ Immediate app access after registration
- ✅ Progressive document collection
- ✅ Better mobile experience
- ✅ Flexible user journey

---

## 🔐 Authentication Integration

### 1. Registration (JSON Mode)
**Best for**: Quick onboarding, mobile apps

```javascript
const registerUser = async (userData) => {
  const response = await fetch('/api/auth/citizen', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idNumber: userData.idNumber,
      contactInfo: {
        email: userData.email,
        phone: userData.phone
      },
      password: userData.password,
      businessType: userData.businessType,
      homeAddress: {
        streetAddress: userData.streetAddress,
        town: userData.town,
        city: userData.city,
        province: userData.province,
        postalCode: userData.postalCode
      }
    })
  });

  if (response.ok) {
    const result = await response.json();
    // Store JWT token for immediate use
    localStorage.setItem('authToken', result.data.token);
    return result.data;
  }
  
  throw new Error('Registration failed');
};
```

### 2. Registration with Documents (Multipart Mode)
**Best for**: Complete onboarding with documents

```javascript
const registerWithDocuments = async (userData, files) => {
  const formData = new FormData();
  
  // Add user data
  formData.append('idNumber', userData.idNumber);
  formData.append('contactInfo[email]', userData.email);
  formData.append('contactInfo[phone]', userData.phone);
  formData.append('password', userData.password);
  formData.append('businessType', userData.businessType);
  
  // Add address fields
  formData.append('homeAddress[streetAddress]', userData.streetAddress);
  formData.append('homeAddress[town]', userData.town);
  formData.append('homeAddress[city]', userData.city);
  formData.append('homeAddress[province]', userData.province);
  formData.append('homeAddress[postalCode]', userData.postalCode);
  
  // Add files
  if (files.idDocument) formData.append('idDocument', files.idDocument);
  if (files.proofOfAddress) formData.append('proofOfAddress', files.proofOfAddress);
  if (files.bankStatement) formData.append('bankStatement', files.bankStatement);
  
  const response = await fetch('/api/auth/citizen', {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    const result = await response.json();
    localStorage.setItem('authToken', result.data.token);
    return result.data;
  }
  
  throw new Error('Registration with documents failed');
};
```

### 3. Three-Step Login Flow
**Complete login implementation**

```javascript
const loginFlow = {
  // Step 1: Check email exists
  checkEmail: async (email) => {
    const response = await fetch('/api/auth/login/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const result = await response.json();
    return result.exists;
  },

  // Step 2: Verify credentials and send OTP
  verifyCredentials: async (email, password) => {
    const response = await fetch('/api/auth/login/verify-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.otpSent;
    }
    
    throw new Error('Invalid credentials');
  },

  // Step 3: Verify OTP and complete login
  verifyOTP: async (email, otp) => {
    const response = await fetch('/api/auth/login/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    
    if (response.ok) {
      const result = await response.json();
      localStorage.setItem('authToken', result.data.token);
      return result.data;
    }
    
    throw new Error('Invalid OTP');
  },

  // Resend OTP if needed
  resendOTP: async (email) => {
    const response = await fetch('/api/auth/login/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    return response.ok;
  }
};
```

---

## 🔄 API Request Helper

### Create a reusable API client

```javascript
class CashDNRAPI {
  constructor(baseURL = 'https://cash-dnr-backend.onrender.com') {
    this.baseURL = baseURL;
  }

  // Get auth token from storage
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Create authenticated request headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (includeAuth && this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }
    
    return headers;
  }

  // Make authenticated API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Token expired - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      return;
    }

    return response;
  }

  // Convenience methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Usage
const api = new CashDNRAPI();
```

---

## 📱 React Integration Examples

### Registration Component

```jsx
import React, { useState } from 'react';

const RegistrationForm = () => {
  const [step, setStep] = useState(1); // 1: Basic, 2: Documents
  const [userData, setUserData] = useState({});
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);

  const handleBasicRegistration = async (formData) => {
    setLoading(true);
    try {
      await registerUser(formData);
      setUserData(formData);
      setStep(2); // Move to document upload
    } catch (error) {
      alert('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!files.idDocument || !files.proofOfAddress) {
      alert('ID Document and Proof of Address are required');
      return;
    }

    setLoading(true);
    try {
      await registerWithDocuments(userData, files);
      window.location.href = '/dashboard';
    } catch (error) {
      alert('Document upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-form">
      {step === 1 ? (
        <BasicInfoForm onSubmit={handleBasicRegistration} loading={loading} />
      ) : (
        <DocumentUpload 
          onFileChange={setFiles} 
          onSubmit={handleFileUpload} 
          loading={loading}
        />
      )}
    </div>
  );
};
```

### Login Component

```jsx
import React, { useState } from 'react';

const LoginForm = () => {
  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState({ email: '', password: '', otp: '' });
  const [loading, setLoading] = useState(false);

  const handleEmailCheck = async () => {
    if (!credentials.email) return;
    
    setLoading(true);
    try {
      const exists = await loginFlow.checkEmail(credentials.email);
      if (exists) {
        setStep(2);
      } else {
        alert('Email not found. Please register first.');
      }
    } catch (error) {
      alert('Error checking email');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialVerification = async () => {
    setLoading(true);
    try {
      const otpSent = await loginFlow.verifyCredentials(
        credentials.email, 
        credentials.password
      );
      if (otpSent) {
        setStep(3);
      }
    } catch (error) {
      alert('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    setLoading(true);
    try {
      await loginFlow.verifyOTP(credentials.email, credentials.otp);
      window.location.href = '/dashboard';
    } catch (error) {
      alert('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      {step === 1 && <EmailStep onNext={handleEmailCheck} />}
      {step === 2 && <PasswordStep onNext={handleCredentialVerification} />}
      {step === 3 && <OTPStep onNext={handleOTPVerification} />}
    </div>
  );
};
```

---

## 📁 File Upload Patterns

### Document Upload After Registration

```javascript
const uploadDocuments = async (files, documentType = 'registration') => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('documents', file);
  });
  formData.append('documentType', documentType);

  const response = await fetch('/api/upload/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    },
    body: formData
  });

  if (response.ok) {
    return await response.json();
  }
  
  throw new Error('Upload failed');
};
```

### File Upload with Progress

```javascript
const uploadWithProgress = (files, onProgress) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));

    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.open('POST', '/api/upload/documents');
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('authToken')}`);
    xhr.send(formData);
  });
};
```

---

## 🛡️ Error Handling

### Comprehensive Error Handler

```javascript
const handleAPIError = (error, response) => {
  if (!response.ok) {
    switch (response.status) {
      case 400:
        return { type: 'validation', message: 'Invalid data provided' };
      case 401:
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return { type: 'auth', message: 'Session expired' };
      case 403:
        return { type: 'permission', message: 'Access denied' };
      case 404:
        return { type: 'notfound', message: 'Resource not found' };
      case 409:
        return { type: 'conflict', message: 'User already exists' };
      case 422:
        return { type: 'validation', message: 'Validation failed' };
      default:
        return { type: 'server', message: 'Server error occurred' };
    }
  }
  
  return { type: 'network', message: 'Network error' };
};
```

---

## 🧪 Testing Your Integration

### Test Registration

```javascript
const testRegistration = async () => {
  try {
    // Test basic registration
    const userData = {
      idNumber: '8001011234567',
      email: 'test@example.com',
      phone: '+27821234567',
      password: 'TestPass123!',
      businessType: 'sole_trader',
      streetAddress: '123 Test Street',
      town: 'Johannesburg',
      city: 'Johannesburg', 
      province: 'Gauteng',
      postalCode: '2000'
    };

    const result = await registerUser(userData);
    console.log('Registration success:', result);
    
    // Test login
    const loginResult = await loginFlow.verifyCredentials(
      userData.email, 
      userData.password
    );
    console.log('Login test:', loginResult);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};
```

### Environment Configuration

```javascript
const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    debug: true
  },
  production: {
    apiUrl: 'https://cash-dnr-backend.onrender.com',
    debug: false
  }
};

const ENV = process.env.NODE_ENV || 'development';
export default config[ENV];
```

---

## 📦 State Management (Redux Example)

### Auth Slice

```javascript
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('authToken'),
    loading: false,
    error: null
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem('authToken', action.payload);
      } else {
        localStorage.removeItem('authToken');
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('authToken');
    }
  }
});

export const { setLoading, setUser, setToken, setError, logout } = authSlice.actions;
export default authSlice.reducer;
```

---

## ✅ Integration Checklist

### Pre-launch Checklist

- [ ] Registration flow tested (both JSON and multipart)
- [ ] Login flow tested (3-step process)
- [ ] File upload functionality tested
- [ ] Error handling implemented
- [ ] Token refresh logic implemented
- [ ] Mobile responsive design tested
- [ ] Network failure scenarios handled
- [ ] User feedback for loading states
- [ ] Form validation implemented
- [ ] CORS properly configured

### Security Checklist

- [ ] JWT tokens stored securely
- [ ] API endpoints use HTTPS in production
- [ ] Sensitive data not logged in console
- [ ] File upload validation implemented
- [ ] XSS protection measures in place
- [ ] CSRF protection if using cookies

---

This guide provides everything you need to integrate with the CASH-DNR Backend API successfully. For additional support, refer to the [API Reference](API_REFERENCE.md) or contact the development team.

**Example with JavaScript Fetch:**
```javascript
const formData = new FormData();

// Add text fields
formData.append('email', 'user@example.com');
formData.append('password', 'YourPassword123!');
formData.append('idNumber', '8203141234089');
formData.append('phoneNumber', '+27 82 555 1234');

// Add address as JSON string
const address = {
  streetAddress: '123 Main Street',
  town: 'Sandton',
  city: 'Johannesburg',
  province: 'Gauteng',
  postalCode: '2196'
};
formData.append('homeAddress', JSON.stringify(address));

// Add files
formData.append('id_document', idDocumentFile);
formData.append('proof_of_residence', residenceProofFile);
formData.append('bank_statement', bankStatementFile); // optional

// Send request
const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/register-with-documents', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered and documents uploaded",
  "data": {
    "user": {
      "id": "uuid-here",
      "username": "michelle.white",
      "email": "user@example.com",
      "firstName": "Michelle",
      "lastName": "White",
      "idNumber": "8203141234089",
      "dateOfBirth": "1982-03-14",
      "gender": "F",
      "taxNumber": "1234567890",
      "homeAffairsVerified": true,
      "isActive": true,
      "isVerified": true
    },
    "uploaded": [
      {
        "id": "file-uuid-1",
        "originalName": "my_id.pdf",
        "storedName": "1736512345678-123456789-user123.pdf",
        "fileType": "id_document"
      },
      {
        "id": "file-uuid-2",
        "originalName": "proof_of_residence.pdf",
        "storedName": "1736512345679-123456789-user123.pdf",
        "fileType": "proof_of_address"
      }
    ]
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "This email is already registered"
}
```

---

## 🎨 Frontend Implementation

### React Component - Registration with Documents

```jsx
import { useState } from 'react';

function RegisterWithDocuments() {
  const [formData, setFormData] = useState({
    idNumber: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [files, setFiles] = useState({
    idDocument: null,
    proofOfResidence: null,
    bankStatement: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e, fieldName) => {
    setFiles({ ...files, [fieldName]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!files.idDocument || !files.proofOfResidence) {
      setError('ID document and proof of residence are required');
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    
    // Add text fields
    formDataToSend.append('email', formData.email);
    formDataToSend.append('password', formData.password);
    formDataToSend.append('idNumber', formData.idNumber);
    formDataToSend.append('phoneNumber', formData.phoneNumber);

    // Add files
    formDataToSend.append('id_document', files.idDocument);
    formDataToSend.append('proof_of_residence', files.proofOfResidence);
    if (files.bankStatement) {
      formDataToSend.append('bank_statement', files.bankStatement);
    }

    try {
      const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/register-with-documents', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        alert('Registration successful! Documents uploaded: ' + data.data.uploaded.length);
        console.log('User created:', data.data.user);
        console.log('Files uploaded:', data.data.uploaded);
        // Redirect or show success
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <h2>Register with Documents</h2>
      
      <div>
        <input
          type="text"
          placeholder="ID Number (13 digits)"
          value={formData.idNumber}
          onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
          maxLength="13"
          required
        />
      </div>
      
      <div>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      
      <div>
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>
      
      <div>
        <input
          type="tel"
          placeholder="Phone Number (+27 82 555 1234)"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
        />
      </div>
      
      <div>
        <label>ID Document (Required)*</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileChange(e, 'idDocument')}
          required
        />
        {files.idDocument && <p>✓ {files.idDocument.name}</p>}
      </div>
      
      <div>
        <label>Proof of Residence (Required)*</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileChange(e, 'proofOfResidence')}
          required
        />
        {files.proofOfResidence && <p>✓ {files.proofOfResidence.name}</p>}
      </div>
      
      <div>
        <label>Bank Statement (Optional)</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileChange(e, 'bankStatement')}
        />
        {files.bankStatement && <p>✓ {files.bankStatement.name}</p>}
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Uploading...' : 'Register with Documents'}
      </button>
      
      <div className="info">
        <h4>What happens next:</h4>
        <ul>
          <li>✅ Your ID will be verified with Home Affairs</li>
          <li>✅ Documents will be uploaded and stored securely</li>
          <li>✅ User account will be created</li>
          <li>✅ If all required documents are provided, account will be verified</li>
        </ul>
      </div>
    </form>
  );
}

export default RegisterWithDocuments;
```

---

## 📋 File Upload Requirements

**Accepted File Types:**
- PDF (`.pdf`)
- Images: JPEG (`.jpg`, `.jpeg`), PNG (`.png`), GIF (`.gif`)
- Documents: Word (`.doc`, `.docx`), Excel (`.xls`, `.xlsx`)

**File Size Limits:**
- Maximum per file: 400MB
- Recommended: Under 10MB for faster uploads

**Required Documents:**
- ✅ ID Document (required)
- ✅ Proof of Residence (required)
- ⚪ Bank Statement (optional but recommended)

---

## ⚠️ Common Errors & Solutions

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "This email is already registered" | Email already in use | Use different email |
| "This ID number is already registered" | ID already in use | User already exists |
| "ID verification failed" | Invalid ID or Home Affairs API error | Check ID format (13 digits) |
| "id_document and proof_of_residence are required" | Missing files | Upload required documents |
| "Incomplete personal details from Home Affairs" | ID not found in Home Affairs system | Verify ID number is correct |

---

## 📱 Test IDs for Development

Use these South African ID numbers for testing:

| ID Number | Name | Gender | DOB |
|-----------|------|--------|-----|
| 8203141234089 | Michelle White | Female | 1982-03-14 |
| 8012094321085 | Christopher White | Male | 1980-12-09 |
