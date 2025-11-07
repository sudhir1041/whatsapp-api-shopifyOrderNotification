import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  console.log('=== ORDER PAID WEBHOOK TRIGGERED ===');
  
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    console.log('Order paid webhook received:', { topic, shop, orderId: payload?.id });
    
    // Basic webhook processing - detailed logic will be implemented server-side
    const order = payload;
    
    // Log order details for debugging
    console.log('Order details:', {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer?.first_name,
      totalPrice: order.total_price,
      phone: order.phone || order.billing_address?.phone
    });
    
    // TODO: Implement WhatsApp messaging and automation logic
    // This will be handled by server-side services
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error in order paid webhook:', error);
    return new Response('Webhook Error', { status: 500 });
  }
};