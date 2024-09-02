import { Invoice } from "../model/invoice.modle.js";

const getInvoices=async(req,res)=>{
    try {
        const documents = await Invoice.find({});
    
        // Convert documents to JSON format
        const jsonDocuments = documents.map(doc => doc.toJSON());
    
        jsonDocuments;
        const transformData = (data) => {
            return data.map(item => {
              const invoice = item.invoiceJSON.Invoice;
              return {
                id: item._id, // Assuming you want to use _id as id
                date: invoice.TxnDate.split('T')[0].split('-').reverse().join('/'), // Format date as DD/MM/YY
                no: invoice.DocNumber,
                name: invoice.CustomerRef.name,
                amount: `$${invoice.TotalAmt}`,
                listItems: invoice.Line
                  .filter(line => line.DetailType === "SalesItemLineDetail") // Filter out non-SalesItemLineDetail lines
                  .map(line => ({
                    id: line.Id,
                    year: line.Description.split(' ')[0] || "", // Extract year from description if available
                    model: line.Description.split(' ')[1] || "", // Extract model from description if available
                    make: line.Description.split(' ')[2] || "", // Extract make from description if available
                    color: "", // You can add color if available or relevant
                    winNo: "", // Add winNo if available or relevant
                  }))
              };
            });
          };
          
          const transformedDataArray = transformData(jsonDocuments);
          console.log(transformedDataArray);
        res.status(200).send(transformedDataArray)
        
    } catch (error) {
        res.status(400).send(error)
    }
}

export {
    getInvoices
}