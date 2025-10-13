# WhatsApp Analytics App - Setup Guide

## 🎯 Complete Setup Instructions

### Phase 1: Development Environment Setup

#### 1. Prerequisites Installation
```bash
# Install Node.js 18+ from https://nodejs.org
node --version  # Should be 18+

# Install Git
git --version
```

#### 2. Project Setup
```bash
# Clone and setup project
git clone <your-repo-url>
cd test-app

# Install dependencies
npm install

# Setup database
npx prisma db push
npx prisma generate
```

#### 3. Environment Configuration
Create `.env` file:
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=read_orders,write_orders,write_products
HOST=https://your-ngrok-url.ngrok-free.app
```

### Phase 2: Shopify App Configuration

#### 1. Create Shopify App
1. Go to [Shopify Partners](https://partners.shopify.com)
2. Create new app
3. Choose "Custom app"
4. Set app URL to your ngrok tunnel
5. Configure OAuth redirect URLs

#### 2. Install in Development Store
```bash
# Start development server
npm run dev

# Follow CLI instructions to install in test store
```

### Phase 3: WhatsApp Business API Setup

#### 1. Meta Business Manager Setup
1. Go to [Meta Business Manager](https://business.facebook.com)
2. Create business account if needed
3. Add WhatsApp Business Account
4. Get Phone Number ID and Access Token

#### 2. Create WhatsApp Templates

**Cart Abandonment Template**
- Name: `abandoned_cart`
- Category: `MARKETING`
- Language: `en_US`
- Content:
```
Hi {{1}}, you left {{2}} worth {{3}} in your cart at {{4}}. Complete your purchase: {{5}}
```

**Welcome Series Template**
- Name: `welcome_series`
- Category: `MARKETING`
- Language: `en_US`
- Content:
```
Welcome to {{1}}, {{2}}! Use code {{3}} for {{4}} off your first order: {{5}}
```

**Order Confirmation Template**
- Name: `order_confirmation`
- Category: `TRANSACTIONAL`
- Language: `en_US`
- Content:
```
Hi {{1}}, your order #{{2}} for {{3}} has been confirmed. Total: {{4}}
```

**Order Shipped Template**
- Name: `order_shipped`
- Category: `TRANSACTIONAL`
- Language: `en_US`
- Content:
```
Hi {{1}}, your order #{{2}} has shipped! Track it here: {{3}}
```

**Hello World Template**
- Name: `hello_world`
- Category: `UTILITY`
- Language: `en_US`
- Content:
```
Hello World
```

#### 3. Submit Templates for Approval
1. Submit all templates in Meta Business Manager
2. Wait for approval (usually 24-48 hours)
3. Note down approved template names

### Phase 4: App Configuration

#### 1. Configure WhatsApp Settings
1. Open your app in Shopify admin
2. Go to **Settings** page
3. Enter configuration:
   - **WhatsApp Business API Token**: Your Meta access token
   - **Phone Number ID**: From Meta Business Manager
   - **Template Names**: Use approved template names
   - **Template Language**: `en_US` (or your language)
   - **Test Phone Number**: Your phone number for testing
   - **Facebook Business URL**: Your Meta Business Manager URL

#### 2. Test Configuration
1. Click "Send Hello World Test" button
2. Check if message is received on test phone
3. Verify in server logs for any errors

### Phase 5: Cart Abandonment Setup

#### 1. Configure Cart Abandonment
1. Go to **Cart Abandonment** page
2. Set configuration:
   - **Enable cart abandonment reminders**: ✅ Checked
   - **Send first reminder after**: 1 hour (recommended)
   - **Maximum reminders per cart**: 3
   - **Interval between reminders**: 24 hours

#### 2. Create Custom Templates (Optional)
1. In Cart Abandonment page, scroll to "Message Templates"
2. Create templates for different reminder sequences:
   - **1st Reminder**: Gentle reminder
   - **2nd Reminder**: Add urgency
   - **3rd Reminder**: Final offer

### Phase 6: Webhook Configuration

#### 1. Deploy Webhooks
```bash
# Deploy to register webhooks with Shopify
npm run deploy
```

#### 2. Verify Webhook Registration
Check `shopify.app.toml` includes:
```toml
[[webhooks.subscriptions]]
topics = [ "orders/paid" ]
uri = "/webhooks/orders/paid"

