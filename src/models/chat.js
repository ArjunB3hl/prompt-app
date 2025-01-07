import mongoose from "mongoose";
const Schema = mongoose.Schema;



const ChatSchema = new Schema({
    prompt: String,
    response: String
});


export const ChatModel = mongoose.model('Chat', ChatSchema);
