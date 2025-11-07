import db from '../db.server.js';

export async function sendEmail({ shop, to, subject, html, text }) {
  try {
    const settings = await db.whatsAppSettings.findUnique({
      where: { shop }
    });

    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
      throw new Error('SMTP settings not configured');
    }

    console.log('=== EMAIL WOULD BE SENT ===');
    console.log('SMTP Host:', settings.smtpHost);
    console.log('SMTP User:', settings.smtpUser);
    console.log('From:', settings.fromEmail || settings.smtpUser);
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html.substring(0, 100) + '...');
    
    // Simulate successful email sending
    const messageId = 'test-' + Date.now();
    console.log('Email simulated successfully:', messageId);
    return { success: true, messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

export async function testEmailConnection(shop) {
  try {
    const settings = await db.whatsAppSettings.findUnique({
      where: { shop }
    });

    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
      return { success: false, error: 'SMTP settings not configured' };
    }

    console.log('=== SMTP CONNECTION TEST ===');
    console.log('Host:', settings.smtpHost);
    console.log('Port:', settings.smtpPort);
    console.log('User:', settings.smtpUser);
    console.log('Secure:', settings.smtpSecure);
    
    // Simulate successful connection
    console.log('SMTP connection simulated successfully');
    return { success: true };
  } catch (error) {
    console.error('SMTP connection error:', error);
    return { success: false, error: error.message };
  }
}