[[webhooks.subscriptions]]
topics = [ "orders/fulfilled" ]
uri = "/webhooks/orders/fulfilled"

[[webhooks.subscriptions]]
topics = [ "carts/create" ]
uri = "/webhooks/carts/create"

[[webhooks.subscriptions]]
topics = [ "carts/update" ]
uri = "/webhooks/carts/update"

[[webhooks.subscriptions]]
topics = [ "customers/create" ]
uri = "/webhooks/customers/create"
```

### Phase 7: Testing

#### 1. Test Order Flow
1. Create test order in your development store
2. Check if order confirmation message is sent
3. Mark order as fulfilled
4. Verify fulfillment message is sent

#### 2. Test Cart Abandonment
1. Add items to cart (as customer with phone number)
2. Leave cart without purchasing
3. Wait for configured delay time
4. Check if abandonment message is sent

#### 3. Test Welcome Series
1. Create new customer account with phone number
2. Verify welcome message is sent
3. Check analytics dashboard for execution records

### Phase 8: Analytics Verification

#### 1. Check Analytics Dashboard
1. Go to main app page (Analytics Dashboard)
2. Verify metrics are showing:
   - Total automations
   - Active campaigns
   - Success rates
   - Cart statistics

#### 2. Monitor Execution Records
1. Go to **Active Automations** page
2. Check automation list shows:
   - Order Paid Webhook
   - Order Fulfilled Webhook
   - Welcome Series Webhook
   - Abandoned Cart Webhook

### Phase 9: Production Setup

#### 1. Cron Job Setup
Set up hourly cron job to process abandoned carts:
```bash
# Add to your server's crontab
0 * * * * curl -X POST https://your-app-url.com/api/cron/abandoned-carts
```

#### 2. Monitoring Setup
1. Set up error logging
2. Monitor webhook response times
3. Track message delivery rates
4. Set up alerts for failures

## 🔧 Troubleshooting Setup Issues

### WhatsApp API Issues
**Problem**: "Invalid OAuth access token"
**Solution**: 
- Generate new access token from Meta Business Manager
- Ensure token has WhatsApp permissions
- Check token hasn't expired

### Webhook Issues
**Problem**: Webhooks not firing
**Solution**:
- Run `npm run deploy` to register webhooks
- Check webhook URLs are accessible
- Verify ngrok tunnel is active during development

### Database Issues
**Problem**: Database connection errors
**Solution**:
- Run `npx prisma db push` to sync schema
- Check database file permissions
- Regenerate Prisma client: `npx prisma generate`

### Template Issues
**Problem**: Messages not sending
**Solution**:
- Verify templates are approved in Meta Business Manager
- Check template names match exactly in app settings
- Ensure parameter count matches template definition

## 📞 Getting Help

If you encounter issues during setup:

1. **Check Server Logs**: Look for error messages in console
2. **Test Individual Components**: Use test buttons to isolate issues
3. **Verify Configuration**: Double-check all settings match this guide
4. **Contact Support**: Email zaptoolonline@gmail.com with:
   - Error messages from logs
   - Screenshots of configuration
   - Steps you've completed

## ✅ Setup Checklist

- [ ] Development environment installed
- [ ] Shopify app created and installed
- [ ] Meta Business Manager configured
- [ ] WhatsApp templates created and approved
- [ ] App settings configured
- [ ] Cart abandonment settings configured
- [ ] Webhooks deployed
- [ ] Order flow tested
- [ ] Cart abandonment tested
- [ ] Welcome series tested
- [ ] Analytics dashboard verified
- [ ] Cron job configured (production)

**Congratulations! Your WhatsApp Analytics App is now fully configured and ready to help recover abandoned carts and engage customers.**