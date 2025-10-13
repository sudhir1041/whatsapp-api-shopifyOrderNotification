import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Badge,
  ProgressBar,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Get all automations with their executions
    const automations = await db.automation.findMany({
      where: { shop: session.shop },
      include: { 
        executions: {
          orderBy: { createdAt: 'desc' }
        }
      },
    });
    
    console.log('=== DATABASE QUERY DEBUG ===');
    console.log('Shop:', session.shop);
    console.log('Found automations:', automations.length);
    automations.forEach(auto => {
      console.log(`- ${auto.name}: ${auto.executions.length} executions`);
    });

    // Get all executions for today's calculation
    const allExecutions = await db.automationExecution.findMany({
      where: {
        automation: {
          shop: session.shop
        }
      },
      include: {
        automation: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Total executions found:', allExecutions.length);
    
    // Get cart abandonment data
    let totalCarts = 0, abandonedCarts = 0, convertedCarts = 0, activeCarts = 0;
    
    try {
      totalCarts = await db.cart.count({ where: { shop: session.shop } });
      abandonedCarts = await db.cart.count({ where: { shop: session.shop, status: 'abandoned' } });
      convertedCarts = await db.cart.count({ where: { shop: session.shop, status: 'converted' } });
      activeCarts = await db.cart.count({ where: { shop: session.shop, status: 'active' } });
    } catch (cartError) {
      console.log('Cart table not found or empty:', cartError.message);
    }
    
    const abandonmentRate = totalCarts > 0 ? ((abandonedCarts / totalCarts) * 100).toFixed(1) : 0;
    const conversionRate = totalCarts > 0 ? ((convertedCarts / totalCarts) * 100).toFixed(1) : 0;

    const totalAutomations = automations.length;
    const activeAutomations = automations.filter(a => a.isActive).length;
    
    // Use allExecutions for calculations
    const successfulExecutions = allExecutions.filter(e => e.status === 'sent').length;
    const totalExecutions = allExecutions.length;
    const successRate = totalExecutions > 0 ? ((successfulExecutions / totalExecutions) * 100).toFixed(1) : 0;
    
    const todayExecutions = allExecutions.filter(e => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const executionDate = new Date(e.createdAt || e.sentAt);
      return executionDate >= today && executionDate < tomorrow;
    }).length;
    
    console.log('=== ANALYTICS SUMMARY ===');
    console.log('Total automations:', totalAutomations);
    console.log('Total executions:', totalExecutions);
    console.log('Successful executions:', successfulExecutions);
    console.log('Today executions:', todayExecutions);
    console.log('Success rate:', successRate + '%');
    console.log('Cart stats:', { totalCarts, abandonedCarts, convertedCarts });
    
    if (allExecutions.length > 0) {
      console.log('Recent executions:');
      allExecutions.slice(0, 3).forEach(e => {
        console.log(`- ${e.automation?.name || 'Unknown'}: ${e.status} at ${e.createdAt}`);
      });
    }
    
    // Get specific automation analytics
    const abandonedCartAutomation = automations.find(a => a.name === 'Abandoned Cart Webhook');
    const welcomeSeriesAutomation = automations.find(a => a.name === 'Welcome Series Webhook');
    const orderPaidAutomation = automations.find(a => a.name === 'Order Paid Webhook');
    const orderFulfilledAutomation = automations.find(a => a.name === 'Order Fulfilled Webhook');
    
    const abandonedCartStats = {
      sent: abandonedCartAutomation?.executions.filter(e => e.status === 'sent').length || 0,
      failed: abandonedCartAutomation?.executions.filter(e => e.status === 'failed').length || 0,
      total: abandonedCartAutomation?.executions.length || 0
    };
    
    const welcomeSeriesStats = {
      sent: welcomeSeriesAutomation?.executions.filter(e => e.status === 'sent').length || 0,
      failed: welcomeSeriesAutomation?.executions.filter(e => e.status === 'failed').length || 0,
      total: welcomeSeriesAutomation?.executions.length || 0
    };
    
    const orderStats = {
      confirmations: orderPaidAutomation?.executions.filter(e => e.status === 'sent').length || 0,
      fulfillments: orderFulfilledAutomation?.executions.filter(e => e.status === 'sent').length || 0
    };

    const campaignPerformance = automations.slice(0, 3).map(automation => {
      const automationExecutions = automation.executions;
      const successful = automationExecutions.filter(e => e.status === 'sent').length;
      const total = automationExecutions.length;
      const completion = total > 0 ? Math.round((successful / total) * 100) : 0;
      
      return {
        name: automation.name,
        completion,
        tone: completion >= 80 ? 'success' : 'primary'
      };
    });

    const recentActivity = allExecutions
      .slice(0, 3)
      .map(e => {
        return `${e.automation?.name || 'Automation'} ${e.status === 'sent' ? 'sent' : 'failed'} to customer`;
      });

    return {
      totalAutomations,
      activeAutomations,
      successRate,
      todayExecutions,
      campaignPerformance,
      recentActivity,
      cartStats: {
        totalCarts,
        abandonedCarts,
        convertedCarts,
        activeCarts,
        abandonmentRate,
        conversionRate
      },
      automationStats: {
        abandonedCart: abandonedCartStats,
        welcomeSeries: welcomeSeriesStats,
        orders: orderStats
      }
    };
  } catch (error) {
    console.error('Analytics error:', error);
    return {
      totalAutomations: 0,
      activeAutomations: 0,
      successRate: 0,
      todayExecutions: 0,
      campaignPerformance: [],
      recentActivity: [],
      cartStats: {
        totalCarts: 0,
        abandonedCarts: 0,
        convertedCarts: 0,
        activeCarts: 0,
        abandonmentRate: 0,
        conversionRate: 0
      },
      automationStats: {
        abandonedCart: { sent: 0, failed: 0, total: 0 },
        welcomeSeries: { sent: 0, failed: 0, total: 0 },
        orders: { confirmations: 0, fulfillments: 0 }
      }
    };
  }
};

