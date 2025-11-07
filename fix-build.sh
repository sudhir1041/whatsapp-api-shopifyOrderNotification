#!/bin/bash

echo "🔧 Fixing Build Issues..."

# Fix JSX template syntax in email-templates
echo "Fixing JSX template syntax..."

# Fix server-only imports in webhook files
echo "Checking webhook files for server imports..."

# Check other webhook files that might have similar issues
for file in app/routes/webhooks.*.jsx; do
    if [ -f "$file" ]; then
        if grep -q "import.*db\.server" "$file"; then
            echo "Found db.server import in $file"
            # Comment out db import if it's not used in server-only functions
            if ! grep -q "export const loader\|export const action.*db\." "$file"; then
                sed -i 's/import db from.*db\.server.*;//g' "$file"
                echo "Removed unused db import from $file"
            fi
        fi
    fi
done

# Try building again
echo "Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build still failing. Check errors above."
fi