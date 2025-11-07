import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  DataTable,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useLoaderData, Link } from "@remix-run/react";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    const automations = await db.automation.findMany({
      where: { shop: session.shop },
      include: {
        executions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { automations };
  } catch (error) {
    console.error('Automations error:', error);
    return { automations: [] };
  }
};

export default function ActiveAutomations() {
  const { automations } = useLoaderData();
  
  const rows = automations.map(automation => {
    const successfulExecutions = automation.executions.filter(e => e.status === 'sent').length;
    const totalExecutions = automation.executions.length;
    const successRate = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0;
    
    return [
      automation.name,
      automation.channel.charAt(0).toUpperCase() + automation.channel.slice(1),
      automation.isActive ? "Active" : "Paused",
      `${successRate}%`,
      `${totalExecutions} executions`,
      "Edit"
    ];
  });

  const activeCount = automations.filter(a => a.isActive).length;
  const pausedCount = automations.filter(a => !a.isActive).length;
  const totalCustomersReached = automations.reduce((sum, a) => sum + a.executions.length, 0);
  const avgSuccessRate = automations.length > 0 ? 
    Math.round(automations.reduce((sum, a) => {
      const successful = a.executions.filter(e => e.status === 'sent').length;
      const total = a.executions.length;
      return sum + (total > 0 ? (successful / total) * 100 : 0);
    }, 0) / automations.length) : 0;
  
  const todayExecutions = automations.reduce((sum, a) => {
    const today = new Date();
    return sum + a.executions.filter(e => {
      const executionDate = new Date(e.createdAt);
      return executionDate.toDateString() === today.toDateString();
    }).length;
  }, 0);

  return (
    <Page>
      <TitleBar title="Active Automations">
        <Link to="/app/marketing-automation">
          <Button variant="primary">Create New Automation</Button>
        </Link>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingLg">Your Automations</Text>
                  <InlineStack gap="200">
                    <Badge tone="success">{activeCount} Active</Badge>
                    <Badge tone="warning">{pausedCount} Paused</Badge>
                  </InlineStack>
                </InlineStack>
                
                {automations.length > 0 ? (
                  <DataTable
                    columnContentTypes={[
                      'text',
                      'text', 
                      'text',
                      'text',
                      'text',
                      'text',
                    ]}
                    headings={[
                      'Automation Name',
                      'Channel',
                      'Status',
                      'Success Rate',
                      'Executions',
                      'Actions',
                    ]}
                    rows={rows}
                  />
                ) : (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      No automations created yet.
                    </Text>
                    <Link to="/app/marketing-automation">
                      <Button>Create Your First Automation</Button>
                    </Link>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Quick Actions</Text>
                  <BlockStack gap="200">
                    <Button fullWidth disabled={automations.length === 0}>
                      Pause All Automations
                    </Button>
                    <Button fullWidth variant="secondary" disabled={automations.length === 0}>
                      Export Report
                    </Button>
                    <Button fullWidth variant="secondary" disabled={automations.length === 0}>
                      Bulk Edit
                    </Button>
                  </BlockStack>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Performance Summary</Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Total Customers Reached</Text>
                      <Text as="span" variant="bodyMd">{totalCustomersReached}</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Average Success Rate</Text>
                      <Text as="span" variant="bodyMd">{avgSuccessRate}%</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Messages Sent Today</Text>
                      <Text as="span" variant="bodyMd">{todayExecutions}</Text>
                    </InlineStack>
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