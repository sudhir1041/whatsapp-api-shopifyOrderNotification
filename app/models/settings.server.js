import prisma from "../db.server.js";

export async function getSettings(shop) {
  try {
    const whatsappSettings = await prisma.whatsAppSettings.findUnique({
      where: { shop },
    });

    return {
      whatsappToken: whatsappSettings?.accessToken || "",
      phoneId: whatsappSettings?.phoneId || "",
      emailProvider: "sendgrid",
      smsProvider: "twilio",
      enableNotifications: true,
      enableAnalytics: true,
    };
  } catch (error) {
    console.error('Settings error:', error);
    return {
      whatsappToken: "",
      phoneId: "",
      emailProvider: "sendgrid",
      smsProvider: "twilio",
      enableNotifications: true,
      enableAnalytics: true,
    };
  }
}

export async function updateSettings(shop, data) {
  return prisma.whatsAppSettings.upsert({
    where: { shop },
    update: {
      accessToken: data.whatsappToken,
      phoneId: data.phoneId,
    },
    create: {
      shop,
      accessToken: data.whatsappToken,
      phoneId: data.phoneId,
    },
  });
}