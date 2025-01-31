import mongoose from "mongoose";
const Schema = mongoose.Schema;


const ImageSchema = new Schema({
    url: String,
});

const MessageSchema = new Schema({
    UserMessage: { 
        type: String, 
        
    },
    fileName: { 
        type: String,
    },
    AIMessage: { 
        type: String, 
    },
    images: [ImageSchema],
});

export const MessageModel = mongoose.model('Message', MessageSchema);

