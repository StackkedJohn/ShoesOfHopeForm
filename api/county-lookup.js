// Vercel serverless function to proxy FCC Census county lookup
// Avoids CORS issues — the FCC API doesn't set Access-Control-Allow-Origin headers

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'lat and lon query parameters required' });
    }

    try {
        const response = await fetch(`https://geo.fcc.gov/api/census/area?lat=${lat}&lon=${lon}&format=json`);
        if (response.ok) {
            const data = await response.json();
            res.status(200).json(data);
        } else {
            res.status(response.status).json({ error: 'FCC API error' });
        }
    } catch (error) {
        console.error('FCC Census API proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch county data' });
    }
};
