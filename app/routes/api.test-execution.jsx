import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Create a test automation if it doesn't exist
    let automation = await db.automation.findFirst({
      where: { shop: session.shop, name: 'Test Automation' }
    });
    
    if (!automation) {
      automation = await db.automation.create({
        data: {
          shop: session.shop,
          name: 'Test Automation',
          channel: 'whatsapp',
          trigger: 'test',
          message: 'Test message',
          isActive: true,
        },
      });
    }
    
    // Create a test execution
    const execution = await db.automationExecution.create({
      data: {
        automationId: automation.id,
        status: 'sent',
        sentAt: new Date(),
      },
    });
    
    console.log('Test execution created:', execution);
    
    return new Response(JSON.stringify({ 
      success: true, 
      execution,
      automation: automation.name 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Test execution error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const loader = async () => {
  return new Response('Test execution endpoint', { status: 200 });
};