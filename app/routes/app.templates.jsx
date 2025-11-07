import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useActionData } from "@remix-run/react";
import db from "../db.server";

export const loader = async ({ request }) => {
  try {
    await authenticate.admin(request);
    
    const templates = [
      {
        id: "welcome-series",
        name: "Welcome Series",
        description: "Onboard new customers with a 3-email sequence",
        channel: "Email",
        category: "Onboarding",
        popular: true
      },
      {
        id: "abandoned-cart",
        name: "Abandoned Cart Recovery",
        description: "Recover lost sales with targeted reminders",
        channel: "WhatsApp",
        category: "Recovery",
        popular: true
      },
      {
        id: "post-purchase",
        name: "Post-Purchase Follow-up",
        description: "Thank customers and request reviews",
        channel: "Email",
        category: "Retention",
        popular: false
      },
      {
        id: "birthday-campaign",
        name: "Birthday Campaign",
        description: "Send personalized birthday offers",
        channel: "SMS",
        category: "Engagement",
        popular: false
      },
      {
        id: "win-back",
        name: "Win-back Campaign",
        description: "Re-engage inactive customers",
        channel: "Email",
        category: "Re-engagement",
        popular: true
      },
      {
        id: "product-recommendation",
        name: "Product Recommendation",
        description: "Suggest products based on purchase history",
        channel: "WhatsApp",
        category: "Upsell",
        popular: false
      },
      {
        id: "order-confirmation",
        name: "Order Confirmation",
        description: "Send confirmation message when order is placed",
        channel: "WhatsApp",
        category: "Transactional",
        popular: true
      },
      {
        id: "order-dispatch",
        name: "Order Dispatch",
        description: "Notify customers when order is fulfilled/shipped",
        channel: "WhatsApp",
        category: "Transactional",
        popular: true
      }
    ];
    
    return { templates };
  } catch (error) {
    console.error('Templates loader error:', error);
    return { templates: [] };
  }
};

export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const templateId = formData.get("templateId");
    
    const templates = [
      {
        id: "welcome-series",
        name: "Welcome Series",
        channel: "email",
        trigger: "customer_created",
        subject: "Welcome to {{shop.name}}!",
        message: "Hi {{customer.first_name}}, welcome to our store! We're excited to have you as a customer."
      },
      {
        id: "abandoned-cart",
        name: "Abandoned Cart Recovery",
        channel: "whatsapp",
        trigger: "cart_abandoned",
        subject: "",
        message: "Hi {{customer.first_name}}, you left something in your cart! Complete your purchase now."
      },
      {
        id: "post-purchase",
        name: "Post-Purchase Follow-up",
        channel: "email",
        trigger: "order_placed",
        subject: "Thank you for your order!",
        message: "Hi {{customer.first_name}}, thank you for your order #{{order.order_number}}!"
      },
      {
        id: "birthday-campaign",
        name: "Birthday Campaign",
        channel: "sms",
        trigger: "customer_birthday",
        subject: "",
        message: "Happy Birthday {{customer.first_name}}! Enjoy 20% off your next purchase."
      },
      {
        id: "win-back",
        name: "Win-back Campaign",
        channel: "email",
        trigger: "customer_inactive",
        subject: "We miss you!",
        message: "Hi {{customer.first_name}}, we miss you! Come back and enjoy 15% off."
      },
      {
        id: "product-recommendation",
        name: "Product Recommendation",
        channel: "whatsapp",
        trigger: "order_placed",
        subject: "",
        message: "Hi {{customer.first_name}}, based on your recent purchase, you might like these products!"
      },
      {
        id: "order-confirmation",
        name: "Order Confirmation",
        channel: "whatsapp",
        trigger: "order_placed",
        subject: "",
        message: "Hi {{customer.first_name}}, your order #{{order.order_number}} has been confirmed!"
      },
      {
        id: "order-dispatch",
        name: "Order Dispatch",
        channel: "whatsapp",
        trigger: "order_fulfilled",
        subject: "",
        message: "Hi {{customer.first_name}}, your order #{{order.order_number}} has been shipped!"
      }
    ];
    
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      await db.automation.create({
        data: {
          shop: session.shop,
          name: template.name,
          channel: template.channel,
          trigger: template.trigger,
          subject: template.subject,
          message: template.message,
          isActive: true,
        },
      });
      
      return { success: `${template.name} automation created successfully!` };
    }
    
    return { error: "Template not found" };
  } catch (error) {
    console.error('Template creation error:', error);
    return { error: "Failed to create automation from template. Please try again." };
  }
};

