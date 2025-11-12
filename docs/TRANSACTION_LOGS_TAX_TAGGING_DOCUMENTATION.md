# Transaction Logs & Tax Tagging System Documentation

> 📚 **For basic API setup and authentication, see [README.md](../README.md)**

## Overview
This document provides comprehensive documentation for the transaction logging and tax tagging system implemented in the CASH-DNR Backend. The system provides automated tax classification, detailed audit trails, and comprehensive logging for all transaction-related activities.

## Base URL
**Production**: `https://cash-dnr-backend.onrender.com/api/transactions`
**Development**: `http://localhost:3000/api/transactions`

---

## 🏗️ System Architecture

### Components
1. **TransactionLog Model** - Detailed transaction-specific logging
2. **AuditLog Model** - System-wide audit trail
3. **TaxTaggingService** - Automated tax classification
4. **TransactionLoggingService** - Centralized logging operations

### Key Features
- ✅ **Automated Tax Classification** - AI-powered tax categorization
- ✅ **Comprehensive Audit Trail** - Complete transaction history
- ✅ **Real-time Flagging** - Suspicious transaction detection
- ✅ **VAT Calculations** - Automatic South African VAT handling
- ✅ **Compliance Tracking** - SARS reporting assistance

---

## 📊 Tax Classification System

### Tax Categories
| Classification | Description | Usage |
|---------------|-------------|-------|
| `TAXABLE_BUSINESS` | Business-related taxable transactions | Office supplies, equipment, business services |
| `TAXABLE_PERSONAL` | Personal taxable transactions | Personal purchases, entertainment |
| `NON_TAXABLE` | Non-taxable transactions | Gifts under threshold, certain transfers |
| `EXEMPT` | Tax-exempt transactions | Medical, educational, charitable |
| `REVIEW_REQUIRED` | Requires manual review | Ambiguous or high-value transactions |

### Classification Thresholds
```javascript
SMALL_TRANSACTION: R1,000
MEDIUM_TRANSACTION: R10,000  
LARGE_TRANSACTION: R100,000
REPORTABLE_CASH: R24,999
SUSPICIOUS_AMOUNT: R500,000
```

### VAT Rate
- **Current Rate**: 15% (South African standard)
- **Automatic Calculation**: VAT-inclusive and VAT-exclusive amounts

---

## 🔗 API Endpoints

### 1. Create Transaction with Tax Classification
**Endpoint**: `POST /api/transactions`
**Purpose**: Create a new transaction with automatic tax classification
**Access**: Private

#### Request Body:
```json
{
  "amount": 15000.00,
  "purpose": "Office equipment purchase",
  "userId": "user-uuid",
  "transactionType": "digital",
  "digitalReference": "REF123456",
  "receiverInfo": {
    "name": "Office Supplies Co (Pty) Ltd",
    "taxId": "1234567890"
  },
  "metadata": {
    "category": "business_expense",
    "department": "IT"
  }
}
```

#### Response (201 - Success):
```json
{
  "success": true,
  "message": "Transaction logged successfully with tax classification",
  "transaction": {
    "id": "txn-uuid",
    "reference": "TXN-1698765432-1234",
    "amount": 15000.00,
    "purpose": "Office equipment purchase",
    "transactionType": "digital",
    "taxClassification": "TAXABLE_BUSINESS",
    "status": "COMPLETED",
    "timestamp": "2025-10-15T10:30:00.000Z",
    "receiver": {
      "name": "Office Supplies Co (Pty) Ltd",
      "taxId": "1234567890"
    }
  },
  "taxAnalysis": {
    "classification": "TAXABLE_BUSINESS",
    "confidenceScore": 85,
    "reasoning": [
      "Business keywords found: office, equipment",
      "Receiver appears to be a registered business"
    ],
    "flags": [],
    "taxImplications": {
      "vat_amount": {
        "vat_inclusive_amount": 15000.00,
        "vat_exclusive_amount": 13043.48,
        "vat_amount": 1956.52,
        "vat_rate": 0.15
      },
      "amount_category": "large",
      "risk_level": "medium"
    }
  }
}
```

### 2. Get Transaction Logs
**Endpoint**: `GET /api/transactions/:transactionId/logs`
**Purpose**: Retrieve all logs for a specific transaction
**Access**: Private

#### Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `logType` (optional): Filter by log type

#### Response (200 - Success):
```json
{
  "success": true,
  "message": "Transaction logs retrieved successfully",
  "data": {
    "logs": [
      {
        "id": "log-uuid",
        "logType": "transaction_created",
        "severity": "low",
        "message": "Transaction created: TXN-1698765432-1234 for amount R15000.00",
        "oldValues": null,
        "newValues": {
          "amount": 15000.00,
          "purpose": "Office equipment purchase",
          "taxClassification": "TAXABLE_BUSINESS"
        },
        "taxDetails": {
          "classification": "TAXABLE_BUSINESS",
          "confidenceScore": 85
        },
        "createdAt": "2025-10-15T10:30:00.000Z",
        "user": {
          "id": "user-uuid",
          "username": "john.doe",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "total": 5,
    "page": 1,
    "totalPages": 1
  }
}
```

