import mongoose from "mongoose";
import { VectorStores } from "openai/resources/beta/vector-stores/vector-stores.mjs";
const Schema = mongoose.Schema;

const RunSchema = new Schema({
    name :{
        type: String,
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    run: {
        threadId: {
            type: String,
            required: true,
            unique: true
        },
        AssistantId: {
            type: String,
            required: true,
            unique: true
        },
        vectorStoreId: {
            type: String,
            required: false,
            unique: false
        },
        fileId: {
            type: String,
            required: false,
            unique: false
        },
        model:{
            type: String,
        },
       

        messages: [
            
            {
        
            type: Schema.Types.ObjectId,
            ref: 'Message'
             }
    
    
    ],
        
    },
   
});

export const RunModel = mongoose.model('Run', RunSchema);