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
  Banner,
  Select,
  Checkbox,
  Text,
  BlockStack,
} from '@shopify/polaris';
import { authenticate } from '../shopify.server.js';
import db from '../db.server.js';
import { testEmailConnection } from '../utils/smtp.server.js';

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  const settings = await db.whatsAppSettings.findUnique({
    where: { shop: session.shop }
  });

  let emailTemplates = [];
  try {
    emailTemplates = await db.emailTemplate?.findMany({
      where: { shop: session.shop }
    }) || [];
  } catch (error) {
    console.log('EmailTemplate not available yet:', error.message);
  }

  return json({ settings, emailTemplates });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get('action');

  if (action === 'test') {
    const result = await testEmailConnection(session.shop);
    return json(result);
  }

  if (action === 'save') {
    const data = {
      smtpHost: formData.get('smtpHost'),
      smtpPort: parseInt(formData.get('smtpPort')) || 587,
      smtpUser: formData.get('smtpUser'),
      smtpPassword: formData.get('smtpPassword'),
      smtpSecure: formData.get('smtpSecure') === 'true',
      fromEmail: formData.get('fromEmail'),
      enableEmailAutomation: formData.get('enableEmailAutomation') === 'true',
    };

    await db.whatsAppSettings.upsert({
      where: { shop: session.shop },
      update: data,
      create: { shop: session.shop, ...data }
    });

    return json({ success: true });
  }

  return json({ error: 'Invalid action' }, { status: 400 });
};

export default function EmailSettings() {
  const { settings, emailTemplates } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  
  const [formData, setFormData] = useState({
    smtpHost: settings?.smtpHost || '',
    smtpPort: settings?.smtpPort || 587,
    smtpUser: settings?.smtpUser || '',
    smtpPassword: settings?.smtpPassword || '',
    smtpSecure: settings?.smtpSecure ?? true,
    fromEmail: settings?.fromEmail || '',
    enableEmailAutomation: settings?.enableEmailAutomation || false,
  });

  const [testResult, setTestResult] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [emailTestResult, setEmailTestResult] = useState(null);

  const handleInputChange = useCallback((field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    const data = new FormData();
    data.append('action', 'save');
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value.toString());
    });
    submit(data, { method: 'post' });
  }, [formData, submit]);

  const handleTest = useCallback(() => {
    const data = new FormData();
    data.append('action', 'test');
    submit(data, { method: 'post' }, {
      onSuccess: (result) => setTestResult(result)
    });
  }, [submit]);
  
  const handleEmailTest = useCallback(async () => {
    if (!testEmail) {
      setEmailTestResult({ success: false, error: 'Please enter a test email address' });
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('testEmail', testEmail);
      
      const response = await fetch('/api/test-email', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      setEmailTestResult(result);
    } catch (error) {
      setEmailTestResult({ success: false, error: error.message });
    }
  }, [testEmail]);

  const isLoading = navigation.state === 'submitting';

  return (
    <Page title="Email Settings" backAction={{ url: '/app/settings' }}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">SMTP Configuration</Text>
              
              {testResult && (
                <Banner
                  status={testResult.success ? 'success' : 'critical'}
                  onDismiss={() => setTestResult(null)}
                >
                  {testResult.success 
                    ? 'SMTP connection successful!' 
                    : `Connection failed: ${testResult.error}`
                  }
                </Banner>
              )}
              
              {emailTestResult && (
                <Banner
                  status={emailTestResult.success ? 'success' : 'critical'}
                  onDismiss={() => setEmailTestResult(null)}
                >
                  {emailTestResult.success 
                    ? 'Test email sent successfully!' 
                    : `Email test failed: ${emailTestResult.error}`
                  }
                </Banner>
              )}

              <FormLayout>
                <Checkbox
                  label="Enable Email Automation"
                  checked={formData.enableEmailAutomation}
                  onChange={handleInputChange('enableEmailAutomation')}
                />

                <TextField
                  label="SMTP Host"
                  value={formData.smtpHost}
                  onChange={handleInputChange('smtpHost')}
                  placeholder="smtp.gmail.com"
                />

                <TextField
                  label="SMTP Port"
                  type="number"
                  value={formData.smtpPort.toString()}
                  onChange={(value) => handleInputChange('smtpPort')(parseInt(value) || 587)}
                />

                <TextField
                  label="SMTP Username"
                  value={formData.smtpUser}
                  onChange={handleInputChange('smtpUser')}
                  placeholder="your-email@gmail.com"
                />

                <TextField
                  label="SMTP Password"
                  type="password"
                  value={formData.smtpPassword}
                  onChange={handleInputChange('smtpPassword')}
                  placeholder="App password or SMTP password"
                />

                <Checkbox
                  label="Use SSL/TLS (Secure Connection)"
                  checked={formData.smtpSecure}
                  onChange={handleInputChange('smtpSecure')}
                />

                <TextField
                  label="From Email Address"
                  value={formData.fromEmail}
                  onChange={handleInputChange('fromEmail')}
                  placeholder="noreply@yourstore.com"
                />
                
                <TextField
                  label="Test Email Address"
                  value={testEmail}
                  onChange={setTestEmail}
                  placeholder="test@example.com"
                  helpText="Enter an email address to test your SMTP configuration"
                />

                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    loading={isLoading}
                  >
                    Save Settings
                  </Button>
                  
                  <Button
                    onClick={handleTest}
                    loading={isLoading}
                    disabled={!formData.smtpHost || !formData.smtpUser}
                  >
                    Test Connection
                  </Button>
                  
                  <Button
                    onClick={handleEmailTest}
                    loading={isLoading}
                    disabled={!testEmail}
                  >
                    Send Test Email
                  </Button>
                </div>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Email Templates</Text>
              <Text variant="bodyMd" color="subdued">
                Configure email templates for different automation types
              </Text>
              
              <Button url="/app/email-templates">
                Manage Email Templates
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}