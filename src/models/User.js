import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';

class User extends Model {
  static STATUS = {
    PENDING_DETAILS: 'Pending Details',
    PENDING_DOCUMENTS: 'Pending Documents',
    PENDING_REVIEW: 'Pending Review',
    VERIFIED: 'Verified',
    REJECTED: 'Rejected'
  };

  // Getters for camelCase access
  get firstName() {
    return this.first_name;
  }

  get lastName() {
    return this.last_name;
  }

  // Get full name helper
  get fullName() {
    return `${this.first_name} ${this.last_name}`;
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  id_number: {
    type: DataTypes.STRING(13),
    allowNull: true, // Make optional for now
    unique: true,
    validate: {
      len: [13, 13],
      isNumeric: true
    }
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female'),
    allowNull: true
  },
  tax_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    validate: {
      len: [1, 20]
    }
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [10, 20]
    }
  },
  home_affairs_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  homeAddress: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'home_address', // Map to the actual database column name
    validate: {
      isValidAddress(value) {
        if (!value) return;
        const required = ['streetAddress', 'town', 'city', 'province', 'postalCode'];
        const missing = required.filter(field => !value[field]);
        if (missing.length > 0) {
          throw new Error(`Missing required address fields: ${missing.join(', ')}`);
        }
      }
    }
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async(user) => {
      if (user.password_hash) {
        const salt = await bcrypt.genSalt(12);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    beforeUpdate: async(user) => {
      if (user.changed('password_hash')) {
        const salt = await bcrypt.genSalt(12);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

export default User;
