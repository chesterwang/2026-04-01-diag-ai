// Simple test script to verify the chat API endpoint
// Run with: node test-api.js

const testChatAPI = async () => {
  try {
    console.log('Testing chat API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Hello, can you tell me about the weather?'
          }
        ]
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      console.log('✅ API endpoint is responding correctly');
      
      // Read the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        result += chunk;
        
        // Log first few chunks to verify streaming
        if (result.length < 200) {
          console.log('Received chunk:', chunk);
        }
      }
      
      console.log('✅ Streaming response received successfully');
    } else {
      console.log('❌ API endpoint returned error status');
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('💡 Make sure the Next.js dev server is running on http://localhost:3000');
    }
  }
};

// Only run if this file is executed directly
if (require.main === module) {
  testChatAPI();
}

module.exports = { testChatAPI };
