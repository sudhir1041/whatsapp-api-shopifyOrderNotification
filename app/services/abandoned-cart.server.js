import db from "../db.server";
import { sendWhatsAppMessage } from "../utils/whatsapp.server";

export async function processAbandonedCarts() {
  console.log('=== PROCESSING ABANDONED CARTS ===');
  
  try {
    // Get all shops with abandonment settings enabled
    const shopsWithSettings = await db.whatsAppSettings.findMany({
      where: {
        enableAbandonmentReminders: true
      }
    });
    
    console.log(`Found ${shopsWithSettings.length} shops with abandonment enabled`);
    
    for (const shopSettings of shopsWithSettings) {
      await processShopAbandonedCarts(shopSettings);
    }
    
  } catch (error) {
    console.error('Error in processAbandonedCarts:', error);
  }
}

async function processShopAbandonedCarts(shopSettings) {
  const shop = shopSettings.shop;
  const delayHours = shopSettings.abandonmentDelayHours || 1;
  const maxReminders = shopSettings.maxReminders || 3;
  const intervalHours = shopSettings.reminderIntervalHours || 24;
  
  console.log(`Processing abandoned carts for ${shop}:`, {
    delayHours,
    maxReminders,
    intervalHours
  });
  
  try {
    // Find carts that haven't been updated based on shop's delay setting
    const delayTime = new Date(Date.now() - delayHours * 60 * 60 * 1000);
    
    const abandonedCarts = await db.cart.findMany({
      where: {
        shop: shop,
        status: 'active',
        updatedAt: {
          lt: delayTime
        }
      }
    });
    
    // Get cart abandonment templates for this shop
    const templates = await db.cartAbandonmentTemplate.findMany({
      where: {
        shop: shop,
        isActive: true
      },
      orderBy: {
        reminderNumber: 'asc'
      }
    });
    
    console.log(`Found ${abandonedCarts.length} abandoned carts for ${shop}`);
    
    for (const cart of abandonedCarts) {
      try {
        // Check how many reminders already sent for this cart
        const existingReminders = await db.automationExecution.count({
          where: {
            automation: {
              shop: shop,
              name: 'Abandoned Cart Webhook'
            },
            orderId: cart.cartId
          }
        });
        
        console.log(`Cart ${cart.cartId} has ${existingReminders} existing reminders (max: ${maxReminders})`);
        
        // Skip if max reminders reached
        if (existingReminders >= maxReminders) {
          console.log(`Skipping cart ${cart.cartId} - max reminders reached`);
          continue;
        }
        
        // Check if enough time has passed since last reminder
        if (existingReminders > 0) {
          const lastReminder = await db.automationExecution.findFirst({
            where: {
              automation: {
                shop: shop,
                name: 'Abandoned Cart Webhook'
              },
              orderId: cart.cartId
            },
            orderBy: {
              createdAt: 'desc'
            }
          });
          
          if (lastReminder) {
            const timeSinceLastReminder = Date.now() - new Date(lastReminder.createdAt).getTime();
            const requiredInterval = intervalHours * 60 * 60 * 1000;
            
            if (timeSinceLastReminder < requiredInterval) {
              console.log(`Skipping cart ${cart.cartId} - not enough time since last reminder`);
              continue;
            }
          }
        }
        
        // Mark as abandoned on first reminder
        if (existingReminders === 0) {
          await db.cart.update({
            where: { id: cart.id },
            data: { status: 'abandoned' }
          });
        }
        
        // Prepare common variables
        const lineItems = JSON.parse(cart.lineItems || '[]');
        const productNames = lineItems.map(item => item.title).join(', ') || 'items';
        const currency = cart.currency === 'INR' ? '₹' : '$';
        const totalPrice = `${currency}${cart.totalPrice}`;
        const reminderNumber = existingReminders + 1;
        
        const variables = {
          firstName: "Customer",
          customerName: "Customer",
          productName: productNames,
          cartTotal: totalPrice,
          totalPrice: totalPrice,
          itemCount: lineItems.length,
          storeName: shop.replace('.myshopify.com', ''),
          shopName: shop.replace('.myshopify.com', ''),
          cartUrl: `https://${shop}/cart`
        };
        
        let messageSent = false;
        
        // Send WhatsApp message if phone available
        if (cart.customerPhone) {
          try {
            const template = templates.find(t => t.reminderNumber === reminderNumber) || templates[0];
            await sendWhatsAppMessage(shop, cart.customerPhone, "abandoned_cart", variables);
            messageSent = true;
            console.log(`WhatsApp reminder ${reminderNumber} sent for cart ${cart.cartId}`);
          } catch (error) {
            console.error(`Failed to send WhatsApp for cart ${cart.cartId}:`, error);
          }
        }
        
        // TODO: Add email functionality later
        // Email sending will be implemented separately
        
        // Only proceed if at least one message was sent
        if (messageSent) {
          // Create automation record and execution
          let automation = await db.automation.findFirst({
            where: { 
              shop: shop, 
              name: 'Abandoned Cart Webhook', 
              trigger: 'cart_abandoned' 
            }
          });
          
          if (!automation) {
            automation = await db.automation.create({
              data: {
                shop: shop,
                name: 'Abandoned Cart Webhook',
                channel: 'whatsapp',
                trigger: 'cart_abandoned',
                message: template ? template.message : 'Abandoned cart reminder sent via WhatsApp',
                isActive: true,
              },
            });
          }
          
          await db.automationExecution.create({
            data: {
              automationId: automation.id,
              orderId: cart.cartId,
              status: 'sent',
              sentAt: new Date(),
            },
          });
          
          console.log(`Abandoned cart reminder ${reminderNumber} sent for cart ${cart.cartId} using template: ${template?.name || 'default'}`);
        }
        
      } catch (error) {
        console.error(`Error processing abandoned cart ${cart.cartId}:`, error);
        
        // Record failed execution
        let automation = await db.automation.findFirst({
          where: { 
            shop: shop, 
            name: 'Abandoned Cart Webhook', 
            trigger: 'cart_abandoned' 
          }
        });
        
        if (automation) {
          await db.automationExecution.create({
            data: {
              automationId: automation.id,
              orderId: cart.cartId,
              status: 'failed',
              errorMessage: error.message,
            },
          });
        }
      }
    }
    
  } catch (error) {
    console.error(`Error processing abandoned carts for ${shop}:`, error);
  }
}

// Function to mark cart as converted when order is placed
export async function markCartAsConverted(cartId, shop) {
  try {
    await db.cart.updateMany({
      where: {
        cartId: cartId,
        shop: shop,
        status: { in: ['active', 'abandoned'] }
      },
      data: {
        status: 'converted'
      }
    });
    
    console.log(`Cart ${cartId} marked as converted`);
  } catch (error) {
    console.error(`Error marking cart as converted:`, error);
  }
}