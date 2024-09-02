import axios from 'axios';
import { createInvoiceData } from '../utils/invoice.js';
import { Invoice } from '../model/invoice.modle.js';
const realmId = process.env.REALM_ID;

const getInvoice = async (req, res) => {
  const accessToken = req.cookies.accessToken;
  const extractedJSON = req.body.extractedJSON;
  console.log("The Access Token is :", accessToken);
  console.log("The extracted JSON is :", extractedJSON);

  if (!accessToken) {
    return res.status(401).send('Not authorized. Please authorize first by visiting /authorize.');
  }

  try {
    // Query to fetch the list of customers
    const query = "SELECT * FROM Customer MAXRESULTS 1"; // Adjust MAXRESULTS as needed
    const customersResponse = await axios.get(
      `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=73`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'text/plain', // Correct Content-Type for query endpoint
        },
      }
    );

    // Check if there are customers in the response
    if (!customersResponse.data.QueryResponse.Customer || customersResponse.data.QueryResponse.Customer.length === 0) {
      return res.status(404).send('No customers found.');
    }

    // Get the first customer from the list
    const firstCustomer = customersResponse.data.QueryResponse.Customer[0];
    const customerId = firstCustomer.Id;
    console.log(customerId);
    // Prepare the invoice data
    // const invoiceData = {
    //   CustomerRef: { value: customerId },
    //   Line: [
    //     {
    //       Amount: 150.0,
    //       DetailType: 'SalesItemLineDetail',
    //       SalesItemLineDetail: {
    //         ItemRef: { value: '1', name: 'Services' },
    //         UnitPrice: 150.0,
    //         Qty: 1,
    //       },
    //     },
    //   ],
    //   BillEmail: { Address: 'johndoe@example.com' },
    //   BillAddr: {
    //     Line1: '123 Main St',
    //     City: 'Anytown',
    //     Country: 'USA',
    //     CountrySubDivisionCode: 'CA',
    //     PostalCode: '90210',
    //   },
    //   DueDate: '2023-09-15',
    //   PrivateNote: 'Thank you for your business!',
    // };
    const invoiceData = createInvoiceData(extractedJSON,customerId)
    console.log(invoiceData);
    // Create an invoice for the selected customer
    const invoiceResponse = await axios.post(
      `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/invoice?minorversion=73`,
      invoiceData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
  const doc = {
          invoiceHash:req.body.hash,
          invoiceJSON:invoiceResponse.data
        }
        const Invoicedoc = await Invoice.create(doc);
        console.log('Successfully Created the DB document',Invoicedoc);
      console.log(Invoicedoc);
    // Send the invoice response back
    return res.status(200).json(invoiceResponse.data);
  } catch (error) {
    if (error.response) {
      // Log detailed error response
      console.error('Error retrieving customers or creating invoice:', JSON.stringify(error.response.data, null, 2));
    } else {
      // Log general error message
      console.error('Error retrieving customers or creating invoice:', error.message);
    }
    res.status(500).send('Failed to retrieve customers or create invoice');
  }
};

export { getInvoice };
