// Test CORS by attempting a simple upload
export async function testCORS(sasUrl: string) {
  try {
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    
    const response = await fetch(sasUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': 'text/plain',
      },
      body: testBlob,
    });
    
    console.log('CORS test response:', response.status, response.statusText);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('CORS test failed:', text);
    }
    
    return response.ok;
  } catch (error) {
    console.error('CORS test error:', error);
    return false;
  }
}