/* eslint-disable linebreak-style */
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class File extends Model {}

File.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  stored_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(1024),
    allowNull: false
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_type: {
    type: DataTypes.ENUM('id_document', 'proof_of_address', 'bank_statement', 'tax_document', 'business_document', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  business_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'File',
  tableName: 'files',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default File;


