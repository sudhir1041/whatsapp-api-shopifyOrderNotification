import { createRequire } from 'module';
import db from '../db.server.js';

const require = createRequire(import.meta.url);

export async function sendEmail({ shop, to, subject, html, text }) {
  try {
    console.log('=== MULTI-STORE EMAIL SERVICE ===');
    console.log('Shop:', shop);
    
    const settings = await db.whatsAppSettings.findUnique({
      where: { shop }
    });

    if (!settings) {
      throw new Error(`No settings found for shop: ${shop}`);
    }

    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      throw new Error(`SMTP settings not configured for shop: ${shop}`);
    }

    // Use require to import nodemailer
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: settings.smtpSecure || false,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    console.log('=== SENDING EMAIL FOR SHOP:', shop, '===');
    console.log('SMTP Host:', settings.smtpHost);
    console.log('SMTP User:', settings.smtpUser);
    console.log('From:', settings.fromEmail || settings.smtpUser);
    console.log('To:', to);
    console.log('Subject:', subject);

    const info = await transporter.sendMail({
      from: settings.fromEmail || settings.smtpUser,
      to,
      subject,
      html,
      text,
    });

    console.log(`Email sent successfully for ${shop}:`, info.messageId);
    return { success: true, messageId: info.messageId, shop };
  } catch (error) {
    console.error(`Email send error for ${shop}:`, error);
    return { success: false, error: error.message, shop };
  }
}

export async function testEmailConnection(shop) {
  try {
    console.log('=== TESTING EMAIL CONNECTION FOR SHOP:', shop, '===');
    
    const settings = await db.whatsAppSettings.findUnique({
      where: { shop }
    });

    if (!settings) {
      return { success: false, error: `No settings found for shop: ${shop}` };
    }

    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      return { success: false, error: `SMTP settings not configured for shop: ${shop}` };
    }

    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: settings.smtpSecure || false,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    await transporter.verify();
    console.log(`SMTP connection verified successfully for ${shop}`);
    return { success: true, shop };
  } catch (error) {
    console.error(`SMTP connection error for ${shop}:`, error);
    return { success: false, error: error.message, shop };
  }
}