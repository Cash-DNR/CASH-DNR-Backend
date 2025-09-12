import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Business extends Model {
  static STATUS = {
    ACTIVE: 'Active',
    PENDING: 'Pending',
    SUSPENDED: 'Suspended',
    INACTIVE: 'Inactive'
  };
}

Business.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  business_reg_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  representative_id_number: {
    type: DataTypes.STRING(13),
    allowNull: false,
    validate: {
      len: [13, 13],
      isNumeric: true
    }
  },
  registered_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  trading_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  tax_id: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      is: /^\+27\s\d{2}\s\d{3}\s\d{4}$/
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
  status: {
    type: DataTypes.ENUM,
    values: Object.values(Business.STATUS),
    defaultValue: Business.STATUS.PENDING
  },
  verification_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  address: {
    type: DataTypes.JSONB,
    allowNull: true,
    validate: {
      isValidAddress(value) {
        if (!value) return;
        const required = ['streetAddress', 'city', 'province', 'postalCode'];
        const missing = required.filter(field => !value[field]);
        if (missing.length > 0) {
          throw new Error(`Missing required address fields: ${missing.join(', ')}`);
        }
      }
    }
  }
}, {
  sequelize,
  modelName: 'Business',
  tableName: 'businesses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Business;
