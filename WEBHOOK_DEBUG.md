# Webhook Debugging Steps

## 1. Deploy Webhooks
```bash
npm run deploy
```

## 2. Test Webhook Connection
Use Shopify CLI to test webhook delivery:
```bash
shopify app generate webhook
```

## 3. Check Webhook Registration
1. Go to Shopify Partner Dashboard
2. Select your app
3. Go to App setup > Webhooks
4. Verify webhooks are listed

## 4. Test Order Creation
1. Create a test order in your Shopify store
2. Watch terminal for webhook logs
3. Look for "ORDER UPDATED WEBHOOK TRIGGERED"

## 5. Check App Installation
Make sure your app is properly installed:
1. Go to your Shopify admin
2. Apps > App and sales channels
3. Verify your app is installed and active

## 6. Verify Tunnel URL
Check if your tunnel URL is accessible:
- Current tunnel should match the one in shopify.app.toml
- Test by visiting: https://your-tunnel-url.trycloudflare.com

## 7. Manual Webhook Test
Test webhook endpoint directly:
```bash
curl -X POST https://your-tunnel-url.trycloudflare.com/webhooks/orders/updated \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Expected Terminal Output
When working correctly, you should see:
```
=== ORDER UPDATED WEBHOOK TRIGGERED ===
Request URL: /webhooks/orders/updated
Request method: POST
Headers: {...}
Raw webhook body: {...}
Parsed order data: {...}
```

## Common Issues
1. **No webhook activity**: App not properly installed or webhooks not deployed
2. **Tunnel not accessible**: Restart development server
3. **Authentication errors**: Check app credentials in .env file
4. **Webhook not registered**: Run `npm run deploy` again