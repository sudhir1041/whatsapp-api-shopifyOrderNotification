import db from '../db.server.js';

export async function sendSMS({ shop, to, message }) {
  try {
    const settings = await db.whatsAppSettings.findUnique({
      where: { shop }
    });

    if (!settings?.smsAccountSid || !settings?.smsAuthToken) {
      throw new Error('SMS settings not configured');
    }

    console.log('=== SMS WOULD BE SENT ===');
    console.log('Account SID:', settings.smsAccountSid);
    console.log('To:', to);
    console.log('Message:', message);
    
    // Simulate successful SMS sending
    const messageId = 'sms-' + Date.now();
    console.log('SMS simulated successfully:', messageId);
    return { success: true, messageId };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
}

export async function testSMSConnection(shop) {
  try {
    const settings = await db.whatsAppSettings.findUnique({
      where: { shop }
    });

    if (!settings?.smsAccountSid || !settings?.smsAuthToken) {
      return { success: false, error: 'SMS settings not configured' };
    }

    console.log('=== SMS CONNECTION TEST ===');
    console.log('Account SID:', settings.smsAccountSid);
    console.log('Auth Token:', settings.smsAuthToken ? 'Present' : 'Missing');
    
    // Simulate successful connection
    console.log('SMS connection simulated successfully');
    return { success: true };
  } catch (error) {
    console.error('SMS connection error:', error);
    return { success: false, error: error.message };
  }
}