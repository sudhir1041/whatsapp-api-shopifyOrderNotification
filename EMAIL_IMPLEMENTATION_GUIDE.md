# Email Implementation Guide

## Current Status
The email functionality is currently implemented with a simple mock service to avoid nodemailer import issues in the development environment.

## To Enable Real Email Functionality

### 1. Fix Nodemailer Import Issues
The main issue is ESM/CommonJS compatibility. To resolve:

```javascript
// In vite.config.js, ensure this is added:
ssr: {
  noExternal: ["nodemailer"],
}
```

### 2. Alternative: Use a Different Email Library
Consider using a more ESM-friendly email library:

```bash
npm install @sendgrid/mail
# or
npm install resend
```

### 3. Replace Simple Email Service
Once the import issues are resolved, replace:
- `app/utils/email-simple.server.js` with `app/utils/email.server.js`
- Update imports in:
  - `app/routes/app.email-settings.jsx`
  - `app/routes/api.test-email.jsx`
  - `app/services/abandoned-cart.server.js`
  - `app/routes/webhooks.orders.paid.jsx`

### 4. Current Mock Implementation
The current implementation logs email details to console instead of sending real emails. This allows you to:
- Test the email settings UI
- Verify email templates work
- See what emails would be sent
- Test the complete flow without SMTP issues

### 5. Production Deployment
For production, you'll need to:
1. Resolve the nodemailer import issue
2. Configure real SMTP settings
3. Test email delivery
4. Monitor email sending logs

## Files to Update for Real Email
- `app/utils/email-simple.server.js` → Replace with real implementation
- `app/services/abandoned-cart.server.js` → Uncomment email sections
- `app/routes/webhooks.orders.paid.jsx` → Uncomment email sections