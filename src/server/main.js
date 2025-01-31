import express from "express";
import ViteExpress from "vite-express";

import mongoose from "mongoose";
import session from 'express-session';
import bcryptjs from 'bcryptjs';
import { UserModel } from '../models/user.js';
import { RunModel } from '../models/run.js';
import { MessageModel } from '../models/message.js';
import { FileModel } from '../models/file.js';


import 'dotenv/config';  // Loads environment variables from .env
import OpenAI from 'openai';


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

mongoose.connect("mongodb://localhost:27017/test", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.error("Error connecting to MongoDB", error);
});
const app = express();
app.use(express.json());

const sessionConfig = {
  secret: 'thisshouldbeabettersecret!',
  resave: false,
  saveUninitialized: false, // Changed to false for better security
  cookie: {
      httpOnly: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7
  }
}
app.use(session(sessionConfig))

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

app.post("/api/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if user already exists
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create new user
    const user = new UserModel({
      username,
      password: hashedPassword
    });

    await user.save();

    const emptyThread = await openai.beta.threads.create();

    const myAssistant = await openai.beta.assistants.create({
      instructions: "Answer questions using file_search",
      model: "gpt-3.5-turbo",
      tools: [{ type: "file_search" }],
    });

    
    // Create a default chat group for the new user
    const chatGroup = new RunModel({
      user: user._id,
      run: {  threadId: emptyThread.id, AssistantId: myAssistant.id, messages: []

      }
    });
    await chatGroup.save();
    
    // Set session with both user and current chat group
    req.session.userId = user._id;
    req.session.currentChatGroupId = chatGroup._id;
    
    
    res.json({ 
      message: 'Registration successful', 
      username: username,
      chatGroupId: chatGroup._id
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await UserModel.findOne({ username });
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcryptjs.compare(password, user.password);
    if (!isValid) {
      console.log('Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const chatGroup =  await RunModel.findOne({ user: user._id });
    if (!chatGroup) {
      console.log('chatGroup not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }



    

    // Set session
    req.session.userId = user._id;
    req.session.username = username; // Store username in session
    req.session.currentChatGroupId = chatGroup._id;
   
    
    res.json({ message: 'Login successful', username: username ,
      chatGroupId: chatGroup._id});
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
});

// Add endpoint to create new chat group
app.post("/api/chatgroup", isAuthenticated, async (req, res) => {
  try {
    const user = await UserModel.findOne({ username: req.body.username });
    const myAssistant = await openai.beta.assistants.create({
      instructions:
        "Answer questions",
      model: "gpt-3.5-turbo",
    });
    const emptyThread = await openai.beta.threads.create();
   
    // Create a default chat group for the new user
    const chatGroup = new RunModel({
      user: user._id,
      run: {  threadId: emptyThread.id, AssistantId: myAssistant.id, messages: []



      }
    });
    await chatGroup.save();
    req.session.currentChatGroupId = chatGroup._id;
   
    res.json({ chatGroupId: chatGroup._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modify check-auth to include chat groups
app.get("/api/check-auth", async (req, res) => {
  if (req.session.userId) {
    try {
      const user = await UserModel.findById(req.session.userId);
      const chatGroups = await RunModel.find({ user: req.session.userId });
      console.log('chatGroupID: ', req.session.currentChatGroupId);
      res.json({ 
        isAuthenticated: true,
        username: user.username,
        chatGroups: chatGroups,
        currentChatGroupId: req.session.currentChatGroupId
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.json({ isAuthenticated: false });
  }
});


import multer from 'multer';

import fs from 'fs';
import path from 'path';



// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Use the original filename directly
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Endpoint to upload a file


// Ensure the uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.post('/api/upload/:chatGroupId', upload.single('file'), async (req, res) => {
  const file = req.file; // Access the uploaded file
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const openaiFile = await openai.files.create({
      file: fs.createReadStream(req.file.path),
      purpose: "assistants",
    });
  
    // Create Vector Store
    const vectorStore = await openai.beta.vectorStores.create({
      name: `User-${req.session.userId}-${Date.now()}`,
    });

    
   
    console.log('Vector store created ', vectorStore);

    // Update the chat group with the file details
    const updatedChatGroup = await RunModel.findByIdAndUpdate(
      req.params.chatGroupId,
      {
        $set: {
          'run.vectorStoreId': vectorStore.id,
          'run.fileId': openaiFile.id
        }
      },
      { new: true }
    );

    // Link Vector Store to Assistant
   
    await openai.beta.assistants.update(updatedChatGroup.run.AssistantId, {
      tool_resources: {
        file_search: { vector_store_ids: [vectorStore.id] }
      }
    });
    
     await openai.beta.vectorStores.files.createAndPoll(
      updatedChatGroup.run.vectorStoreId,
      { file_id: openaiFile.id }
    );
    console.log('Vector store updated ', vectorStore);

    if (!updatedChatGroup) {
      return res.status(404).json({ error: 'Chat group not found' });
    }
    
    
    const fileModel = await FileModel.create({
      fileName: file.filename,
    });
   
    res.json({ message: 'File uploaded successfully', filename: file.filename });
    
    fs.unlinkSync(file.path); // Delete the file after uploading
  } catch (error) {
    console.error('Error updating chat group:', error);
    res.status(500).json({ error: 'Failed to update chat group' });
  }
});

app.delete('/api/delete-file/:chatGroupId/:filename', async (req, res) => {
  

  try {
   

    // Remove the file from the current chat group
    const chatGroup = await RunModel.findById(req.params.chatGroupId);


    // Remove from Vector Store
    await openai.beta.vectorStores.files.del(
      updatedChatGroup.run.vectorStoreId,
      req.params.fileId
    );

    await RunModel.findByIdAndUpdate(
      req.params.chatGroupId,
      { run: { fileId: null, vectorStoreId: null } },
      { new: true }
    );
    

    if (!updatedChatGroup) {
      return res.status(404).json({ error: 'Chat group not found' });
    }

      
    res.json({ message: 'File deleted successfully', filename });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});




app.get("/api/chat", isAuthenticated, async (req, res) => {
  // Set SSE headers IMMEDIATELY
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Extract query parameters instead of using req.body
    const response = { model: req.query.model, prompt: req.query.prompt };

    // Find the run by chat group ID
    const run = await RunModel.findById(req.session.currentChatGroupId);
    if (!run) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "Run not found" })}\n\n`);
      res.end();
      return;
    }



    // Update assistant model if necessary
    if (response.model !== "gpt-3.5-turbo") {
      await openai.beta.assistants.update(run.run.AssistantId, { model: response.model });
    }

    // Add the user's message to the existing thread using query parameter
    await openai.beta.threads.messages.create(run.run.threadId, {
      role: "user",
      content: response.prompt, // Changed from req.body.prompt to response.prompt
     
    });

    // Create and execute a new run on the existing thread with streaming enabled
    const newRun = await openai.beta.threads.runs.create(run.run.threadId, {
      assistant_id: run.run.AssistantId,
      stream: true, // Enable streaming
    });

    let aiMessage = '';


    // Handle streaming events
    for await (const event of newRun) {
      if (event.event === 'thread.message.delta') {
        const content = event.data.delta.content?.[0]?.text?.value;
       
        if (content) {
          aiMessage += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    }

    // Send a "done" event to indicate the end of the stream
    res.write('data: [DONE]\n\n');
    res.end();

  
    // Save the chat message using query parameter
    const chat = new MessageModel({
      UserMessage: response.prompt, // Changed from req.body.prompt to response.prompt
      AIMessage: aiMessage,
    });
    await chat.save();

    
  
    



    // Add chat to current chat group
    await RunModel.findByIdAndUpdate(
      req.session.currentChatGroupId,
      { $push: { 'run.messages': chat._id } }
    );
    
    if(run.run.vectorStoreId) {
      const file = await FileModel.findOne().sort({ createdAt: -1 }); // Fetch the most recent file
     
      await MessageModel.findByIdAndUpdate(
        chat._id,
        { fileName: file.fileName }
      );

      

         await RunModel.findByIdAndUpdate(
          req.params.chatGroupId,
          {
            $set: {
              'run.vectorStoreId': null,
              'run.fileId': null
            }
          },
          { new: true }
        );

       
        await openai.beta.vectorStores.files.del(
          run.run.vectorStoreId,
          run.run.fileId
        );
    
        if (file) {
          await FileModel.findByIdAndDelete(file._id);
          console.log(`Deleted file document with ID: ${file._id}`);
        } else {
          console.log("No file found to delete.");
        }
        
  }

   
    

  } catch (error) {
    // Send error as SSE event
    console.error("Error in /api/chat SSE route:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});


app.get("/api/image", isAuthenticated, async (req, res) => {
 
  
});

// Add endpoint to get chats for a chat group
app.get("/api/chatgroup/:id/chats", isAuthenticated, async (req, res) => {
  try {
    const chatGroup = await RunModel.findById(req.params.id).populate('run.messages');
    req.session.currentChatGroupId = req.params.id;
    res.json(chatGroup.run.messages);
  } catch (error) {
    
    res.status(500).json({ error: error.message });
  }
});

ViteExpress.listen(app, 5030, () =>
  console.log("Server is listening on port 5030..."),
);
