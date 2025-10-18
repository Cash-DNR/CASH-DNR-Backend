import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class ChatMessage extends Model {
  static TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    SYSTEM: 'system',
    TRANSACTION: 'transaction',
    CASH_NOTE: 'cash_note'
  };

  static STATUS = {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    EDITED: 'edited',
    DELETED: 'deleted'
  };
}

ChatMessage.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  roomId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'room_id',
    references: {
      model: 'chat_rooms',
      key: 'id'
    }
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sender_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM,
    values: Object.values(ChatMessage.TYPES),
    defaultValue: ChatMessage.TYPES.TEXT,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM,
    values: Object.values(ChatMessage.STATUS),
    defaultValue: ChatMessage.STATUS.SENT,
    allowNull: false
  },
  replyToId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reply_to_id',
    references: {
      model: 'chat_messages',
      key: 'id'
    }
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'File attachments metadata'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional message data (transaction details, etc.)'
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'edited_at'
  },
  readBy: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'read_by',
    comment: 'Tracking who read the message and when'
  }
}, {
  sequelize,
  modelName: 'ChatMessage',
  tableName: 'chat_messages',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['room_id']
    },
    {
      fields: ['sender_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    }
  ]
});

export default ChatMessage;
