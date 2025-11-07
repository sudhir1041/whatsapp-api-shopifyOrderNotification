#!/bin/bash

echo "🔧 Fixing Shopify authentication and app configuration..."

# Check current Shopify auth
echo "📋 Current Shopify auth status:"
shopify auth whoami

echo ""
echo "🔄 Resetting Shopify app configuration..."

# Reset the app configuration
shopify app config link --reset

echo ""
echo "📋 If the above fails, run these commands manually:"
echo ""
echo "1. Logout and login to correct account:"
echo "   shopify auth logout"
echo "   shopify auth login"
echo ""
echo "2. Link to existing app or create new one:"
echo "   shopify app config link"
echo ""
echo "3. Or create a new app:"
echo "   shopify app init"
echo ""
echo "📋 Alternative: Update .env with correct credentials"
echo "Check your Shopify Partner Dashboard for the correct:"
echo "- SHOPIFY_API_KEY"
echo "- SHOPIFY_API_SECRET"
echo "- Client ID"