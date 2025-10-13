export function getTemplates() {
  return [
    {
      id: "welcome-series",
      name: "Welcome Series",
      description: "Onboard new customers with a 3-email sequence",
      channel: "Email",
      category: "Onboarding",
      popular: true,
      trigger: "customer_created",
      subject: "Welcome to {{shop.name}}!",
      message: "Hi {{customer.first_name}}, welcome to our store! We're excited to have you as a customer."
    },
    {
      id: "abandoned-cart",
      name: "Abandoned Cart Recovery",
      description: "Recover lost sales with targeted reminders",
      channel: "WhatsApp",
      category: "Recovery",
      popular: true,
      trigger: "cart_abandoned",
      subject: "",
      message: "Hi {{customer.first_name}}, you left something in your cart! Complete your purchase now."
    },
    {
      id: "post-purchase",
      name: "Post-Purchase Follow-up",
      description: "Thank customers and request reviews",
      channel: "Email",
      category: "Retention",
      popular: false,
      trigger: "order_placed",
      subject: "Thank you for your order!",
      message: "Hi {{customer.first_name}}, thank you for your order #{{order.order_number}}!"
    },
    {
      id: "birthday-campaign",
      name: "Birthday Campaign",
      description: "Send personalized birthday offers",
      channel: "SMS",
      category: "Engagement",
      popular: false,
      trigger: "customer_birthday",
      subject: "",
      message: "Happy Birthday {{customer.first_name}}! Enjoy 20% off your next purchase."
    },
    {
      id: "win-back",
      name: "Win-back Campaign",
      description: "Re-engage inactive customers",
      channel: "Email",
      category: "Re-engagement",
      popular: true,
      trigger: "customer_inactive",
      subject: "We miss you!",
      message: "Hi {{customer.first_name}}, we miss you! Come back and enjoy 15% off."
    },
    {
      id: "product-recommendation",
      name: "Product Recommendation",
      description: "Suggest products based on purchase history",
      channel: "WhatsApp",
      category: "Upsell",
      popular: false,
      trigger: "order_placed",
      subject: "",
      message: "Hi {{customer.first_name}}, based on your recent purchase, you might like these products!"
    },
    {
      id: "order-confirmation",
      name: "Order Confirmation",
      description: "Send confirmation message when order is placed",
      channel: "WhatsApp",
      category: "Transactional",
      popular: true,
      trigger: "order_placed",
      subject: "",
      message: "Hi {{customer.first_name}}, your order #{{order.order_number}} has been confirmed!"
    },
    {
      id: "order-dispatch",
      name: "Order Dispatch",
      description: "Notify customers when order is fulfilled/shipped",
      channel: "WhatsApp",
      category: "Transactional",
      popular: true,
      trigger: "order_fulfilled",
      subject: "",
      message: "Hi {{customer.first_name}}, your order #{{order.order_number}} has been shipped!"
    }
  ];
}