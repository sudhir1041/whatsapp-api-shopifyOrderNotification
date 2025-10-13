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
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState } from "react";
import { redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import db from "../db.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  try {
    const automationData = {
      name: formData.get("name"),
      channel: formData.get("channel"),
      trigger: formData.get("trigger"),
      subject: formData.get("subject") || "",
      message: formData.get("message"),
      isActive: formData.get("enabled") === "on",
    };
    
    await db.automation.create({
      data: {
        shop: session.shop,
        ...automationData,
      },
    });
    
    return redirect("/app/active-automations");
  } catch (error) {
    console.error('Create automation error:', error);
    return { error: "Failed to create automation. Please try again." };
  }
};

export default function MarketingAutomation() {
  const actionData = useActionData();
  const [automationName, setAutomationName] = useState("");
  const [channel, setChannel] = useState("email");
  const [trigger, setTrigger] = useState("customer_created");
  const [enabled, setEnabled] = useState(false);

  const channelOptions = [
    { label: "Email", value: "email" },
    { label: "WhatsApp", value: "whatsapp" },
    { label: "SMS", value: "sms" },
  ];

  const triggerOptions = [
    { label: "Customer Created", value: "customer_created" },
    { label: "Order Placed", value: "order_placed" },
    { label: "Order Fulfilled", value: "order_fulfilled" },
    { label: "Cart Abandoned", value: "cart_abandoned" },
    { label: "Product Viewed", value: "product_viewed" },
    { label: "Customer Birthday", value: "customer_birthday" },
  ];

  return (
    <Page>
      <TitleBar title="Create Marketing Automation" />
      <BlockStack gap="500">
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
                    <Text as="h2" variant="headingLg">Automation Setup</Text>
                    
                    <FormLayout>
                      <TextField
                        label="Automation Name"
                        name="name"
                        value={automationName}
                        onChange={setAutomationName}
                        placeholder="e.g., Welcome New Customers"
                        required
                      />
                      
                      <Select
                        label="Communication Channel"
                        name="channel"
                        options={channelOptions}
                        value={channel}
                        onChange={setChannel}
                      />
                      
                      <Select
                        label="Trigger Event"
                        name="trigger"
                        options={triggerOptions}
                        value={trigger}
                        onChange={setTrigger}
                      />
                      
                      <Checkbox
                        label="Enable automation immediately"
                        name="enabled"
                        checked={enabled}
                        onChange={setEnabled}
                      />
                    </FormLayout>
                  </BlockStack>
                </Card>
                
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingLg">Message Content</Text>
                    
                    <FormLayout>
                      {channel === "email" && (
                        <TextField
                          label="Subject Line"
                          name="subject"
                          placeholder="Welcome to our store!"
                          multiline={false}
                        />
                      )}
                      
                      <TextField
                        label="Message Content"
                        name="message"
                        placeholder="Hi {{customer.first_name}}, welcome to our store! We're excited to have you as a customer..."
                        multiline={6}
                        required
                      />
                      
                      <InlineStack gap="200">
                        <Button submit variant="primary">Save Automation</Button>
                        <Button variant="secondary">Preview Message</Button>
                      </InlineStack>
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
                  <Text as="h3" variant="headingMd">Automation Flow</Text>
                  <BlockStack gap="200">
                    <InlineStack gap="200">
                      <div style={{width: "20px", height: "20px", backgroundColor: "#00A047", borderRadius: "50%"}}></div>
                      <Text as="p" variant="bodyMd">Trigger: {triggerOptions.find(t => t.value === trigger)?.label}</Text>
                    </InlineStack>
                    <InlineStack gap="200">
                      <div style={{width: "20px", height: "20px", backgroundColor: "#0066CC", borderRadius: "50%"}}></div>
                      <Text as="p" variant="bodyMd">Wait: 0 minutes</Text>
                    </InlineStack>
                    <InlineStack gap="200">
                      <div style={{width: "20px", height: "20px", backgroundColor: "#FF6900", borderRadius: "50%"}}></div>
                      <Text as="p" variant="bodyMd">Send: {channel.charAt(0).toUpperCase() + channel.slice(1)} Message</Text>
                    </InlineStack>
                  </BlockStack>
                  <Button fullWidth variant="secondary">Add Step</Button>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Available Variables</Text>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" tone="subdued">{'{'}{'{'} customer.first_name {'}'}{'}'}</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">{'{'}{'{'} customer.last_name {'}'}{'}'}</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">{'{'}{'{'} customer.email {'}'}{'}'}</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">{'{'}{'{'} shop.name {'}'}{'}'}</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">{'{'}{'{'} order.total_price {'}'}{'}'}</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">{'{'}{'{'} order.order_number {'}'}{'}'}</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">{'{'}{'{'} order.tracking_number {'}'}{'}'}</Text>
                  </BlockStack>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Tips</Text>
                  <Text as="p" variant="bodyMd">
                    • Use personalization variables to make messages more engaging
                  </Text>
                  <Text as="p" variant="bodyMd">
                    • Test your automation with a small group first
                  </Text>
                  <Text as="p" variant="bodyMd">
                    • Monitor performance and adjust timing as needed
                  </Text>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}