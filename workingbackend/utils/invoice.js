const createInvoiceData =(jsonString, customerId) => {
  console.log('creating invoice');
    // Validate the inputs
    if (!jsonString || !customerId) {
      throw new Error('Invalid input: JSON data and customer ID are required.');
    }
 let jsonData;
  try {
    jsonData = JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Invalid JSON string: ' + error.message);
  }
    // Map vehicles to invoice lines
    const invoiceLines = jsonData.vehicles.map(vehicle => ({
      Amount: 150.0, // Example amount; adjust as needed
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        ItemRef: { value: '1', name: 'Vehicle Sales' }, // Use actual item reference if available
        UnitPrice: 150.0, // Example unit price; adjust as needed
        Qty: 1, // Quantity can be adjusted or derived from JSON if needed
      },
      Description: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, // Description of the vehicle
    }));
  console.log('Invoice Lines', invoiceLines);
    // Create the invoice data object
    const invoiceData = {
      CustomerRef: { value: customerId },
      Line: invoiceLines,
      BillEmail: { Address:'johndoe@example.com' }, // Use dealer name if applicable
      BillAddr: {
        Line1: '123 Main St',
        City: 'Anytown',
        Country: 'USA',
        CountrySubDivisionCode: 'CA',
        PostalCode: '90210',
      },
      DueDate: jsonData.date || '2023-09-15', // Use provided date or default
      PrivateNote: 'Thank you for your business!',
    };
  console.log(invoiceData);
    return invoiceData;
  };

  export {
    createInvoiceData
  }