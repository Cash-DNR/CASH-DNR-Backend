/**
 * Audit Logger Middleware
 * Logs all API requests for security and compliance tracking
 */

import AuditLog from '../models/AuditLog.js';
import logger from '../services/logger.js';

/**
 * Audit logger middleware to track API requests
 */
const auditLogger = (options = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Extract user information
    const userId = req.user?.id || null;
    const userRole = req.user?.role || 'anonymous';
    
    // Log request
    const requestLog = {
      entity_type: options.entityType || 'API_REQUEST',
      entity_id: req.params?.id || null,
      action_type: `${req.method}_REQUEST`,
      user_id: userId,
      user_role: userRole,
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.get('User-Agent'),
      request_data: {
        method: req.method,
        path: req.path,
        query: req.query,
        params: req.params,
        body: req.body && req.method !== 'GET' ? req.body : undefined
      },
      metadata: {
        timestamp: new Date().toISOString(),
        endpoint: `${req.method} ${req.path}`,
        ...options.metadata
      }
    };

    try {
      // Create audit log entry
      await AuditLog.create(requestLog);
      
      // Override res.json to capture response
      const originalJson = res.json;
      res.json = function(data) {
        const responseTime = Date.now() - startTime;
        
        // Log response (async, don't block response)
        setImmediate(async () => {
          try {
            await AuditLog.create({
              ...requestLog,
              action_type: `${req.method}_RESPONSE`,
              response_data: {
                statusCode: res.statusCode,
                responseTime: `${responseTime}ms`,
                dataType: Array.isArray(data) ? 'array' : typeof data
              }
            });
          } catch (error) {
            logger.error('Failed to log response audit:', error);
          }
        });
        
        return originalJson.call(this, data);
      };
      
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      // Don't block request on audit failure
    }
    
    next();
  };
};

/**
 * Create audit log for specific actions
 */
const createAuditLog = async (logData) => {
  try {
    return await AuditLog.create(logData);
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    throw error;
  }
};

/**
 * Audit specific entities
 */
const auditEntity = (entityType, actionType, options = {}) => {
  return auditLogger({
    entityType,
    actionType,
    ...options
  });
};

export { auditLogger, createAuditLog, auditEntity };
export default auditLogger;