# 🚀 Phase 1 - Foundational Operations Documentation

> 📚 **For API overview and quick start, see [README.md](../README.md)**

## Overview

**Phase 1** of the CASH-DNR system implements the core foundational operations that enable digital tracking and transfer of physical cash notes. This phase establishes the essential infrastructure for cash note management, user registration with Home Affairs verification, and automatic tax number generation.

---

## 🎯 Phase 1 Objectives

### Primary Goals
1. **Digital Cash Note Tracking** - Register and track physical cash notes digitally
2. **Ownership Management** - Prevent double spending through digital ownership transfer
3. **Home Affairs Integration** - Verify user identity during registration
4. **Automatic Tax Number Generation** - Generate tax numbers for users without existing ones
5. **Fraud Prevention** - Flag stolen notes and prevent unauthorized transfers
6. **Proxy Transactions** - Enable family members/middleman transactions

### Key Features Delivered
- ✅ Cash note scanning (QR code, barcode, manual entry)
- ✅ Digital ownership tracking and transfer
- ✅ Home Affairs verification during registration
- ✅ Automatic SARS tax number generation
- ✅ Stolen note flagging and red-flagging system
- ✅ Foreign currency transfer validation
- ✅ Proxy spending authorization (USSD/digital confirmation)
- ✅ Comprehensive audit trails and transaction logging

---

## 🏗️ Technical Architecture

### Core Components

#### 1. **CashNote Model**
**Purpose**: Digital representation of physical cash notes
**Key Features**:
- Unique reference code validation
- Denomination tracking (R10, R20, R50, R100, R200)
- Ownership chain management
- Status tracking (active, stolen, locked, etc.)
- Foreign currency support

```javascript
// Reference code format: CN-YYMMDD-NNNN-CC
// Example: CN-241217-1234-89
```

#### 2. **CashNoteTransfer Model** 
**Purpose**: Track all ownership transfers with audit trail
**Key Features**:
- Transfer method tracking (QR scan, speedpoint, USSD, etc.)
- Proxy transaction support
- Home Affairs validation for foreign transfers
- Risk scoring and fraud detection
- Reversal and dispute management

#### 3. **TaxNumberGenerationService**
**Purpose**: Automatic tax number generation and SARS integration
**Key Features**:
- South African tax number format validation
- Check for existing SARS records
- Generate unique tax numbers with Luhn algorithm
- Tax bracket calculation
- Income categorization (salary/business)

#### 4. **Enhanced User Registration**
**Purpose**: Phase 1 user onboarding with Home Affairs verification
**Key Features**:
- ID number verification with Home Affairs API
- Automatic personal detail extraction
- Tax number generation if none exists
- Phase 1 initialization (cash notes enabled, digital wallet enabled)
- Comprehensive audit logging

---

## 🔗 API Endpoints

### Base URL
**Production**: `https://cash-dnr-backend.onrender.com/api`
**Development**: `http://localhost:3000/api`

### 1. User Registration (Enhanced for Phase 1)

**Endpoint**: `POST /api/auth/register`
**Purpose**: Register user with Home Affairs verification and tax number generation

#### Request Body:
```json
{
  "idNumber": "0001010001088",
  "email": "john.doe@example.com", 
  "password": "securePassword123",
  "contactInfo": {
    "email": "john.doe@example.com",
    "phone": "+27 82 123 4567"
  },
  "homeAddress": {
    "streetAddress": "123 Main Street",
    "town": "Johannesburg",
    "city": "Johannesburg", 
    "province": "Gauteng",
    "postalCode": "2000"
  }
}
```

#### Response (201 - Success):
```json
{
  "success": true,
  "message": "User registered successfully with Home Affairs and SARS verification",
  "data": {
    "user": {
      "id": "user-uuid",
      "username": "john.doe",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "homeAffairsVerified": true
    },
    "token": "jwt-token",
    "phase1Registration": {
      "completed": true,
      "taxNumberGenerated": true,
      "taxNumberSource": "generated",
      "homeAffairsVerified": true,
      "cashNotesEnabled": true,
      "digitalWalletEnabled": true,
      "nextSteps": [
        "Complete profile information",
        "Upload required documents", 
        "Start scanning cash notes",
        "Set up digital wallet preferences"
      ]
    },
    "taxInformation": {
      "taxNumber": "1234567890",
      "source": "generated",
      "sarsRegistered": true,
      "message": "New tax number generated and registered with SARS"
    }
  }
}
```

### 2. Cash Note Registration

**Endpoint**: `POST /api/cash-notes/register`
**Purpose**: Register a new cash note in the system

