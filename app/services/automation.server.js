import { getAutomationsByTrigger, createExecution, updateExecution } from "../models/automation.server";

export async function executeAutomations(shop, trigger, data) {
  const automations = await getAutomationsByTrigger(shop, trigger);
  
  for (const automation of automations) {
    const execution = await createExecution(automation.id, {
      customerId: data.customerId,
      orderId: data.orderId,
      status: 'pending',
    });

    try {
      const message = replaceVariables(automation.message, data);
      
      if (automation.channel === 'whatsapp') {
        await sendWhatsAppMessage(data.phone, message);
      } else if (automation.channel === 'email') {
        await sendEmail(data.email, automation.subject, message);
      }
      
      await updateExecution(execution.id, {
        status: 'sent',
        sentAt: new Date(),
      });
    } catch (error) {
      await updateExecution(execution.id, {
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }
}

function replaceVariables(template, data) {
  return template
    .replace(/\{\{\s*customer\.first_name\s*\}\}/g, data.customerFirstName || '')
    .replace(/\{\{\s*customer\.last_name\s*\}\}/g, data.customerLastName || '')
    .replace(/\{\{\s*customer\.email\s*\}\}/g, data.customerEmail || '')
    .replace(/\{\{\s*order\.total_price\s*\}\}/g, data.orderTotal || '')
    .replace(/\{\{\s*order\.order_number\s*\}\}/g, data.orderNumber || '')
    .replace(/\{\{\s*shop\.name\s*\}\}/g, data.shopName || '');
}

async function sendWhatsAppMessage(phone, message) {
  console.log(`Sending WhatsApp to ${phone}: ${message}`);
}

async function sendEmail(email, subject, message) {
  console.log(`Sending email to ${email}: ${subject} - ${message}`);
}