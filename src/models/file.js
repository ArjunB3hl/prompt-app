import mongoose from "mongoose";
const Schema = mongoose.Schema;



const FileSchema = new Schema({
    fileName: { 
        type: String,
    }

});

export const FileModel = mongoose.model('File', FileSchema);

