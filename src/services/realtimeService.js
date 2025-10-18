import jwt from 'jsonwebtoken';
import logger from './logger.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import UserActivity from '../models/UserActivity.js';
import CashNote from '../models/CashNote.js';
import Transaction from '../models/Transaction.js';
import { Op } from 'sequelize';

// Store active connections
const activeUsers = new Map();
const userSockets = new Map();

// Real-time notification service
class RealtimeNotificationService {
  static async sendNotification(userId, notification) {
    try {
      // Save notification to database
      const savedNotification = await Notification.create({
        userId,
        ...notification
      });

      // Send to connected user via WebSocket
      const socket = userSockets.get(userId);
      if (socket) {
        socket.emit('notification', {
          id: savedNotification.id,
          type: savedNotification.type,
          title: savedNotification.title,
          message: savedNotification.message,
          priority: savedNotification.priority,
          metadata: savedNotification.metadata,
          actionUrl: savedNotification.actionUrl,
          createdAt: savedNotification.createdAt
        });

        logger.info(`📧 Real-time notification sent to user ${userId}: ${notification.title}`);
      }

      return savedNotification;
    } catch (error) {
      logger.error('Error sending real-time notification:', error);
      throw error;
    }
  }

  static async broadcastSystemNotification(notification) {
    try {
      // Get all active users
      const activeUserIds = Array.from(activeUsers.keys());
      
      // Send to all connected users
      for (const userId of activeUserIds) {
        await this.sendNotification(userId, {
          ...notification,
          type: Notification.TYPES.SYSTEM
        });
      }

      logger.info(`📢 System notification broadcasted to ${activeUserIds.length} users`);
    } catch (error) {
      logger.error('Error broadcasting system notification:', error);
      throw error;
    }
  }

  static async sendBalanceUpdate(userId, balanceData) {
    try {
      const socket = userSockets.get(userId);
      if (socket) {
        socket.emit('balance_update', {
          currentBalance: balanceData.currentBalance,
          previousBalance: balanceData.previousBalance,
          change: balanceData.change,
          changeType: balanceData.changeType, // 'increase' | 'decrease'
          reason: balanceData.reason,
          timestamp: new Date().toISOString(),
          transactionId: balanceData.transactionId
        });

        logger.info(`💰 Balance update sent to user ${userId}: ${balanceData.changeType} of R${balanceData.change}`);
      }

      // Also send notification for significant changes
      if (Math.abs(balanceData.change) >= 100) {
        await this.sendNotification(userId, {
          type: Notification.TYPES.TRANSACTION,
          title: 'Balance Updated',
          message: `Your balance has ${balanceData.changeType}d by R${Math.abs(balanceData.change)}`,
          priority: Math.abs(balanceData.change) >= 1000 ? Notification.PRIORITIES.HIGH : Notification.PRIORITIES.MEDIUM,
          metadata: {
            balanceChange: balanceData.change,
            newBalance: balanceData.currentBalance,
            transactionId: balanceData.transactionId
          }
        });
      }
    } catch (error) {
      logger.error('Error sending balance update:', error);
      throw error;
    }
  }

  static async sendCashNoteUpdate(userId, cashNoteData) {
    try {
      const socket = userSockets.get(userId);
      if (socket) {
        socket.emit('cash_note_update', {
          cashNoteId: cashNoteData.id,
          action: cashNoteData.action, // 'created' | 'transferred' | 'received' | 'updated'
          denomination: cashNoteData.denomination,
          serialNumber: cashNoteData.serialNumber,
          status: cashNoteData.status,
          fromUser: cashNoteData.fromUser,
          toUser: cashNoteData.toUser,
          timestamp: new Date().toISOString(),
          transferId: cashNoteData.transferId
        });

        logger.info(`💵 Cash note update sent to user ${userId}: ${cashNoteData.action} - ${cashNoteData.serialNumber}`);
      }

      // Send notification for transfers
      if (cashNoteData.action === 'transferred' || cashNoteData.action === 'received') {
        const title = cashNoteData.action === 'transferred' ? 'Cash Note Sent' : 'Cash Note Received';
        const message = cashNoteData.action === 'transferred' 
          ? `You sent a R${cashNoteData.denomination} cash note to ${cashNoteData.toUser?.fullName || 'another user'}`
          : `You received a R${cashNoteData.denomination} cash note from ${cashNoteData.fromUser?.fullName || 'another user'}`;

        await this.sendNotification(userId, {
          type: Notification.TYPES.CASH_NOTE,
          title,
          message,
          priority: Notification.PRIORITIES.MEDIUM,
          metadata: {
            cashNoteId: cashNoteData.id,
            denomination: cashNoteData.denomination,
            serialNumber: cashNoteData.serialNumber,
            transferId: cashNoteData.transferId,
            action: cashNoteData.action
          },
          actionUrl: `/cash-notes/${cashNoteData.id}`
        });
      }
    } catch (error) {
      logger.error('Error sending cash note update:', error);
      throw error;
    }
  }

