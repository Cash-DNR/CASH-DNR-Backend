import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class ChatRoomMember extends Model {
  static ROLES = {
    MEMBER: 'member',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    OWNER: 'owner'
  };

  static STATUS = {
    ACTIVE: 'active',
    MUTED: 'muted',
    BANNED: 'banned',
    LEFT: 'left'
  };
}

ChatRoomMember.init({
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM,
    values: Object.values(ChatRoomMember.ROLES),
    defaultValue: ChatRoomMember.ROLES.MEMBER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM,
    values: Object.values(ChatRoomMember.STATUS),
    defaultValue: ChatRoomMember.STATUS.ACTIVE,
    allowNull: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'joined_at'
  },
  lastReadAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_read_at'
  },
  notificationSettings: {
    type: DataTypes.JSONB,
    defaultValue: {
      muted: false,
      mentions: true,
      allMessages: true
    },
    field: 'notification_settings'
  }
}, {
  sequelize,
  modelName: 'ChatRoomMember',
  tableName: 'chat_room_members',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['room_id', 'user_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['role']
    },
    {
      fields: ['status']
    }
  ]
});

export default ChatRoomMember;
