import mongoose , { Mongoose, Schema} from "mongoose";

const invoiceSchema =new Schema(
    {
             invoiceHash:{
                type:String,
                required: true
             },
             invoiceJSON:{
                type:mongoose.Schema.Types.Mixed , 
                required: true
            }

    }
,{
    timestamps:true
})

export const Invoice = mongoose.model("Video",invoiceSchema)