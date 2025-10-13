import db from "../db.server";

export async function sendWhatsAppMessage(shop, phoneNumber, templateType, variables) {
  try {
    console.log('Sending WhatsApp message:', { 
      shop: shop?.replace(/[^a-zA-Z0-9.-]/g, ''), 
      phoneNumber: phoneNumber?.replace(/[^0-9+]/g, ''), 
      templateType: templateType?.replace(/[^a-zA-Z]/g, '') 
    });
    
    const settings = await db.whatsAppSettings.findUnique({
      where: { shop },
    });

    if (!settings) {
      throw new Error("WhatsApp settings not found");
    }
    
    if (!settings.phoneId || !settings.accessToken) {
      throw new Error("WhatsApp configuration incomplete");
    }

    // Try sending without button first
    try {
      return await attemptSendMessage(settings, phoneNumber, templateType, variables, false);
    } catch (error) {
      // If button parameter error, try with button
      if (error.message.includes('Button at index 0')) {
        console.log('Template requires button, retrying with button parameters');
        return await attemptSendMessage(settings, phoneNumber, templateType, variables, true);
      }
      throw error;
    }
  } catch (error) {
    console.error('WhatsApp message error:', error);
    throw error;
  }
}

async function attemptSendMessage(settings, phoneNumber, templateType, variables, includeButton) {
  // Keep full product names
  // No truncation needed

  // Build parameters based on template type
  let parameters = [
    { type: "text", text: variables.firstName || "" },
    { type: "text", text: variables.orderId || "" }
  ];

  if (templateType === "order") {
    parameters.push(
      { type: "text", text: variables.productName || "" },
      { type: "text", text: variables.price || "" }
    );
  } else if (templateType === "fulfillment") {
    parameters.push(
      { type: "text", text: variables.trackingId || "" },
      { type: "text", text: variables.trackingUrl || "" }
    );
  }

  const templateName = templateType === "order" 
    ? settings.orderTemplateName 
    : settings.fulfillmentTemplateName;
    
  if (!templateName) {
    throw new Error(`Template name not configured for ${templateType}`);
  }

  // Build components array
  const components = [
    {
      type: "body",
      parameters: parameters
    }
  ];
  
  // Add button component if requested and for order templates
  if (includeButton && templateType === "order") {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [
        {
          type: "text",
          text: variables.orderId || ""
        }
      ]
    });
  }

  const payload = {
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: settings.templateLanguage || "en_US"
      },
      components: components
    }
  };
  
  console.log(`Attempting WhatsApp send ${includeButton ? 'with' : 'without'} button`);

  const response = await fetch(`${settings.facebookUrl}${settings.phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('WhatsApp API Error Response received');
    throw new Error(`WhatsApp API error: ${response.statusText} - ${errorText}`);
  }

  console.log('WhatsApp message sent successfully');
  return await response.json();
}

export function formatProductNames(products) {
  return products
    .map(product => product.title.split(' ').slice(0, 3).join(' '))
    .join(', ');
}