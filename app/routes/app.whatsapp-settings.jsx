import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Text,
  Divider,
  BlockStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  const settings = await db.whatsAppSettings.findUnique({
    where: { shop: session.shop },
  });

  return json({ settings });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "saveSettings") {
    const data = {
      facebookUrl: formData.get("facebookUrl"),
      phoneId: formData.get("phoneId"),
      accessToken: formData.get("accessToken"),
      orderTemplateName: formData.get("orderTemplateName"),
      fulfillmentTemplateName: formData.get("fulfillmentTemplateName"),
      templateLanguage: formData.get("templateLanguage"),
      hasButton: formData.get("hasButton") === "on",
    };

    await db.whatsAppSettings.upsert({
      where: { shop: session.shop },
      update: data,
      create: { ...data, shop: session.shop },
    });
    
    return json({ success: true, message: "Settings saved successfully!" });
  }

  return json({ success: false, error: "Invalid action" });
};

export default function WhatsAppSettings() {
  const { settings } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  
  const [formData, setFormData] = useState({
    facebookUrl: settings?.facebookUrl || "",
    phoneId: settings?.phoneId || "",
    accessToken: settings?.accessToken || "",
    orderTemplateName: settings?.orderTemplateName || "",
    fulfillmentTemplateName: settings?.fulfillmentTemplateName || "",
    templateLanguage: settings?.templateLanguage || "en",
    hasButton: settings?.hasButton || false,
  });



  const handleSaveSettings = () => {
    const data = new FormData();
    data.append("action", "saveSettings");
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    submit(data, { method: "post" });
  };



  return (
    <Page title="WhatsApp Notifications Settings">
      <Layout>
        {actionData && (
          <Layout.Section>
            <Banner status={actionData.success ? "success" : "critical"}>
              {actionData.success ? actionData.message : actionData.error}
            </Banner>
          </Layout.Section>
        )}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">WhatsApp Configuration</Text>
              <FormLayout>
                <TextField
                  label="Facebook Message URL"
                  value={formData.facebookUrl}
                  onChange={(value) => setFormData({...formData, facebookUrl: value})}
                  placeholder="https://graph.facebook.com/v18.0/"
                />
                <TextField
                  label="Phone ID"
                  value={formData.phoneId}
                  onChange={(value) => setFormData({...formData, phoneId: value})}
                  placeholder="Your WhatsApp Business Phone Number ID"
                />
                <TextField
                  label="Access Token"
                  value={formData.accessToken}
                  onChange={(value) => setFormData({...formData, accessToken: value})}
                  type="password"
                  placeholder="Your WhatsApp Business API Token"
                />
                <TextField
                  label="Order Template Name"
                  value={formData.orderTemplateName}
                  onChange={(value) => setFormData({...formData, orderTemplateName: value})}
                  placeholder="Your approved order template name"
                />
                <TextField
                  label="Fulfillment Template Name"
                  value={formData.fulfillmentTemplateName}
                  onChange={(value) => setFormData({...formData, fulfillmentTemplateName: value})}
                  placeholder="Your approved fulfillment template name"
                />
                <TextField
                  label="Template Language"
                  value={formData.templateLanguage}
                  onChange={(value) => setFormData({...formData, templateLanguage: value})}
                  placeholder="en"
                />
                <div style={{ marginTop: '16px' }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.hasButton}
                      onChange={(e) => setFormData({...formData, hasButton: e.target.checked})}
                      style={{ marginRight: '8px' }}
                    />
                    Order template has button (check if your template includes a URL button)
                  </label>
                </div>
                <Button primary onClick={handleSaveSettings}>
                  Save Settings
                </Button>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Template Variables</Text>
              <Banner status="info">
                <p><strong>Order Created Template Variables:</strong></p>
                <p>• {'{'}firstName{'}'} - Customer's first name</p>
                <p>• {'{'}orderId{'}'} - Order number</p>
                <p>• {'{'}productName{'}'} - Total order price</p>
                <p>• {'{'}price{'}'} - Product names</p>
                <br/>
                <p><strong>Order Fulfilled Template Variables:</strong></p>
                <p>• {'{'}firstName{'}'} - Customer's first name</p>
                <p>• {'{'}orderId{'}'} - Order number</p>
                <p>• {'{'}trackingId{'}'} - Tracking number</p>
                <p>• {'{'}trackingUrl{'}'} - Tracking URL</p>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}