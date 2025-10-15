import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class AuditLog extends Model {
  static ACTION_TYPES = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    EXPORT: 'export',
    IMPORT: 'import',
    ADMIN_ACTION: 'admin_action',
    // Phase 1 specific actions
    REGISTER: 'register',
    SCAN: 'scan',
    TRANSFER: 'transfer',
    FLAG_STOLEN: 'flag_stolen',
    PROXY_AUTHORIZE: 'proxy_authorize',
    HOME_AFFAIRS_VERIFY: 'home_affairs_verify',
    TAX_NUMBER_GENERATE: 'tax_number_generate'
  };

  static ENTITIES = {
    USER: 'user',
    TRANSACTION: 'transaction',
    BUSINESS: 'business',
    TAX_ID: 'tax_id',
    FILE: 'file',
    SYSTEM: 'system',
    // Phase 1 entities
    CASH_NOTE: 'cash_note',
    CASH_NOTE_TRANSFER: 'cash_note_transfer',
    TAX_NUMBER: 'tax_number',
    HOME_AFFAIRS_VERIFICATION: 'home_affairs_verification'
  };

  static SEVERITY = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
  };
}

AuditLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action_type: {
    type: DataTypes.ENUM,
    values: Object.values(AuditLog.ACTION_TYPES),
    allowNull: false
  },
  entity_type: {
    type: DataTypes.ENUM,
    values: Object.values(AuditLog.ENTITIES),
    allowNull: false
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the affected entity'
  },
  severity: {
    type: DataTypes.ENUM,
    values: Object.values(AuditLog.SEVERITY),
    defaultValue: AuditLog.SEVERITY.INFO
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  old_values: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  new_values: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
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
  },
  request_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Unique request identifier for tracing'
  }
}, {
  sequelize,
  modelName: 'AuditLog',
  tableName: 'audit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Audit logs should not be updatable
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['action_type']
    },
    {
      fields: ['entity_type', 'entity_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['request_id']
    }
  ]
});

export default AuditLog;