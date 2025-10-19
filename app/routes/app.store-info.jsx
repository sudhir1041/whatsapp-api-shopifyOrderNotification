import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Page, Card, Text, BlockStack, DataTable } from '@shopify/polaris';
import { authenticate } from '../shopify.server.js';
import db from '../db.server.js';

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  
  // Get shop info from Shopify API
  let shopInfo = null;
  try {
    const response = await admin.graphql(`
      query {
        shop {
          name
          email
          currencyCode
          timezoneAbbreviation
          plan {
            displayName
          }
        }
      }
    `);
    const data = await response.json();
    shopInfo = data.data?.shop;
  } catch (error) {
    console.error('Failed to fetch shop info:', error);
  }
  
  // Get app data for this shop
  const settings = await db.whatsAppSettings.findUnique({
    where: { shop: session.shop }
  });
  
  const automationCount = await db.automation.count({
    where: { shop: session.shop }
  });
  
  const cartCount = await db.cart.count({
    where: { shop: session.shop }
  });

  return json({ 
    session: { shop: session.shop },
    shopInfo,
    settings,
    stats: { automationCount, cartCount }
  });
};

export default function StoreInfo() {
  const { session, shopInfo, settings, stats } = useLoaderData();

  const rows = [
    ['Shop Domain', session.shop],
    ['Shop Name', shopInfo?.name || 'N/A'],
    ['Shop Email', shopInfo?.email || 'N/A'],
    ['Currency', shopInfo?.currencyCode || 'N/A'],
    ['Timezone', shopInfo?.timezoneAbbreviation || 'N/A'],
    ['Plan', shopInfo?.plan?.displayName || 'N/A'],
    ['WhatsApp Configured', settings?.accessToken ? 'Yes' : 'No'],
    ['Email Configured', settings?.smtpHost ? 'Yes' : 'No'],
    ['SMS Configured', settings?.smsAccountSid ? 'Yes' : 'No'],
    ['Total Automations', stats.automationCount.toString()],
    ['Total Carts Tracked', stats.cartCount.toString()],
  ];

  return (
    <Page title="Store Information">
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd">Multi-Store Support Verification</Text>
          <Text variant="bodyMd" color="subdued">
            This page shows that WaNotify properly supports multiple stores. Each store has its own isolated data.
          </Text>
          
          <DataTable
            columnContentTypes={['text', 'text']}
            headings={['Property', 'Value']}
            rows={rows}
          />
        </BlockStack>
      </Card>
    </Page>
  );
}