export const action = async ({ request }) => {
  console.log('=== ORDER FULFILLED WEBHOOK TRIGGERED ===');
  console.log('Request URL:', request.url);
  console.log('Request method:', request.method);
  
  const { authenticate } = await import("../shopify.server");
  const { sendWhatsAppMessage, formatProductNames } = await import("../utils/whatsapp.server");
  const { executeAutomations } = await import("../services/automation.server");
  const db = (await import("../db.server")).default;
  
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log('Webhook authenticated successfully:', { topic, shop, orderId: payload?.id });
    
    const order = payload;
    
    // Check if we already processed this fulfillment
    const fulfillmentKey = `${shop}_fulfillment_${order.id}`;
    const processed = global.processedFulfillments = global.processedFulfillments || new Set();
    
    if (processed.has(fulfillmentKey)) {
      console.log(`Fulfillment ${order.id} already processed, skipping`);
      return new Response('OK', { status: 200 });
    }
    
    // Mark as processing
    processed.add(fulfillmentKey);
    
    // Only send notifications for recent fulfillments (within last 5 minutes)
    const fulfillmentTime = new Date(order.fulfillments?.[0]?.created_at || order.updated_at);
    const now = new Date();
    const timeDiff = (now - fulfillmentTime) / (1000 * 60); // difference in minutes
    
    if (timeDiff > 5) {
      console.log(`Skipping old fulfillment notification. Fulfillment age: ${timeDiff.toFixed(1)} minutes`);
      return new Response('OK', { status: 200 });
    }
    
    console.log(`Processing recent fulfillment. Age: ${timeDiff.toFixed(1)} minutes`);
    console.log('Fulfillment data:', JSON.stringify(payload?.fulfillments, null, 2));

    
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

    // Get tracking information from fulfillments
    const fulfillment = order.fulfillments?.[0];
    let trackingNumber = "N/A";
    let trackingUrl = "";
    
    if (fulfillment) {
      // Get tracking number
      trackingNumber = fulfillment.tracking_number || 
                      fulfillment.tracking_numbers?.[0] || 
                      "N/A";
      
      // Get tracking URL - try multiple sources
      trackingUrl = fulfillment.tracking_url || 
                   fulfillment.tracking_urls?.[0] || 
                   fulfillment.tracking_company_url || 
                   (fulfillment.tracking_number ? `https://track.example.com/${fulfillment.tracking_number}` : "") ||
                   "";
    }

    // Prepare variables for template
    const variables = {
      firstName: order.customer?.first_name || order.billing_address?.first_name || "Customer",
      orderId: order.order_number || order.id,
      trackingId: trackingNumber,
      trackingUrl: trackingUrl || `https://track.shopify.com/${order.order_number}`
    };

    try {
      // Send WhatsApp notification
      console.log('Attempting to send fulfillment notification:', { shop, formattedPhone, variables });
      await sendWhatsAppMessage(shop, formattedPhone, "fulfillment", variables);
      
      // Create or find automation record for webhook
      let automation = await db.automation.findFirst({
        where: { shop, name: 'Order Fulfilled Webhook', trigger: 'order_fulfilled' }
      });
      
      if (!automation) {
        automation = await db.automation.create({
          data: {
            shop,
            name: 'Order Fulfilled Webhook',
            channel: 'whatsapp',
            trigger: 'order_fulfilled',
            message: 'Order fulfillment notification sent via WhatsApp',
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
      
      console.log('WhatsApp fulfillment message sent and execution recorded:', {
        executionId: execution.id,
        automationId: automation.id,
        automationName: automation.name,
        status: execution.status,
        sentAt: execution.sentAt
      });
    } catch (error) {
      console.error('Failed to send WhatsApp fulfillment message:', error);
      
      // Create automation record if needed and save failed execution
      let automation = await db.automation.findFirst({
        where: { shop, name: 'Order Fulfilled Webhook', trigger: 'order_fulfilled' }
      });
      
      if (!automation) {
        automation = await db.automation.create({
          data: {
            shop,
            name: 'Order Fulfilled Webhook',
            channel: 'whatsapp',
            trigger: 'order_fulfilled',
            message: 'Order fulfillment notification sent via WhatsApp',
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
    await executeAutomations(shop, "order_fulfilled", {
      customerId: order.customer?.id,
      orderId: order.id,
      customerFirstName: order.customer?.first_name || order.billing_address?.first_name,
      customerLastName: order.customer?.last_name || order.billing_address?.last_name,
      customerEmail: order.customer?.email || order.email,
      phone: formattedPhone,
      email: order.customer?.email || order.email,
      orderTotal: order.total_price,
      orderNumber: order.order_number || order.id,
      shopName: shop,
    });
    
    console.log(`WhatsApp fulfillment notification and automations executed for order ${order.id}`);
    
  } catch (error) {
    console.error('Error in order fulfilled webhook:', error);
    return new Response('Webhook Error', { status: 500 });
  }
  
  return new Response('OK', { status: 200 });
};