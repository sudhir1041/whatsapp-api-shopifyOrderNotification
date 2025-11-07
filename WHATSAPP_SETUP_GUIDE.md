# WhatsApp Notifications App - Setup & Deployment Guide

## Overview
This Shopify app sends WhatsApp notifications to customers when orders are created or fulfilled using WhatsApp Business API.

## Features
- Order creation notifications with customer name, order ID, product names, and price
- Order fulfillment notifications with customer name, order ID, tracking ID, and tracking URL
- Support for WhatsApp templates with or without buttons
- Test notification functionality
- Dashboard to monitor configuration status

## Prerequisites

### 1. WhatsApp Business API Setup
1. Create a **Meta Business Account** at [business.facebook.com](https://business.facebook.com)
2. Set up **WhatsApp Business API** through Meta Business
3. Get your **Phone Number ID** from WhatsApp Business API settings
4. Generate a **Permanent Access Token** (not temporary)
5. Get the **Facebook Graph API URL**: `https://graph.facebook.com/v18.0/`

### 2. WhatsApp Message Templates
Create approved message templates in Meta Business Manager:

#### Order Created Template Example:
```
Hello {{1}}, your order {{2}} for {{3}} worth {{4}} has been confirmed!
```
- With button: Add a URL button with dynamic parameter `{{1}}` (order ID)

#### Order Fulfillment Template Example:
```
Hi {{1}}, your order {{2}} has been shipped! Track: {{3}} - {{4}}
```

## Installation & Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd test-app
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=write_products,read_orders,write_orders,read_customers
```

### 3. Database Setup
```bash
npx prisma db push
npx prisma generate
```

### 4. Start Development
```bash
npm run dev
```

## App Configuration

### 1. WhatsApp Settings Page
Navigate to **WhatsApp Settings** in your app and configure:

- **Facebook Message URL**: `https://graph.facebook.com/v18.0/`
- **Phone ID**: Your WhatsApp Business Phone Number ID
- **Access Token**: Your permanent WhatsApp Business API token
- **Order Template Name**: Name of your approved order template
- **Fulfillment Template Name**: Name of your approved fulfillment template
- **Template Language**: `en` or your template language code

### 2. Template Variables
The app automatically replaces these variables in your templates:

**Order Created:**
- `{{1}}` = Customer first name
- `{{2}}` = Order ID
- `{{3}}` = Product names (first 3 words each)
- `{{4}}` = Total price

**Order Fulfilled:**
- `{{1}}` = Customer first name
- `{{2}}` = Order ID
- `{{3}}` = Tracking number
- `{{4}}` = Tracking URL

## Testing

### 1. Test Notifications
1. Go to **Test Notifications** page
2. Enter a phone number with country code (e.g., +1234567890)
3. Click **Test Order Created** or **Test Order Fulfilled**
4. Check for success/error messages

### 2. Dashboard
Monitor your app status on the **Dashboard** page:
- Configuration status
- Current settings overview

## Deployment

### 1. Deploy to Shopify
```bash
npm run deploy
```

### 2. Update App URLs
After deployment, update your app URLs in:
- Shopify Partner Dashboard
- `shopify.app.toml` file

### 3. Install in Store
1. Go to your Shopify Partner Dashboard
2. Select your app
3. Click "Select store" and install

## Webhook Configuration

The app automatically configures these webhooks:
- `orders/create` - Triggers order creation notifications
- `orders/fulfilled` - Triggers fulfillment notifications

## Troubleshooting

### Common Issues

1. **"Template not configured" error**
   - Ensure both template names are set in WhatsApp Settings
   - Verify template names match exactly in Meta Business Manager

2. **"WhatsApp API error: Bad Request"**
   - Check if template has buttons and requires button parameters
   - Verify phone number format includes country code
   - Ensure access token is permanent, not temporary

3. **"No phone number found"**
   - Customer must have phone number in billing or shipping address
   - Phone number must be in international format

4. **Webhook not receiving**
   - Run `npm run deploy` to update webhook URLs
   - Check webhook subscriptions in Shopify Partner Dashboard

### Debug Mode
Check console logs for detailed error messages and API payloads.

## Production Considerations

1. **Database**: Consider upgrading from SQLite to PostgreSQL/MySQL for production
2. **Error Handling**: Monitor logs for failed notifications
3. **Rate Limits**: WhatsApp has rate limits - implement queuing for high volume
4. **Phone Validation**: Add phone number validation before sending

## Support

For issues:
1. Check console logs for detailed error messages
2. Verify WhatsApp Business API setup
3. Test with simple templates without buttons first
4. Ensure all required scopes are granted

## File Structure
```
app/
├── routes/
│   ├── app.whatsapp-settings.jsx    # Settings configuration
│   ├── app.dashboard.jsx            # Status dashboard
│   ├── app.test-webhook.jsx         # Test notifications
│   ├── webhooks.orders.create.jsx   # Order creation webhook
│   └── webhooks.orders.fulfilled.jsx # Order fulfillment webhook
├── utils/
│   └── whatsapp.server.js           # WhatsApp API integration
└── db.server.js                     # Database connection
```