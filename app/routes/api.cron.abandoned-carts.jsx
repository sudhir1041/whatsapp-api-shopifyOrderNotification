import { processAbandonedCarts } from "../services/abandoned-cart.server";

export const action = async ({ request }) => {
  console.log('=== ABANDONED CART CRON JOB TRIGGERED ===');
  
  try {
    await processAbandonedCarts();
    return new Response('Abandoned carts processed', { status: 200 });
  } catch (error) {
    console.error('Error in abandoned cart cron:', error);
    return new Response('Error processing abandoned carts', { status: 500 });
  }
};

export const loader = async () => {
  return new Response('Abandoned cart cron endpoint', { status: 200 });
};