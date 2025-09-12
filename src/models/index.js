import { sequelize } from '../config/database.js';
import User from './User.js';
import Business from './Business.js';
import Transaction from './Transaction.js';

// Define associations
User.hasMany(Transaction, { foreignKey: 'user_id' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

// Export models and sequelize instance
export {
  sequelize,
  User,
  Business,
  Transaction
};

export default {
  sequelize,
  User,
  Business,
  Transaction
};
