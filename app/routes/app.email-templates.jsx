import { useState, useCallback } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useSubmit, useNavigation } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Select,
  Text,
  BlockStack,
  DataTable,
  Badge,
} from '@shopify/polaris';
import { authenticate } from '../shopify.server.js';
import db from '../db.server.js';

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  let templates = [];
  try {
    templates = await db.emailTemplate?.findMany({
      where: { shop: session.shop },
      orderBy: { type: 'asc' }
    }) || [];
  } catch (error) {
    console.log('EmailTemplate not available yet:', error.message);
  }

  return json({ templates });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get('action');

  if (action === 'save') {
    const data = {
      type: formData.get('type'),
      subject: formData.get('subject'),
      htmlContent: formData.get('htmlContent'),
      textContent: formData.get('textContent'),
      isActive: formData.get('isActive') === 'true',
    };

    try {
      await db.emailTemplate?.upsert({
        where: { 
          shop_type: { 
            shop: session.shop, 
            type: data.type 
          } 
        },
        update: data,
        create: { shop: session.shop, ...data }
      });
    } catch (error) {
      console.log('EmailTemplate save failed:', error.message);
      return json({ error: 'Email templates not available yet' }, { status: 400 });
    }

    return json({ success: true });
  }

  return json({ error: 'Invalid action' }, { status: 400 });
};

const templateTypes = [
  { label: 'Order Confirmation', value: 'order' },
  { label: 'Order Fulfillment', value: 'fulfillment' },
  { label: 'Cart Abandonment', value: 'abandoned_cart' },
  { label: 'Welcome Series', value: 'welcome' },
];

const defaultTemplates = {
  order: {
    subject: 'Order Confirmation #{{orderNumber}}',
    html: '<h2>Thank you for your order!</h2>\n<p>Hi {{customerName}},</p>\n<p>Your order #{{orderNumber}} has been confirmed.</p>\n<p><strong>Total: {{totalPrice}}</strong></p>\n<p>We\'ll send you shipping details once your order is on its way.</p>',
    text: 'Thank you for your order! Your order #{{orderNumber}} has been confirmed. Total: {{totalPrice}}'
  },
  fulfillment: {
    subject: 'Your order #{{orderNumber}} is on its way!',
    html: '<h2>Your order has shipped!</h2>\n<p>Hi {{customerName}},</p>\n<p>Great news! Your order #{{orderNumber}} is now on its way.</p>\n<p><strong>Tracking Number:</strong> {{trackingNumber}}</p>\n<p>You can track your package using the link above.</p>',
    text: 'Your order #{{orderNumber}} has shipped! Tracking: {{trackingNumber}}'
  },
  abandoned_cart: {
    subject: 'You left something in your cart',
    html: '<h2>Don\'t forget your items!</h2>\n<p>Hi {{customerName}},</p>\n<p>You left {{itemCount}} items worth {{totalPrice}} in your cart.</p>\n<p>Complete your purchase before they\'re gone!</p>\n<a href="{{cartUrl}}" style="background: #007ace; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Complete Purchase</a>',
    text: 'Hi {{customerName}}, you left {{itemCount}} items worth {{totalPrice}} in your cart. Complete your purchase: {{cartUrl}}'
  },
  welcome: {
    subject: 'Welcome to {{shopName}}!',
    html: '<h2>Welcome to {{shopName}}!</h2>\n<p>Hi {{customerName}},</p>\n<p>Thank you for joining us! We\'re excited to have you as part of our community.</p>\n<p>Use code <strong>{{discountCode}}</strong> for {{discountAmount}} off your first order.</p>',
    text: 'Welcome to {{shopName}}! Use code {{discountCode}} for {{discountAmount}} off your first order.'
  }
};

export default function EmailTemplates() {
  const { templates } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  
  const [selectedType, setSelectedType] = useState('order');
  const [formData, setFormData] = useState(() => {
    const existing = templates.find(t => t.type === selectedType);
    return existing || { 
      subject: defaultTemplates[selectedType]?.subject || '',
      htmlContent: defaultTemplates[selectedType]?.html || '',
      textContent: defaultTemplates[selectedType]?.text || '',
      isActive: true 
    };
  });

  const handleTypeChange = useCallback((value) => {
    setSelectedType(value);
    const existing = templates.find(t => t.type === value);
    setFormData(existing || { 
      subject: defaultTemplates[value]?.subject || '',
      htmlContent: defaultTemplates[value]?.html || '',
      textContent: defaultTemplates[value]?.text || '',
      isActive: true 
    });
  }, [templates]);

  const handleInputChange = useCallback((field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    const data = new FormData();
    data.append('action', 'save');
    data.append('type', selectedType);
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value.toString());
    });
    submit(data, { method: 'post' });
  }, [formData, selectedType, submit]);

  const tableRows = templates.map(template => [
    templateTypes.find(t => t.value === template.type)?.label || template.type,
    template.subject,
    template.isActive ? <Badge status="success">Active</Badge> : <Badge>Inactive</Badge>,
    new Date(template.updatedAt).toLocaleDateString()
  ]);

  const isLoading = navigation.state === 'submitting';

  return (
    <Page title="Email Templates" backAction={{ url: '/app/email-settings' }}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Template Editor</Text>
              
              <FormLayout>
                <Select
                  label="Template Type"
                  options={templateTypes}
                  value={selectedType}
                  onChange={handleTypeChange}
                />

                <TextField
                  label="Subject Line"
                  value={formData.subject}
                  onChange={handleInputChange('subject')}
                  placeholder="Enter email subject"
                />

                <TextField
                  label="HTML Content"
                  value={formData.htmlContent}
                  onChange={handleInputChange('htmlContent')}
                  multiline={8}
                  placeholder="Enter HTML email content"
                />

                <TextField
                  label="Text Content (Fallback)"
                  value={formData.textContent}
                  onChange={handleInputChange('textContent')}
                  multiline={4}
                  placeholder="Enter plain text version"
                />

                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={isLoading}
                >
                  Save Template
                </Button>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Available Templates</Text>
              
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text']}
                headings={['Type', 'Subject', 'Status', 'Last Updated']}
                rows={tableRows}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Available Variables</Text>
              <Text variant="bodyMd" color="subdued">
                Use these variables in your templates:
              </Text>
              
              <Text variant="bodyMd">
                <strong>Order Templates:</strong> customerName, orderNumber, totalPrice, shopName
              </Text>
              <Text variant="bodyMd">
                <strong>Fulfillment Templates:</strong> customerName, orderNumber, trackingNumber, trackingUrl
              </Text>
              <Text variant="bodyMd">
                <strong>Cart Abandonment:</strong> customerName, itemCount, totalPrice, cartUrl
              </Text>
              <Text variant="bodyMd">
                <strong>Welcome Series:</strong> customerName, shopName, discountCode, discountAmount
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}