#### Request Body:
```json
{
  "referenceCode": "CN-241217-1234-89",
  "denomination": 100.00,
  "serialNumber": "AB123456789",
  "scanMethod": "mobile_camera",
  "qrCodeData": "encoded-qr-data",
  "isForeign": false
}
```

#### Response (201 - Success):
```json
{
  "success": true,
  "message": "Cash note registered successfully",
  "data": {
    "id": "note-uuid",
    "referenceCode": "CN-241217-1234-89",
    "denomination": 100.00,
    "noteType": "ZAR_100",
    "status": "active",
    "currentOwner": "user-uuid",
    "registeredAt": "2024-12-17T10:30:00.000Z"
  }
}
```

### 3. Cash Note Scanning

**Endpoint**: `POST /api/cash-notes/scan`
**Purpose**: Scan and verify a cash note

#### Request Body:
```json
{
  "referenceCode": "CN-241217-1234-89",
  "scanMethod": "qr_code"
}
```

#### Response (200 - Success):
```json
{
  "success": true,
  "message": "Cash note scanned successfully", 
  "data": {
    "id": "note-uuid",
    "referenceCode": "CN-241217-1234-89",
    "denomination": 100.00,
    "noteType": "ZAR_100",
    "status": "active",
    "currentOwner": {
      "id": "owner-uuid",
      "username": "jane.smith",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "transferCount": 3,
    "isOwnedByScanner": false,
    "canTransfer": true,
    "metadata": {
      "issueDate": "2024-12-17T08:00:00.000Z",
      "lastTransfer": "2024-12-17T09:45:00.000Z",
      "isForeign": false
    }
  }
}
```

### 4. Transfer Cash Note Ownership

**Endpoint**: `POST /api/cash-notes/:id/transfer`
**Purpose**: Transfer ownership of a cash note

#### Request Body:
```json
{
  "toUserId": "recipient-user-uuid",
  "transferMethod": "digital_confirm",
  "isProxyTransaction": false,
  "transactionContext": "p2p",
  "notes": "Payment for services"
}
```

#### Proxy Transaction Example:
```json
{
  "toUserId": "family-member-uuid",
  "transferMethod": "ussd",
  "isProxyTransaction": true,
  "proxyType": "family_member",
  "proxyAuthorizationCode": "PXY-1703075400-1234",
  "transactionContext": "family_transfer",
  "notes": "Grocery money for mom"
}
```

#### Response (200 - Success):
```json
{
  "success": true,
  "message": "Cash note ownership transferred successfully",
  "data": {
    "transferId": "transfer-uuid",
    "transferReference": "TXF-1703075400-5678",
    "cashNote": {
      "id": "note-uuid", 
      "referenceCode": "CN-241217-1234-89",
      "denomination": 100.00
    },
    "from": {
      "id": "sender-uuid",
      "username": "john.doe"
    },
    "to": {
      "id": "recipient-uuid", 
      "username": "jane.smith",
      "name": "Jane Smith"
    },
    "transferredAt": "2024-12-17T11:00:00.000Z",
    "newTransferCount": 4
  }
}
```

### 5. Flag Cash Note as Stolen

**Endpoint**: `PUT /api/cash-notes/:id/flag-stolen`
**Purpose**: Flag a cash note as stolen (Phase 1 fraud prevention)

#### Request Body:
```json
{
  "reason": "Cash note stolen during robbery"
}
```

#### Response (200 - Success):
```json
{
  "success": true,
  "message": "Cash note flagged as stolen successfully",
  "data": {
    "referenceCode": "CN-241217-1234-89",
    "status": "stolen",
    "flaggedAt": "2024-12-17T11:30:00.000Z",
    "flaggedBy": "user-uuid"
  }
}
```

### 6. Get User's Cash Notes

**Endpoint**: `GET /api/cash-notes/my-notes`
**Purpose**: Retrieve user's cash notes

#### Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50) 
- `status` (optional): Filter by status
- `noteType` (optional): Filter by note type

#### Response (200 - Success):
```json
{
  "success": true,
  "message": "Cash notes retrieved successfully",
  "data": {
    "cashNotes": [
      {
        "id": "note-uuid",
        "referenceCode": "CN-241217-1234-89",
        "denomination": 100.00,
        "noteType": "ZAR_100", 
        "status": "active",
        "transferCount": 3,
        "registeredAt": "2024-12-17T08:00:00.000Z",
        "lastTransferAt": "2024-12-17T09:45:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "totalPages": 1,
      "limit": 50
    },
    "summary": {
      "totalNotes": 15,
      "totalValue": "1250.00",
      "currency": "ZAR"
    }
  }
}
```

### 7. Proxy Authorization

**Endpoint**: `POST /api/cash-notes/proxy-authorize`
**Purpose**: Authorize proxy transactions (Phase 1 middleman support)

