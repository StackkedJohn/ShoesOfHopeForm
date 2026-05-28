// Vercel serverless function to serve Mapbox API tokens
// This keeps the tokens secure in environment variables while making them available to the client

module.exports = async (req, res) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Return Mapbox tokens from environment variables
    res.status(200).json({
        accessToken: process.env.MAPBOX_ACCESS_TOKEN,
        addressToken: process.env.MAPBOX_ADDRESS_TOKEN
    });
};
