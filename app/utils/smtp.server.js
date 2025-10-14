import { createRequire } from 'module';
import db from '../db.server.js';

const require = createRequire(import.meta.url);

export async function sendEmail({ shop, to, subject, html, text }) {
  try {
    const settings = await db.whatsAppSettings.findUnique({
      where: { shop }
    });

    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
      throw new Error('SMTP settings not configured');
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

    console.log('=== SENDING REAL EMAIL ===');
    console.log('SMTP Host:', settings.smtpHost);
    console.log('SMTP Port:', settings.smtpPort);
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

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
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
    console.log('SMTP connection verified successfully');
    return { success: true };
  } catch (error) {
    console.error('SMTP connection error:', error);
    return { success: false, error: error.message };
  }
}