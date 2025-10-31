import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * CashNote Model - Digital representation of physical cash notes
 * Core component for Phase 1 foundational operations
 */
class CashNote extends Model {
  // Note status enumeration
  static STATUS = {
    ACTIVE: 'active',           // Available for transactions
    TRANSFERRED: 'transferred', // Ownership transferred
    LOCKED: 'locked',          // Temporarily locked
    STOLEN: 'stolen',          // Flagged as stolen
    FOREIGN: 'foreign',        // Foreign currency note
    DISPUTED: 'disputed',      // Under dispute resolution
    DESTROYED: 'destroyed'     // Note destroyed/invalid
  };

  // Note types
  static NOTE_TYPES = {
    ZAR_10: 'ZAR_10',
    ZAR_20: 'ZAR_20',
    ZAR_50: 'ZAR_50',
    ZAR_100: 'ZAR_100',
    ZAR_200: 'ZAR_200',
    FOREIGN: 'FOREIGN'
  };

  // Transaction types for ownership transfer
  static TRANSFER_TYPES = {
    P2P: 'peer_to_peer',
    BUSINESS: 'business_transaction',
    PROXY: 'proxy_spending',
    CONVERSION: 'digital_conversion',
    MIDDLEMAN: 'middleman_transaction'
  };

  /**
   * Generate unique reference code for cash note
   * Format: CN-{YEAR}{MONTH}{DAY}-{SEQUENCE}-{CHECKSUM}
   */
  static generateReferenceCode() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');

    // Simple checksum calculation
    const base = `${year}${month}${day}${sequence}`;
    const checksum = base.split('').reduce((sum, digit) => sum + parseInt(digit), 0) % 99;

    return `CN-${year}${month}${day}-${sequence}-${checksum.toString().padStart(2, '0')}`;
  }

  /**
   * Validate reference code format
   */
  static validateReferenceCode(referenceCode) {
    const pattern = /^CN-\d{6}-\d{4}-\d{2}$/;
    if (!pattern.test(referenceCode)) {
      return false;
    }

    // Validate checksum
    const parts = referenceCode.split('-');
    const base = parts[1] + parts[2];
    const providedChecksum = parseInt(parts[3]);
    const calculatedChecksum = base.split('').reduce((sum, digit) => sum + parseInt(digit), 0) % 99;

    return providedChecksum === calculatedChecksum;
  }

  /**
   * Check if note can be transferred
   */
  canBeTransferred() {
    return this.status === CashNote.STATUS.ACTIVE && !this.is_locked;
  }

  /**
   * Get current owner information
   */
  async getCurrentOwner() {
    if (!this.current_owner_id) return null;

    const { User } = await import('./User.js');
    return await User.findByPk(this.current_owner_id, {
      attributes: ['id', 'username', 'first_name', 'last_name', 'phone_number']
    });
  }

  /**
   * Flag note as stolen and lock it
   */
  async flagAsStolen(reportedBy, reason) {
    this.status = CashNote.STATUS.STOLEN;
    this.is_locked = true;
    this.flagged_reason = reason;
    this.flagged_by = reportedBy;
    this.flagged_at = new Date();

    await this.save();

    // Log the action (import dynamically to avoid circular dependency)
    const { transactionLoggingService } = await import('../services/transactionLoggingService.js');
    await transactionLoggingService.logCashNoteFlagged(this, reportedBy, reason);
  }
}

CashNote.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reference_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      isValidReference(value) {
        if (!CashNote.validateReferenceCode(value)) {
          throw new Error('Invalid reference code format');
        }
      }
    }
  },
  denomination: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01,
      isValidDenomination(value) {
        const validDenominations = [10, 20, 50, 100, 200];
        if (!validDenominations.includes(parseFloat(value))) {
          throw new Error('Invalid denomination. Must be one of: 10, 20, 50, 100, 200');
        }
      }
    }
  },
  note_type: {
    type: DataTypes.ENUM(...Object.values(CashNote.NOTE_TYPES)),
    allowNull: false,
    defaultValue: CashNote.NOTE_TYPES.ZAR_10
  },
  serial_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Physical note serial number if available'
  },
  status: {
    type: DataTypes.ENUM(...Object.values(CashNote.STATUS)),
    allowNull: false,
    defaultValue: CashNote.STATUS.ACTIVE
  },
  current_owner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  original_owner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'First registered owner'
  },
  issued_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When note was first registered in system'
  },
  last_transferred_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last ownership transfer timestamp'
  },
  transfer_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of times ownership has been transferred'
  },
  is_locked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Prevents transfers when locked'
  },
  locked_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for locking the note'
  },
  locked_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who locked the note'
  },
  locked_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the note was locked'
  },
  is_foreign: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'True for non-ZAR currency notes'
  },
  foreign_currency: {
    type: DataTypes.STRING(3),
    allowNull: true,
    validate: {
      len: [3, 3],
      isAlpha: true,
      isUppercase: true
    },
    comment: 'ISO currency code for foreign notes'
  },
  exchange_rate: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    comment: 'Exchange rate when registered (foreign notes only)'
  },
  flagged_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for flagging (stolen, disputed, etc.)'
  },
  flagged_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who flagged the note'
  },
  flagged_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the note was flagged'
  },
  qr_code_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'QR code content if scanned'
  },
  barcode_data: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Barcode content if scanned'
  },
  scan_method: {
    type: DataTypes.ENUM('qr_code', 'barcode', 'manual_entry', 'speedpoint', 'mobile_camera'),
    allowNull: true,
    comment: 'Method used to register the note'
  },
  verification_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    },
    comment: 'Confidence score for authenticity (0-1)'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional metadata about the note'
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
  modelName: 'CashNote',
  tableName: 'cash_notes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['reference_code']
    },
    {
      fields: ['current_owner_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['serial_number'],
      where: {
        serial_number: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['is_foreign', 'foreign_currency']
    }
  ]
});

export default CashNote;
