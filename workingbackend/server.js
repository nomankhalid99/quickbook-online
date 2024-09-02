import express from 'express';
import axios from 'axios';
import qs from 'qs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { getInvoice } from './controller/getInvoice.controller.js';
import uploadMiddleware from './middleware/multer.middleware.js';
import extractTextFromImage from './controller/amazon.controller.js';
import openAIextractMethod from './controller/openai.controller.js';
import { auth } from './middleware/auth.middleware.js';
import connectDB from './db/db.js';
import { getInvoices } from './controller/invoicesDB.controller.js';
import { checkImg } from './middleware/imgchecker.middleware.js';
import dotenv from "dotenv"



dotenv.config()
const app = express();
const port = 3000;

// Middleware to parse cookies
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from this origin
  credentials: true // Allow cookies to be sent
}));
//Connecting DB
connectDB()
// QuickBooks API credentials
const clientId = process.env.QUICKBOOK_CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;
const realmId = process.env.REALM_ID;

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
    res.cookie('accessToken', newAccessToken, { httpOnly: true });
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true });
    res.cookie('tokenExpiresAt', newTokenExpiresAt, { httpOnly: true });

    console.log('Access token refreshed and cookies updated.');
  } catch (error) {
    console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to refresh access token');
  }
}

// Middleware to check token expiration and refresh if necessary
// app.use();

// Step 1: Generate Authorization URL
app.get('/authorize',auth, (req, res) => {
  const scope = 'com.intuit.quickbooks.accounting';
  const authorizationUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=YOUR_CUSTOM_STATE`;
  res.redirect(authorizationUrl);
});

// Step 2: Handle Redirect and Exchange Authorization Code for Tokens
app.get('/callback', async (req, res) => {
  const authCode = req.query.code;

  if (!authCode) {
    return res.status(400).send('Authorization code not found.');
  }

  try {
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;

    const response = await axios.post(
      tokenUrl,
      qs.stringify({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: redirectUri,
      }),
      { headers: { 'Authorization': authHeader, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;
    const expiresIn = response.data.expires_in; // in seconds
    const tokenExpiresAt = Date.now() + expiresIn * 1000; // Convert to milliseconds

    // Store tokens and expiration time in cookies
    res.cookie('accessToken', accessToken, { maxAge: 18000000,httpOnly: true });
    res.cookie('refreshToken', refreshToken, { maxAge: 18000000,httpOnly: true });
    res.cookie('tokenExpiresAt', tokenExpiresAt, {maxAge: 18000000, httpOnly: true });

    res.redirect('http://localhost:5173/upload');
  } catch (error) {
    console.error('Error fetching tokens:', error.response ? error.response.data : error.message);
    res.status(500).send('Failed to exchange authorization code for tokens.');
  }
});

// Step 3: Endpoint to get customer list
app.get('/customer', async (req, res) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).send('Not authorized. Please authorize first by visiting /authorize.');
  }

  const quickbooksUrl = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=SELECT * FROM Customer&minorversion=65`;

  try {
    const response = await axios.get(quickbooksUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching customer list:', error.response ? error.response.data : error.message);
    res.status(500).send('Failed to fetch customer list');
  }
});

// Step 4: Endpoint to create an invoice
app.get('/create-invoice', getInvoice);
app.post('/upload',uploadMiddleware,checkImg , extractTextFromImage,openAIextractMethod,getInvoice);
app.get('/getInvoices',getInvoices)
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
