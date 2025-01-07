import mongoose from "mongoose";
const Schema = mongoose.Schema;



const ChatGroupSchema = new Schema({
    user:
    {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    chats: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Chat'
        }
    ]
});


export const ChatGroupModel = mongoose.model('ChatGroup', ChatGroupSchema);
