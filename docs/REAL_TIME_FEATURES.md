# 🚀 Real-time Features Documentation

## Overview
The CASH-DNR backend now includes comprehensive real-time features for notifications, balance updates, cash note transfers, and activity feeds using Socket.IO WebSockets.

## 🔥 Features Included

### 📧 Real-time Notifications
- **Push Notifications**: Instant delivery to connected users
- **Notification Types**: Transaction, Cash Note, System, Security alerts
- **Priority Levels**: Low, Medium, High, Urgent
- **Read/Unread Tracking**: Mark individual or all notifications as read
- **History & Pagination**: Retrieve notification history with filtering

### 💰 Live Balance Updates
- **Real-time Balance Changes**: Instant updates when cash notes are transferred
- **Transaction Alerts**: Notifications for significant balance changes (≥R100)
- **Cash Note Tracking**: Live updates on cash note status changes
- **Balance Breakdown**: Notes by denomination, total count, current balance

### 🔄 Activity Feed
- **Live Activity Stream**: Real-time user activity updates
- **Activity Types**: Login, logout, transactions, cash note operations, file uploads
- **Metadata Tracking**: Detailed activity information and context
- **Pagination Support**: Retrieve activity history with filtering

### 📊 Real-time Updates
- **Cash Note Transfers**: Live updates on send/receive operations
- **Status Changes**: Real-time status updates for cash notes and transactions
- **System Notifications**: Broadcast messages to all connected users
- **Connection Tracking**: Online/offline status and active user monitoring

---

## 🔌 WebSocket Connection

### Client Connection Setup

```javascript
import io from 'socket.io-client';

// Initialize Socket.IO client
const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('cashDnrToken') // JWT token
  },
  transports: ['websocket', 'polling']
});

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Connected to CASH-DNR real-time service');
});

socket.on('connected', (data) => {
  console.log('📡 Connection confirmed:', data);
  // data: { userId, unreadNotifications, timestamp }
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('error', (error) => {
  console.error('🚨 Socket error:', error);
});
```

---

## 📧 Notification System

### Receiving Real-time Notifications

```javascript
// Listen for new notifications
socket.on('notification', (notification) => {
  console.log('🔔 New notification:', notification);
  
  // notification object:
  // {
  //   id: "uuid",
  //   type: "transaction" | "cash_note" | "system" | "security",
  //   title: "Notification Title",
  //   message: "Notification message",
  //   priority: "low" | "medium" | "high" | "urgent",
  //   metadata: { /* additional data */ },
  //   actionUrl: "/path/to/action",
  //   createdAt: "2025-10-18T12:00:00.000Z"
  // }
  
  // Show notification in UI
  showNotificationToast(notification);
});

// Listen for recent notifications on connection
socket.on('recent_notifications', (notifications) => {
  console.log('📨 Recent notifications:', notifications);
  updateNotificationsList(notifications);
});

// Listen for unread count updates
socket.on('unread_count_update', (data) => {
  console.log('📊 Unread count:', data.count);
  updateNotificationBadge(data.count);
});
```

### Managing Notifications

```javascript
// Mark notification as read
function markNotificationRead(notificationId) {
  socket.emit('mark_notification_read', { notificationId });
}

// Mark all notifications as read
function markAllNotificationsRead() {
  socket.emit('mark_all_notifications_read');
}

// Get notification history
function getNotificationHistory(page = 1, limit = 20, type = null) {
  socket.emit('get_notification_history', { page, limit, type });
}

// Listen for responses
socket.on('notification_read', (data) => {
  console.log('✅ Notification marked as read:', data.notificationId);
});

socket.on('all_notifications_read', (data) => {
  console.log('✅ All notifications marked as read');
  updateNotificationBadge(0);
});

socket.on('notification_history', (data) => {
  console.log('📜 Notification history:', data);
  // data: { notifications, pagination: { page, limit, total, pages } }
});
```

---

