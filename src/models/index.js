import { sequelize } from '../config/database.js';
import User from './User.js';
import Business from './Business.js';
import Transaction from './Transaction.js';
import TransactionLog from './TransactionLog.js';
import AuditLog from './AuditLog.js';
import TaxId from './TaxId.js';
import File from './File.js';
import CashNote from './CashNote.js';
import CashNoteTransfer from './CashNoteTransfer.js';

// Define associations
User.hasMany(Transaction, { foreignKey: 'user_id' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

// Transaction Log associations
User.hasMany(TransactionLog, { foreignKey: 'user_id' });
TransactionLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(TransactionLog, { foreignKey: 'admin_user_id' });
TransactionLog.belongsTo(User, { foreignKey: 'admin_user_id', as: 'admin_user' });

Transaction.hasMany(TransactionLog, { foreignKey: 'transaction_id' });
TransactionLog.belongsTo(Transaction, { foreignKey: 'transaction_id' });

// Audit Log associations
User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Business associations
User.hasMany(Business, { foreignKey: 'owner_user_id' });
Business.belongsTo(User, { foreignKey: 'owner_user_id' });

// TaxId associations
User.hasMany(TaxId, { foreignKey: 'user_id' });
TaxId.belongsTo(User, { foreignKey: 'user_id' });

// File associations
User.hasMany(File, { foreignKey: 'user_id' });
File.belongsTo(User, { foreignKey: 'user_id' });

// Cash Note associations (Phase 1 - Core functionality)
User.hasMany(CashNote, { foreignKey: 'current_owner_id', as: 'ownedCashNotes' });
CashNote.belongsTo(User, { foreignKey: 'current_owner_id', as: 'currentOwner' });

User.hasMany(CashNote, { foreignKey: 'original_owner_id', as: 'originalCashNotes' });
CashNote.belongsTo(User, { foreignKey: 'original_owner_id', as: 'originalOwner' });

User.hasMany(CashNote, { foreignKey: 'locked_by', as: 'lockedCashNotes' });
CashNote.belongsTo(User, { foreignKey: 'locked_by', as: 'lockedBy' });

User.hasMany(CashNote, { foreignKey: 'flagged_by', as: 'flaggedCashNotes' });
CashNote.belongsTo(User, { foreignKey: 'flagged_by', as: 'flaggedBy' });

// Cash Note Transfer associations (Phase 1 - Ownership tracking)
CashNote.hasMany(CashNoteTransfer, { foreignKey: 'cash_note_id', as: 'transfers' });
CashNoteTransfer.belongsTo(CashNote, { foreignKey: 'cash_note_id', as: 'cashNote' });

User.hasMany(CashNoteTransfer, { foreignKey: 'from_user_id', as: 'sentTransfers' });
CashNoteTransfer.belongsTo(User, { foreignKey: 'from_user_id', as: 'fromUser' });

User.hasMany(CashNoteTransfer, { foreignKey: 'to_user_id', as: 'receivedTransfers' });
CashNoteTransfer.belongsTo(User, { foreignKey: 'to_user_id', as: 'toUser' });

User.hasMany(CashNoteTransfer, { foreignKey: 'proxy_authorized_by', as: 'authorizedProxyTransfers' });
CashNoteTransfer.belongsTo(User, { foreignKey: 'proxy_authorized_by', as: 'proxyAuthorizer' });

User.hasMany(CashNoteTransfer, { foreignKey: 'disputed_by', as: 'disputedTransfers' });
CashNoteTransfer.belongsTo(User, { foreignKey: 'disputed_by', as: 'disputeInitiator' });

User.hasMany(CashNoteTransfer, { foreignKey: 'reversed_by', as: 'reversedTransfers' });
CashNoteTransfer.belongsTo(User, { foreignKey: 'reversed_by', as: 'reversalInitiator' });

// Export models and sequelize instance
export {
  sequelize,
  User,
  Business,
  Transaction,
  TransactionLog,
  AuditLog,
  TaxId,
  File,
  CashNote,
  CashNoteTransfer
};

export default {
  sequelize,
  User,
  Business,
  Transaction,
  TransactionLog,
  AuditLog,
  TaxId,
  File
};
