export const action = async ({ request }) => {
  console.log('=== TEST WEBHOOK TRIGGERED ===');
  console.log('Request URL:', request.url);
  console.log('Request method:', request.method);
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  const body = await request.text();
  console.log('Request body:', body);
  
  return new Response('Test webhook received', { status: 200 });
};