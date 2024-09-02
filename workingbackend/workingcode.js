const express = require('express');
const axios = require('axios');
const qs = require('qs');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware to parse cookies
app.use(cookieParser());
app.use(cors());

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
app.use(async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
  const tokenExpiresAt = parseInt(req.cookies.tokenExpiresAt, 10);

  try {
    if (accessToken) {
      // Check if we need to refresh the access token
      if (Date.now() >= tokenExpiresAt - 60000) {
        console.log('Access token is about to expire or has expired. Refreshing...');
        await refreshAccessToken(req, res);
      }
      next();
    } else {
      console.log('Access token not found. Redirecting to authorization...');
      // return res.redirect('/authorize');
      next()
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Step 1: Generate Authorization URL
app.get('/authorize', (req, res) => {
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
    res.cookie('accessToken', accessToken, { httpOnly: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    res.cookie('tokenExpiresAt', tokenExpiresAt, { httpOnly: true });

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
app.get('/create-invoice', async (req, res) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).send('Not authorized. Please authorize first by visiting /authorize.');
  }

  const customerData = {
    DisplayName: 'John Doe',
    PrimaryEmailAddr: { Address: 'johndoe@example.com' },
    PrimaryPhone: { FreeFormNumber: '(555) 555-5555' },
    CompanyName: 'Doe Enterprises',
    BillAddr: {
      Line1: '123 Main St',
      City: 'Anytown',
      Country: 'USA',
      CountrySubDivisionCode: 'CA',
      PostalCode: '90210',
    },
  };

  try {
    const customerResponse = await axios.post(
      `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/customer?minorversion=65`,
      customerData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    const customerId = customerResponse.data.Customer.Id;

    const invoiceData = {
      CustomerRef: { value: customerId },
      Line: [
        {
          Amount: 150.0,
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: { value: '1', name: 'Services' },
            UnitPrice: 150.0,
            Qty: 1,
          },
        },
      ],
      BillEmail: { Address: 'johndoe@example.com' },
      BillAddr: {
        Line1: '123 Main St',
        City: 'Anytown',
        Country: 'USA',
        CountrySubDivisionCode: 'CA',
        PostalCode: '90210',
      },
      DueDate: '2023-09-15',
      PrivateNote: 'Thank you for your business!',
    };

    const invoiceResponse = await axios.post(
      `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/invoice?minorversion=65`,
      invoiceData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(invoiceResponse.data);
  } catch (error) {
    console.error('Error creating customer or invoice:', error.response ? error.response.data : error.message);
    res.status(500).send('Failed to create customer or invoice');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