### 3. Update Tax Classification
**Endpoint**: `PUT /api/transactions/:transactionId/tax-classification`
**Purpose**: Manually update transaction tax classification
**Access**: Private (Admin only)

#### Request Body:
```json
{
  "taxClassification": "TAXABLE_PERSONAL",
  "reason": "Reclassified after manual review",
  "adminUserId": "admin-user-uuid"
}
```

#### Response (200 - Success):
```json
{
  "success": true,
  "message": "Tax classification updated successfully",
  "data": {
    "transactionId": "txn-uuid",
    "previousClassification": "TAXABLE_BUSINESS",
    "newClassification": "TAXABLE_PERSONAL",
    "updatedBy": "admin-user-uuid",
    "timestamp": "2025-10-15T11:00:00.000Z"
  }
}
```

### 4. Reclassify Transaction
**Endpoint**: `POST /api/transactions/:transactionId/reclassify`
**Purpose**: Re-run automated tax classification
**Access**: Private

#### Response (200 - Success):
```json
{
  "success": true,
  "message": "Transaction reclassified successfully",
  "data": {
    "transactionId": "txn-uuid",
    "previousClassification": "REVIEW_REQUIRED",
    "newClassification": "TAXABLE_BUSINESS",
    "changed": true,
    "analysis": {
      "confidenceScore": 90,
      "reasoning": [
        "Business keywords found: office, supplies",
        "Receiver appears to be a registered business"
      ],
      "flags": [],
      "taxImplications": {
        "vat_amount": {
          "vat_inclusive_amount": 15000.00,
          "vat_exclusive_amount": 13043.48,
          "vat_amount": 1956.52,
          "vat_rate": 0.15
        }
      }
    }
  }
}
```

### 5. Get Tax Summary
**Endpoint**: `GET /api/transactions/tax-summary/:userId`
**Purpose**: Generate tax summary for a user within date range
**Access**: Private

#### Query Parameters:
- `fromDate` (required): Start date (ISO 8601)
- `toDate` (required): End date (ISO 8601)

#### Response (200 - Success):
```json
{
  "success": true,
  "message": "Tax summary generated successfully",
  "data": {
    "period": {
      "from": "2025-01-01T00:00:00.000Z",
      "to": "2025-10-15T23:59:59.000Z"
    },
    "totalTransactions": 47,
    "taxClassifications": {
      "taxable_business": {
        "count": 15,
        "totalAmount": 125000.00
      },
      "taxable_personal": {
        "count": 20,
        "totalAmount": 85000.00
      },
      "non_taxable": {
        "count": 8,
        "totalAmount": 12000.00
      },
      "exempt": {
        "count": 2,
        "totalAmount": 5000.00
      },
      "review_required": {
        "count": 2,
        "totalAmount": 75000.00
      }
    },
    "estimatedVat": 31500.00,
    "flagsRaised": [
      "LARGE_CASH_TRANSACTION",
      "REVIEW_REQUIRED"
    ]
  }
}
```

### 6. Get Audit Trail
**Endpoint**: `GET /api/transactions/audit-trail`
**Purpose**: Retrieve comprehensive audit trail
**Access**: Private (Admin only)

#### Query Parameters:
- `userId` (optional): Filter by user ID
- `actionType` (optional): Filter by action type
- `fromDate` (optional): Start date
- `toDate` (optional): End date
- `page` (optional): Page number
- `limit` (optional): Items per page

#### Response (200 - Success):
```json
{
  "success": true,
  "message": "Audit trail retrieved successfully",
  "data": {
    "logs": [
      {
        "id": "audit-uuid",
        "actionType": "create",
        "entityType": "transaction",
        "entityId": "txn-uuid",
        "severity": "info",
        "description": "Created transaction TXN-1698765432-1234",
        "oldValues": null,
        "newValues": {
          "reference": "TXN-1698765432-1234",
          "amount": 15000.00
        },
        "createdAt": "2025-10-15T10:30:00.000Z",
        "user": {
          "id": "user-uuid",
          "username": "john.doe"
        }
      }
    ],
    "total": 150,
    "page": 1,
    "totalPages": 15
  }
}
```

### 7. Flag Transaction
**Endpoint**: `PUT /api/transactions/:transactionId/flag`
**Purpose**: Flag a transaction for review
**Access**: Private (Admin only)

#### Request Body:
```json
{
  "reason": "Suspicious amount pattern detected",
  "flags": ["SUSPICIOUS_AMOUNT", "PATTERN_DETECTED"],
  "adminUserId": "admin-user-uuid"
}
```

#### Response (200 - Success):
```json
{
  "success": true,
  "message": "Transaction flagged successfully",
  "data": {
    "transactionId": "txn-uuid",
    "status": "FLAGGED",
    "flags": ["SUSPICIOUS_AMOUNT", "PATTERN_DETECTED"],
    "reason": "Suspicious amount pattern detected",
    "flaggedBy": "admin-user-uuid",
    "flaggedAt": "2025-10-15T12:00:00.000Z"
  }
}
```

