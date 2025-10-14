import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server.js';
import { sendEmail } from '../utils/smtp.server.js';

export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    
    const testEmail = formData.get('testEmail');
    
    if (!testEmail) {
      return json({ success: false, error: 'Test email address is required' });
    }

    console.log('=== TEST EMAIL API ===');
    console.log('Shop:', session.shop);
    console.log('Test Email:', testEmail);
    
    const result = await sendEmail({
      shop: session.shop,
      to: testEmail,
      subject: 'Test Email from WaNotify',
      html: `
        <h2>Test Email Successful!</h2>
        <p>This is a test email from your WaNotify app.</p>
        <p>Your SMTP configuration is working correctly.</p>
        <p><strong>Shop:</strong> ${session.shop}</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
      `,
      text: `Test Email Successful! This is a test email from your WaNotify app. Your SMTP configuration is working correctly. Shop: ${session.shop}. Sent at: ${new Date().toLocaleString()}`
    });

    return json(result);
  } catch (error) {
    console.error('Test email error:', error);
    return json({ success: false, error: error.message });
  }
};