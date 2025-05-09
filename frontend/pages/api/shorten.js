export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/shorten`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          long_url: req.body.longUrl,
          custom_alias: req.body.customAlias
        })
      }
    );

    const responseData = await response.json();

    // Handle 409 Conflict for custom alias
    if (response.status === 409) {
      return res.status(409).json({
        error: responseData.detail?.message || 'Custom alias already in use',
        code: responseData.detail?.error || 'CustomAliasInUse'
      });
    }

    // Handle other non-200 responses
    if (!response.ok) {
      throw new Error(responseData.message || 'Backend request failed');
    }

    // Successful response
    return res.status(200).json({
      shortUrl: responseData.short_url || responseData.shortUrl,
      alias: responseData.alias // Include the alias in response if needed
    });
    
  } catch (error) {
    console.error('API route error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}