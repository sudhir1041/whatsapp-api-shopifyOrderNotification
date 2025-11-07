# WhatsApp Analytics App - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [WhatsApp Templates](#whatsapp-templates)
6. [Webhooks](#webhooks)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Analytics](#analytics)
10. [Troubleshooting](#troubleshooting)
11. [Support](#support)

## 🎯 Project Overview

The WhatsApp Analytics App is a Shopify app built with Remix that provides automated WhatsApp messaging for e-commerce stores. It includes cart abandonment recovery, welcome series, order confirmations, and comprehensive analytics.

### Tech Stack
- **Framework**: Remix
- **Database**: SQLite with Prisma ORM
- **UI**: Shopify Polaris
- **Messaging**: WhatsApp Business API
- **Deployment**: Shopify App Bridge

## ✨ Features

### 🛒 Cart Abandonment Recovery
- Automatic cart tracking via webhooks
- Configurable delay times (30 minutes to 24 hours)
- Multiple reminder sequences (up to 5 reminders)
- Custom message templates with variables
- Smart interval management between reminders

### 👋 Welcome Series
- Automatic welcome messages for new customers
- Customizable templates with discount codes
- Customer onboarding automation

### 📦 Order Management
- Order confirmation messages
- Fulfillment notifications with tracking
- Real-time order status updates

### 📊 Analytics Dashboard
- Real-time performance metrics
- Cart abandonment rates
- Message delivery statistics
- Campaign performance tracking
- Success rate monitoring

### ⚙️ Configuration Management
- WhatsApp Business API integration
- Template management system
- Timing and frequency controls
- Multi-language support

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ 
- Shopify Partner Account
- WhatsApp Business API Account
- Meta Business Manager Access

### Installation Steps

1. **Clone Repository**
```bash
git clone <repository-url>
cd test-app
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
# Configure your environment variables
```

4. **Database Setup**
```bash
npx prisma db push
npx prisma generate
```

5. **Start Development**
```bash
npm run dev
```

## ⚙️ Configuration

### WhatsApp Business API Setup

1. **Access Token Configuration**
   - Navigate to Settings page
   - Enter WhatsApp Business API Token
   - Configure Phone Number ID
   - Set template language (default: en_US)

2. **Template Names**
   - Order Template: `order_confirmation`
   - Fulfillment Template: `order_shipped`
   - Abandoned Cart Template: `abandoned_cart`
   - Welcome Series Template: `welcome_series`
   - Hello World Template: `hello_world`

3. **Contact Information**
   - Test Phone Number (for testing)
   - Facebook Business URL
   - Support Email: zaptoolonline@gmail.com

### Cart Abandonment Configuration

1. **Timing Settings**
   - First reminder delay: 30 minutes - 24 hours
   - Maximum reminders per cart: 1-5 messages
   - Interval between reminders: 6-72 hours

2. **Template Management**
   - Create custom message templates
   - Use variable placeholders
   - Assign to reminder sequences

## 📱 WhatsApp Templates

### Template Parameters

#### Cart Abandonment Template
```
Hi {{1}}, you left {{2}} worth {{3}} in your cart at {{4}}. Complete your purchase: {{5}}
```
- `{{1}}` - Customer Name
- `{{2}}` - Product Names
- `{{3}}` - Cart Total
- `{{4}}` - Store Name
- `{{5}}` - Cart URL

#### Welcome Series Template
```
Welcome to {{1}}, {{2}}! Use code {{3}} for {{4}} off your first order: {{5}}
```
- `{{1}}` - Store Name
- `{{2}}` - Customer Name
- `{{3}}` - Discount Code
- `{{4}}` - Discount Amount
- `{{5}}` - Store URL

#### Order Confirmation Template
```
Hi {{1}}, your order #{{2}} for {{3}} has been confirmed. Total: {{4}}
```
- `{{1}}` - Customer Name
- `{{2}}` - Order Number
- `{{3}}` - Product Names
- `{{4}}` - Order Total

#### Fulfillment Template
```
Hi {{1}}, your order #{{2}} has shipped! Track it here: {{3}}
```
- `{{1}}` - Customer Name
- `{{2}}` - Order Number
- `{{3}}` - Tracking URL

### Meta Business Manager Setup

1. **Create Templates**
   - Go to Meta Business Manager
   - Navigate to WhatsApp Manager
   - Create message templates
   - Submit for approval

2. **Template Categories**
   - Cart Abandonment: `MARKETING`
   - Welcome Series: `MARKETING`
   - Order Confirmation: `TRANSACTIONAL`
   - Fulfillment: `TRANSACTIONAL`

## 🔗 Webhooks

### Required Webhooks

Add these to `shopify.app.toml`:

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

### Webhook Handlers

1. **Cart Create/Update** (`/webhooks/carts/*`)
   - Tracks cart data for abandonment
   - Stores customer contact information
   - Monitors cart status changes

2. **Order Paid** (`/webhooks/orders/paid`)
   - Sends order confirmation messages
   - Marks carts as converted
   - Creates execution records

3. **Order Fulfilled** (`/webhooks/orders/fulfilled`)
   - Sends shipping notifications
   - Includes tracking information
   - Updates order status

4. **Customer Create** (`/webhooks/customers/create`)
   - Sends welcome messages
   - Initiates customer onboarding
   - Records new customer events

## 🗄️ Database Schema

### Core Models

#### WhatsAppSettings
```prisma
model WhatsAppSettings {
  id                      String @id @default(cuid())
  shop                    String @unique
  facebookUrl             String?
  phoneId                 String?
  accessToken             String?
  orderTemplateName       String?
  fulfillmentTemplateName String?
  helloWorldTemplateName  String?
  abandonedCartTemplateName String?
  welcomeSeriesTemplateName String?
  templateLanguage        String?
  abandonmentDelayHours   Int? @default(1)
  enableAbandonmentReminders Boolean @default(true)
  maxReminders            Int? @default(3)
  reminderIntervalHours   Int? @default(24)
  testPhoneNumber         String?
  // ... other fields
}
```

#### Cart
```prisma
model Cart {
  id            String @id @default(cuid())
  cartId        String
  shop          String
  customerEmail String?
  customerPhone String?
  lineItems     String // JSON string
  totalPrice    String?
  currency      String?
  status        String @default("active")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([cartId, shop])
}
```

#### Automation
```prisma
model Automation {
  id          String @id @default(cuid())
  shop        String
  name        String
  channel     String // "whatsapp", "email", "sms"
  trigger     String // "order_placed", "cart_abandoned", etc.
  isActive    Boolean @default(true)
  message     String
  executions  AutomationExecution[]
}
```

#### AutomationExecution
```prisma
model AutomationExecution {
  id           String @id @default(cuid())
  automationId String
  customerId   String?
  orderId      String?
  status       String // "sent", "failed", "pending"
  errorMessage String?
  sentAt       DateTime?
  createdAt    DateTime @default(now())
  
  automation   Automation @relation(fields: [automationId], references: [id])
}
```

#### CartAbandonmentTemplate
```prisma
model CartAbandonmentTemplate {
  id             String @id @default(cuid())
  shop           String
  name           String
  message        String
  reminderNumber Int @default(1)
  isActive       Boolean @default(true)
  createdAt      DateTime @default(now())
}
```

## 🔌 API Endpoints

### Internal Endpoints

#### Settings Management
- `GET/POST /app/settings` - WhatsApp configuration
- `GET/POST /app/cart-abandonment` - Cart abandonment settings

#### Analytics
- `GET /app` - Analytics dashboard
- `GET /app/active-automations` - Automation management

#### Cron Jobs
- `POST /api/cron/abandoned-carts` - Process abandoned carts
- `POST /api/test-execution` - Create test execution

### Webhook Endpoints
- `POST /webhooks/orders/paid` - Order confirmation
- `POST /webhooks/orders/fulfilled` - Fulfillment notification
- `POST /webhooks/carts/create` - Cart creation tracking
- `POST /webhooks/carts/update` - Cart update tracking
- `POST /webhooks/customers/create` - Welcome series

## 📊 Analytics

### Dashboard Metrics

1. **Overview Cards**
   - Total Automations
   - Active Campaigns
   - Success Rate
   - Cart Abandonment Rate

2. **Campaign Performance**
   - Individual automation success rates
   - Progress bars with completion percentages
   - Color-coded performance indicators

3. **Cart Analytics**
   - Total carts tracked
   - Abandoned cart count
   - Converted cart count
   - Abandonment rate percentage

4. **Automation Statistics**
   - Abandoned cart recovery messages
   - Welcome series messages
   - Order notification messages
   - Success/failure rates

5. **Real-time Features**
   - Auto-refresh every 30 seconds
   - Manual refresh button
   - Recent activity feed

## 🔧 Troubleshooting

### Common Issues

#### 1. WhatsApp Messages Not Sending
**Symptoms**: Messages fail with authentication errors
**Solutions**:
- Verify access token is valid and not expired
- Check Phone Number ID is correct
- Ensure templates are approved in Meta Business Manager
- Verify phone numbers are in correct format (91XXXXXXXXXX for India)

#### 2. Cart Data Not Appearing
**Symptoms**: No carts shown in abandonment section
**Solutions**:
- Verify cart webhooks are registered: `npm run deploy`
- Check webhook endpoints are responding (200 status)
- Ensure customers are adding items to cart with contact info
- Check database for cart records: `npx prisma studio`

#### 3. Analytics Not Updating
**Symptoms**: Dashboard shows zero or outdated data
**Solutions**:
- Check execution records in database
- Verify webhook handlers are creating execution records
- Use manual refresh button
- Check server logs for errors

#### 4. Template Parameter Errors
**Symptoms**: Messages send with placeholder text
**Solutions**:
- Verify template parameter mapping
- Check Meta template uses correct parameter numbers
- Ensure variable replacement is working in code
- Test with hello_world template first

### Debug Tools

1. **Server Logs**
   - Check console output for webhook processing
   - Look for execution creation logs
   - Monitor API response errors

2. **Database Inspection**
   ```bash
   npx prisma studio
   ```

3. **Test Endpoints**
   - `/api/test-execution` - Create test data
   - Settings page "Send Hello World Test" button

## 📞 Support

### Contact Information
- **Email**: zaptoolonline@gmail.com
- **Website**: https://zaptool.online
- **Documentation**: https://zaptool.online/docs

### Getting Help

1. **Check Logs**: Always check server console for error messages
2. **Test Configuration**: Use test buttons to verify setup
3. **Database Check**: Use Prisma Studio to inspect data
4. **Contact Support**: Email with specific error messages and logs

### Reporting Issues

When reporting issues, include:
- Error messages from server logs
- Steps to reproduce the problem
- Screenshots of configuration
- Database state (if relevant)

## 🚀 Deployment

### Production Deployment

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   # ... other variables
   ```

2. **Database Migration**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Webhook Registration**
   ```bash
   npm run deploy
   ```

4. **Cron Job Setup**
   - Set up hourly cron job to call `/api/cron/abandoned-carts`
   - Monitor execution logs
   - Set up error alerting

### Monitoring

1. **Health Checks**
   - Monitor webhook response times
   - Check database connection
   - Verify WhatsApp API connectivity

2. **Performance Metrics**
   - Message delivery rates
   - Cart abandonment recovery rates
   - Customer engagement metrics

---

## 📝 Changelog

### Version 1.0.0
- Initial release with core functionality
- Cart abandonment recovery
- Welcome series automation
- Order notifications
- Analytics dashboard
- Template management

---

*For technical support, contact: zaptoolonline@gmail.com*