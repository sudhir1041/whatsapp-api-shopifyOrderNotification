export const action = async ({ request }) => {
  const { authenticate } = await import("../shopify.server");
  const db = (await import("../db.server")).default;
  console.log('=== CART CREATE WEBHOOK TRIGGERED ===');
  
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log('Cart created:', { topic, shop, cartId: payload?.id });
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
    
    console.log('Extracted contact info:', {
      originalPhone: cart.phone,
      extractedPhone: phoneNumber,
      originalEmail: cart.email,
      extractedEmail: email,
      billingPhone: cart.billing_address?.phone,
      shippingPhone: cart.shipping_address?.phone
    });
    
    // Store cart data for abandoned cart tracking
    const cartData = {
      customerEmail: email || null,
      customerPhone: phoneNumber || null,
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