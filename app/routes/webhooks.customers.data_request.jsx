import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log('Customer data request webhook:', { topic, shop, payload });
    
    // Handle customer data request
    // This webhook is triggered when a customer requests their data
    // You should collect and return all customer data your app has stored
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Customer data request error:', error);
    return new Response('Error', { status: 500 });
  }
};