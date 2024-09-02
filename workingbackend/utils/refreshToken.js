import axios from "axios";
import qs from 'qs'


// QuickBooks API credentials
const clientId = 'ABPAFo5NbPPDUAn2YucIUJli11DeOn4bGFbJDqUuiRmbB8gAXq';
const clientSecret = '04H2EIyoZisLMONhtiULlZIy9QmvFzQddTKMDQRW';
const redirectUri = 'http://localhost:3000/callback';
const realmId = '9341452907573222';

// Function to refresh access token
async function refreshAccessToken(req, res) {
  const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;

  try {
    const response = await axios.post(
      tokenUrl,
      qs.stringify({ grant_type: 'refresh_token', refresh_token: req.cookies.refreshToken }),
      { headers: { 'Authorization': authHeader, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const newAccessToken = response.data.access_token;
    const newRefreshToken = response.data.refresh_token;
    const expiresIn = response.data.expires_in; // in seconds
    const newTokenExpiresAt = Date.now() + expiresIn * 1000; // Convert to milliseconds

    // Update cookies with new tokens and expiration
    res.cookie('accessToken', newAccessToken, { maxAge: 18000000,httpOnly: true });
    res.cookie('refreshToken', newRefreshToken, { maxAge: 18000000,httpOnly: true });
    res.cookie('tokenExpiresAt', newTokenExpiresAt, {maxAge: 18000000, httpOnly: true });

    console.log('Access token refreshed and cookies updated.');
  } catch (error) {
    console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to refresh access token');
  }
}

export {
    refreshAccessToken
}