## 💰 Balance & Cash Note Updates

### Real-time Balance Updates

```javascript
// Listen for balance updates
socket.on('balance_update', (balanceData) => {
  console.log('💰 Balance updated:', balanceData);
  
  // balanceData object:
  // {
  //   currentBalance: 1500,
  //   previousBalance: 1200,
  //   change: 300,
  //   changeType: "increase" | "decrease",
  //   reason: "Cash note received",
  //   timestamp: "2025-10-18T12:00:00.000Z",
  //   transactionId: "uuid"
  // }
  
  // Update balance display
  updateBalanceDisplay(balanceData.currentBalance);
  
  // Show balance change animation
  showBalanceChangeAnimation(balanceData.change, balanceData.changeType);
});

// Request current balance
function requestBalanceUpdate() {
  socket.emit('request_balance_update');
}
```

### Cash Note Updates

```javascript
// Listen for cash note updates
socket.on('cash_note_update', (cashNoteData) => {
  console.log('💵 Cash note updated:', cashNoteData);
  
  // cashNoteData object:
  // {
  //   cashNoteId: "uuid",
  //   action: "created" | "transferred" | "received" | "updated",
  //   denomination: 200,
  //   serialNumber: "CN123456789",
  //   status: "active" | "transferred" | "cancelled",
  //   fromUser: { id, fullName },
  //   toUser: { id, fullName },
  //   timestamp: "2025-10-18T12:00:00.000Z",
  //   transferId: "uuid"
  // }
  
  // Update cash notes list
  updateCashNotesList(cashNoteData);
  
  // Show transfer animation
  if (cashNoteData.action === 'transferred' || cashNoteData.action === 'received') {
    showTransferAnimation(cashNoteData);
  }
});
```

---

## 📋 Activity Feed

### Real-time Activity Updates

```javascript
// Listen for activity updates
socket.on('activity_update', (activity) => {
  console.log('📋 New activity:', activity);
  
  // activity object:
  // {
  //   id: "uuid",
  //   type: "login" | "transaction" | "cash_note_transfer" | etc.,
  //   description: "Activity description",
  //   metadata: { /* additional data */ },
  //   timestamp: "2025-10-18T12:00:00.000Z"
  // }
  
  // Add to activity feed
  addToActivityFeed(activity);
});

// Listen for initial activity feed
socket.on('activity_feed', (activities) => {
  console.log('📊 Activity feed:', activities);
  displayActivityFeed(activities);
});

// Get activity feed
function getActivityFeed(page = 1, limit = 20, type = null) {
  socket.emit('get_activity_feed', { page, limit, type });
}

// Listen for activity feed response
socket.on('activity_feed_response', (data) => {
  console.log('📋 Activity feed response:', data);
  // data: { activities, pagination: { page, limit, total, pages } }
});
```

---

## 🛠 REST API Endpoints

### Notification Management

```javascript
// Get notifications (REST API)
async function getNotifications(status = null, type = null, page = 1, limit = 50) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (type) params.append('type', type);
  params.append('page', page);
  params.append('limit', limit);
  
  const response = await fetch(`/api/notifications?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cashDnrToken')}`
    }
  });
  
  return await response.json();
}

// Mark notification as read (REST API)
async function markNotificationReadAPI(notificationId) {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cashDnrToken')}`
    }
  });
  
  return await response.json();
}
```

### Real-time API Endpoints

```javascript
// Send notification to user (admin)
async function sendNotification(userId, notification) {
  const response = await fetch('/api/realtime/notifications/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cashDnrToken')}`
    },
    body: JSON.stringify({ userId, ...notification })
  });
  
  return await response.json();
}

// Broadcast system notification (admin)
async function broadcastSystemNotification(notification) {
  const response = await fetch('/api/realtime/notifications/broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cashDnrToken')}`
    },
    body: JSON.stringify(notification)
  });
  
  return await response.json();
}

