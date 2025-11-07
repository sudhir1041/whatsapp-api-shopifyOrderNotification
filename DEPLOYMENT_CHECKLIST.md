# Complete Deployment Checklist

## 1. Deploy App
```bash
npm run deploy
```

## 2. Uninstall & Reinstall App
1. Go to Shopify Admin → Apps
2. Uninstall TestApp
3. Reinstall from Partner Dashboard
4. Look for webhook registration logs:
   ```
   🔗 REGISTERING WEBHOOKS FOR SHOP: your-shop.myshopify.com
   ✅ WEBHOOKS REGISTERED SUCCESSFULLY FOR: your-shop.myshopify.com
   ```

## 3. Configure WhatsApp Settings
1. Go to app → WhatsApp Settings
2. Fill in all fields:
   - Facebook Message URL: `https://graph.facebook.com/v18.0/`
   - Phone ID: Your WhatsApp Business Phone ID
   - Access Token: Your permanent token
   - Order Template Name: `order_processing_template`
   - Fulfillment Template Name: `order_shipped_template`
   - Template Language: `en_US`
3. Click Save Settings

## 4. Test Notifications
1. Go to Test Notifications page
2. Enter phone number: `+918873566210`
3. Test both order and fulfillment notifications

## 5. Test Real Orders
1. Create test order in Shopify store
2. Watch console for webhook logs:
   ```
   === ORDER CREATE WEBHOOK TRIGGERED ===
   === ORDER PAID WEBHOOK TRIGGERED ===
   ```
3. Mark order as fulfilled
4. Watch for fulfillment webhook:
   ```
   === ORDER FULFILLED WEBHOOK TRIGGERED ===
   ```

## 6. Verify Webhook Registration
Check Partner Dashboard → App → Webhooks:
- orders/create ✅
- orders/paid ✅  
- orders/fulfilled ✅
- orders/updated ✅
- customers/data_request ✅
- customers/redact ✅
- shop/redact ✅

## Current Configuration Status
✅ Webhooks configured in shopify.server.js
✅ Webhooks configured in shopify.app.toml
✅ WhatsApp utility fixed (no button components)
✅ All webhook handlers created
✅ GDPR compliance endpoints added
✅ Test functionality working

## If Webhooks Still Don't Work
1. Check ngrok tunnel is accessible
2. Verify app is properly installed
3. Check webhook URLs in Partner Dashboard
4. Test webhook endpoints manually:
   ```bash
   curl -X POST https://saving-drake-eternal.ngrok-free.app/webhooks/orders/create
   ```