  static async sendActivityUpdate(userId, activity) {
    try {
      const socket = userSockets.get(userId);
      if (socket) {
        socket.emit('activity_update', {
          id: activity.id,
          type: activity.type,
          description: activity.description,
          metadata: activity.metadata,
          timestamp: activity.createdAt || new Date().toISOString()
        });

        logger.info(`📋 Activity update sent to user ${userId}: ${activity.type}`);
      }
    } catch (error) {
      logger.error('Error sending activity update:', error);
      throw error;
    }
  }
}

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    
    if (!token) {
      logger.warn('Socket connection attempted without token');
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      logger.warn(`Socket authentication failed: User ${decoded.userId} not found`);
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user.id;
    socket.user = user;
    
    logger.info(`Socket authenticated for user ${user.email} (${user.id})`);
    next();
    
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

// Initialize Socket.IO handlers
export const initializeSocketHandlers = (io) => {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    const user = socket.user;
    
    logger.info(`🔌 User connected: ${user.email} (${userId})`);

    // Store user connection
    activeUsers.set(userId, {
      userId,
      socketId: socket.id,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: user.fullName
      },
      connectedAt: new Date(),
      lastActivity: new Date()
    });
    
    userSockets.set(userId, socket);

    // Join user-specific room for personal notifications
    socket.join(`user_${userId}`);

    // Log user activity
    await UserActivity.create({
      userId,
      type: UserActivity.ACTIVITY_TYPES.LOGIN,
      description: 'User connected to real-time service',
      ipAddress: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      deviceInfo: {
        socketId: socket.id,
        transport: socket.conn.transport.name
      }
    });

    // Send user's unread notifications count and recent data
    try {
      const unreadCount = await Notification.count({
        where: {
          userId,
          status: Notification.STATUS.UNREAD
        }
      });

      // Send connection confirmation with unread count
      socket.emit('connected', {
        userId,
        unreadNotifications: unreadCount,
        timestamp: new Date()
      });

      // Send recent notifications
      const recentNotifications = await Notification.findAll({
        where: {
          userId,
          status: Notification.STATUS.UNREAD
        },
        order: [['created_at', 'DESC']],
        limit: 20
      });

      if (recentNotifications.length > 0) {
        socket.emit('recent_notifications', recentNotifications);
      }

      // Send recent activity feed
      const recentActivities = await UserActivity.findAll({
        where: { userId },
        order: [['created_at', 'DESC']],
        limit: 10
      });

      if (recentActivities.length > 0) {
        socket.emit('activity_feed', recentActivities);
      }

      logger.info(`User ${userId} connected with ${unreadCount} unread notifications`);
    } catch (error) {
      logger.error('Error sending initial data:', error);
    }

    // Notification event handlers
    socket.on('mark_notification_read', async (data) => {
      try {
        await handleMarkNotificationRead(socket, data);
      } catch (error) {
        logger.error('Error handling mark_notification_read:', error);
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });

    socket.on('mark_all_notifications_read', async () => {
      try {
        await handleMarkAllNotificationsRead(socket);
      } catch (error) {
        logger.error('Error handling mark_all_notifications_read:', error);
        socket.emit('error', { message: 'Failed to mark all notifications as read' });
      }
    });

    socket.on('get_notification_history', async (data) => {
      try {
        await handleGetNotificationHistory(socket, data);
      } catch (error) {
        logger.error('Error handling get_notification_history:', error);
        socket.emit('error', { message: 'Failed to get notification history' });
      }
    });

    socket.on('get_activity_feed', async (data) => {
      try {
        await handleGetActivityFeed(socket, data);
      } catch (error) {
        logger.error('Error handling get_activity_feed:', error);
        socket.emit('error', { message: 'Failed to get activity feed' });
      }
    });

    socket.on('request_balance_update', async () => {
      try {
        await handleRequestBalanceUpdate(socket);
      } catch (error) {
        logger.error('Error handling request_balance_update:', error);
        socket.emit('error', { message: 'Failed to get balance update' });
      }
    });

    // Activity tracking
    socket.on('activity', () => {
      if (activeUsers.has(userId)) {
        activeUsers.get(userId).lastActivity = new Date();
      }
    });

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      logger.info(`🔌 User disconnected: ${user.email} (${userId}). Reason: ${reason}`);

      try {
        await UserActivity.create({
          userId,
          type: UserActivity.ACTIVITY_TYPES.LOGOUT,
          description: `User disconnected from real-time service. Reason: ${reason}`,
          ipAddress: socket.handshake.address,
          metadata: { reason, socketId: socket.id }
        });
      } catch (error) {
        logger.error('Error logging logout activity:', error);
      }

      // Remove user from active connections
      activeUsers.delete(userId);
      userSockets.delete(userId);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });
  });
};

