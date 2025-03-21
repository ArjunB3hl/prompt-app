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
            required: false,
            unique: true
        },
        AssistantId: {
            type: String,
            required: false,
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
        memory: {
            type: Boolean,
        },
        assistant : {
            type: String,
        },
        tool: {
            type: String,
        },
        
        messages: [
            
            {
        
            type: Schema.Types.ObjectId,
            ref: 'Message'
             }
    
    
    ],
        
    },
    updatedAt: { type: Date, default: Date.now }  // Add this field
}, { timestamps: true });  // This adds createdAt and updatedAt timestamps automatically

export const RunModel = mongoose.model('Run', RunSchema);