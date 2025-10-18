import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Notification extends Model {
  static TYPES = {
    TRANSACTION: 'transaction',
    CASH_NOTE: 'cash_note',
    SYSTEM: 'system',
    CHAT: 'chat',
    SECURITY: 'security',
    REMINDER: 'reminder',
    PROMOTION: 'promotion'
  };

  static PRIORITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  };

  static STATUS = {
    UNREAD: 'unread',
    READ: 'read',
    ARCHIVED: 'archived'
  };
}

Notification.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM,
    values: Object.values(Notification.TYPES),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM,
    values: Object.values(Notification.PRIORITIES),
    defaultValue: Notification.PRIORITIES.MEDIUM,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM,
    values: Object.values(Notification.STATUS),
    defaultValue: Notification.STATUS.UNREAD,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional notification data (transaction ID, URLs, etc.)'
  },
  actionUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'action_url',
    comment: 'URL for notification click action'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at',
    comment: 'When notification should be automatically removed'
  },
  sendEmail: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'send_email'
  },
  sendSms: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'send_sms'
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'delivered_at'
  }
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['expires_at']
    }
  ]
});

export default Notification;
