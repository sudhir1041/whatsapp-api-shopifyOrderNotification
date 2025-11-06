export const action = async ({ request }) => {
  try {
    const { authenticate } = await import("../shopify.server");
    const db = (await import("../db.server")).default;
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log('Shop data erasure webhook:', { topic, shop, payload });
    
    // Handle shop data erasure
    // Delete all shop data when app is uninstalled
    // This is required for GDPR compliance
    
    if (shop) {
      console.log(`Erasing all data for shop: ${shop}`);
      
      // Delete WhatsApp settings
      await db.whatsAppSettings.deleteMany({
        where: { shop: shop }
      });
      
      console.log(`Shop data erased for: ${shop}`);
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Shop data erasure error:', error);
    return new Response('Error', { status: 500 });
  }
};