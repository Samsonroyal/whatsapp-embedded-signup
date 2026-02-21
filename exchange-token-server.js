/**
 * Facebook OAuth Token Exchange Server
 * 
 * This is a simple Node.js/Express server that securely exchanges
 * authorization codes for access tokens on the backend.
 * 
 * Setup:
 * 1. npm install express dotenv cors
 * 2. Create .env file with:
 *    FACEBOOK_APP_ID=your_app_id
 *    FACEBOOK_APP_SECRET=your_app_secret
 *    PORT=3000
 * 3. node exchange-token-server.js
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware — explicit CORS so preflight (OPTIONS) requests succeed
app.use(cors({
  origin: true,           // reflect the request origin (allows any origin)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Token Exchange Endpoint
 * POST /api/exchange-token
 * 
 * Body: { code: "authorization_code" }
 * Returns: { access_token, token_type, expires_in, ... }
 */
app.post('/api/exchange-token', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      console.error('Missing Facebook credentials in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log('Exchanging authorization code for access token...');
    console.log('Code (first 20 chars):', code.substring(0, 20) + '...');

    // Exchange code for access token (POST with JSON body per Facebook docs)
    const tokenUrl = 'https://graph.facebook.com/v22.0/oauth/access_token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: appId,
        client_secret: appSecret,
        code,
        grant_type: 'authorization_code'
      })
    });

    const data = await response.json();

    console.log('Token exchange response status:', response.status);
    console.log('Token exchange response:', {
      hasAccessToken: !!data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      error: data.error,
      errorDescription: data.error_description
    });

    if (!response.ok || data.error) {
      console.error('Facebook API error:', JSON.stringify(data, null, 2));
      return res.status(400).json({
        error: data.error?.message || data.error_description || 'Failed to exchange code',
        details: data
      });
    }

    if (!data.access_token) {
      console.error('No access token in response');
      return res.status(400).json({
        error: 'No access token in response',
        details: data
      });
    }

    // Optional: Validate token
    try {
      const debugUrl = new URL('https://graph.facebook.com/debug_token');
      debugUrl.searchParams.append('input_token', data.access_token);
      debugUrl.searchParams.append('access_token', `${appId}|${appSecret}`);

      const debugResponse = await fetch(debugUrl.toString());
      const debugData = await debugResponse.json();

      console.log('Token validation:', {
        isValid: debugData.data?.is_valid,
        scopes: debugData.data?.scopes,
        expiresAt: new Date(debugData.data?.expires_at * 1000)
      });

      if (!debugData.data?.is_valid) {
        console.warn('Token validation failed');
      }
    } catch (debugErr) {
      console.warn('Could not validate token:', debugErr.message);
    }

    // Return the token and metadata
    return res.json({
      access_token: data.access_token,
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in,
      success: true,
      message: 'Access token successfully exchanged'
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Verify stored token endpoint
 * POST /api/verify-token
 * 
 * Body: { access_token: "token_to_verify" }
 * Returns: { is_valid: boolean, scopes: [...], expires_at: timestamp }
 */
app.post('/api/verify-token', async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const debugUrl = new URL('https://graph.facebook.com/debug_token');
    debugUrl.searchParams.append('input_token', access_token);
    debugUrl.searchParams.append('access_token', `${appId}|${appSecret}`);

    const response = await fetch(debugUrl.toString());
    const data = await response.json();

    return res.json({
      is_valid: data.data?.is_valid,
      scopes: data.data?.scopes || [],
      expires_at: data.data?.expires_at,
      app_id: data.data?.app_id,
      user_id: data.data?.user_id,
      error: data.error
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      error: 'Token verification failed',
      message: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Facebook Token Exchange Server running on http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  POST /api/exchange-token  - Exchange authorization code for access token`);
  console.log(`  POST /api/verify-token    - Verify and inspect an access token`);
  console.log(`  GET  /health             - Health check\n`);
});

module.exports = app;
