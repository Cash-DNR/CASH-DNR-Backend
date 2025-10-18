import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class ChatRoom extends Model {
  static TYPES = {
    DIRECT: 'direct',
    GROUP: 'group',
    SUPPORT: 'support',
    BUSINESS: 'business'
  };
}

ChatRoom.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100],
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.ENUM,
    values: Object.values(ChatRoom.TYPES),
    defaultValue: ChatRoom.TYPES.DIRECT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_private'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional room settings and configuration'
  }
}, {
  sequelize,
  modelName: 'ChatRoom',
  tableName: 'chat_rooms',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['is_active']
    }
  ]
});

export default ChatRoom;
