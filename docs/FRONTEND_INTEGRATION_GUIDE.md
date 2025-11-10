# Frontend Integration Guide - Registration API

## Base URL
```
Production: https://cash-dnr-backend.onrender.com
```

---

## 📝 Registration with Documents (TESTED & WORKING)

This is the **only tested and confirmed working** registration endpoint.

**Endpoint:** `POST /api/auth/register-with-documents`

**Request Type:** `multipart/form-data`

**Required Fields:**
- `email` (text)
- `password` (text)
- `idNumber` (text)
- `id_document` (file) - **Required**
- `proof_of_residence` (file) - **Required**

**Optional Fields:**
- `phoneNumber` (text)
- `bank_statement` (file)
- `other_documents` (file)
- `homeAddress` (JSON string)

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
