import { authenticate } from "../shopify.server";
import { sendWhatsAppMessage } from "../utils/whatsapp.server";
import { executeAutomations } from "../services/automation.server";
import db from "../db.server";

export const action = async ({ request }) => {
  console.log('=== CUSTOMER CREATE WEBHOOK TRIGGERED ===');
  
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log('Customer created:', { topic, shop, customerId: payload?.id });
    
    const customer = payload;
    
    // Format phone number
    const phoneNumber = customer.phone;
    let formattedPhone = null;
    
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        formattedPhone = cleanPhone;
      } else if (cleanPhone.length === 10) {
        formattedPhone = `91${cleanPhone}`;
      } else {
        formattedPhone = cleanPhone;
      }
    }
    
    try {
      // Send welcome series message if phone available
      if (formattedPhone) {
        const variables = {
          firstName: customer.first_name || "Customer",
          storeName: shop.replace('.myshopify.com', ''),
          welcomeOffer: "WELCOME10",
          storeUrl: `https://${shop}`
        };
        
        await sendWhatsAppMessage(shop, formattedPhone, "welcome", variables);
        
        // Create automation record and execution
        let automation = await db.automation.findFirst({
          where: { shop, name: 'Welcome Series Webhook', trigger: 'customer_created' }
        });
        
        if (!automation) {
          automation = await db.automation.create({
            data: {
              shop,
              name: 'Welcome Series Webhook',
              channel: 'whatsapp',
              trigger: 'customer_created',
              message: 'Welcome message sent via WhatsApp',
              isActive: true,
            },
          });
        }
        
        await db.automationExecution.create({
          data: {
            automationId: automation.id,
            customerId: customer.id?.toString(),
            status: 'sent',
            sentAt: new Date(),
          },
        });
        
        console.log('Welcome message sent and execution recorded');
      }
    } catch (error) {
      console.error('Failed to send welcome message:', error);
    }
    
    // Execute other automations
    await executeAutomations(shop, "customer_created", {
      customerId: customer.id,
      customerFirstName: customer.first_name,
      customerLastName: customer.last_name,
      customerEmail: customer.email,
      phone: formattedPhone,
      email: customer.email,
      shopName: shop,
    });
    
    console.log(`Welcome automation executed for customer ${customer.id}`);
    
  } catch (error) {
    console.error('Error in customer create webhook:', error);
    return new Response('Webhook Error', { status: 500 });
  }
  
  return new Response('OK', { status: 200 });
};