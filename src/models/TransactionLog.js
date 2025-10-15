import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class TransactionLog extends Model {
  static LOG_TYPES = {
    CREATED: 'transaction_created',
    UPDATED: 'transaction_updated',
    STATUS_CHANGED: 'status_changed',
    TAX_CLASSIFIED: 'tax_classified',
    FLAGGED: 'transaction_flagged',
    REVIEWED: 'transaction_reviewed',
    COMPLETED: 'transaction_completed',
    FAILED: 'transaction_failed'
  };

  static SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  };
}

TransactionLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  transaction_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'transactions',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  log_type: {
    type: DataTypes.ENUM,
    values: Object.values(TransactionLog.LOG_TYPES),
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM,
    values: Object.values(TransactionLog.SEVERITY),
    defaultValue: TransactionLog.SEVERITY.LOW
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  old_values: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Previous values before change'
  },
  new_values: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'New values after change'
  },
  tax_details: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Tax classification details and calculations'
  },
  system_metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'System-generated metadata like IP, user agent, etc.'
  },
  admin_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Admin who performed the action (if applicable)'
  },
  ip_address: {
    type: DataTypes.INET,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'TransactionLog',
  tableName: 'transaction_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['transaction_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['log_type']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['severity']
    }
  ]
});

export default TransactionLog;
