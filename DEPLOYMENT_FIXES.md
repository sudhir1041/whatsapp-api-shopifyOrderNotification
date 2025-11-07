# Deployment Build Fixes

## Issues Fixed:

### 1. JSX Template Variable Syntax Error
**Problem:** Invalid curly brace syntax in JSX for template variables
**Location:** `app/routes/app.email-templates.jsx` lines 226-235
**Fix:** Replaced complex curly brace expressions with simple string literals

**Before:**
```jsx
{'{'}{'{'}{'}'}customerName{'}'}{'}'}}
```

**After:**
```jsx
{'{{customerName}}, {{orderNumber}}, {{totalPrice}}, {{shopName}}'}
```

### 2. Server-only Module Import Error
**Problem:** Client-side code importing server modules
**Location:** `app/routes/webhooks.customers.redact.jsx`
**Fix:** Removed unused `db.server` import

**Before:**
```jsx
import db from "../db.server";
```

**After:**
```jsx
// Removed - not needed for this webhook
```

## Quick Fix Commands:

```bash
# Run the fix script
chmod +x fix-build.sh
./fix-build.sh

# Or manually test build
npm run build
```

## Deployment Steps After Fix:

1. **Test Build Locally:**
   ```bash
   npm run build
   ```

2. **Deploy to Production:**
   ```bash
   cd /home/zaptool/htdocs/zaptool.online
   chmod +x zaptool-deploy.sh
   sudo ./zaptool-deploy.sh
   ```

3. **Manual Steps:**
   ```bash
   # Update environment variables
   nano .env
   
   # Get SSL certificate
   certbot --nginx -d zaptool.online -d www.zaptool.online
   
   # Start application
   sudo -u zaptool pm2 start ecosystem.config.js
   ```

## Verification:

- ✅ Build completes without errors
- ✅ No JSX syntax warnings
- ✅ No server-only import errors
- ✅ Application starts successfully

## Common Build Issues & Solutions:

### Vite CJS Deprecation Warning
```bash
# This is just a warning, not an error
# Update to ESM imports when possible
```

### Template Variable Display
```jsx
// Use string literals for template examples
{'{{variableName}}'}

// Not complex expressions
{'{'}{'{'}{'}'}variableName{'}'}{'}'}}
```

### Server Import Separation
```jsx
// Server-only imports should only be in:
// - loader functions
// - action functions  
// - .server.js files

// Remove from client-side code
```