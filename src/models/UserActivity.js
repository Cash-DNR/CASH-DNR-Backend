import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class UserActivity extends Model {
  static ACTIVITY_TYPES = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    TRANSACTION: 'transaction',
    CASH_NOTE_CREATE: 'cash_note_create',
    CASH_NOTE_TRANSFER: 'cash_note_transfer',
    CHAT_MESSAGE: 'chat_message',
    PROFILE_UPDATE: 'profile_update',
    PASSWORD_CHANGE: 'password_change',
    FILE_UPLOAD: 'file_upload',
    SYSTEM_ACTION: 'system_action'
  };
}

UserActivity.init({
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
    values: Object.values(UserActivity.ACTIVITY_TYPES),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional activity data'
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: true,
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  location: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Geographic location data'
  },
  deviceInfo: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'device_info',
    comment: 'Device and browser information'
  }
}, {
  sequelize,
  modelName: 'UserActivity',
  tableName: 'user_activities',
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
      fields: ['created_at']
    }
  ]
});

export default UserActivity;