// Get current balance
async function getCurrentBalance() {
  const response = await fetch('/api/realtime/balance', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cashDnrToken')}`
    }
  });
  
  return await response.json();
}

// Get recent transactions
async function getRecentTransactions(limit = 10) {
  const response = await fetch(`/api/realtime/transactions/recent?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cashDnrToken')}`
    }
  });
  
  return await response.json();
}

// Get online users
async function getOnlineUsers() {
  const response = await fetch('/api/realtime/online-users', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('cashDnrToken')}`
    }
  });
  
  return await response.json();
}
```

---

## 🎨 Frontend Integration Examples

### React Hook for Real-time Features

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useRealtimeFeatures() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('cashDnrToken');
    if (!token) return;

    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    // Notification events
    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    newSocket.on('unread_count_update', (data) => {
      setUnreadCount(data.count);
    });

    newSocket.on('recent_notifications', (notifications) => {
      setNotifications(notifications);
    });

    // Balance events
    newSocket.on('balance_update', (balanceData) => {
      setBalance(balanceData.currentBalance);
    });

    // Activity events
    newSocket.on('activity_update', (activity) => {
      setActivities(prev => [activity, ...prev.slice(0, 19)]); // Keep latest 20
    });

    newSocket.on('activity_feed', (activities) => {
      setActivities(activities);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const markNotificationRead = (notificationId) => {
    socket?.emit('mark_notification_read', { notificationId });
  };

  const markAllNotificationsRead = () => {
    socket?.emit('mark_all_notifications_read');
  };

  const requestBalanceUpdate = () => {
    socket?.emit('request_balance_update');
  };

  return {
    socket,
    isConnected,
    notifications,
    unreadCount,
    balance,
    activities,
    markNotificationRead,
    markAllNotificationsRead,
    requestBalanceUpdate
  };
}
```

### Vue.js Composition API

```javascript
import { ref, onMounted, onUnmounted } from 'vue';
import io from 'socket.io-client';

export function useRealtimeFeatures() {
  const socket = ref(null);
  const isConnected = ref(false);
  const notifications = ref([]);
  const unreadCount = ref(0);
  const balance = ref(0);
  const activities = ref([]);

  onMounted(() => {
    const token = localStorage.getItem('cashDnrToken');
    if (!token) return;

    socket.value = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Event listeners (same as React example)
    socket.value.on('connect', () => isConnected.value = true);
    socket.value.on('disconnect', () => isConnected.value = false);
    
    socket.value.on('notification', (notification) => {
      notifications.value.unshift(notification);
      unreadCount.value++;
    });

    socket.value.on('balance_update', (balanceData) => {
      balance.value = balanceData.currentBalance;
    });

    // ... other event listeners
  });

  onUnmounted(() => {
    socket.value?.disconnect();
  });

  const markNotificationRead = (notificationId) => {
    socket.value?.emit('mark_notification_read', { notificationId });
  };

  return {
    socket,
    isConnected,
    notifications,
    unreadCount,
    balance,
    activities,
    markNotificationRead
  };
}
```

---

## 📱 Mobile Integration (React Native)

```javascript
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class RealtimeService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  async connect() {
    const token = await AsyncStorage.getItem('cashDnrToken');
    if (!token) throw new Error('No auth token found');

    this.socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('📱 Connected to real-time service');
    });

    this.socket.on('notification', (notification) => {
      // Show push notification
      this.showPushNotification(notification);
    });

    this.socket.on('balance_update', (balanceData) => {
      // Update app badge or send local notification
      this.updateAppBadge(balanceData.currentBalance);
    });
  }

  showPushNotification(notification) {
    // Use react-native-push-notification or similar
    PushNotification.localNotification({
      title: notification.title,
      message: notification.message,
      playSound: true,
      soundName: 'default',
      userInfo: notification
    });
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export default new RealtimeService();
```

---

## 🚀 Getting Started

1. **Install Socket.IO Client**:
   ```bash
   npm install socket.io-client
   ```

2. **Initialize Connection**:
   ```javascript
   import io from 'socket.io-client';
   
   const socket = io('http://localhost:3000', {
     auth: { token: 'your-jwt-token' }
   });
   ```

3. **Listen for Events**:
   ```javascript
   socket.on('notification', handleNotification);
   socket.on('balance_update', handleBalanceUpdate);
   socket.on('cash_note_update', handleCashNoteUpdate);
   ```

4. **Send Events**:
   ```javascript
   socket.emit('mark_notification_read', { notificationId: 'uuid' });
   socket.emit('request_balance_update');
   ```

---

## 🔒 Security Features

- **JWT Authentication**: All WebSocket connections require valid JWT tokens
- **User Isolation**: Users only receive their own notifications and updates
- **Rate Limiting**: Built-in protection against spam and abuse
- **Input Validation**: All incoming data is validated and sanitized
- **Secure Transport**: Support for WSS (WebSocket Secure) in production

---

## 📊 Performance Optimizations

- **Connection Pooling**: Efficient handling of multiple concurrent connections
- **Database Indexes**: Optimized queries for real-time data retrieval
- **Memory Management**: Automatic cleanup of expired notifications
- **Compression**: WebSocket message compression for reduced bandwidth
- **Reconnection Logic**: Automatic reconnection with exponential backoff

---

## 🐛 Error Handling

```javascript
// Socket error handling
socket.on('error', (error) => {
  console.error('Socket error:', error);
  
  if (error.message.includes('Authentication')) {
    // Redirect to login
    window.location.href = '/login';
  }
});

// Connection error handling
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  
  // Show user-friendly error message
  showErrorToast('Connection failed. Please check your internet connection.');
});

