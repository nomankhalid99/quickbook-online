import mongoose from "mongoose";

const connectDB = async()=>{

try {
   const connectIntance = await mongoose.connect(`mongodb+srv://${process.env.MONGOO_DB_USERNAME}:${process.env.MONGOO_DB_PASSWORD}@cluster0.0h35u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/quickbook-online`)
   console.log(`Database Connected Successfully !! DB host: ${connectIntance.connection.host}`);

} catch (error) {
    console.log(`MongoDB connection Failed: ${error}`)
    process.exit(1)
}

}

export default connectDB