---

## 🏷️ Tax Classification Logic

### Business Expense Keywords
```javascript
['office', 'supplies', 'equipment', 'rent', 'utilities', 'fuel', 'travel',
 'meeting', 'conference', 'training', 'software', 'subscription', 'maintenance',
 'advertising', 'marketing', 'professional', 'legal', 'accounting', 'consultation']
```

### Personal Expense Keywords
```javascript
['groceries', 'food', 'restaurant', 'entertainment', 'clothing', 'personal',
 'gift', 'donation', 'medical', 'pharmacy', 'hospital', 'school', 'education']
```

### Exempt Keywords
```javascript
['salary', 'wage', 'pension', 'grant', 'welfare', 'insurance', 'medical aid',
 'educational', 'charity', 'donation to registered npo']
```

### Confidence Scoring
- **Business Keywords Match**: +30 points
- **Personal Keywords Match**: +25 points  
- **Exempt Keywords Match**: +40 points
- **Business Receiver Detected**: +25 points
- **Tax-related Terms**: +20 points

**Classification Thresholds:**
- **≥60 points**: High confidence, automatic classification
- **40-59 points**: Medium confidence, requires review
- **<40 points**: Low confidence, manual review required

---

## 📝 Log Types

### Transaction Log Types
| Type | Description | Severity |
|------|-------------|----------|
| `transaction_created` | New transaction logged | Low |
| `transaction_updated` | Transaction modified | Low-High |
| `status_changed` | Status updated | Medium-Critical |
| `tax_classified` | Tax classification applied | Low-Medium |
| `transaction_flagged` | Flagged for review | High |
| `transaction_reviewed` | Manual review completed | Medium |
| `transaction_completed` | Transaction finalized | Low |
| `transaction_failed` | Transaction failed | Critical |

### Audit Log Actions
| Action | Description |
|--------|-------------|
| `create` | Entity created |
| `read` | Entity accessed |
| `update` | Entity modified |
| `delete` | Entity deleted |
| `login` | User login |
| `logout` | User logout |
| `admin_action` | Administrative action |

---

## 🔒 Security & Compliance

### Data Protection
- **IP Address Logging**: All transactions logged with IP
- **Session Tracking**: Complete session audit trail  
- **User Agent Logging**: Device/browser identification
- **Request ID Tracking**: Complete request tracing

### SARS Compliance
- **Cash Transaction Reporting**: Automatic flagging >R24,999
- **VAT Calculations**: Compliant with SA VAT regulations
- **Audit Trail**: Complete transaction history for tax authorities
- **Business Classification**: Proper business expense categorization

### Risk Management
- **Suspicious Amount Detection**: Automatic flagging >R500,000
- **Pattern Recognition**: Unusual transaction patterns
- **Manual Review Queue**: Flagged transactions for human review
- **Multi-level Approval**: Admin oversight for sensitive operations

---

## 📊 Database Schema

### TransactionLog Table
```sql
CREATE TABLE transaction_logs (
  id UUID PRIMARY KEY,
  transaction_id UUID NOT NULL,
  user_id UUID NOT NULL,
  log_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  tax_details JSONB,
  system_metadata JSONB,
  admin_user_id UUID,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### AuditLog Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  request_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Integration Examples

### Frontend Integration
```javascript
// Create transaction with automatic tax classification
const createTransaction = async (transactionData) => {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Request-ID': generateRequestId()
    },
    body: JSON.stringify(transactionData)
  });
  
  const result = await response.json();
  
  // Handle tax classification results
  if (result.taxAnalysis.flags.length > 0) {
    showFlagsWarning(result.taxAnalysis.flags);
  }
  
  return result;
};

// Get transaction audit trail
const getTransactionLogs = async (transactionId) => {
  const response = await fetch(`/api/transactions/${transactionId}/logs`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

### Admin Dashboard Integration
```javascript
// Flag transaction for review
const flagTransaction = async (transactionId, reason, flags) => {
  const response = await fetch(`/api/transactions/${transactionId}/flag`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      reason,
      flags,
      adminUserId: getCurrentAdminId()
    })
  });
  
  return await response.json();
};

// Get audit trail for dashboard
const getAuditTrail = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/transactions/audit-trail?${params}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  return await response.json();
};
```

---

## 📈 Performance Considerations

### Database Indexing
- **Transaction ID**: Primary lookup index
- **User ID**: User-based queries
- **Created At**: Time-range queries  
- **Log Type**: Filtering by action type
- **Severity**: Priority-based filtering

### Caching Strategy
- **Tax Classification Rules**: Cache business logic
- **User Session Data**: Cache active sessions
- **Audit Trail Pagination**: Cache recent pages

### Monitoring
- **Log Volume**: Monitor daily log creation rates
- **Classification Accuracy**: Track manual override rates
- **Performance Metrics**: API response times
- **Error Rates**: Failed classification attempts

---

This comprehensive transaction logging and tax tagging system provides full auditability, automated compliance assistance, and detailed tracking for all transaction activities in the CASH-DNR system.
