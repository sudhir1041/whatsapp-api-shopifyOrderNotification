export const action = async ({ request }) => {
  const { authenticate } = await import("../shopify.server");
  const db = (await import("../db.server")).default;
  console.log('=== CART UPDATE WEBHOOK TRIGGERED ===');
  
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log('Cart updated:', { topic, shop, cartId: payload?.id });
    console.log('Full cart payload:', JSON.stringify(payload, null, 2));
    
    const cart = payload;
    
    // Extract phone from multiple sources
    let phoneNumber = cart.phone || 
                     cart.billing_address?.phone || 
                     cart.shipping_address?.phone || 
                     cart.customer?.phone || 
                     cart.customer?.default_address?.phone ||
                     cart.attributes?.find(attr => attr.key === 'phone')?.value ||
                     cart.note_attributes?.find(attr => attr.name === 'phone')?.value;
    
    // Extract email from multiple sources
    let email = cart.email || 
               cart.customer?.email || 
               cart.billing_address?.email || 
               cart.shipping_address?.email ||
               cart.attributes?.find(attr => attr.key === 'email')?.value ||
               cart.note_attributes?.find(attr => attr.name === 'email')?.value;
    
    // Update cart data
    const cartData = {
      customerEmail: email || null,
      customerPhone: phoneNumber || null,
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