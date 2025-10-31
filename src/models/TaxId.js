import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class TaxId extends Model {
  static TAX_ID_TYPES = {
    PERSONAL: 'personal',
    BUSINESS: 'business',
    TRUST: 'trust',
    COMPANY: 'company'
  };

  static STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    CANCELLED: 'cancelled'
  };
}

TaxId.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  tax_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 20]
    }
  },
  tax_id_type: {
    type: DataTypes.ENUM(...Object.values(TaxId.TAX_ID_TYPES)),
    allowNull: false,
    defaultValue: TaxId.TAX_ID_TYPES.PERSONAL
  },
  status: {
    type: DataTypes.ENUM(...Object.values(TaxId.STATUS)),
    allowNull: false,
    defaultValue: TaxId.STATUS.ACTIVE
  },
  issued_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  issuing_authority: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'SARS'
  },
  verification_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the tax number has been verified with SARS'
  },
  verification_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the tax number was last verified'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional tax ID metadata'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'TaxId',
  tableName: 'tax_ids',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tax_number']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['tax_id_type']
    }
  ]
});

export default TaxId;
