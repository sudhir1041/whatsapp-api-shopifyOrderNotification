export const action = async ({ request }) => {
  const { authenticate } = await import("../shopify.server");
  const db = (await import("../db.server")).default;
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log('Customer data erasure webhook:', { topic, shop, payload });
    
    // Handle customer data erasure
    // Delete any customer data stored in your app
    // This is required for GDPR compliance
    
    const customerId = payload.customer?.id;
    if (customerId) {
      // Delete customer-related data from your database
      console.log(`Erasing data for customer: ${customerId}`);
      // Add your data deletion logic here
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Customer data erasure error:', error);
    return new Response('Error', { status: 500 });
  }
};