// Reconnection handling
socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);
  showSuccessToast('Connection restored!');
});
```

---

## 📝 Event Reference

### Incoming Events (Server → Client)

| Event | Description | Data Structure |
|-------|-------------|----------------|
| `connected` | Connection confirmation | `{ userId, unreadNotifications, timestamp }` |
| `notification` | New notification | `{ id, type, title, message, priority, metadata, actionUrl, createdAt }` |
| `balance_update` | Balance changed | `{ currentBalance, previousBalance, change, changeType, reason, timestamp, transactionId }` |
| `cash_note_update` | Cash note status changed | `{ cashNoteId, action, denomination, serialNumber, status, fromUser, toUser, timestamp, transferId }` |
| `activity_update` | New user activity | `{ id, type, description, metadata, timestamp }` |
| `recent_notifications` | Recent notifications on connect | `Array<Notification>` |
| `activity_feed` | Recent activities on connect | `Array<Activity>` |
| `unread_count_update` | Unread notification count changed | `{ count }` |

### Outgoing Events (Client → Server)

| Event | Description | Data Structure |
|-------|-------------|----------------|
| `mark_notification_read` | Mark notification as read | `{ notificationId }` |
| `mark_all_notifications_read` | Mark all notifications as read | `{}` |
| `get_notification_history` | Get notification history | `{ page?, limit?, type? }` |
| `get_activity_feed` | Get activity feed | `{ page?, limit?, type? }` |
| `request_balance_update` | Request current balance | `{}` |
| `activity` | Update last activity timestamp | `{}` |

---

## 🏁 Conclusion

The CASH-DNR real-time features provide a comprehensive foundation for building responsive, live applications. The system supports:

- ✅ **Real-time notifications** with different types and priorities
- ✅ **Live balance updates** with automatic change tracking  
- ✅ **Cash note transfer updates** with status monitoring
- ✅ **Activity feeds** with comprehensive user action tracking
- ✅ **WebSocket + REST API** hybrid architecture for flexibility
- ✅ **Mobile and web support** with consistent API
- ✅ **Security and performance** optimizations built-in

For questions or support, refer to the main API documentation or contact the development team.

**Happy coding! 🚀**
