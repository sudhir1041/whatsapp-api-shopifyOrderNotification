import db from '../db.server.js';

let nodemailer;

async function getNodemailer() {
  if (!nodemailer) {
    nodemailer = await import('nodemailer');
  }
  return nodemailer.default || nodemailer;
}

export async function createEmailTransporter(shop) {
  const settings = await db.whatsAppSettings.findUnique({
    where: { shop }
  });

  if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
    throw new Error('SMTP settings not configured');
  }

  const nm = await getNodemailer();
  return nm.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: settings.smtpSecure,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPassword,
    },
  });
}

export async function sendEmail({ shop, to, subject, html, text }) {
  try {
    const transporter = await createEmailTransporter(shop);
    const settings = await db.whatsAppSettings.findUnique({
      where: { shop }
    });

    const info = await transporter.sendMail({
      from: settings.fromEmail || settings.smtpUser,
      to,
      subject,
      html,
      text,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

export async function testEmailConnection(shop) {
  try {
    const transporter = await createEmailTransporter(shop);
    await transporter.verify();
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