// Event handler functions
const handleMarkNotificationRead = async (socket, data) => {
  const { notificationId } = data;
  const userId = socket.userId;

  try {
    const updated = await Notification.update(
      {
        status: Notification.STATUS.READ,
        readAt: new Date()
      },
      {
        where: {
          id: notificationId,
          userId
        }
      }
    );

    if (updated[0] > 0) {
      socket.emit('notification_read', {
        notificationId,
        timestamp: new Date()
      });

      // Send updated unread count
      const unreadCount = await Notification.count({
        where: {
          userId,
          status: Notification.STATUS.UNREAD
        }
      });

      socket.emit('unread_count_update', { count: unreadCount });
      logger.info(`Notification ${notificationId} marked as read for user ${userId}`);
    }
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    throw error;
  }
};

const handleMarkAllNotificationsRead = async (socket) => {
  const userId = socket.userId;

  try {
    await Notification.update(
      {
        status: Notification.STATUS.READ,
        readAt: new Date()
      },
      {
        where: {
          userId,
          status: Notification.STATUS.UNREAD
        }
      }
    );

    socket.emit('all_notifications_read', {
      timestamp: new Date()
    });

    socket.emit('unread_count_update', { count: 0 });
    logger.info(`All notifications marked as read for user ${userId}`);
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    throw error;
  }
};

const handleGetNotificationHistory = async (socket, data) => {
  const userId = socket.userId;
  const { page = 1, limit = 20, type = null } = data;

  try {
    const where = { userId };
    if (type) {
      where.type = type;
    }

    const notifications = await Notification.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const totalCount = await Notification.count({ where });

    socket.emit('notification_history', {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

    logger.info(`Sent notification history to user ${userId}: ${notifications.length} notifications`);
  } catch (error) {
    logger.error('Error getting notification history:', error);
    throw error;
  }
};

const handleGetActivityFeed = async (socket, data) => {
  const userId = socket.userId;
  const { page = 1, limit = 20, type = null } = data;

  try {
    const where = { userId };
    if (type) {
      where.type = type;
    }

    const activities = await UserActivity.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const totalCount = await UserActivity.count({ where });

    socket.emit('activity_feed_response', {
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

    logger.info(`Sent activity feed to user ${userId}: ${activities.length} activities`);
  } catch (error) {
    logger.error('Error getting activity feed:', error);
    throw error;
  }
};

const handleRequestBalanceUpdate = async (socket) => {
  const userId = socket.userId;

  try {
    // Get user's current cash notes and calculate balance
    const cashNotes = await CashNote.findAll({
      where: {
        currentOwnerId: userId,
        status: 'active'
      }
    });

    const currentBalance = cashNotes.reduce((sum, note) => sum + note.denomination, 0);

    socket.emit('balance_update', {
      currentBalance,
      totalNotes: cashNotes.length,
      notesByDenomination: cashNotes.reduce((acc, note) => {
        acc[note.denomination] = (acc[note.denomination] || 0) + 1;
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    });

    logger.info(`Sent balance update to user ${userId}: R${currentBalance}`);
  } catch (error) {
    logger.error('Error getting balance update:', error);
    throw error;
  }
};

// Export functions for external use
export const sendNotificationToUser = RealtimeNotificationService.sendNotification;
export const sendBalanceUpdate = RealtimeNotificationService.sendBalanceUpdate;
export const sendCashNoteUpdate = RealtimeNotificationService.sendCashNoteUpdate;
export const sendActivityUpdate = RealtimeNotificationService.sendActivityUpdate;
export const broadcastSystemNotification = RealtimeNotificationService.broadcastSystemNotification;

export const getActiveUsers = () => Array.from(activeUsers.values());
export const getUserSocket = (userId) => userSockets.get(userId);
export const isUserOnline = (userId) => activeUsers.has(userId);

export { RealtimeNotificationService };

export default {
  initializeSocketHandlers,
  sendNotificationToUser,
  sendBalanceUpdate,
  sendCashNoteUpdate,
  sendActivityUpdate,
  broadcastSystemNotification,
  getActiveUsers,
  getUserSocket,
  isUserOnline,
  RealtimeNotificationService
};
