import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * CashNoteTransfer Model - Tracks ownership transfers of cash notes
 * Essential for Phase 1 audit trail and double-spending prevention
 */
class CashNoteTransfer extends Model {
  // Transfer status enumeration
  static STATUS = {
    PENDING: 'pending',           // Transfer initiated but not confirmed
    COMPLETED: 'completed',       // Transfer successful
    FAILED: 'failed',            // Transfer failed
    CANCELLED: 'cancelled',       // Transfer cancelled by user
    DISPUTED: 'disputed',         // Under dispute resolution
    REVERSED: 'reversed'          // Transfer reversed/rolled back
  };

  // Transfer methods
  static TRANSFER_METHODS = {
    QR_SCAN: 'qr_scan',          // QR code scanning
    BARCODE_SCAN: 'barcode_scan', // Barcode scanning
    MANUAL_ENTRY: 'manual_entry', // Manual reference code entry
    SPEEDPOINT: 'speedpoint',     // POS terminal
    USSD: 'ussd',                // USSD code for proxy transactions
    DIGITAL_CONFIRM: 'digital_confirm' // App-to-app transfer
  };

  // Proxy authorization types
  static PROXY_TYPES = {
    FAMILY_MEMBER: 'family_member',
    GUARDIAN: 'guardian',
    BUSINESS_AGENT: 'business_agent',
    AUTHORIZED_REPRESENTATIVE: 'authorized_representative'
  };

  /**
   * Generate transfer reference
   * Format: TXF-{TIMESTAMP}-{RANDOM}
   */
  static generateTransferReference() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `TXF-${timestamp}-${random}`;
  }

  /**
   * Check if transfer is still pending
   */
  isPending() {
    return this.status === CashNoteTransfer.STATUS.PENDING;
  }

  /**
   * Check if transfer was successful
   */
  isCompleted() {
    return this.status === CashNoteTransfer.STATUS.COMPLETED;
  }

  /**
   * Check if transfer can be reversed
   */
  canBeReversed() {
    return this.status === CashNoteTransfer.STATUS.COMPLETED &&
           this.is_reversible &&
           !this.is_reversed;
  }

  /**
   * Mark transfer as completed
   */
  async complete() {
    this.status = CashNoteTransfer.STATUS.COMPLETED;
    this.completed_at = new Date();
    await this.save();
  }

  /**
   * Mark transfer as failed
   */
  async fail(reason) {
    this.status = CashNoteTransfer.STATUS.FAILED;
    this.failure_reason = reason;
    this.failed_at = new Date();
    await this.save();
  }
}

CashNoteTransfer.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  transfer_reference: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    defaultValue: () => CashNoteTransfer.generateTransferReference()
  },
  cash_note_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'cash_notes',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  from_user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    comment: 'Previous owner'
  },
  to_user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    comment: 'New owner'
  },
  transfer_method: {
    type: DataTypes.ENUM(...Object.values(CashNoteTransfer.TRANSFER_METHODS)),
    allowNull: false,
    comment: 'Method used for the transfer'
  },
  status: {
    type: DataTypes.ENUM(...Object.values(CashNoteTransfer.STATUS)),
    allowNull: false,
    defaultValue: CashNoteTransfer.STATUS.PENDING
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    },
    comment: 'Denomination value of the transferred note'
  },
  // Proxy transaction fields (Phase 1 requirement)
  is_proxy_transaction: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'True if this is a middleman/proxy transaction'
  },
  proxy_type: {
    type: DataTypes.ENUM(...Object.values(CashNoteTransfer.PROXY_TYPES)),
    allowNull: true,
    comment: 'Type of proxy authorization'
  },
  proxy_authorized_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who authorized the proxy transaction'
  },
  proxy_authorization_method: {
    type: DataTypes.ENUM('ussd', 'digital_confirm', 'sms', 'phone_call'),
    allowNull: true,
    comment: 'Method used to authorize proxy transaction'
  },
  proxy_authorization_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Authorization code for proxy transaction'
  },
  proxy_authorization_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When proxy authorization expires'
  },
  // Transaction context
  transaction_context: {
    type: DataTypes.ENUM('p2p', 'business_purchase', 'service_payment', 'family_transfer', 'proxy_spending'),
    allowNull: true,
    comment: 'Context of the transaction'
  },
  business_context: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Business transaction details (merchant info, receipt, etc.)'
  },
  // Security and fraud prevention
  ip_address: {
    type: DataTypes.INET,
    allowNull: true,
    comment: 'IP address of the initiator'
  },
  device_fingerprint: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Device fingerprint for fraud detection'
  },
  location_data: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'GPS coordinates and location info'
  },
  verification_method: {
    type: DataTypes.ENUM('pin', 'biometric', 'otp', 'ussd_code', 'digital_signature'),
    allowNull: true,
    comment: 'Method used to verify the transaction'
  },
  risk_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    },
    comment: 'Fraud risk score (0-1, higher = riskier)'
  },
  // Foreign currency handling (Phase 1 requirement)
  requires_home_affairs_validation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'True if foreign currency requires Home Affairs validation'
  },
  home_affairs_validated: {
    type: DataTypes.BOOLEAN,
    defaultValue: null,
    comment: 'Home Affairs validation result for foreign transfers'
  },
  home_affairs_validation_reference: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Home Affairs validation reference number'
  },
  // Timing and completion
  initiated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When pending transfer expires'
  },
  // Failure and dispute handling
  failure_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for transfer failure'
  },
  dispute_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for dispute if status is disputed'
  },
  disputed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who raised the dispute'
  },
  disputed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Reversal tracking
  is_reversible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this transfer can be reversed'
  },
  is_reversed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this transfer has been reversed'
  },
  reversed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who initiated the reversal'
  },
  reversed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reversal_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for reversal'
  },
  // Additional metadata
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User notes for the transfer'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional transfer metadata'
  },
  // Audit fields
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'CashNoteTransfer',
  tableName: 'cash_note_transfers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['transfer_reference']
    },
    {
      fields: ['cash_note_id']
    },
    {
      fields: ['from_user_id']
    },
    {
      fields: ['to_user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['initiated_at']
    },
    {
      fields: ['is_proxy_transaction', 'proxy_authorized_by']
    },
    {
      fields: ['requires_home_affairs_validation', 'home_affairs_validated']
    },
    {
      fields: ['risk_score']
    }
  ]
});

export default CashNoteTransfer;
