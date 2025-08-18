import { sequelize } from '../config/database.js';
import User from './User.js';

// Export models and sequelize instance
export {
  sequelize,
  User
};

export default {
  sequelize,
  User
};
