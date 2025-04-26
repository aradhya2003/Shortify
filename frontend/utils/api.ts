export const shortenUrl = async (longUrl: string): Promise<{ shortUrl: string }> => {
    const res = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ longUrl }),
    });
    return res.json();
  };
  
  // Track clicks (for analytics)
  export const trackClick = async (shortCode: string) => {
    await fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({ shortCode }),
    });
  };