import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Button,
  TextField,
  Select,
  Checkbox,
  FormLayout,
  DataTable,
  Badge,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState } from "react";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  console.log('=== CART ABANDONMENT LOADER DEBUG ===');
  console.log('Shop:', session.shop);
  
  try {
    // Get cart abandonment settings
    const settings = await db.whatsAppSettings.findUnique({
      where: { shop: session.shop },
    });
    
    console.log('Settings from DB:', settings);
    
    // Get abandoned carts
    const abandonedCarts = await db.cart.findMany({
      where: { 
        shop: session.shop,
        status: { in: ['active', 'abandoned'] }
      },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });
    
    console.log('Abandoned carts found:', abandonedCarts.length);
    
    const result = {
      settings: {
        abandonmentDelayHours: settings?.abandonmentDelayHours || 1,
        enableAbandonmentReminders: settings?.enableAbandonmentReminders ?? true,
        maxReminders: settings?.maxReminders || 3,
        reminderIntervalHours: settings?.reminderIntervalHours || 24,
      },
      abandonedCarts
    };
    
    console.log('Returning data:', {
      enableAbandonmentReminders: result.settings.enableAbandonmentReminders,
      abandonmentDelayHours: result.settings.abandonmentDelayHours,
      cartsCount: abandonedCarts.length
    });
    
    return result;
  } catch (error) {
    console.error('Cart abandonment loader error:', error);
    console.error('Error details:', error.message);
    return {
      settings: {
        abandonmentDelayHours: 1,
        enableAbandonmentReminders: true,
        maxReminders: 3,
        reminderIntervalHours: 24,
      },
      abandonedCarts: []
    };
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  try {
    const abandonmentDelayHours = parseInt(formData.get("abandonmentDelayHours")) || 1;
    const enableAbandonmentReminders = formData.get("enableAbandonmentReminders") === "on" || formData.has("enableAbandonmentReminders");
    const maxReminders = parseInt(formData.get("maxReminders")) || 3;
    const reminderIntervalHours = parseInt(formData.get("reminderIntervalHours")) || 24;
    
    console.log('=== CART ABANDONMENT SAVE DEBUG ===');
    console.log('Form data:', Object.fromEntries(formData.entries()));
    console.log('Parsed values:', {
      abandonmentDelayHours,
      enableAbandonmentReminders,
      maxReminders,
      reminderIntervalHours
    });
    
    const result = await db.whatsAppSettings.upsert({
      where: { shop: session.shop },
      update: {
        abandonmentDelayHours,
        enableAbandonmentReminders,
        maxReminders,
        reminderIntervalHours,
      },
      create: {
        shop: session.shop,
        abandonmentDelayHours,
        enableAbandonmentReminders,
        maxReminders,
        reminderIntervalHours,
      },
    });
    
    console.log('Database save result:', result);
    
    return { success: "Cart abandonment settings saved successfully!" };
  } catch (error) {
    console.error('Save cart abandonment settings error:', error);
    return { error: `Failed to save settings: ${error.message}` };
  }
};

