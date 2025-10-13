import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  console.log('=== CART CREATE WEBHOOK TRIGGERED ===');
  
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log('Cart created:', { topic, shop, cartId: payload?.id });
    
    const cart = payload;
    
    // Store cart data for abandoned cart tracking
    const cartData = {
      customerEmail: cart.email || null,
      customerPhone: cart.phone || null,
      lineItems: JSON.stringify(cart.line_items || []),
      totalPrice: cart.total_price || '0',
      currency: cart.currency || 'USD',
      updatedAt: new Date(),
    };
    
    console.log('Storing cart data:', {
      cartId: cart.id,
      shop: shop,
      hasEmail: !!cart.email,
      hasPhone: !!cart.phone,
      itemCount: cart.line_items?.length || 0,
      totalPrice: cart.total_price
    });
    
    await db.cart.upsert({
      where: { 
        cartId_shop: {
          cartId: cart.id,
          shop: shop
        }
      },
      update: cartData,
      create: {
        cartId: cart.id,
        shop: shop,
        status: 'active',
        ...cartData
      },
    });
    
    console.log(`Cart ${cart.id} stored/updated for abandonment tracking`);
    
    // If cart has items and contact info, it's a potential abandonment candidate
    if (cart.line_items?.length > 0 && (cart.email || cart.phone)) {
      console.log(`Cart ${cart.id} is trackable for abandonment (has items and contact info)`);
    }
    
  } catch (error) {
    console.error('Error in cart create webhook:', error);
    return new Response('Webhook Error', { status: 500 });
  }
  
  return new Response('OK', { status: 200 });
};