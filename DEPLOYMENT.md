# WaNotify Production Deployment Guide

## Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Production domain/server
- PostgreSQL database (recommended)

## Environment Setup

1. **Copy production environment file:**
```bash
cp .env.production .env
```

2. **Update production variables in .env:**
```bash
NODE_ENV=production
SHOPIFY_API_KEY=your_production_api_key
SHOPIFY_API_SECRET=your_production_api_secret
SHOPIFY_APP_URL=https://your-production-domain.com
DATABASE_URL=postgresql://username:password@host:port/database
```

## Deployment Options

### Option 1: Docker Compose (Recommended)
```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f app
```

### Option 2: Manual Deployment
```bash
# Install dependencies
npm ci --only=production

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Build application
npm run build:prod

# Start production server
npm run start:prod
```

## Database Migration
```bash
# For new deployment
npx prisma migrate deploy

# For existing deployment with changes
npx prisma db push
```

## Production Checklist

- [ ] Update SHOPIFY_APP_URL to production domain
- [ ] Configure production database (PostgreSQL recommended)
- [ ] Set up SSL certificates
- [ ] Configure environment variables
- [ ] Test webhooks with production URL
- [ ] Deploy to Shopify App Store
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## Monitoring
- Check application logs: `docker-compose logs -f app`
- Monitor database: `docker-compose logs -f db`
- Health check endpoint: `https://your-domain.com/health`

## Troubleshooting
- Ensure all environment variables are set
- Check database connectivity
- Verify Shopify webhook URLs
- Monitor application logs for errors