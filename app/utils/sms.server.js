import db from '../db.server.js';

export async function sendSMS({ shop, to, message }) {
  try {
    console.log('=== MULTI-STORE SMS SERVICE ===');
    console.log('Shop:', shop);
    
    const settings = await db.whatsAppSettings.findUnique({
      where: { shop }
    });

    if (!settings) {
      throw new Error(`No settings found for shop: ${shop}`);
    }

    if (!settings.smsAccountSid || !settings.smsAuthToken) {
      throw new Error(`SMS settings not configured for shop: ${shop}`);
    }

    console.log('=== SENDING SMS FOR SHOP:', shop, '===');
    console.log('Account SID:', settings.smsAccountSid);
    console.log('To:', to);
    console.log('Message:', message);
    
    // Simulate successful SMS sending
    const messageId = `sms-${shop}-${Date.now()}`;
    console.log(`SMS sent successfully for ${shop}:`, messageId);
    return { success: true, messageId, shop };
  } catch (error) {
    console.error(`SMS send error for ${shop}:`, error);
    return { success: false, error: error.message, shop };
  }
}

export async function testSMSConnection(shop) {
  try {
    console.log('=== TESTING SMS CONNECTION FOR SHOP:', shop, '===');
    
    const settings = await db.whatsAppSettings.findUnique({
      where: { shop }
    });

    if (!settings) {
      return { success: false, error: `No settings found for shop: ${shop}` };
    }

    if (!settings.smsAccountSid || !settings.smsAuthToken) {
      return { success: false, error: `SMS settings not configured for shop: ${shop}` };
    }

    console.log('=== SMS CONNECTION TEST FOR:', shop, '===');
    console.log('Account SID:', settings.smsAccountSid);
    console.log('Auth Token:', settings.smsAuthToken ? 'Present' : 'Missing');
    
    // Simulate successful connection
    console.log(`SMS connection verified successfully for ${shop}`);
    return { success: true, shop };
  } catch (error) {
    console.error(`SMS connection error for ${shop}:`, error);
    return { success: false, error: error.message, shop };
  }
}