// Re-export the new realtime service for backward compatibility
export { 
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
} from './realtimeService.js';

import realtimeService from './realtimeService.js';
export default realtimeService;
