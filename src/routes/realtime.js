import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import UserActivity from '../models/UserActivity.js';
import CashNote from '../models/CashNote.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { 
  sendNotificationToUser, 
  sendBalanceUpdate, 
  sendCashNoteUpdate,
  sendActivityUpdate,
  broadcastSystemNotification,
  getActiveUsers,
  isUserOnline 
} from '../services/realtimeService.js';
import logger from '../services/logger.js';

const router = express.Router();

// Get user activity feed
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, type } = req.query;

    const where = { userId };
    
    if (type) {
      where.type = type;
    }

    const offset = (page - 1) * limit;

    const activities = await UserActivity.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        activities: activities.rows,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(activities.count / limit),
          count: activities.count
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching activity feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity feed'
    });
  }
});

// Get online users
router.get('/online-users', authenticateToken, async (req, res) => {
  try {
    const activeUsers = getActiveUsers();
    
    res.json({
      success: true,
      data: {
        count: activeUsers.length,
        users: activeUsers.map(user => ({
          userId: user.userId,
          user: user.user,
          connectedAt: user.connectedAt,
          lastActivity: user.lastActivity
        }))
      }
    });

  } catch (error) {
    logger.error('Error fetching online users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch online users'
    });
  }
});

// Check if specific user is online
router.get('/users/:userId/online-status', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const isOnline = isUserOnline(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        isOnline,
        checkedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Error checking user online status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user online status'
    });
  }
});

// Get system activity overview (admin only)
router.get('/system-overview', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin permissions
    const userRole = req.user.role || 'user';
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const stats = await Promise.all([
      // Active users
      getActiveUsers().length,
      
      // Activities in last 24 hours
      UserActivity.count({
        where: {
          createdAt: { [Op.gte]: last24Hours }
        }
      }),
      
      // Activities in last hour
      UserActivity.count({
        where: {
          createdAt: { [Op.gte]: lastHour }
        }
      }),
      
      // Activity by type (last 24 hours)
      UserActivity.findAll({
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: { [Op.gte]: last24Hours }
        },
        group: ['type'],
        raw: true
      }),
      
      // Recent activities
      UserActivity.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'first_name', 'last_name']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        activeUsers: stats[0],
        activitiesLast24h: stats[1],
        activitiesLastHour: stats[2],
        activityByType: stats[3],
        recentActivities: stats[4],
        timestamp: now
      }
    });

  } catch (error) {
    logger.error('Error fetching system overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system overview'
    });
  }
});

// Log custom activity
router.post('/log', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, description, metadata } = req.body;

    if (!type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Type and description are required'
      });
    }

    // Validate activity type
    if (!Object.values(UserActivity.ACTIVITY_TYPES).includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity type'
      });
    }

    const activity = await UserActivity.create({
      userId,
      type,
      description,
      metadata: metadata || {},
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      data: activity
    });

  } catch (error) {
    logger.error('Error logging activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log activity'
    });
  }
});

// Get user connection history
router.get('/connection-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const connections = await UserActivity.findAndCountAll({
      where: {
        userId,
        type: {
          [Op.in]: ['login', 'logout']
        }
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        connections: connections.rows,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(connections.count / limit),
          count: connections.count
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching connection history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connection history'
    });
  }
});

// Send notification to specific user (admin only)
router.post('/notifications/send', authenticateToken, async (req, res) => {
  try {
    const { userId, type, title, message, priority = 'medium', metadata = {} } = req.body;

    // Check if sender is admin (optional - add role check here)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: 'Forbidden' });
    // }

    const notification = await sendNotificationToUser(userId, {
      type,
      title,
      message,
      priority,
      metadata
    });

    res.status(201).json({
      success: true,
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

// Broadcast system notification (admin only)
router.post('/notifications/broadcast', authenticateToken, async (req, res) => {
  try {
    const { title, message, priority = 'medium', metadata = {} } = req.body;

    await broadcastSystemNotification({
      title,
      message,
      priority,
      metadata
    });

    res.json({
      success: true,
      message: 'System notification broadcasted successfully'
    });

  } catch (error) {
    logger.error('Error broadcasting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast notification'
    });
  }
});

// Send balance update to user
router.post('/balance-update', authenticateToken, async (req, res) => {
  try {
    const { userId, balanceData } = req.body;

    // If userId not provided, use current user
    const targetUserId = userId || req.user.userId;

    await sendBalanceUpdate(targetUserId, balanceData);

    res.json({
      success: true,
      message: 'Balance update sent successfully'
    });

  } catch (error) {
    logger.error('Error sending balance update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send balance update'
    });
  }
});

// Send cash note update to user  
router.post('/cash-note-update', authenticateToken, async (req, res) => {
  try {
    const { userId, cashNoteData } = req.body;

    // If userId not provided, use current user
    const targetUserId = userId || req.user.userId;

    await sendCashNoteUpdate(targetUserId, cashNoteData);

    res.json({
      success: true,
      message: 'Cash note update sent successfully'
    });

  } catch (error) {
    logger.error('Error sending cash note update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send cash note update'
    });
  }
});

// Get user's current balance and cash notes
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const cashNotes = await CashNote.findAll({
      where: {
        currentOwnerId: userId,
        status: 'active'
      }
    });

    const currentBalance = cashNotes.reduce((sum, note) => sum + note.denomination, 0);

    const balanceData = {
      currentBalance,
      totalNotes: cashNotes.length,
      notesByDenomination: cashNotes.reduce((acc, note) => {
        acc[note.denomination] = (acc[note.denomination] || 0) + 1;
        return acc;
      }, {}),
      notes: cashNotes.map(note => ({
        id: note.id,
        serialNumber: note.serialNumber,
        denomination: note.denomination,
        status: note.status,
        createdAt: note.createdAt
      }))
    };

    res.json({
      success: true,
      data: balanceData
    });

  } catch (error) {
    logger.error('Error getting balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance'
    });
  }
});

// Get user's recent transactions
router.get('/transactions/recent', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10 } = req.query;

    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'fromUser',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'toUser', 
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: transactions
    });

  } catch (error) {
    logger.error('Error getting recent transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent transactions'
    });
  }
});

export default router;
