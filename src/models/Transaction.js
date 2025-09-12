import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Transaction extends Model {
  static TYPES = {
    MANUAL: 'manual',
    DIGITAL: 'digital',
    ATM: 'atm'
  };

  static STATUS = {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    FLAGGED: 'Flagged',
    UNDER_REVIEW: 'Under Review'
  };

  static TAX_CLASSIFICATION = {
    TAXABLE_PERSONAL: 'Taxable-Personal',
    TAXABLE_BUSINESS: 'Taxable-Business',
    NON_TAXABLE: 'Non-Taxable',
    REVIEW_REQUIRED: 'Review-Required',
    EXEMPT: 'Exempt'
  };
}

Transaction.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reference: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  purpose: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  transaction_type: {
    type: DataTypes.ENUM,
    values: Object.values(Transaction.TYPES),
    allowNull: false
  },
  cash_note_serial: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  digital_reference: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  receiver_info: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      hasRequiredFields(value) {
        if (!value.name || !value.taxId) {
          throw new Error('Receiver info must include name and taxId');
        }
      }
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  tax_classification: {
    type: DataTypes.ENUM,
    values: Object.values(Transaction.TAX_CLASSIFICATION),
    defaultValue: Transaction.TAX_CLASSIFICATION.REVIEW_REQUIRED
  },
  status: {
    type: DataTypes.ENUM,
    values: Object.values(Transaction.STATUS),
    defaultValue: Transaction.STATUS.PENDING
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Transaction',
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Transaction;