export default function Index() {
  const analytics = useLoaderData();
  const revalidator = useRevalidator();
  
  // Auto-refresh every 30 seconds for real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      revalidator.revalidate();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [revalidator]);
  
  return (
    <Page>
      <TitleBar title="Analytics Dashboard">
        <Button onClick={() => revalidator.revalidate()} loading={revalidator.state === 'loading'}>
          Refresh Data
        </Button>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <InlineStack gap="400">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">Total Automations</Text>
                    <Text as="p" variant="heading2xl">{analytics.totalAutomations}</Text>
                    <Badge tone="info">Created</Badge>
                  </BlockStack>
                </Card>
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">Active Campaigns</Text>
                    <Text as="p" variant="heading2xl">{analytics.activeAutomations}</Text>
                    <Badge tone="success">Running</Badge>
                  </BlockStack>
                </Card>
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">Success Rate</Text>
                    <Text as="p" variant="heading2xl">{analytics.successRate}%</Text>
                    <Badge tone={analytics.successRate >= 80 ? "success" : "warning"}>
                      {analytics.successRate >= 80 ? "Excellent" : "Good"}
                    </Badge>
                  </BlockStack>
                </Card>
              </InlineStack>
              
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">Campaign Performance</Text>
                  <BlockStack gap="300">
                    {analytics.campaignPerformance.length > 0 ? (
                      analytics.campaignPerformance.map((campaign, index) => (
                        <BlockStack key={index} gap="200">
                          <InlineStack align="space-between">
                            <Text as="span" variant="bodyMd">{campaign.name}</Text>
                            <Text as="span" variant="bodyMd">{campaign.completion}% completion</Text>
                          </InlineStack>
                          <ProgressBar progress={campaign.completion} tone={campaign.tone} />
                        </BlockStack>
                      ))
                    ) : (
                      <Text as="p" variant="bodyMd" tone="subdued">
                        No campaigns yet. Create automations to see performance metrics.
                      </Text>
                    )}
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Recent Activity</Text>
                  <BlockStack gap="200">
                    {analytics.recentActivity.length > 0 ? (
                      analytics.recentActivity.map((activity, index) => (
                        <Text key={index} as="p" variant="bodyMd">• {activity}</Text>
                      ))
                    ) : (
                      <Text as="p" variant="bodyMd" tone="subdued">
                        No recent activity. Automations will appear here once they start running.
                      </Text>
                    )}
                  </BlockStack>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Quick Stats</Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Messages Sent Today</Text>
                      <Text as="span" variant="bodyMd">{analytics.todayExecutions}</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Total Automations</Text>
                      <Text as="span" variant="bodyMd">{analytics.totalAutomations}</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Active Now</Text>
                      <Text as="span" variant="bodyMd">{analytics.activeAutomations}</Text>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Cart Analytics</Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Total Carts</Text>
                      <Text as="span" variant="bodyMd">{analytics.cartStats.totalCarts}</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Abandoned</Text>
                      <Text as="span" variant="bodyMd">{analytics.cartStats.abandonedCarts}</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Converted</Text>
                      <Text as="span" variant="bodyMd">{analytics.cartStats.convertedCarts}</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Abandonment Rate</Text>
                      <Text as="span" variant="bodyMd">{analytics.cartStats.abandonmentRate}%</Text>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Abandoned Cart Recovery</Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Messages Sent</Text>
                      <Text as="span" variant="bodyMd">{analytics.automationStats?.abandonedCart?.sent || 0}</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Failed</Text>
                      <Text as="span" variant="bodyMd">{analytics.automationStats?.abandonedCart?.failed || 0}</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Success Rate</Text>
                      <Text as="span" variant="bodyMd">
                        {analytics.automationStats?.abandonedCart?.total > 0 ? 
                          Math.round((analytics.automationStats.abandonedCart.sent / analytics.automationStats.abandonedCart.total) * 100) : 0}%
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Welcome Series</Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Welcome Messages</Text>
                      <Text as="span" variant="bodyMd">{analytics.automationStats?.welcomeSeries?.sent || 0}</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Failed</Text>
                      <Text as="span" variant="bodyMd">{analytics.automationStats?.welcomeSeries?.failed || 0}</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Success Rate</Text>
                      <Text as="span" variant="bodyMd">
                        {analytics.automationStats?.welcomeSeries?.total > 0 ? 
                          Math.round((analytics.automationStats.welcomeSeries.sent / analytics.automationStats.welcomeSeries.total) * 100) : 0}%
                      </Text>
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