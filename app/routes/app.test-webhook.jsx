import { useState } from "react";
import { json } from "@remix-run/node";
import { useSubmit, useActionData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { sendWhatsAppMessage } from "../utils/whatsapp.server";

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  try {
    const phoneNumber = formData.get("phoneNumber");
    const templateType = formData.get("templateType");
    
    const variables = templateType === "order" ? {
      firstName: "Sudhir",
      orderId: "LE2929",
      productName: "₹299",
      price: "Plant Name"
      
    } : {
      firstName: "Sudhir", 
      orderId: "LE2929",
      trackingId: "TRK789012",
      trackingUrl: "https://track.example.com/TRK789012"
    };
    
    await sendWhatsAppMessage(session.shop, phoneNumber, templateType, variables);
    
    return json({ success: true, message: "Test message sent successfully!" });
  } catch (error) {
    console.error("Test webhook error:", error);
    return json({ success: false, error: error.message }, { status: 400 });
  }
};

export default function TestWebhook() {
  const submit = useSubmit();
  const actionData = useActionData();
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleTest = (templateType) => {
    const data = new FormData();
    data.append("phoneNumber", phoneNumber);
    data.append("templateType", templateType);
    
    submit(data, { method: "post" });
  };

  return (
    <Page title="Test WhatsApp Notifications">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Test Notifications</Text>
              <FormLayout>
                <TextField
                  label="Test Phone Number"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  placeholder="+1234567890"
                  helpText="Enter phone number with country code"
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button 
                    primary 
                    onClick={() => handleTest("order")}
                    disabled={!phoneNumber}
                  >
                    Test Order Created
                  </Button>
                  <Button 
                    onClick={() => handleTest("fulfillment")}
                    disabled={!phoneNumber}
                  >
                    Test Order Fulfilled
                  </Button>
                </div>
              </FormLayout>
              
              {actionData && (
                <Banner status={actionData.success ? "success" : "critical"}>
                  {actionData.success ? actionData.message : actionData.error}
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}