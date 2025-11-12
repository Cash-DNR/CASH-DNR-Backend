# 🛠️ CASH-DNR Scripts

> **For main project documentation, see [../README.md](../README.md)**

## Overview

This directory contains utility scripts, production tools, and debugging helpers organized by purpose and usage context.

---

## 📁 Directory Structure

```
scripts/
├── README.md              # This documentation file
├── production/            # Production environment tools
├── utilities/             # Development and maintenance scripts
└── debug/                 # Debugging and troubleshooting tools
```

---

## 🏭 Production Scripts (`./production/`)

Scripts for production environment management and monitoring:

### Database & Migration
- **`migrate-production.js`** - Run database migrations in production
- **`prod-migrate.js`** - Alternative production migration script
- **`comprehensive-production-diagnostics.js`** - Complete production health check

### Monitoring & Diagnostics
- **`monitor-production.js`** - Production system monitoring
- **`monitor-production-simple.js`** - Simplified production monitoring
- **`monitor-production-recovery.js`** - Recovery monitoring after issues
- **`monitor-after-fix.js`** - Post-fix monitoring validation

### Environment & Health Checks
- **`check-production-env.js`** - Production environment validation
- **`check-production-stats.js`** - Production statistics and metrics
- **`production-diagnostics.js`** - Production system diagnostics

**Usage:**
```bash
# Run production health check
node scripts/production/comprehensive-production-diagnostics.js

# Monitor production system
node scripts/production/monitor-production.js

# Run production migrations
node scripts/production/migrate-production.js
```

---

## 🔧 Utility Scripts (`./utilities/`)

Development and maintenance tools:

### User Management
- **`delete-production-users.js`** - Clean up production test users
- **`delete-christopher.js`** - Remove specific test user (Christopher)
- **`delete-and-register-8203.js`** - Delete and recreate specific test user
- **`register-8203141234089.js`** - Register specific test user
- **`register-full-details.js`** - Register user with complete details

### Database Management
- **`check-prod-db.js`** - Production database connection check
- **`check-prod-tables.js`** - Production table structure validation
- **`check-users-columns.js`** - User table column validation
- **`check-user-table-columns.js`** - User table schema check
- **`check-files-table.js`** - Files table structure check
- **`check-file-type-enum.js`** - File type enumeration validation

### System Utilities
- **`fix-password.js`** - Password hash repair utility
- **`update-phone.js`** - Phone number update script
- **`quick-diagnostic.js`** - Quick system diagnostic check
- **`check-logs.js`** - Log file analysis
- **`check-environment-update.js`** - Environment configuration check

### Registration & Testing
- **`full-registration-flow.js`** - Complete registration testing
- **`register-8203141234089.js`** - Specific test user registration
- **`register-full-details.js`** - Detailed user registration

**Usage:**
```bash
# Clean up test users
node scripts/utilities/delete-production-users.js

# Check database structure
node scripts/utilities/check-prod-tables.js

# Quick system check
node scripts/utilities/quick-diagnostic.js

# Fix password issues
node scripts/utilities/fix-password.js
```

---

## 🐛 Debug Scripts (`./debug/`)

Debugging and troubleshooting tools:

### Route Debugging
- **`debug-route.js`** - Debug API route issues
- **`debug-db-route.js`** - Database route debugging
- **`debug-upload.js`** - File upload debugging

### System Debugging
- **`debug-user.js`** - User-related debugging
- **`debug-env-server.js`** - Environment and server debugging
- **`debug-production-registration.js`** - Production registration debugging

**Usage:**
```bash
# Debug API routes
node scripts/debug/debug-route.js

# Debug file uploads
node scripts/debug/debug-upload.js

# Debug user issues
node scripts/debug/debug-user.js
```

---

## 🚀 Quick Reference

### Common Tasks

| Task | Command |
|------|---------|
| **Check Production Health** | `node scripts/production/comprehensive-production-diagnostics.js` |
| **Monitor Production** | `node scripts/production/monitor-production.js` |
| **Clean Test Users** | `node scripts/utilities/delete-production-users.js` |
| **Check Database** | `node scripts/utilities/check-prod-db.js` |
| **Debug Routes** | `node scripts/debug/debug-route.js` |
| **Fix Passwords** | `node scripts/utilities/fix-password.js` |

### Script Categories

| Category | Purpose | When to Use |
|----------|---------|-------------|
| **Production** | Live environment management | Deployment, monitoring, migrations |
| **Utilities** | Development & maintenance | Testing, cleanup, diagnostics |
| **Debug** | Troubleshooting | When things break, investigation |

---

## ⚠️ Important Notes

### Production Scripts
- **Always backup** before running production scripts
- **Test in staging** environment first when possible
- **Monitor logs** during and after execution
- **Have rollback plan** ready for migrations

### Safety Guidelines
- **Read script contents** before execution
- **Understand impact** of each script
- **Use test environment** for debugging scripts
- **Keep backups** of critical data

---

## 🔍 Script Naming Conventions

- **`check-*`** - Diagnostic and validation scripts
- **`monitor-*`** - System monitoring tools
- **`debug-*`** - Debugging and troubleshooting
- **`delete-*`** - Data cleanup utilities
- **`register-*`** - User registration tools
- **`fix-*`** - Repair and maintenance utilities
- **`migrate-*`** - Database migration tools

---

## 🤝 Contributing

When adding new scripts:
1. **Choose appropriate directory** based on purpose
2. **Follow naming conventions** for clarity
3. **Add documentation** in this README
4. **Include usage examples** and safety notes
5. **Test thoroughly** before committing

---

## 📊 Script Inventory

- **Production Scripts:** 8 files
- **Utility Scripts:** 15+ files  
- **Debug Scripts:** 6 files
- **Total:** 30+ organized scripts

---

*Last Updated: December 2024*