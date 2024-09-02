import { Invoice } from "../model/invoice.modle.js";
import { hashGenerator } from "../utils/hashCheck.js";


const checkImg =async (req, res ,next)=>{
    // console.log(req.base64Image);
    const base64Image = req.base64Image
   const hash= hashGenerator(base64Image)
   console.log(hash);
    const document = await Invoice.findOne({ invoiceHash: hash });
    if(document!=null){
        console.log('Img is already used for invoice Creation , Stoping the request');
      res.status(300).send('Invoice is already created')
    }else{
      console.log('Invoice is Not Created Moving to Next Controller');
      req.body.hash=hash
      next()
    }

}
export {
    checkImg
}