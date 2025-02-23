import mongoose from "mongoose";
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { 
        type: String, 
        required: true,
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    tokens: {
        access_token: String,
        refresh_token: String,
        scope: String,
        token_type: String,
        expiry_date: Number
      },
    image: {
        type: String,
        required: false,
    },
    email:{
        type: String,
        required: false,
    },
});

export const UserModel = mongoose.model('User', UserSchema);