#### Request Body:
```json
{
  "proxyUserId": "family-member-uuid",
  "authorizationMethod": "ussd",
  "maxAmount": 500.00,
  "validUntil": "2024-12-18T12:00:00.000Z",
  "purpose": "Grocery shopping authorization"
}
```

#### Response (200 - Success):
```json
{
  "success": true,
  "message": "Proxy authorization created successfully",
  "data": {
    "authorizationCode": "PXY-1703075400-1234",
    "proxyUserId": "family-member-uuid",
    "authorizingUserId": "user-uuid",
    "authorizationMethod": "ussd",
    "maxAmount": 500.00,
    "validUntil": "2024-12-18T12:00:00.000Z",
    "purpose": "Grocery shopping authorization",
    "status": "active"
  }
}
```

---

## 🔐 Security Features

### 1. **Fraud Prevention**
- **Double Spending Prevention**: Digital ownership tracking prevents same note being transferred multiple times
- **Stolen Note Flagging**: Red-flag stolen notes to prevent usage
- **Reference Code Validation**: Cryptographic validation of cash note reference codes
- **Risk Scoring**: Automatic risk assessment for transfers

### 2. **Home Affairs Integration** 
- **Identity Verification**: Real-time ID verification during registration
- **Personal Detail Extraction**: Automatic retrieval of verified personal information
- **Foreign Currency Validation**: Enhanced validation for foreign currency transfers

### 3. **Audit Trail**
- **Complete Transaction History**: Every action logged with timestamps
- **IP Address Tracking**: Security monitoring for all operations  
- **Device Fingerprinting**: Device identification for fraud detection
- **User Action Logging**: Comprehensive audit of all user activities

---

## 📊 Database Schema

### Key Tables Created in Phase 1

