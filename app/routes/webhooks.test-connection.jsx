export const action = async ({ request }) => {
  console.log('=== TEST CONNECTION WEBHOOK ===');
  console.log('Method:', request.method);
  console.log('URL:', request.url);
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.text();
    console.log('Body:', body);
    
    return new Response('Test webhook received successfully', { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return new Response('Error', { status: 500 });
  }
};

export const loader = async ({ request }) => {
  console.log('=== TEST CONNECTION GET REQUEST ===');
  return new Response('Webhook endpoint is accessible', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
};