export default function Templates() {
  const { templates } = { templates: [
    {
      id: "welcome-series",
      name: "Welcome Series",
      description: "Onboard new customers with a 3-email sequence",
      channel: "Email",
      category: "Onboarding",
      popular: true
    },
    {
      id: "abandoned-cart",
      name: "Abandoned Cart Recovery",
      description: "Recover lost sales with targeted reminders",
      channel: "WhatsApp",
      category: "Recovery",
      popular: true
    },
    {
      id: "post-purchase",
      name: "Post-Purchase Follow-up",
      description: "Thank customers and request reviews",
      channel: "Email",
      category: "Retention",
      popular: false
    },
    {
      id: "birthday-campaign",
      name: "Birthday Campaign",
      description: "Send personalized birthday offers",
      channel: "SMS",
      category: "Engagement",
      popular: false
    },
    {
      id: "win-back",
      name: "Win-back Campaign",
      description: "Re-engage inactive customers",
      channel: "Email",
      category: "Re-engagement",
      popular: true
    },
    {
      id: "product-recommendation",
      name: "Product Recommendation",
      description: "Suggest products based on purchase history",
      channel: "WhatsApp",
      category: "Upsell",
      popular: false
    },
    {
      id: "order-confirmation",
      name: "Order Confirmation",
      description: "Send confirmation message when order is placed",
      channel: "WhatsApp",
      category: "Transactional",
      popular: true
    },
    {
      id: "order-dispatch",
      name: "Order Dispatch",
      description: "Notify customers when order is fulfilled/shipped",
      channel: "WhatsApp",
      category: "Transactional",
      popular: true
    }
  ]};
  
  const actionData = useActionData();

  return (
    <Page>
      <TitleBar title="Automation Templates">
        <Button variant="secondary">Create Custom Template</Button>
      </TitleBar>
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
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingLg">Choose a Template</Text>
                <InlineStack gap="200">
                  <Badge tone="info">8 Templates Available</Badge>
                </InlineStack>
              </InlineStack>
              
              <Layout>
                {templates.map((template, index) => (
                  <Layout.Section key={index} variant="oneHalf">
                    <Card>
                      <BlockStack gap="300">
                        <InlineStack align="space-between">
                          <BlockStack gap="100">
                            <InlineStack gap="200">
                              <Text as="h3" variant="headingMd">{template.name}</Text>
                              {template.popular && <Badge tone="success">Popular</Badge>}
                            </InlineStack>
                            <Text as="p" variant="bodyMd" tone="subdued">
                              {template.description}
                            </Text>
                          </BlockStack>
                        </InlineStack>
                        
                        <InlineStack align="space-between">
                          <InlineStack gap="200">
                            <Badge>{template.channel}</Badge>
                            <Badge tone="info">{template.category}</Badge>
                          </InlineStack>
                          <form method="post" style={{display: 'inline'}}>
                            <input type="hidden" name="templateId" value={template.id} />
                            <Button submit>Use Template</Button>
                          </form>
                        </InlineStack>
                      </BlockStack>
                    </Card>
                  </Layout.Section>
                ))}
              </Layout>
            </BlockStack>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Template Categories</Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Onboarding</Text>
                      <Badge>1</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Recovery</Text>
                      <Badge>1</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Retention</Text>
                      <Badge>1</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Engagement</Text>
                      <Badge>1</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Re-engagement</Text>
                      <Badge>1</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Upsell</Text>
                      <Badge>1</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Transactional</Text>
                      <Badge>2</Badge>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Need Help?</Text>
                  <Text as="p" variant="bodyMd">
                    Not sure which template to choose? Our templates are designed to help you get started quickly with proven automation strategies.
                  </Text>
                  <Button fullWidth variant="secondary">View Documentation</Button>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}