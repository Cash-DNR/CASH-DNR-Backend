import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import { sendNotificationToUser } from '../services/realtimeService.js';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import logger from '../services/logger.js';

const router = express.Router();

// Get all notifications for a user
router.get('/', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;
    const { status, type, page = 1, limit = 50 } = req.query;

    const where = { userId };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Only show non-expired notifications
    where.expiresAt = {
      [Op.or]: [
        { [Op.is]: null },
        { [Op.gt]: new Date() }
      ]
    };

    const offset = (page - 1) * limit;

    const notifications = await Notification.findAndCountAll({
      where,
      order: [
        ['priority', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.rows,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(notifications.count / limit),
          count: notifications.count,
          unreadCount: await Notification.count({
            where: {
              userId,
              status: Notification.STATUS.UNREAD
            }
          })
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Get unread notification count
router.get('/unread-count', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;

    const count = await Notification.count({
      where: {
        userId,
        status: Notification.STATUS.UNREAD,
        expiresAt: {
          [Op.or]: [
            { [Op.is]: null },
            { [Op.gt]: new Date() }
          ]
        }
      }
    });

    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    logger.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const [updatedRows] = await Notification.update(
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

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;

    const [updatedRows] = await Notification.update(
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

    res.json({
      success: true,
      message: `${updatedRows} notifications marked as read`
    });

  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Archive notification
router.put('/:notificationId/archive', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const [updatedRows] = await Notification.update(
      {
        status: Notification.STATUS.ARCHIVED
      },
      {
        where: {
          id: notificationId,
          userId
        }
      }
    );

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification archived'
    });

  } catch (error) {
    logger.error('Error archiving notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive notification'
    });
  }
});

// Delete notification
router.delete('/:notificationId', authenticateToken, async(req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const deletedRows = await Notification.destroy({
      where: {
        id: notificationId,
        userId
      }
    });

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// Send notification to user (admin only)
router.post('/send', authenticateToken, async(req, res) => {
  try {
    // Check if user has admin permissions
    const userRole = req.user.role || 'user';
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const {
      userId,
      type,
      title,
      message,
      priority = Notification.PRIORITIES.MEDIUM,
      actionUrl,
      metadata,
      sendEmail = false,
      sendSms = false,
      expiresAt
    } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, type, title, and message are required'
      });
    }

    const notification = await sendNotificationToUser(userId, {
      type,
      title,
      message,
      priority,
      actionUrl,
      metadata: metadata || {},
      sendEmail,
      sendSms,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: notification
    });

  } catch (error) {
    logger.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

// Broadcast notification to all users (admin only)
router.post('/broadcast', authenticateToken, async(req, res) => {
  try {
    // Check if user has admin permissions
    const userRole = req.user.role || 'user';
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const {
      type,
      title,
      message,
      priority = Notification.PRIORITIES.MEDIUM,
      actionUrl,
      metadata,
      sendEmail = false,
      sendSms = false,
      expiresAt,
      userIds // Optional: specific users to send to
    } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'type, title, and message are required'
      });
    }

    let targetUserIds = userIds;

    // If no specific users, get all active users
    if (!targetUserIds || targetUserIds.length === 0) {
      const User = (await import('../models/User.js')).default;
      const users = await User.findAll({
        where: { isActive: true },
        attributes: ['id']
      });
      targetUserIds = users.map(user => user.id);
    }

    // Send notification to all target users
    const notifications = await Promise.all(
      targetUserIds.map(userId =>
        sendNotificationToUser(userId, {
          type,
          title,
          message,
          priority,
          actionUrl,
          metadata: metadata || {},
          sendEmail,
          sendSms,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `Notification broadcasted to ${notifications.length} users`,
      data: {
        sent: notifications.length,
        notifications: notifications
      }
    });

  } catch (error) {
    logger.error('Error broadcasting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast notification'
    });
  }
});

// Get notification statistics (admin only)
router.get('/stats', authenticateToken, async(req, res) => {
  try {
    // Check if user has admin permissions
    const userRole = req.user.role || 'user';
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const stats = await Promise.all([
      // Total notifications
      Notification.count(),

      // Unread notifications
      Notification.count({ where: { status: Notification.STATUS.UNREAD } }),

      // Notifications by type
      Notification.findAll({
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['type'],
        raw: true
      }),

      // Notifications by priority
      Notification.findAll({
        attributes: [
          'priority',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['priority'],
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        total: stats[0],
        unread: stats[1],
        byType: stats[2],
        byPriority: stats[3]
      }
    });

  } catch (error) {
    logger.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics'
    });
  }
});

export default router;
