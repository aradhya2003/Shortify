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
          long_url: req.body.longUrl  // Ensure this matches your frontend state
        })
      }
    );

    if (!response.ok) throw new Error('Backend request failed');
    
    const data = await response.json();
    return res.status(200).json({
      shortUrl: data.short_url || data.shortUrl  // Handle both naming conventions
    });
    
  } catch (error) {
    console.error('API route error:', error);
    return res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}