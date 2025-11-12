# 🧪 CASH-DNR Test Suite

> **For project setup and basic API usage, see [../README.md](../README.md)**

## Overview

This directory contains organized test scripts for the CASH-DNR Backend system. Tests are categorized by purpose and maintenance status to ensure clarity and ease of use.

---

## 📁 Directory Structure

```
tests/
├── README.md              # This documentation file
├── active/                # Current working tests for key functionality
├── utilities/             # Helper scripts and test utilities
└── archive/               # Historical/debugging tests (kept for reference)
```

---

## 🎯 Active Tests (`./active/`)

These are the **primary test scripts** that validate core system functionality:

### Registration & File Upload Tests
- **`test-new-multer.cjs`** - Complete multipart registration with document upload
  - Tests unified `/api/auth/citizen` endpoint with files
  - Validates PDF upload, user creation, and JWT token generation
  - **Run:** `node tests/active/test-new-multer.cjs`

- **`test-full-login-flow.cjs`** - End-to-end user journey test
  - Registration → Login → OTP verification flow
  - Tests complete user authentication cycle
  - **Run:** `node tests/active/test-full-login-flow.cjs`

- **`test-login-only.cjs`** - Login flow validation for existing users
  - Tests multi-step login: email check → credentials → OTP
  - Validates existing user authentication
  - **Run:** `node tests/active/test-login-only.cjs`

### Authentication & OTP Tests
- **`test-integrated-otp.js`** - Complete OTP generation and verification
  - Tests immediate OTP generation and verification cycle
  - Validates SMS integration and OTP validation
  - **Run:** `node tests/active/test-integrated-otp.js`

### System Tests
- **`test_phase1.js`** - Phase 1 foundational features validation
  - Tests core cash note functionality
  - Validates transaction logging and audit trails
  - **Run:** `node tests/active/test_phase1.js`

- **`test-sms-live.js`** - Live SMS integration testing
  - Tests real Twilio SMS delivery
  - Validates OTP delivery to actual phone numbers
  - **Run:** `node tests/active/test-sms-live.js`

---

## 🛠️ Test Utilities (`./utilities/`)

Helper scripts and maintenance tools:

### Data Management
- **`delete-test-user.js`** - Clean up test users from database
  - Removes test users by ID number
  - Cleans associated files and data
  - **Run:** `node tests/utilities/delete-test-user.js`

### OTP Testing Tools
- **`quick-otp-test.js`** - Quick OTP verification testing
  - Tests specific OTP keys and codes
  - Useful for debugging OTP issues
  - **Run:** `node tests/utilities/quick-otp-test.js`

- **`quick-fresh-otp.js`** - Generate fresh OTP for testing
  - Creates new OTP for immediate testing
  - Bypasses normal flow for debugging
  - **Run:** `node tests/utilities/quick-fresh-otp.js`

---

## 📦 Archived Tests (`./archive/`)

Historical tests kept for reference and debugging:

### Categories
- **Production Debugging** - `test-production-*.js` files
- **Local Development** - `test-local-*.js` files
- **File Upload Debugging** - `test-minimal-*.js`, `test-file-upload-*.js`
- **Registration Variations** - Various registration test approaches
- **Database Testing** - Connection and model tests
- **API Endpoint Testing** - Individual endpoint validation

> **Note:** These files are kept for historical reference but are no longer actively maintained.

---

## 🚀 Quick Start Testing

### 1. **Complete System Test**
```bash
# Test full user registration with documents
node tests/active/test-new-multer.cjs

# Test complete login flow
node tests/active/test-full-login-flow.cjs
```

### 2. **Authentication Only**
```bash
# Test existing user login
node tests/active/test-login-only.cjs

# Test OTP functionality
node tests/active/test-integrated-otp.js
```

### 3. **Clean Up Test Data**
```bash
# Remove test users after testing
node tests/utilities/delete-test-user.js
```

---

## 🔧 Test Configuration

### Environment Requirements
- **Node.js** ≥ 18.0.0
- **Production API** access or local server running
- **Test credentials** for known ID numbers

### Test Data
All active tests use these standardized test credentials:
- **ID Number:** `8203141234089`
- **Generated Name:** Michelle White
- **Tax Number:** T1412340896
- **Test Endpoints:** Production (`https://cash-dnr-backend.onrender.com`)

### Expected Test Outcomes
- ✅ **Registration:** 201 status with JWT token
- ✅ **Login Flow:** 200 status at each step
- ✅ **File Upload:** 201 status with file metadata
- ✅ **OTP Verification:** 200 status with session token

---

## 📝 Test Output Examples

### Successful Registration Test
```
🚀 Testing multipart registration with PDF upload...
📄 Test PDF size: 1.2KB
📤 Sending registration request...
✅ Registration successful! Status: 201
🎟️ JWT Token received (length: 245)
📁 Files uploaded: 3 documents
👤 User created: Michelle White (Tax: T1412340896)
```

### Successful Login Flow
```
🔐 Testing complete login flow...
📧 Step 1: Email check - ✅ 200 OK
🔑 Step 2: Credential verification - ✅ 200 OK  
📱 Step 3: OTP sent to console mode
🔢 Step 4: OTP verification - ✅ 200 OK
🎯 Login flow complete!
```

---

## 🐛 Troubleshooting

### Common Issues
1. **502 Bad Gateway** - Server may be starting up (wait 30s)
2. **OTP Timeout** - Use `quick-otp-test.js` for fresh OTP
3. **User Already Exists** - Run `delete-test-user.js` to clean up

### Debug Mode
Most tests include verbose logging. Look for:
- 🚀 **Process start** indicators  
- ✅ **Success** confirmations
- ❌ **Error** details with HTTP status codes
- 📄 **Response data** for analysis

---

## 📊 Test Coverage

| Feature | Test Coverage | Files |
|---------|---------------|-------|
| **Registration** | ✅ Complete | `test-new-multer.cjs`, `test-full-login-flow.cjs` |
| **Authentication** | ✅ Complete | `test-login-only.cjs`, `test-integrated-otp.js` |
| **File Upload** | ✅ Complete | `test-new-multer.cjs` |
| **OTP System** | ✅ Complete | `test-integrated-otp.js`, utilities |
| **SMS Integration** | ✅ Live Testing | `test-sms-live.js` |
| **Phase 1 Features** | ✅ Core Functions | `test_phase1.js` |

---

## 🤝 Contributing

When adding new tests:
1. **Active tests** - Place in `./active/` for current functionality
2. **Utilities** - Place in `./utilities/` for helper scripts
3. **Archive** - Move old/obsolete tests to `./archive/`
4. **Documentation** - Update this README with new test descriptions

---

*Last Updated: December 2024*