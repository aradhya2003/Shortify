export default async function handler(req, res) {
    if (!req.query.code) {
      return res.status(400).json({ error: 'Missing code parameter' });
    }
  
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/${req.query.code}`
      );
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to redirect' });
    }
  }