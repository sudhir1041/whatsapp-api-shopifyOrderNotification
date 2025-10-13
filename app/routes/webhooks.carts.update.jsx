import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  console.log('=== CART UPDATE WEBHOOK TRIGGERED ===');
  
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log('Cart updated:', { topic, shop, cartId: payload?.id });
    
    const cart = payload;
    
    // Update cart data
    const cartData = {
      customerEmail: cart.email || null,
      customerPhone: cart.phone || null,
      lineItems: JSON.stringify(cart.line_items || []),
      totalPrice: cart.total_price || '0',
      currency: cart.currency || 'USD',
      updatedAt: new Date(),
    };
    
    console.log('Updating cart data:', {
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
    
    console.log(`Cart ${cart.id} updated successfully`);
    
    // Log if cart is empty (potential abandonment)
    if (!cart.line_items || cart.line_items.length === 0) {
      console.log(`Cart ${cart.id} is now empty - may be abandoned`);
    }
    
  } catch (error) {
    console.error('Error in cart update webhook:', error);
    return new Response('Webhook Error', { status: 500 });
  }
  
  return new Response('OK', { status: 200 });
};