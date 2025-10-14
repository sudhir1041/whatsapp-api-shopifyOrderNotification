import { authenticate } from "../shopify.server";
import { sendWhatsAppMessage, formatProductNames } from "../utils/whatsapp.server";
import { executeAutomations } from "../services/automation.server";
import { markCartAsConverted } from "../services/abandoned-cart.server";
import db from "../db.server";

export const action = async ({ request }) => {
  console.log('=== ORDER PAID WEBHOOK TRIGGERED ===');
  console.log('Request URL:', request.url);
  console.log('Request method:', request.method);
  
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log('Webhook authenticated successfully:', { topic, shop, orderId: payload?.id });
    
    const order = payload;
    
    // Check if we already processed this order
    const orderKey = `${shop}_order_${order.id}`;
    const processed = global.processedOrders = global.processedOrders || new Set();
    
    if (processed.has(orderKey)) {
      console.log(`Order ${order.id} already processed, skipping`);
      return new Response('OK', { status: 200 });
    }
    
    // Mark as processing
    processed.add(orderKey);
    
    // Only send notifications for recent orders (within last 5 minutes)
    const orderTime = new Date(order.created_at || order.updated_at);
    const now = new Date();
    const timeDiff = (now - orderTime) / (1000 * 60); // difference in minutes
    
    if (timeDiff > 5) {
      console.log(`Skipping old order notification. Order age: ${timeDiff.toFixed(1)} minutes`);
      return new Response('OK', { status: 200 });
    }
    
    console.log(`Processing recent order. Age: ${timeDiff.toFixed(1)} minutes`);
    console.log('Order line items:', JSON.stringify(order.line_items?.map(item => ({ title: item.title, name: item.name })), null, 2));
    
    // Mark any associated cart as converted
    if (order.cart_token) {
      await markCartAsConverted(order.cart_token, shop);
    }
    
    // Extract customer phone number
    const phoneNumber = order.phone || order.billing_address?.phone || order.shipping_address?.phone;
    
    if (!phoneNumber) {
      console.log("No phone number found for order:", order.id);
      return new Response('OK', { status: 200 });
    }

    // Format phone number for Indian numbers (91 + 10 digits)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    let formattedPhone;
    
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      // Already has 91 prefix with 10 digits
      formattedPhone = cleanPhone;
    } else if (cleanPhone.length === 10) {
      // 10 digit number, add 91 prefix
      formattedPhone = `91${cleanPhone}`;
    } else if (cleanPhone.startsWith('918') && cleanPhone.length === 13) {
      // Remove extra 1 prefix, keep 91
      formattedPhone = cleanPhone.substring(1);
    } else {
      // Use as is
      formattedPhone = cleanPhone;
    }

    // Get all product names (full names, joined by commas)
    const productNames = order.line_items?.map(item => item.title.trim()).join(', ') || 'Product';
    
    console.log('All product names:', productNames);

    // Calculate total price with correct currency
    const currency = order.currency || order.presentment_currency || 'USD';
    let totalPrice;
    
    if (currency === 'INR') {
      totalPrice = `₹${order.total_price}`;
    } else if (currency === 'USD') {
      totalPrice = `$${order.total_price}`;
    } else {
      totalPrice = `${currency} ${order.total_price}`;
    }

    // Prepare variables for template (swapped product and price order)
    const variables = {
      firstName: order.customer?.first_name || order.billing_address?.first_name || "Customer",
      orderId: order.order_number || order.id,
      productName: totalPrice,
      price: productNames
    };

    try {
      let messageSent = false;
      
      // Send WhatsApp notification if phone available
      if (formattedPhone) {
        try {
          await sendWhatsAppMessage(shop, formattedPhone, "order", variables);
          messageSent = true;
          console.log('WhatsApp order confirmation sent');
        } catch (whatsappError) {
          console.error('WhatsApp send failed:', whatsappError);
        }
      }
      
      // TODO: Add email functionality later
      // Email notifications will be implemented separately
      
      // Only create automation record if at least one message was sent
      if (messageSent) {
        // Create or find automation record for webhook
        let automation = await db.automation.findFirst({
          where: { shop, name: 'Order Paid Webhook', trigger: 'order_placed' }
        });
        
        if (!automation) {
          automation = await db.automation.create({
            data: {
              shop,
              name: 'Order Paid Webhook',
              channel: 'whatsapp',
              trigger: 'order_placed',
              message: 'Order confirmation sent via WhatsApp',
              isActive: true,
            },
          });
        }
        
        // Save execution record for analytics
        const execution = await db.automationExecution.create({
          data: {
            automationId: automation.id,
            customerId: order.customer?.id?.toString(),
            orderId: order.id?.toString(),
            status: 'sent',
            sentAt: new Date(),
          },
        });
        
        console.log('WhatsApp message sent and execution recorded:', {
          executionId: execution.id,
          automationId: automation.id,
          automationName: automation.name,
          status: execution.status,
          sentAt: execution.sentAt
        });
      }
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      
      // Create automation record if needed and save failed execution
      let automation = await db.automation.findFirst({
        where: { shop, name: 'Order Paid Webhook', trigger: 'order_placed' }
      });
      
      if (!automation) {
        automation = await db.automation.create({
          data: {
            shop,
            name: 'Order Paid Webhook',
            channel: 'whatsapp',
            trigger: 'order_placed',
            message: 'Order confirmation sent via WhatsApp',
            isActive: true,
          },
        });
      }
      
      await db.automationExecution.create({
        data: {
          automationId: automation.id,
          customerId: order.customer?.id?.toString(),
          orderId: order.id?.toString(),
          status: 'failed',
          errorMessage: error.message,
        },
      });
    }
    
    // Execute automations
    await executeAutomations(shop, "order_placed", {
      customerId: order.customer?.id,
      orderId: order.id,
      customerFirstName: order.customer?.first_name || order.billing_address?.first_name,
      customerLastName: order.customer?.last_name || order.billing_address?.last_name,
      customerEmail: order.customer?.email || order.email,
      phone: formattedPhone,
      email: order.customer?.email || order.email,
      orderTotal: totalPrice,
      orderNumber: order.order_number || order.id,
      shopName: shop,
    });
    
    console.log(`WhatsApp notification and automations executed for order ${order.id}`);
    
  } catch (error) {
    console.error('Error in order paid webhook:', error);
    return new Response('Webhook Error', { status: 500 });
  }
  
  return new Response('OK', { status: 200 });
};