export default function CartAbandonment() {
  const { settings, abandonedCarts } = useLoaderData();
  const actionData = useActionData();
  
  const [abandonmentDelayHours, setAbandonmentDelayHours] = useState(settings.abandonmentDelayHours.toString());
  const [enableAbandonmentReminders, setEnableAbandonmentReminders] = useState(settings.enableAbandonmentReminders);
  const [maxReminders, setMaxReminders] = useState(settings.maxReminders.toString());
  const [reminderIntervalHours, setReminderIntervalHours] = useState(settings.reminderIntervalHours.toString());

  const delayOptions = [
    { label: "30 minutes", value: "0.5" },
    { label: "1 hour", value: "1" },
    { label: "2 hours", value: "2" },
    { label: "4 hours", value: "4" },
    { label: "8 hours", value: "8" },
    { label: "24 hours", value: "24" },
  ];

  const intervalOptions = [
    { label: "6 hours", value: "6" },
    { label: "12 hours", value: "12" },
    { label: "24 hours", value: "24" },
    { label: "48 hours", value: "48" },
    { label: "72 hours", value: "72" },
  ];

  const cartRows = abandonedCarts.map(cart => {
    const lineItems = JSON.parse(cart.lineItems || '[]');
    const productNames = lineItems.map(item => item.title).join(', ') || 'No items';
    const currency = cart.currency === 'INR' ? '₹' : '$';
    const total = `${currency}${cart.totalPrice || '0'}`;
    const timeSince = Math.round((new Date() - new Date(cart.updatedAt)) / (1000 * 60 * 60));
    
    return [
      cart.cartId,
      cart.customerEmail || 'No email',
      cart.customerPhone || 'No phone',
      productNames.length > 50 ? productNames.substring(0, 50) + '...' : productNames,
      total,
      `${timeSince}h ago`,
      cart.status === 'abandoned' ? 'Abandoned' : 'Active'
    ];
  });

  return (
    <Page>
      <TitleBar title="Cart Abandonment" />
      <BlockStack gap="500">
        {actionData?.success && (
          <Banner tone="success">
            <p>{actionData.success}</p>
          </Banner>
        )}
        
        {actionData?.error && (
          <Banner tone="critical">
            <p>{actionData.error}</p>
          </Banner>
        )}
        
        <Banner tone={enableAbandonmentReminders ? "success" : "warning"}>
          <p>
            <strong>Cart Abandonment Status: {enableAbandonmentReminders ? "ACTIVE" : "INACTIVE"}</strong>
            {enableAbandonmentReminders ? (
              ` - Reminders will be sent after ${abandonmentDelayHours < 1 ? `${abandonmentDelayHours * 60} minutes` : `${abandonmentDelayHours} hour${abandonmentDelayHours > 1 ? 's' : ''}`}, up to ${maxReminders} reminder${maxReminders > 1 ? 's' : ''} per cart.`
            ) : (
              " - Enable cart abandonment reminders in the configuration below to start recovering abandoned carts."
            )}
          </p>
        </Banner>
        
        <Layout>
          <Layout.Section>
            <Form method="post">
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">Abandonment Configuration</Text>
                  
                  <FormLayout>
                    <Checkbox
                      label="Enable cart abandonment reminders"
                      name="enableAbandonmentReminders"
                      checked={enableAbandonmentReminders}
                      onChange={setEnableAbandonmentReminders}
                      helpText="Automatically send WhatsApp messages to customers who abandon their carts"
                    />

                    
                    <Select
                      label="Send first reminder after"
                      name="abandonmentDelayHours"
                      options={delayOptions}
                      value={abandonmentDelayHours}
                      onChange={setAbandonmentDelayHours}
                      helpText="How long to wait before considering a cart abandoned"
                    />
                    
                    <TextField
                      label="Maximum reminders per cart"
                      name="maxReminders"
                      type="number"
                      value={maxReminders}
                      onChange={setMaxReminders}
                      min="1"
                      max="5"
                      helpText="Maximum number of reminder messages to send per abandoned cart"
                    />
                    
                    <Select
                      label="Interval between reminders"
                      name="reminderIntervalHours"
                      options={intervalOptions}
                      value={reminderIntervalHours}
                      onChange={setReminderIntervalHours}
                      helpText="Time to wait between sending reminder messages"
                    />
                    
                    <Button submit variant="primary">Save Configuration</Button>
                  </FormLayout>
                </BlockStack>
              </Card>
            </Form>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">Configuration Status</Text>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Cart Abandonment</Text>
                    <Badge tone={enableAbandonmentReminders ? "success" : "critical"}>
                      {enableAbandonmentReminders ? "Active" : "Inactive"}
                    </Badge>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">First Reminder After</Text>
                    <Text as="span" variant="bodyMd">
                      {abandonmentDelayHours < 1 ? `${abandonmentDelayHours * 60}min` : `${abandonmentDelayHours}h`}
                    </Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Max Reminders</Text>
                    <Text as="span" variant="bodyMd">{maxReminders}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Reminder Interval</Text>
                    <Text as="span" variant="bodyMd">{reminderIntervalHours}h</Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
            
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">Cart Stats</Text>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Total Carts</Text>
                    <Text as="span" variant="bodyMd">{abandonedCarts.length}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Abandoned</Text>
                    <Text as="span" variant="bodyMd">
                      {abandonedCarts.filter(c => c.status === 'abandoned').length}
                    </Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Active</Text>
                    <Text as="span" variant="bodyMd">
                      {abandonedCarts.filter(c => c.status === 'active').length}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
        
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">Abandoned Carts</Text>
            
            {abandonedCarts.length > 0 ? (
              <DataTable
                columnContentTypes={[
                  'text',
                  'text',
                  'text',
                  'text',
                  'text',
                  'text',
                  'text',
                ]}
                headings={[
                  'Cart ID',
                  'Customer Email',
                  'Phone',
                  'Products',
                  'Total',
                  'Last Updated',
                  'Status',
                ]}
                rows={cartRows}
              />
            ) : (
              <Text as="p" variant="bodyMd" tone="subdued">
                No abandoned carts found. Carts will appear here when customers add items but don't complete checkout.
              </Text>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}