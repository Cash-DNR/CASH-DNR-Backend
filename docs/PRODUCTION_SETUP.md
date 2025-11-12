# 🌐 Production Database Setup Guide

## Current Issue
The production database hostname `dpg-d2hhdpruibrs73fb18g0-a` cannot be resolved.
This indicates the database instance may no longer be available.

## 🔧 Solution Options

### Option 1: Create New Render.com PostgreSQL Database
1. Go to https://render.com/
2. Create a new PostgreSQL database
3. Get the new connection details
4. Update `.env` file with new credentials

### Option 2: Use Railway.app PostgreSQL (Recommended)
1. Go to https://railway.app/
2. Create new project
3. Add PostgreSQL service
4. Copy connection details
5. Update `.env` file

### Option 3: Use Supabase PostgreSQL (Free tier available)
1. Go to https://supabase.com/
2. Create new project
3. Go to Settings > Database
4. Copy connection string
5. Update `.env` file

### Option 4: Use Local Production Setup (Testing)
1. Set up local PostgreSQL as production
2. Update `.env` with local production credentials
3. Run migrations locally

## 🔄 After Getting New Database Credentials

1. Update `.env` file:
```env
# Production Database Configuration (New Database)
PROD_DB_HOST=your-new-hostname
PROD_DB_PORT=5432
PROD_DB_NAME=your-new-db-name
PROD_DB_USER=your-new-username
PROD_DB_PASSWORD=your-new-password
PROD_DATABASE_URL=postgresql://username:password@hostname:5432/database
```

2. Test connection:
```bash
$env:NODE_ENV="production"; node -e "import('./src/config/database.js').then(db => db.testConnection())"
```

3. Run migration:
```bash
node prod-migrate.js
```

## 🚀 Quick Setup with Railway (Recommended)
Railway offers reliable PostgreSQL with good free tier:

1. **Sign up**: https://railway.app/
2. **New Project**: Click "New Project"
3. **Add PostgreSQL**: Select "Provision PostgreSQL"
4. **Get Credentials**: Click on PostgreSQL service → Connect tab
5. **Copy URL**: Copy the DATABASE_URL

The URL will look like:
`postgresql://postgres:password@hostname.railway.app:5432/railway`

## 🛠️ Need Help?
Let me know which option you prefer and I can help you:
1. Set up the new database connection
2. Update the configuration files
3. Run the production migration
4. Test the production API

The CASH-DNR system is ready to deploy - we just need a working production database!
