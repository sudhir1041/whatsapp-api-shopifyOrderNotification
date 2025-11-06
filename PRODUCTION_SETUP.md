# Production Setup for zaptool.online

## Quick Setup Steps

### 1. Deploy the App
```bash
# In your project directory
./deploy-direct.sh
```

### 2. Start the App
```bash
export NODE_ENV=production
export DATABASE_URL="file:./prisma/production.sqlite"
npm run start
```

### 2. Configure Nginx (if not already done)

Create nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/zaptool.online
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name zaptool.online www.zaptool.online;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zaptool.online www.zaptool.online;

    # SSL Configuration (get certificates with certbot)
    ssl_certificate /etc/letsencrypt/live/zaptool.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zaptool.online/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/zaptool.online /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Get SSL Certificate
```bash
sudo certbot --nginx -d zaptool.online -d www.zaptool.online
```

### 4. Update Shopify App Configuration

In your Shopify Partner Dashboard:
1. Go to your app settings
2. Update App URL to: `https://zaptool.online`
3. Update Allowed redirection URLs to:
   - `https://zaptool.online/auth/callback`
   - `https://zaptool.online/auth/shopify/callback`
   - `https://zaptool.online/api/auth/callback`

### 5. Deploy App Configuration
```bash
npm run deploy
```

## Environment Variables

Make sure your `.env` file has:
```
SHOPIFY_API_KEY=a2025f8cce4b8f141f39409f4baeec8b
SHOPIFY_API_SECRET=dfc7395493e3a575d322117785a1254f
SCOPES=read_orders,write_orders,write_products,read_customers
SHOPIFY_APP_URL=https://zaptool.online
DATABASE_URL=file:./prisma/production.sqlite

# Add your WhatsApp credentials
WHATSAPP_ACCESS_TOKEN=your_actual_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
```

## Running in Background

To keep the app running:
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "wanotify" -- run start
pm2 save
pm2 startup
```

## Your App is Ready!

- **App URL**: https://zaptool.online
- **Install in Shopify**: Go to your Partner Dashboard and install in a test store
- **Configure WhatsApp**: Add your WhatsApp Business API credentials in the app settings
- **Test**: Create test orders and abandoned carts to verify functionality

## Troubleshooting

- **Check logs**: `pm2 logs wanotify`
- **Restart app**: `pm2 restart wanotify`
- **Check nginx**: `sudo nginx -t && sudo systemctl status nginx`
- **SSL issues**: `sudo certbot renew --dry-run`