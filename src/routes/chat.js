import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';
import ChatRoomMember from '../models/ChatRoomMember.js';
import User from '../models/User.js';
import { Op } from 'sequelize';
import logger from '../services/logger.js';
import { broadcastToRoom } from '../services/socketService.js';

const router = express.Router();

// Get all chat rooms for a user
router.get('/rooms', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;

    const rooms = await ChatRoom.findAll({
      include: [
        {
          model: ChatRoomMember,
          as: 'members',
          where: { userId, status: ChatRoomMember.STATUS.ACTIVE },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'first_name', 'last_name']
            }
          ]
        },
        {
          model: ChatMessage,
          as: 'lastMessage',
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'first_name', 'last_name']
            }
          ]
        }
      ],
      order: [['updated_at', 'DESC']]
    });

    res.json({
      success: true,
      data: rooms
    });

  } catch (error) {
    logger.error('Error fetching chat rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat rooms'
    });
  }
});

// Create a new chat room
router.post('/rooms', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;
    const { name, type, description, isPrivate, memberIds } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      });
    }

    // Create room
    const room = await ChatRoom.create({
      name,
      type,
      description,
      isPrivate: isPrivate || false,
      createdBy: userId
    });

    // Add creator as owner
    await ChatRoomMember.create({
      roomId: room.id,
      userId,
      role: ChatRoomMember.ROLES.OWNER,
      status: ChatRoomMember.STATUS.ACTIVE
    });

    // Add other members if specified
    if (memberIds && memberIds.length > 0) {
      const memberPromises = memberIds.map(memberId =>
        ChatRoomMember.create({
          roomId: room.id,
          userId: memberId,
          role: ChatRoomMember.ROLES.MEMBER,
          status: ChatRoomMember.STATUS.ACTIVE
        })
      );

      await Promise.all(memberPromises);
    }

    // Fetch room with members
    const roomWithMembers = await ChatRoom.findByPk(room.id, {
      include: [
        {
          model: ChatRoomMember,
          as: 'members',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'first_name', 'last_name']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: roomWithMembers
    });

  } catch (error) {
    logger.error('Error creating chat room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat room'
    });
  }
});

// Get messages for a chat room
router.get('/rooms/:roomId/messages', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is member of the room
    const membership = await ChatRoomMember.findOne({
      where: {
        userId,
        roomId,
        status: ChatRoomMember.STATUS.ACTIVE
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    const offset = (page - 1) * limit;

    const messages = await ChatMessage.findAndCountAll({
      where: { roomId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: ChatMessage,
          as: 'replyTo',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'first_name', 'last_name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        messages: messages.rows.reverse(), // Reverse to show oldest first
        pagination: {
          current: parseInt(page),
          total: Math.ceil(messages.count / limit),
          count: messages.count,
          hasNext: offset + messages.rows.length < messages.count,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Add member to chat room
router.post('/rooms/:roomId/members', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;
    const { roomId } = req.params;
    const { userIds, role = ChatRoomMember.ROLES.MEMBER } = req.body;

    // Check if requester has permission (admin or owner)
    const requesterMembership = await ChatRoomMember.findOne({
      where: {
        userId,
        roomId,
        role: [ChatRoomMember.ROLES.ADMIN, ChatRoomMember.ROLES.OWNER],
        status: ChatRoomMember.STATUS.ACTIVE
      }
    });

    if (!requesterMembership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add members to this room'
      });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required'
      });
    }

    // Add members
    const memberPromises = userIds.map(async(memberId) => {
      // Check if user is already a member
      const existingMember = await ChatRoomMember.findOne({
        where: { userId: memberId, roomId }
      });

      if (existingMember) {
        // Reactivate if inactive
        if (existingMember.status !== ChatRoomMember.STATUS.ACTIVE) {
          existingMember.status = ChatRoomMember.STATUS.ACTIVE;
          existingMember.joinedAt = new Date();
          await existingMember.save();
          return existingMember;
        }
        return null; // Already active member
      }

      // Create new membership
      return ChatRoomMember.create({
        roomId,
        userId: memberId,
        role,
        status: ChatRoomMember.STATUS.ACTIVE
      });
    });

    const results = await Promise.all(memberPromises);
    const addedMembers = results.filter(result => result !== null);

    // Broadcast member additions
    addedMembers.forEach(member => {
      broadcastToRoom(roomId, 'member_added', {
        roomId,
        member,
        addedBy: userId
      });
    });

    res.json({
      success: true,
      message: `Added ${addedMembers.length} members to room`,
      data: addedMembers
    });

  } catch (error) {
    logger.error('Error adding room members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add members to room'
    });
  }
});

// Get room members
router.get('/rooms/:roomId/members', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;
    const { roomId } = req.params;

    // Verify user is member of the room
    const membership = await ChatRoomMember.findOne({
      where: {
        userId,
        roomId,
        status: ChatRoomMember.STATUS.ACTIVE
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    const members = await ChatRoomMember.findAll({
      where: {
        roomId,
        status: ChatRoomMember.STATUS.ACTIVE
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name']
        }
      ],
      order: [['role', 'ASC'], ['joined_at', 'ASC']]
    });

    res.json({
      success: true,
      data: members
    });

  } catch (error) {
    logger.error('Error fetching room members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room members'
    });
  }
});

// Update message (edit)
router.put('/messages/:messageId', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Find message and verify ownership
    const message = await ChatMessage.findOne({
      where: {
        id: messageId,
        senderId: userId
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you do not have permission to edit it'
      });
    }

    // Update message
    message.content = content;
    message.status = ChatMessage.STATUS.EDITED;
    message.editedAt = new Date();
    await message.save();

    // Get updated message with sender info
    const updatedMessage = await ChatMessage.findByPk(messageId, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });

    // Broadcast message edit
    broadcastToRoom(message.roomId, 'message_edited', {
      messageId,
      content,
      editedAt: message.editedAt,
      message: updatedMessage
    });

    res.json({
      success: true,
      data: updatedMessage
    });

  } catch (error) {
    logger.error('Error editing message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit message'
    });
  }
});

// Delete message
router.delete('/messages/:messageId', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;

    // Find message and verify ownership or admin permissions
    const message = await ChatMessage.findByPk(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user owns the message or is room admin
    let canDelete = message.senderId === userId;

    if (!canDelete) {
      const membership = await ChatRoomMember.findOne({
        where: {
          userId,
          roomId: message.roomId,
          role: [ChatRoomMember.ROLES.ADMIN, ChatRoomMember.ROLES.OWNER],
          status: ChatRoomMember.STATUS.ACTIVE
        }
      });
      canDelete = !!membership;
    }

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this message'
      });
    }

    // Mark message as deleted instead of actually deleting
    message.status = ChatMessage.STATUS.DELETED;
    message.content = '[Message deleted]';
    await message.save();

    // Broadcast message deletion
    broadcastToRoom(message.roomId, 'message_deleted', {
      messageId,
      deletedBy: userId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

// Search messages in a room
router.get('/rooms/:roomId/search', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;
    const { roomId } = req.params;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Verify user is member of the room
    const membership = await ChatRoomMember.findOne({
      where: {
        userId,
        roomId,
        status: ChatRoomMember.STATUS.ACTIVE
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    const offset = (page - 1) * limit;

    const messages = await ChatMessage.findAndCountAll({
      where: {
        roomId,
        content: {
          [Op.iLike]: `%${query}%`
        },
        status: {
          [Op.ne]: ChatMessage.STATUS.DELETED
        }
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        messages: messages.rows,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(messages.count / limit),
          count: messages.count
        }
      }
    });

  } catch (error) {
    logger.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
});

export default router;
