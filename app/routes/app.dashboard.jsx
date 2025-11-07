import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  const settings = await db.whatsAppSettings.findUnique({
    where: { shop: session.shop },
  });

  const isConfigured = !!(settings?.phoneId && settings?.accessToken && settings?.orderTemplateName);

  return json({ settings, isConfigured });
};

export default function Dashboard() {
  const { settings, isConfigured } = useLoaderData();

  return (
    <Page title="WhatsApp Notifications Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">App Status</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text>Configuration Status:</Text>
                <Badge status={isConfigured ? "success" : "critical"}>
                  {isConfigured ? "Configured" : "Not Configured"}
                </Badge>
              </div>
              {!isConfigured && (
                <Text tone="subdued">
                  Please configure your WhatsApp settings to start sending notifications.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Current Settings</Text>
              <div>
                <Text variant="bodyMd" fontWeight="semibold">Phone ID:</Text>
                <Text>{settings?.phoneId || "Not set"}</Text>
              </div>
              <div>
                <Text variant="bodyMd" fontWeight="semibold">Order Template:</Text>
                <Text>{settings?.orderTemplateName || "Not set"}</Text>
              </div>
              <div>
                <Text variant="bodyMd" fontWeight="semibold">Fulfillment Template:</Text>
                <Text>{settings?.fulfillmentTemplateName || "Not set"}</Text>
              </div>
              <div>
                <Text variant="bodyMd" fontWeight="semibold">Language:</Text>
                <Text>{settings?.templateLanguage || "Not set"}</Text>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}