#### 1. **cash_notes**
```sql
CREATE TABLE cash_notes (
  id UUID PRIMARY KEY,
  reference_code VARCHAR(20) UNIQUE NOT NULL,
  denomination DECIMAL(10,2) NOT NULL,
  note_type ENUM('ZAR_10', 'ZAR_20', 'ZAR_50', 'ZAR_100', 'ZAR_200', 'FOREIGN'),
  status ENUM('active', 'transferred', 'locked', 'stolen', 'disputed', 'destroyed'),
  current_owner_id UUID REFERENCES users(id),
  original_owner_id UUID REFERENCES users(id),
  transfer_count INTEGER DEFAULT 0,
  is_foreign BOOLEAN DEFAULT FALSE,
  foreign_currency VARCHAR(3),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. **cash_note_transfers**
```sql
CREATE TABLE cash_note_transfers (
  id UUID PRIMARY KEY,
  transfer_reference VARCHAR(50) UNIQUE NOT NULL,
  cash_note_id UUID REFERENCES cash_notes(id),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  transfer_method ENUM('qr_scan', 'barcode_scan', 'speedpoint', 'ussd', 'digital_confirm'),
  status ENUM('pending', 'completed', 'failed', 'cancelled', 'disputed'),
  is_proxy_transaction BOOLEAN DEFAULT FALSE,
  proxy_type ENUM('family_member', 'guardian', 'business_agent'),
  requires_home_affairs_validation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. **Enhanced users table**
```sql
ALTER TABLE users ADD COLUMN registration_phase ENUM('phase_1_complete', 'phase_2_complete', 'phase_3_complete');
ALTER TABLE users ADD COLUMN cash_notes_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN digital_wallet_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN cash_holding_limit DECIMAL(10,2) DEFAULT 25000.00;
```

---

## 🚀 Deployment Guide

### 1. **Database Migration**
```bash
# Run Phase 1 migration
npm run migrate:phase1

# Or manually import and run
node -e "
import('./src/migrations/20241217_002_phase1_foundational_operations.js')
  .then(migration => migration.up())
  .then(() => console.log('Phase 1 migration completed!'))
"
```

### 2. **Environment Variables**
Add to your `.env` file:
```env
# Phase 1 Configuration
PHASE_1_ENABLED=true
CASH_NOTES_ENABLED=true
HOME_AFFAIRS_API_URL=https://api.dha.gov.za
SARS_API_URL=https://api.sars.gov.za
TAX_GENERATION_ENABLED=true

# Cash Note Configuration
MAX_CASH_HOLDING_LIMIT=25000
REFERENCE_CODE_VALIDATION=true
PROXY_TRANSACTION_ENABLED=true

# Security
FRAUD_DETECTION_ENABLED=true
STOLEN_NOTE_FLAGGING=true
```

### 3. **Start the Application**
```bash
# Install dependencies
npm install

# Run database migrations
npm run migrate

# Start the server
npm start
```

---

## 📱 User Flows

### 1. **New User Registration Flow**
```
1. User enters ID number and contact details
   ↓
2. System verifies ID with Home Affairs API
   ↓ 
3. Personal details auto-populated from Home Affairs
   ↓
4. System checks for existing tax number in SARS
   ↓
5. If no tax number exists, generates new one
   ↓
6. User account created with Phase 1 features enabled
   ↓
7. User can immediately start scanning cash notes
```

### 2. **Cash Note Registration Flow**
```
1. User scans QR code/barcode or enters reference code manually
   ↓
2. System validates reference code format and checksum
   ↓
3. System checks if note already registered
   ↓
4. If new, creates cash note record with user as owner
   ↓
5. Audit log created for registration
   ↓
6. User can now transfer or manage the note
```

### 3. **Ownership Transfer Flow**
```
1. Current owner initiates transfer (scan recipient or enter details)
   ↓
2. System validates ownership and note status
   ↓
3. If foreign currency, Home Affairs validation required
   ↓
4. Transfer record created with pending status
   ↓
5. Recipient confirmation (if required)
   ↓
6. Ownership updated, transfer completed
   ↓
7. Both parties receive confirmation
```

### 4. **Proxy Transaction Flow (Middleman/Family)**
```
1. Authorizing user creates proxy authorization
   ↓
2. System generates authorization code (USSD/Digital)
   ↓
3. Proxy user receives authorization code
   ↓
4. Proxy user initiates transfer with authorization code
   ↓
5. System validates authorization and expiry
   ↓
6. Transfer proceeds as authorized proxy transaction
   ↓
7. All parties notified of transaction completion
```

---

## 🔧 Testing

### Unit Tests
```bash
# Run Phase 1 specific tests
npm test -- --grep "Phase 1"

# Test cash note operations
npm test src/tests/cashNotes.test.js

# Test tax number generation
npm test src/tests/taxGeneration.test.js
```

### Integration Tests
```bash
# Test complete user registration flow
npm test src/tests/integration/userRegistration.test.js

# Test cash note lifecycle
npm test src/tests/integration/cashNoteLifecycle.test.js
```

### Manual Testing Checklist
- [ ] User registration with Home Affairs verification
- [ ] Tax number generation for new users
- [ ] Cash note scanning and registration
- [ ] Ownership transfer between users
- [ ] Proxy transaction authorization
- [ ] Foreign currency transfer validation
- [ ] Stolen note flagging and prevention
- [ ] Audit trail completeness

---

## 📈 Performance Metrics

### Expected Performance (Phase 1)
- **User Registration**: < 3 seconds (including Home Affairs verification)
- **Cash Note Scanning**: < 500ms
- **Ownership Transfer**: < 1 second
- **Database Queries**: < 100ms average
- **API Response Times**: < 200ms average

### Scalability Targets
- **Concurrent Users**: 10,000+
- **Cash Notes**: 1M+ notes tracked
- **Daily Transactions**: 100,000+
- **Storage**: Efficient JSONB for metadata

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Home Affairs API Unavailable**
```javascript
// Error handling in registration
if (!idVerificationResult.success) {
  return res.status(503).json({
    success: false,
    message: 'Home Affairs verification service temporarily unavailable',
    fallbackOptions: ['Try again later', 'Contact support']
  });
}
```

#### 2. **Tax Number Generation Failed** 
```javascript
// Fallback to basic generation
if (!taxGenerationResult.success) {
  taxNumber = generateTaxNumber(idNumber); // Fallback method
  logger.warn('Using fallback tax number generation');
}
```

#### 3. **Cash Note Already Registered**
```javascript
// Provide current owner information
if (existingNote) {
  return res.status(409).json({
    success: false,
    message: 'Cash note already registered',
    data: {
      currentOwner: existingNote.current_owner_id,
      registeredAt: existingNote.created_at,
      status: existingNote.status
    }
  });
}
```

---

## 🔮 Phase 2 Preview

Phase 1 establishes the foundation. **Phase 2** will add:
- **Enhanced Financial Categorization**: Automated expense categorization
- **SARS Integration**: Direct tax routing and bracket-level deductions  
- **Business Transaction Support**: POS integration and bulk operations
- **Advanced Fraud Detection**: ML-based pattern recognition
- **Compliance Automation**: Automated tax calculations and reporting

---

## 📞 Support

For Phase 1 implementation support:
- **Technical Issues**: Check logs in `logs/app.log`
- **Database Issues**: Review migration status
- **API Errors**: Check endpoint documentation
- **Security Concerns**: Review audit logs in `audit_logs` table

**Phase 1 Foundation Complete! 🎉**
Ready for cash note digital tracking, Home Affairs verified registration, and automatic tax number generation.
