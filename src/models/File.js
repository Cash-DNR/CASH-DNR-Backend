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
  file_name: {
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
    type: DataTypes.BIGINT,
    allowNull: false
  },
  file_category: {
    type: DataTypes.ENUM('id_documents', 'proof_of_address', 'bank_statements', 'tax_documents', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  upload_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'completed'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
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


