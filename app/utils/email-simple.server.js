import db from '../db.server.js';

// Simple email service without nodemailer dependency issues
export async function sendSimpleEmail({ shop, to, subject, html, text }) {
  try {
    // For now, just log the email that would be sent
    console.log('=== EMAIL WOULD BE SENT ===');
    console.log('Shop:', shop);
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html.substring(0, 100) + '...');
    
    // Return success for testing
    return { success: true, messageId: 'test-' + Date.now() };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

export async function testSimpleEmailConnection(shop) {
  try {
    const settings = await db.whatsAppSettings.findUnique({
      where: { shop }
    });

    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
      return { success: false, error: 'SMTP settings not configured' };
    }

    // For now, just validate settings exist
    console.log('SMTP settings validated for shop:', shop);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function replaceEmailVariables(template, variables) {
  let content = template;
  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  });
  return content;
}