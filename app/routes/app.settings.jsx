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
  Divider,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState } from "react";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import db from "../db.server";

async function testWhatsAppConnection(accessToken, phoneId) {
  const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${response.status}`);
  }
  
  return await response.json();
}

async function sendHelloWorldTemplate(accessToken, phoneId, toPhoneNumber, templateName = "hello_world", languageCode = "en_US") {
  console.log('=== WHATSAPP API DEBUG ===');
  
  // Clean and validate token
  const cleanToken = accessToken?.trim();
  if (!cleanToken) {
    throw new Error('Access token is empty or undefined');
  }
  
  // Check token format - should be alphanumeric with some special chars
  if (!/^[A-Za-z0-9_-]+$/.test(cleanToken)) {
    console.log('Token contains invalid characters');
    console.log('Token length:', cleanToken.length);
    console.log('Token (first 50 chars):', cleanToken.substring(0, 50));
  }
  
  console.log('Access Token (first 20 chars):', cleanToken?.substring(0, 20) + '...');
  console.log('Token Length:', cleanToken?.length);
  console.log('Phone ID:', phoneId);
  console.log('To Phone:', toPhoneNumber);
  console.log('Template Name:', templateName);
  console.log('Language Code:', languageCode);
  
  const payload = {
    messaging_product: "whatsapp",
    to: toPhoneNumber,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode
      }
    }
  };
  
  console.log('API Payload:', JSON.stringify(payload, null, 2));
  
  let response;
  try {
    response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
  } catch (fetchError) {
    console.log('Fetch Error:', fetchError);
    throw new Error(`Network error: ${fetchError.message}. Check your internet connection and try again.`);
  }
  
  console.log('Response Status:', response.status);
  console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorData = await response.json();
    console.log('Error Response:', JSON.stringify(errorData, null, 2));
    throw new Error(`WhatsApp API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const result = await response.json();
  console.log('Success Response:', JSON.stringify(result, null, 2));
  return result;
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    console.log('=== SETTINGS LOADER DEBUG ===');
    console.log('Shop:', session.shop);
    
    const whatsappSettings = await db.whatsAppSettings.findUnique({
      where: { shop: session.shop },
    });
    
    console.log('WhatsApp settings from DB:', whatsappSettings);

    const automationCount = await db.automation.count({
      where: { shop: session.shop },
    });

    const activeAutomationCount = await db.automation.count({
      where: { shop: session.shop, isActive: true },
    });

    const monthlyExecutions = await db.automationExecution.count({
      where: {
        automation: { shop: session.shop },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const settingsData = {
      settings: {
        whatsappToken: whatsappSettings?.accessToken || "",
        phoneId: whatsappSettings?.phoneId || "",
        orderTemplateName: whatsappSettings?.orderTemplateName || "",
        fulfillmentTemplateName: whatsappSettings?.fulfillmentTemplateName || "",
        helloWorldTemplateName: whatsappSettings?.helloWorldTemplateName || "hello_world",
        abandonedCartTemplateName: whatsappSettings?.abandonedCartTemplateName || "abandoned_cart",
        welcomeSeriesTemplateName: whatsappSettings?.welcomeSeriesTemplateName || "welcome_series",
        testPhoneNumber: whatsappSettings?.testPhoneNumber || "",
        facebookUrl: whatsappSettings?.facebookUrl || "",
        templateLanguage: whatsappSettings?.templateLanguage || "en_US",
        emailProvider: "sendgrid",
        smsProvider: "twilio",
        enableNotifications: true,
        enableAnalytics: true,
      },
      usage: {
        monthlyExecutions,
        automationCount,
        activeAutomationCount,
      }
    };
    
    console.log('Returning settings data:', settingsData);
    return settingsData;
  } catch (error) {
    console.error('Settings loader error:', error);
    return {
      settings: {
        whatsappToken: "",
        phoneId: "",
        emailProvider: "sendgrid",
        smsProvider: "twilio",
        enableNotifications: true,
        enableAnalytics: true,
      },
      usage: {
        monthlyExecutions: 0,
        automationCount: 0,
        activeAutomationCount: 0,
      }
    };
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  console.log('=== SETTINGS SAVE DEBUG ===');
  console.log('Shop:', session.shop);
  console.log('Form data:', Object.fromEntries(formData.entries()));
  
  try {
    const action = formData.get("action");
    const whatsappToken = formData.get("whatsappToken");
    const phoneId = formData.get("phoneId");
    const testPhoneNumber = formData.get("testPhoneNumber");
    const facebookUrl = formData.get("facebookUrl");
    const templateLanguage = formData.get("templateLanguage");
    const orderTemplateName = formData.get("orderTemplateName");
    const fulfillmentTemplateName = formData.get("fulfillmentTemplateName");
    const helloWorldTemplateName = formData.get("helloWorldTemplateName");
    const abandonedCartTemplateName = formData.get("abandonedCartTemplateName");
    const welcomeSeriesTemplateName = formData.get("welcomeSeriesTemplateName");
    const emailApiKey = formData.get("emailApiKey");
    const fromEmail = formData.get("fromEmail");
    const smsAccountSid = formData.get("smsAccountSid");
    const smsAuthToken = formData.get("smsAuthToken");
    
    // Handle WhatsApp connection test
    if (action === "test_whatsapp") {
      try {
        const testResult = await testWhatsAppConnection(whatsappToken, phoneId);
        return { success: "WhatsApp connection test successful! API is working." };
      } catch (error) {
        return { error: `WhatsApp connection test failed: ${error.message}` };
      }
    }
    
    // Handle hello_world template test
    if (action === "send_hello_world") {
      console.log('=== HELLO WORLD TEST DEBUG ===');
      console.log('Form whatsappToken:', whatsappToken ? 'Present' : 'Missing');
      console.log('Form phoneId:', phoneId);
      
      // Get saved settings from database
      const existing = await db.whatsAppSettings.findUnique({
        where: { shop: session.shop }
      });
      
      const tokenToUse = whatsappToken || existing?.accessToken;
      const phoneIdToUse = phoneId || existing?.phoneId;
      const phoneToUse = testPhoneNumber || existing?.testPhoneNumber;
      const templateToUse = existing?.helloWorldTemplateName || "hello_world";
      const languageToUse = existing?.templateLanguage || "en_US";
      
      console.log('Using token:', tokenToUse ? 'Present' : 'Missing');
      console.log('Using phoneId:', phoneIdToUse);
      
      if (!tokenToUse) {
        return { error: "Please enter WhatsApp API token and save settings first." };
      }
      if (!phoneIdToUse) {
        return { error: "Please enter Phone Number ID and save settings first." };
      }
      if (!phoneToUse) {
        return { error: "Please enter a test phone number and save settings first." };
      }
      
      try {
        const result = await sendHelloWorldTemplate(tokenToUse, phoneIdToUse, phoneToUse, templateToUse, languageToUse);
        return { success: `${templateToUse} template sent successfully to ${phoneToUse}!` };
      } catch (error) {
        return { error: `Failed to send Hello World template: ${error.message}` };
      }
    }
    
    console.log('Raw form values:');
    console.log('whatsappToken:', whatsappToken);
    console.log('phoneId:', phoneId);
    console.log('testPhoneNumber:', testPhoneNumber);
    console.log('orderTemplateName:', orderTemplateName);
    console.log('fulfillmentTemplateName:', fulfillmentTemplateName);
    console.log('emailApiKey:', emailApiKey);
    console.log('fromEmail:', fromEmail);
    console.log('smsAccountSid:', smsAccountSid);
    console.log('smsAuthToken:', smsAuthToken);
    
    // Check if record exists first
    const existing = await db.whatsAppSettings.findUnique({
      where: { shop: session.shop }
    });
    
    console.log('Existing record:', existing);
    
    const dataToSave = {
      accessToken: whatsappToken || "",
      phoneId: phoneId || "",
      orderTemplateName: orderTemplateName || "",
      fulfillmentTemplateName: fulfillmentTemplateName || "",
      helloWorldTemplateName: helloWorldTemplateName || "hello_world",
      abandonedCartTemplateName: abandonedCartTemplateName || "abandoned_cart",
      welcomeSeriesTemplateName: welcomeSeriesTemplateName || "welcome_series",
      testPhoneNumber: testPhoneNumber || "",
      facebookUrl: facebookUrl || "",
      templateLanguage: templateLanguage || "en_US",
    };
    
    console.log('Data to save:', dataToSave);
    
    const result = await db.whatsAppSettings.upsert({
      where: { shop: session.shop },
      update: dataToSave,
      create: {
        shop: session.shop,
        ...dataToSave,
      },
    });
    
    console.log('Database save result:', result);
    
    // Verify the save worked
    const verification = await db.whatsAppSettings.findUnique({
      where: { shop: session.shop }
    });
    console.log('Verification query result:', verification);
    
    return { success: "Settings saved successfully!" };
  } catch (error) {
    console.error('Save settings error:', error);
    console.error('Error stack:', error.stack);
    return { error: `Failed to save settings: ${error.message}` };
  }
};

export default function Settings() {
  const { settings, usage } = useLoaderData();
  const actionData = useActionData();
  const [whatsappToken, setWhatsappToken] = useState(settings.whatsappToken);
  const [phoneId, setPhoneId] = useState(settings.phoneId);
  const [orderTemplateName, setOrderTemplateName] = useState(settings.orderTemplateName);
  const [fulfillmentTemplateName, setFulfillmentTemplateName] = useState(settings.fulfillmentTemplateName);
  const [helloWorldTemplateName, setHelloWorldTemplateName] = useState(settings.helloWorldTemplateName || "hello_world");
  const [abandonedCartTemplateName, setAbandonedCartTemplateName] = useState(settings.abandonedCartTemplateName || "abandoned_cart");
  const [welcomeSeriesTemplateName, setWelcomeSeriesTemplateName] = useState(settings.welcomeSeriesTemplateName || "welcome_series");
  const [testPhoneNumber, setTestPhoneNumber] = useState(settings.testPhoneNumber);
  const [facebookUrl, setFacebookUrl] = useState(settings.facebookUrl || "");
  const [templateLanguage, setTemplateLanguage] = useState(settings.templateLanguage || "en_US");
  const [emailApiKey, setEmailApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [smsAccountSid, setSmsAccountSid] = useState("");
  const [smsAuthToken, setSmsAuthToken] = useState("");
  const [emailProvider, setEmailProvider] = useState(settings.emailProvider);
  const [smsProvider, setSmsProvider] = useState(settings.smsProvider);
  const [enableNotifications, setEnableNotifications] = useState(settings.enableNotifications);
  const [enableAnalytics, setEnableAnalytics] = useState(settings.enableAnalytics);

  const emailProviders = [
    { label: "SendGrid", value: "sendgrid" },
    { label: "Mailgun", value: "mailgun" },
    { label: "Amazon SES", value: "ses" },
  ];

  const smsProviders = [
    { label: "Twilio", value: "twilio" },
    { label: "MessageBird", value: "messagebird" },
    { label: "Nexmo", value: "nexmo" },
  ];

  return (
    <Page>
      <TitleBar title="Settings" />
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
        
        <Layout>
          <Layout.Section>
            <Form method="post">
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingLg">Communication Channels</Text>
                    
                    <FormLayout>
                      <Text as="h3" variant="headingMd">WhatsApp Configuration</Text>
                      <TextField
                        label="WhatsApp Business API Token"
                        name="whatsappToken"
                        value={whatsappToken}
                        onChange={setWhatsappToken}
                        placeholder="Enter your WhatsApp API token"
                        type="password"
                        autoComplete="off"
                      />
                      <TextField
                        label="Phone Number ID"
                        name="phoneId"
                        value={phoneId}
                        onChange={setPhoneId}
                        placeholder="Enter your WhatsApp phone number ID"
                        autoComplete="off"
                      />
                      <TextField
                        label="Order Template Name"
                        name="orderTemplateName"
                        value={orderTemplateName}
                        onChange={setOrderTemplateName}
                        placeholder="e.g., order_confirmation"
                        helpText="WhatsApp Business API template name for order confirmations"
                      />
                      <TextField
                        label="Fulfillment Template Name"
                        name="fulfillmentTemplateName"
                        value={fulfillmentTemplateName}
                        onChange={setFulfillmentTemplateName}
                        placeholder="e.g., order_shipped"
                        helpText="WhatsApp Business API template name for order fulfillments"
                      />
                      <TextField
                        label="Hello World Template Name"
                        name="helloWorldTemplateName"
                        value={helloWorldTemplateName}
                        onChange={setHelloWorldTemplateName}
                        placeholder="hello_world"
                        helpText="WhatsApp Business API template name for test messages"
                      />
                      <TextField
                        label="Abandoned Cart Template Name"
                        name="abandonedCartTemplateName"
                        value={abandonedCartTemplateName}
                        onChange={setAbandonedCartTemplateName}
                        placeholder="abandoned_cart"
                        helpText="WhatsApp Business API template name for abandoned cart reminders"
                      />
                      <TextField
                        label="Welcome Series Template Name"
                        name="welcomeSeriesTemplateName"
                        value={welcomeSeriesTemplateName}
                        onChange={setWelcomeSeriesTemplateName}
                        placeholder="welcome_series"
                        helpText="WhatsApp Business API template name for welcome messages"
                      />
                      <TextField
                        label="Facebook Business URL"
                        name="facebookUrl"
                        value={facebookUrl}
                        onChange={setFacebookUrl}
                        placeholder="https://business.facebook.com/..."
                        helpText="Your Facebook Business Manager URL"
                      />
                      <Select
                        label="Template Language"
                        name="templateLanguage"
                        options={[
                          { label: "English (US)", value: "en_US" },
                          { label: "English (UK)", value: "en_GB" },
                          { label: "Spanish", value: "es" },
                          { label: "French", value: "fr" },
                          { label: "German", value: "de" },
                          { label: "Hindi", value: "hi" },
                          { label: "Portuguese", value: "pt_BR" },
                        ]}
                        value={templateLanguage}
                        onChange={setTemplateLanguage}
                        helpText="Language for WhatsApp message templates"
                      />
                      
                      <Divider />
                      
                      <Text as="h3" variant="headingMd">Test WhatsApp Message</Text>
                      <TextField
                        label="Test Phone Number"
                        name="testPhoneNumber"
                        value={testPhoneNumber}
                        onChange={setTestPhoneNumber}
                        placeholder="919876543210"
                        helpText="Enter phone number with country code (e.g., 919876543210 for India)"
                      />
                      
                      <Divider />
                      
                      <Text as="h3" variant="headingMd">Email Configuration</Text>
                      <Select
                        label="Email Service Provider"
                        options={emailProviders}
                        value={emailProvider}
                        onChange={setEmailProvider}
                      />
                      <TextField
                        label="API Key"
                        name="emailApiKey"
                        value={emailApiKey}
                        onChange={setEmailApiKey}
                        placeholder="Enter your email provider API key"
                        type="password"
                      />
                      <TextField
                        label="From Email"
                        name="fromEmail"
                        value={fromEmail}
                        onChange={setFromEmail}
                        placeholder="noreply@yourstore.com"
                      />
                      
                      <Divider />
                      
                      <Text as="h3" variant="headingMd">SMS Configuration</Text>
                      <Select
                        label="SMS Service Provider"
                        options={smsProviders}
                        value={smsProvider}
                        onChange={setSmsProvider}
                      />
                      <TextField
                        label="Account SID"
                        name="smsAccountSid"
                        value={smsAccountSid}
                        onChange={setSmsAccountSid}
                        placeholder="Enter your SMS provider account SID"
                      />
                      <TextField
                        label="Auth Token"
                        name="smsAuthToken"
                        value={smsAuthToken}
                        onChange={setSmsAuthToken}
                        placeholder="Enter your SMS provider auth token"
                        type="password"
                      />
                    </FormLayout>
                  </BlockStack>
                </Card>
                
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingLg">General Settings</Text>
                    
                    <FormLayout>
                      <Checkbox
                        label="Enable email notifications for automation events"
                        checked={enableNotifications}
                        onChange={setEnableNotifications}
                      />
                      
                      <Checkbox
                        label="Enable advanced analytics tracking"
                        checked={enableAnalytics}
                        onChange={setEnableAnalytics}
                      />
                      
                      <TextField
                        label="Default Timezone"
                        value="UTC"
                        disabled
                      />
                      
                      <Select
                        label="Date Format"
                        options={[
                          { label: "MM/DD/YYYY", value: "us" },
                          { label: "DD/MM/YYYY", value: "eu" },
                          { label: "YYYY-MM-DD", value: "iso" },
                        ]}
                        value="us"
                        onChange={() => {}}
                      />
                      
                      <Button submit variant="primary">Save Settings</Button>
                    </FormLayout>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Form>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Connection Status</Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">WhatsApp</Text>
                      <Text as="span" variant="bodyMd" tone={whatsappToken ? "success" : "critical"}>
                        {whatsappToken ? "Connected" : "Disconnected"}
                      </Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Email</Text>
                      <Text as="span" variant="bodyMd" tone="success">Connected</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">SMS</Text>
                      <Text as="span" variant="bodyMd" tone="warning">Not Configured</Text>
                    </InlineStack>
                  </BlockStack>
                  <BlockStack gap="200">
                    <Button fullWidth variant="secondary">Test All Connections</Button>
                    <form method="post" style={{width: '100%'}}>
                      <input type="hidden" name="action" value="test_whatsapp" />
                      <Button fullWidth variant="secondary" submit disabled={!whatsappToken || !phoneId}>
                        Test WhatsApp Connection
                      </Button>
                    </form>
                    <form method="post" style={{width: '100%'}}>
                      <input type="hidden" name="action" value="send_hello_world" />
                      <Button fullWidth variant="primary" submit disabled={!whatsappToken || !phoneId}>
                        Send Hello World Test
                      </Button>
                    </form>
                  </BlockStack>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Usage Limits</Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Messages This Month</Text>
                      <Text as="span" variant="bodyMd">{usage.monthlyExecutions} / 5,000</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Active Automations</Text>
                      <Text as="span" variant="bodyMd">{usage.activeAutomationCount} / 10</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Total Automations</Text>
                      <Text as="span" variant="bodyMd">{usage.automationCount} / Unlimited</Text>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Support</Text>
                  <Text as="p" variant="bodyMd">
                    Need help configuring your automation settings? Check our documentation or contact support.
                  </Text>
                  <BlockStack gap="200">
                    <Button 
                      fullWidth 
                      variant="secondary" 
                      url="https://zaptool.online/docs" 
                      external
                    >
                      View Documentation
                    </Button>
                    <Button 
                      fullWidth 
                      variant="secondary" 
                      url="mailto:zaptoolonline@gmail.com?subject=WhatsApp Analytics App Support" 
                      external
                    >
                      Contact Support
                    </Button>
                    <Button 
                      fullWidth 
                      variant="secondary" 
                      url="https://zaptool.online" 
                      external
                    >
                      Visit Website
                    </Button>
                  </BlockStack>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Email: zaptoolonline@gmail.com
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Website: zaptool.online
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}