import express from "express";
import ViteExpress from "vite-express";

import mongoose from "mongoose";
import session from "express-session";
import bcryptjs from "bcryptjs";
import { google } from "googleapis";
import { Server as SocketIOServer } from "socket.io";

import { UserModel } from "../models/user.js";
import { RunModel } from "../models/run.js";
import { MessageModel } from "../models/message.js";
import { FileModel } from "../models/file.js";
import { encoding_for_model } from "@dqbd/tiktoken";
import EventHandlerMail from "../functions/mail.js";
import EventHandlerDocument from "../functions/doc.js";
import Anthropic from '@anthropic-ai/sdk';

import "dotenv/config"; // Loads environment variables from .env
import OpenAI from "openai";

const config = {
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  // This should match one of your approved JavaScript origins or redirect URIs
  redirect_uri: process.env.REDIRECT_URI,
};


// Create an OAuth2 client with your configuration details
const oauth2Client = new google.auth.OAuth2(
  config.client_id,
  config.client_secret,
  config.redirect_uri
);

// Define the scopes you want to request
const scopes = [
  // Basic profile
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",

  // Gmail API scopes (Manage emails)
  "https://mail.google.com/", // Full access to Gmail
  
  // drive API scopes (Manage Google Drive)
  "https://www.googleapis.com/auth/drive", // Full access to Google Drive
 

  // Google Docs API scopes (Manage Google Docs)
  "https://www.googleapis.com/auth/documents", // Full access to Google Docs
  
];


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

mongoose
  .connect("mongodb://localhost:27017/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB", error);
  });

const app = express();

app.use(express.json());

const sessionConfig = {
  secret: "thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: false, // Changed to false for better security
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
};


// Route to initiate OAuth 2.0 flow
app.get('/auth/google', (req, res) => {
  // Generate an authentication URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // 'offline' to receive a refresh token
    scope: scopes,          // Scopes requested
    prompt: 'consent', // Forces user to re-approve permissions
  });
  // Redirect the user to the Google authentication page
  res.redirect(authUrl);


  
});

// OAuth2 callback route
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('No authorization code provided.');
  }

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user profile info from Google
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2"
    });
    const { data } = await oauth2.userinfo.get();
    console.log('Google profile data:', data);
    
    // Use the email from Google's profile as username (or any unique identifier)
    let user = await UserModel.findOne({ username: data.given_name });
    let chatGroup = null;
    if (!user) {
          // Create a new user in MongoDB if one doesn't exist
          // A real app should generate a secure password or mark the account as Google-registered
          user = new UserModel({ username: data.given_name, password: "google-oauth", email: data.email, image: data.picture });
          await user.save();
            // Create a new thread and assistant for this user
          const emptyThread = await openai.beta.threads.create();
          const myAssistant = await openai.beta.assistants.create({
            model: "gpt-3.5-turbo",
            
          });

          // Create a default chat group for the new user
          const chatGroup = new RunModel({
            name: "New Chat",
            user: user._id,
            run: { threadId: emptyThread.id, AssistantId: myAssistant.id, messages: [], model: "gpt-3.5-turbo" },
          });
          await chatGroup.save();

    }

    if(chatGroup === null){
      chatGroup = await RunModel.findOne({ user: user._id }).sort({ updatedAt: -1 });
    }
    
    user.tokens = tokens;
    await user.save();  // Persist the tokens in MongoDB
    // Set session or perform other state management as needed
    req.session.userId = user._id; 
    req.session.currentChatGroupId = chatGroup._id;
    res.redirect(`http://localhost:5030`);
    
  } catch (error) {
    console.error('Error during Google auth callback:', error);
    res.status(500).send('Error retrieving access token.');
  }
});




app.post("/api/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create new user
    const user = new UserModel({
      username,
      password: hashedPassword,
    });

    await user.save();

    // Create a new thread and assistant for this user
    const [myAssistant, emptyThread] = await Promise.all([
      openai.beta.assistants.create({
       
        model: "gpt-3.5-turbo",
        
      }),
      openai.beta.threads.create()
    ]);

    // Create a default chat group for the new user
    const chatGroup = new RunModel({
      name: "New Chat",
      user: user._id,
      run: { threadId: emptyThread.id, AssistantId: myAssistant.id, messages: [], model: "gpt-3.5-turbo" },
    });
    await chatGroup.save();

    // Set session with both user and current chat group
    req.session.userId = user._id;
    req.session.currentChatGroupId = chatGroup._id;

    res.json({
      message: "Registration successful",
      username: username,
      chatGroupId: chatGroup._id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Error creating user" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await UserModel.findOne({ username });
    if (!user) {
      console.log("User not found");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValid = await bcryptjs.compare(password, user.password);
    if (!isValid) {
      console.log("Invalid password");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Find an existing chat group for the user
    const chatGroup = await RunModel.findOne({ user: user._id }).sort({ updatedAt: -1 });
    if (!chatGroup) {
      console.log("chatGroup not found");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Set session
    req.session.userId = user._id;
    req.session.username = username; // Store username in session
    req.session.currentChatGroupId = chatGroup._id;

    res.json({
      message: "Login successful",
      username: username,
      chatGroupId: chatGroup._id,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error during login" });
  }
});

app.get("/api/logout", isAuthenticated, async (req, res) => {
  try {
  
    // Set session
    req.session.userId = null;
    req.session.username = null; // Store username in session
    req.session.currentChatGroupId =null;

    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Error during logout" });
  }
});

// Add endpoint to create a new chat group
app.post("/api/chatgroup", isAuthenticated, async (req, res) => {
  try {
    const user = await UserModel.findOne({ username: req.body.username });
    
    
    const [myAssistant, emptyThread] = await Promise.all([
      openai.beta.assistants.create({
      
        model: "gpt-3.5-turbo",
        
      }),
      openai.beta.threads.create()
    ]);


    // Create a new chat group for the user
    const chatGroup = new RunModel({
      name: "New Chat",
      user: user._id,
      run: { threadId: emptyThread.id, AssistantId: myAssistant.id, messages: [], model : req.body.model },
    });
    await chatGroup.save();
    req.session.currentChatGroupId = chatGroup._id;

    res.json({ name: chatGroup.name,chatGroupId: chatGroup._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modify check-auth to include chat groups
app.get("/api/check-auth", async (req, res) => {
  if (req.session.userId) {
    try {
      const user = await UserModel.findById(req.session.userId);
      const chatGroups = await RunModel.find({ user: req.session.userId }).sort({ updatedAt: -1 });
      console.log("chatGroupID: ", req.session.currentChatGroupId);
      console.log("user ", user);
      res.json({
        isAuthenticated: true,
        username: user.username,
        chatGroups: chatGroups,
        currentChatGroupId: req.session.currentChatGroupId,
        image: user.image,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.json({ isAuthenticated: false, username: '', chatGroups: [], currentChatGroupId: null, image: '' });
  }
});

import multer from "multer";
import fs from "fs";
import path from "path";
import { type } from "os";

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Use the original filename directly
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Ensure the uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Endpoint to upload a file and attach it to a chat group
app.post("/api/upload/:chatGroupId", upload.single("file"), async (req, res) => {
  const file = req.file; // Access the uploaded file
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // Upload the file to OpenAI and create a vector store

    const [openaiFile, vectorStore] = await Promise.all([
      openai.files.create({
        file: fs.createReadStream(req
        .file.path),
        purpose: "assistants",
      }),
      openai.beta.vectorStores.create({
        name: `User-${req.session.userId}-${Date.now()}`,           
      }),
    ]);
   

    console.log("Vector store created ", vectorStore);

    // Update the chat group with the file details
    const updatedChatGroup = await RunModel.findByIdAndUpdate(
      req.params.chatGroupId,
      {
        $set: {
          "run.vectorStoreId": vectorStore.id,
          "run.fileId": openaiFile.id,
          
        },
      },
      { new: true }
    );

    if (!updatedChatGroup) {
      return res.status(404).json({ error: "Chat group not found" });
    }

    // Link the vector store to the assistant so that file_search works
    await openai.beta.assistants.update(updatedChatGroup.run.AssistantId, {
      tool_resources: {
        file_search: { vector_store_ids: [vectorStore.id] },
      },
      tools: [{ type: "file_search" }],
    });

    // Poll until the file is indexed into the vector store
    await openai.beta.vectorStores.files.createAndPoll(
      updatedChatGroup.run.vectorStoreId,
      { file_id: openaiFile.id }
    );
    console.log("Vector store updated ", vectorStore);

    // Save file document in our database
    const fileModel = new FileModel({
      fileName: file.filename,
    });
    await fileModel.save();

    // Remove the temporary file from the uploads directory
    fs.unlinkSync(file.path);

    res.json({ message: "File uploaded successfully", filename: file.filename });
  } catch (error) {
    console.error("Error updating chat group:", error);
    res.status(500).json({ error: "Failed to update chat group" });
  }
});

// Endpoint to delete an attached file
app.delete("/api/delete-file/:chatGroupId/:filename", async (req, res) => {
  try {
    // Find the chat group
    const chatGroup = await RunModel.findById(req.params.chatGroupId);
    if (!chatGroup) {
      return res.status(404).json({ error: "Chat group not found" });
    }

    await openai.beta.assistants.update(chatGroup.run.AssistantId, {
      tool_resources: {},
      tools: [],
    });

    // Find the file document by filename
    const fileDoc = await FileModel.findOne({ fileName: req.params.filename });
    if (!fileDoc) {
      return res.status(404).json({ error: "File not found" });
    }

    // If there is an attached vector store, delete the file from it
    if (chatGroup.run.vectorStoreId && chatGroup.run.fileId) {
      await openai.beta.vectorStores.files.del(
        chatGroup.run.vectorStoreId,
        chatGroup.run.fileId
      );
    }
    await openai.files.del(chatGroup.run.fileId);

    

    
    // Remove the file attachment from the chat group document
    await RunModel.findByIdAndUpdate(
      req.params.chatGroupId,
      { $set: { "run.fileId": null, "run.vectorStoreId": null } },
      { new: true }
    );

    // Delete only this file document (instead of all files)
    await FileModel.deleteOne({ _id: fileDoc._id });

    res.json({ message: "File deleted successfully", filename: req.params.filename });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// SSE endpoint for chat
app.get("/api/chatTool", isAuthenticated, async (req, res) => {
  // Set SSE headers immediately
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  console.log("Client connected");
  
  
  req.on("close", () => {

        console.log("Client disconnected");
        
    });

  try {
    // Extract query parameters (note: currentChatGroupId comes from client)
    const {  prompt, currentChatGroupId, tool} = req.query;
    const responseData = {  prompt, currentChatGroupId,tool};

    // Find the run by chat group ID
      const run = await RunModel.findById(responseData.currentChatGroupId);
      if (!run) {
        res.write(
          `event: error\ndata: ${JSON.stringify({ error: "Run not found" })}\n\n`
        );
        res.end();
        return;
      }

      const user = await UserModel.findById(req.session.userId);
      const subRunPromises = [];

      // Create our event handler, passing in the client and SSE response
      let eventHandler = null;
     if(responseData.tool !== ''){
        console.log("Tool: ", responseData.tool);
        if(responseData.tool === "mail"){
          await openai.beta.assistants.update(run.run.AssistantId, {
            model: "gpt-4o",
  instructions:
    "You are a weather bot. Use the provided functions to answer questions.",
  tools: [
    {
      type: "function",
      function: {
        name: "setEmail",
        description: "Read/write or both to the given email by the user",
        parameters: {
          type: "object",
          properties: {
            instruction: {
              type: "string",
              enum: ["Read", "Write"],
              description: "The instruction to set the email eg, 'Read' or 'Write' ",
            },
            email: {
              type: "string",
              description:
                "The email address specified by the user eg, ending with @gmail.com",
            },
            emailContent: {
              type: "string",
              description: "if it involves writing, write what the user has specified for you to write",
            },

          },
          required: ["instruction", "email", "emailContent"],
          additionalProperties: false
        },
        strict: true
      },
    }
  ],

        });

        eventHandler = new EventHandlerMail(openai, res, subRunPromises,user.tokens);
      }
        if(responseData.tool === "document"){
        
          await openai.beta.assistants.update(run.run.AssistantId, {
            model: "gpt-4o",
            instructions: "Append, Create or Read  the document as specified by the user",
            tools: [
              {
                type: "function",
                function: {
                  name: "setDocument",
                  description: "Append/Create/Read given instruction by the user",
                  parameters: {
                    type: "object",
                    properties: {
                      instruction: {
                        type: "string",
                        enum: ["Append", "Create", "Read"],
                        description: "The instruction for the document eg, 'Append', 'Create' or 'Read'  ",
                      },
                      title: {
                        type: "string",
                        description:
                          "The document title specified by the user or create one using the response ",
                      },
                      content: {
                        type: "string",
                        description: "if it involves appending a existing document or creating one, write what the user has specified for you to write",
                      },
          
                    },
                    required: ["instruction", "title", "content"],
                    additionalProperties: false
                  },
                  strict: true
                },
              }
            ],

      });
      eventHandler = new EventHandlerDocument(openai, res, subRunPromises,user.tokens);
    }
  }
      
      


    // Add the user's message to the existing thread
    await openai.beta.threads.messages.create(run.run.threadId, {
      role: "user",
      content: responseData.prompt,
    });

    // Create a new run with the assistant

    
    let aiMessage = "";
    let promptTokens = 0;
    let completionTokens = 0;
    
 

    // Bind the event handler's onEvent to the "event" event
    eventHandler.on("event", eventHandler.onEvent.bind(eventHandler));

    // Start the main run stream
    const newRun = await openai.beta.threads.runs.stream(
      run.run.threadId,
      {
        assistant_id: run.run.AssistantId,
        model: responseData.model,
      },
      eventHandler
    );

    // Process events from the main run
    try {
      for await (const event of newRun) {
        // Emit the event so that the event handler can check for required actions
        eventHandler.emit("event", event);

      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("OpenAI API request aborted");
      } else {
        console.error("Error processing main run stream:", error);
      }
    }

    // Wait for any sub-run (tool outputs) streams to finish
    if (subRunPromises.length > 0) {
      console.log("Waiting for sub-run streams to finish...");
      await Promise.all(subRunPromises);
    }

      
    
    aiMessage = eventHandler.tempObj.aiMessage;
    promptTokens = eventHandler.tempObj.promptTokens;
    completionTokens = eventHandler.tempObj.completionTokens;
    console.log("the number of prompt tokens: ", promptTokens);
    console.log("the number of completion tokens: ", completionTokens);
    console.log("AI Message from event handler: ", aiMessage);
    
   
    

    let chat =  null;
    
  
    chat = new MessageModel({
      UserMessage: responseData.prompt,
      AIMessage: aiMessage,
      promptTokens: promptTokens,
      completionTokens: completionTokens,
    });
    await chat.save();
    // Send a "done" event  to indicate the end of the stream
    res.write(`data: ${JSON.stringify({ flag: 'DONE', id: chat._id })}\n\n`);
    res.end();

      // Add chat to the chat group's messages
      await RunModel.findByIdAndUpdate(responseData.currentChatGroupId, {
        $push: { "run.messages": chat._id},
        $set: { 
          "updatedAt": new Date()  // Update the timestamp
        }
      });
   
  } catch (error) {
    console.error("Error in /api/chat SSE route:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// SSE endpoint for chat
app.get("/api/chatCompletion", isAuthenticated, async (req, res) => {
  // Set SSE headers immediately
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  console.log("Client connected in chat completions");
  let isDisconnected = false;

    req.on("close", () => {

        console.log("Client disconnected");
        isDisconnected = true;
    });

  try {
    // Extract query parameters (note: currentChatGroupId comes from client)
    const { model, prompt, currentChatGroupId } = req.query;
    const responseData = { model, prompt, currentChatGroupId};

    // Find the run by chat group ID
      const run = await RunModel.findById(responseData.currentChatGroupId);
      if (!run) {
        res.write(
          `event: error\ndata: ${JSON.stringify({ error: "Run not found" })}\n\n`
        );
        res.end();
        return;
      }

      // Add the user's message to the existing thread


      

    let aiMessage = "";
    let promptTokens = 0;
    let completionTokens = 0;
  
    // Stream events 
    const obj = {
      model: responseData.model,
      messages: [
        {"role": "user", "content": responseData.prompt}
      ],
      stream: true,
      stream_options: {
        include_usage: true,
      }
    };

    let completion = null;
    
       if(model === "gpt-4o-mini" || model === "gpt-3.5-turbo" || model === "o1-mini" || model === "o3-mini"){
            completion = await openai.chat.completions.create(obj);
            try{
                 
                    
                    
              for await (const chunk of completion) {
                
                if (isDisconnected) { // Check for abort *inside* the loop
                  console.log("OpenAI stream aborted");
                  break; // Exit the loop
              }

           
                  const content = chunk.choices[0]?.delta?.content;
                  promptTokens = chunk.usage?.prompt_tokens;
                  completionTokens = chunk.usage?.completion_tokens;
                  if(chunk.usage !== undefined){
                    console.log("Prompt tokens: ", promptTokens);
                    console.log("Completion tokens: ", completionTokens);
                  }
                  
                  if (content) {
                    aiMessage += content;
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                

              }
              

              

              
      
          } catch (error) {
            if (error.name === 'AbortError') {
              console.log('OpenAI API request aborted');
          } else {
              console.error("Error processing stream:", error);
          }
        }
       }
       else{

        
          try {
            // Use the anthropic client for Claude models
            const stream = await anthropic.messages.stream({
              model: model, // e.g. "claude-3-5-haiku-20241022"
              max_tokens: 4000,
              messages: [
                { role: "user", content: responseData.prompt }
              ],
            });
        
            // Process the stream chunks
            for await (const chunk of stream) {
              if (isDisconnected) {
                await stream.controller.abort();
                break;
              }
        
              if (chunk.type === 'content_block_delta' && chunk.delta.text) {
                aiMessage += chunk.delta.text;
                res.write(`data: ${JSON.stringify({ content: chunk.delta.text })}\n\n`);
              }
              console.log("Claude chunk:", chunk);
              // Track usage once complete
              if (chunk.type === 'message_start' ) {
                promptTokens = chunk.message.usage?.input_tokens || 0;
                
               
              }
              if(chunk.type === 'message_delta'){

                completionTokens = chunk.usage?.output_tokens || 0;
                console.log("Claude usage:", {
                  promptTokens,
                  completionTokens
                });

              }


              
            }
            
            // Ensure we have the final event
            res.write(`data: ${JSON.stringify({ content: "\n" })}\n\n`);
            
          } catch (error) {
            console.error("Error streaming from Claude:", error);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          }
        }



        

    
 
          
    

    

    
   
    

    let chat =  null;
    // Save the chat message in the database
    if (req.query.messageId) {
      // Send a "done" event to indicate the end of the stream
      try {
        // Validate it's a proper ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.query.messageId)) {
          throw new Error('Invalid message ID format');
        }
        
        const chatMessage = await MessageModel.findById(req.query.messageId);
        if (!chatMessage) {
          throw new Error('Message not found');
        }
        res.write("data: [DONE]\n\n");
        res.end();
        console.log("Editing messageId");
      
        // Update the AI response
      
        console.log("Changing the AI response:", chatMessage.AIMessage);
        chatMessage.UserMessage = responseData.prompt;  
        chatMessage.AIMessage = aiMessage;
      
        await chatMessage.save(); // Save only the modified message
        
        // Rest of your code...
      } catch (error) {
        console.error('Error in /api/chatCompletions SSE route:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
        return;
      }

     

        // Add chat to the chat group's messages
  
     
    }
    else{
    chat = new MessageModel({
      UserMessage: responseData.prompt,
      AIMessage: aiMessage,
      promptTokens: promptTokens,
      completionTokens: completionTokens,
    });
    await chat.save();
    // Send a "done" event  to indicate the end of the stream
    res.write(`data: ${JSON.stringify({ flag: 'DONE', id: chat._id })}\n\n`);
    res.end();

      // Add chat to the chat group's messages
      await RunModel.findByIdAndUpdate(responseData.currentChatGroupId, {
        $push: { "run.messages": chat._id},
        $set: { "run.model": responseData.model,
        "updatedAt": new Date() 
        }
      });
  }
    
   
  } catch (error) {
    console.error("Error in /api/chatCompletions SSE route:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});










// SSE endpoint for chat
app.get("/api/chat", isAuthenticated, async (req, res) => {
  // Set SSE headers immediately
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  console.log("Client connected in api/chat");
  let isDisconnected = false;

    req.on("close", () => {

        console.log("Client disconnected");
        isDisconnected = true;
    });

  try {
    // Extract query parameters (note: currentChatGroupId comes from client)
    const { model, prompt, currentChatGroupId, technique,  assistant } = req.query;
    const responseData = { model, prompt, currentChatGroupId,technique, assistant};

    // Find the run by chat group ID
      const run = await RunModel.findById(responseData.currentChatGroupId);
      if (!run) {
        res.write(
          `event: error\ndata: ${JSON.stringify({ error: "Run not found" })}\n\n`
        );
        res.end();
        return;
      }

      // Add the user's message to the existing thread

      const[myAssistant, threadMessage] = await Promise.all([
        openai.beta.assistants.retrieve(run.run.AssistantId),
        openai.beta.threads.messages.create(run.run.threadId, {
          role: "user",
          content: responseData.prompt,
        })
      ]);

      
      if(myAssistant.model !== responseData.model){ 

        await openai.beta.assistants.update(run.run.AssistantId, {
          model: responseData.model,
          tools : [],
        });
      }
      
      if (responseData.assistant !== '') {
        console.log("Assistant: ", responseData.assistant);
      
        // Define clear roleplay instructions
        const roleplayInstructions = `You are now in roleplay mode. Follow these instructions:
        - Role: ${responseData.assistant}
        - Behavior: Act as the character or role described in the text.
        - Context: Stay in character and respond appropriately to user inputs.
      
        ${responseData.assistant}`;
      
        await openai.beta.assistants.update(run.run.AssistantId, {
          model: 'gpt-4o',
          instructions: roleplayInstructions,
        });

      }
      
      else{
        if(myAssistant.instructions !== null){
          await openai.beta.assistants.update(run.run.AssistantId, {

            instructions: null,
          });

      } }
    
    

    // Create a new run with the assistant

    
    
    

    let aiMessage = "";
    let promptTokens = 0;
    let completionTokens = 0;
    let runId = null;
    // Stream events from the assistant
 
    const newRun =  await openai.beta.threads.runs.create(run.run.threadId, {
        assistant_id: run.run.AssistantId,
        stream: true,
        model: responseData.model,
      
    });
          try{
                  for await (const event of newRun) {
                    
                    if(event.event === 'thread.run.created'){
                      runId = event.data.id;
                      console.log("Run ID: ", runId);
                    }
                    

                    if (isDisconnected) { // Check for abort *inside* the loop

                      await openai.beta.threads.runs.cancel(
                        run.run.threadId,
                        runId
                      ); 
                      console.log("OpenAI stream aborted");
                      break; // Exit the loop
                  }

                    if(event.data.usage){
                  
                    promptTokens = event.data.usage.prompt_tokens;
                    completionTokens = event.data.usage.completion_tokens;

                    }
                    if (event.event === "thread.message.delta") {
                      const content = event.data.delta.content?.[0]?.text?.value;
                      if (content) {
                        aiMessage += content;
                        res.write(`data: ${JSON.stringify({ content })}\n\n`);
                      }
                    }
                  }
                } catch (error) {
                  if (error.name === 'AbortError') {
                    console.log('OpenAI API request aborted');
                } else {
                    console.error("Error processing stream:", error);
                }
              }
    

    

    
   
    

    let chat =  null;
    // Save the chat message in the database
    if (req.query.messageId) {
      // Send a "done" event to indicate the end of the stream
      res.write("data: [DONE]\n\n");
      res.end();
      console.log("Editing messageId");
    
      // Find the message inside the run
      const chatMessage = await MessageModel.findById(req.query.messageId);
      
    
      console.log("Changing the AI response:", chatMessage.AIMessage);
      chatMessage.UserMessage = responseData.prompt;  
      chatMessage.AIMessage = aiMessage;
    
      await chatMessage.save(); // Save only the modified message

        // Add chat to the chat group's messages
  
     
    }
    else{
    chat = new MessageModel({
      UserMessage: responseData.prompt,
      AIMessage: aiMessage,
      promptTokens: promptTokens,
      completionTokens: completionTokens,
    });
    await chat.save();
    // Send a "done" event  to indicate the end of the stream
    res.write(`data: ${JSON.stringify({ flag: 'DONE', id: chat._id })}\n\n`);
    res.end();

      // Add chat to the chat group's messages
      await RunModel.findByIdAndUpdate(responseData.currentChatGroupId, {
        $push: { "run.messages": chat._id},
        $set: { "run.model": responseData.model,
        "updatedAt": new Date() 
        }
      });
  }
    

  

    // If a file was attached (i.e. vectorStoreId exists) then update the message
    if (run.run.vectorStoreId) {
      // Try to find the file document associated with this group (you could also query by additional criteria)
      const fileDoc = await FileModel.findOne({});
      if (fileDoc) {
        await MessageModel.findByIdAndUpdate(chat._id, { fileName: fileDoc.fileName });
      }

      // Update the assistant to remove the tool_resources (if desired)
      await openai.beta.assistants.update(run.run.AssistantId, {
        tool_resources: {},
        tools: [],
      });

      // Update the chat group to remove file references. Re-fetching ensures we have the latest values.
      const updatedGroup = await RunModel.findByIdAndUpdate(
        responseData.currentChatGroupId,
        { $set: { "run.vectorStoreId": null, "run.fileId": null } },
        { new: true }
      );

      // If the updated group still has vector store info (as a safety check), then delete the file from the vector store
      if (updatedGroup.run.vectorStoreId && updatedGroup.run.fileId) {
        await openai.beta.vectorStores.files.del(
          updatedGroup.run.vectorStoreId,
          updatedGroup.run.fileId
        );
      }

      // Delete the file document for this file only
      if (fileDoc) {
        await FileModel.deleteOne({ _id: fileDoc._id });
      }
    }
  } catch (error) {
    console.error("Error in /api/chat SSE route:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

app.post("/api/tokens", isAuthenticated, async (req, res) => {
  try {
    const { text, model, chatGroupId, memory } = req.body;

    if (!text || !model || !chatGroupId) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

   
   
    // Get the chat history from the database
    const chatRun = await RunModel.findById(chatGroupId)

    if (!chatRun) {
        return res.status(404).json({ error: "Chat group not found" });
    }


    let estimatedCompletionTokens = 0;

       // Load the correct tokenizer for the model
    if(model === "gpt-4o-mini" || model === "gpt-3.5-turbo" || model === "o1-mini" || model === "o3-mini"){
              const enc = encoding_for_model(model);

              let thread_messages = null;
              let messages = null;
              let pastTokens = 0;
              if (memory) {
                thread_messages = await openai.beta.threads.messages.list(chatRun.run.threadId, {limit: 100});
                  messages = thread_messages.data.map((msg) => msg.content[0].text.value);
                  console.log("Messages: ", messages);
                  messages.forEach((msg) => {
                      pastTokens += enc.encode(msg).length;
                  } );
              }

              
              // Tokenize the new input message
              const inputTokens = enc.encode(text).length;

              // Define estimated completion token limits based on the model
              const modelCompletionFactors = {
                  "o3-mini": 20, // Predicts 20x input tokens
                  "o1-mini": 1.5, // Predicts 1.5x input tokens
                  "gpt-4o-mini": 1.3, // Predicts 1.3x input tokens
                  "gpt-3.5-turbo": 1.2, // Predicts 1.2x input tokens
              };

              const completionFactor = modelCompletionFactors[model] || 1.2;
              estimatedCompletionTokens = pastTokens + Math.ceil(inputTokens * completionFactor);
              // Free memory for tokenizer
              enc.free();

            }
            else{
              try {
              const client = new Anthropic();

              const response = await client.messages.countTokens({ model: req.body.model, 
                system: 'You are a scientist', messages: [{ role: 'user', content: text }] });

                console.log("Response: ", response);
                
              estimatedCompletionTokens = response.input_tokens*1.5;
             
              }
              catch (error) {
                console.error("Error estimating tokens:", error);
                return res.status(500).json({ error: "Internal server error" });
              }

            }

    

    
    // Return token estimates
    return res.json({
        
        estimatedCompletionTokens,
       
    });

} catch (error) {
    console.error("Error estimating tokens:", error);
    return res.status(500).json({ error: "Internal server error" });
}



});

app.get("/api/chatGroupName", isAuthenticated, async (req, res) => {
  // Set SSE headers immediately
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  console.log("In chatGroupName");
  try {
    // Extract query parameters (note: currentChatGroupId comes from client)
    const { prompt, currentChatGroupId } = req.query;
    const responseData = {  prompt, currentChatGroupId};
    console.log("responseData: ", responseData);

    // Find the run by chat group ID
    const run = await RunModel.findById(responseData.currentChatGroupId);
    if (!run) {
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: "Run not found" })}\n\n`
      );
      res.end();
      return;
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Valid model name
      messages: [
        {"role": "system", "content": "Construct a title using the following chat using very few words."},
        {"role": "user", "content": responseData.prompt}
      ],
      stream: true,
    });

    let aiMessage = "";

    // ✅ Handle chat completion chunks correctly
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        aiMessage += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // ✅ Add error handling for empty response
    if (!aiMessage.trim()) {
      aiMessage = "New Chat"; // Default name
    }

    console.log("Final aiMessage:", aiMessage);
    

    // Send a "done" event to indicate the end of the stream
    res.write("data: [DONE]\n\n");
    res.end();

    // Save the chat message in the database
  
    await RunModel.findByIdAndUpdate(responseData.currentChatGroupId, {
      $set: { "name": aiMessage, "updatedAt": new Date() }
    });

  } catch (error) {
    console.error("Error in /api/chat SSE route:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});




  // Replace your existing SSE-based /api/prompting endpoint with this:

app.get("/api/prompting", isAuthenticated, async (req, res) => {
  try {
    const { prompt, technique } = req.query;
    console.log("Prompting ..", { prompt, technique });

    // Call OpenAI *without* streaming
    const completion = await openai.chat.completions.create({
      model: "o3-mini",
      messages: [
        {
          role: "user", // Use "user" as the default role
          content: `You are an expert in prompt engineering. Your task is to rewrite the given prompt using the specified technique. The technique is: ${technique}. Follow these rules:
          - If the technique is "Chain-of-Thought", Given a user's prompt, rewrite the prompt into a detailed chain-of-thought prompt, explicitly instructing an LLM to think step-by-step. Include clear guidance to outline intermediate reasoning steps explicitly before providing the final answer.
          - If the technique is "Few-Shot Prompting", include 2-3 examples in the rewritten prompt.
          - If the technique is "Self-Consistency", Given a user's prompt, rewrite it into a prompt explicitly instructing an LLM to employ a Self-Consistency approach. The prompt should clearly ask the model to independently generate multiple detailed step-by-step reasoning paths for the same problem, explicitly instructing the model to arrive at each solution independently and then aggregate or compare these reasoning paths to determine a reliable final answer.
          - If the technique is not recognized, default to improving the clarity and specificity of the prompt. Important: No meta comments or instructions should be included in the rewritten prompt.
          
          Original Prompt: ${prompt}\nTechnique: ${technique}`,
        },
      ],
      stream: false, // Disables streaming
    });

    // Get the final rewritten prompt from OpenAI
    const aiMessage = completion.choices?.[0]?.message?.content || "";
    console.log("AI message:", aiMessage);
    // Send back a simple JSON response
    return res.json({ content: aiMessage });
  } catch (error) {
    console.error("Error in /api/prompting route:", error);
    return res.status(500).json({ error: error.message });
  }
});






app.get("/api/image/:id", isAuthenticated, async (req, res) => {
  try {
      const { id } = req.params;

      // Fetch the RunModel using the provided ID and populate messages
      const runData = await RunModel.findById(id).populate("run.messages");

      if (!runData) {
          return res.status(404).json({ error: "Run not found" });
      }

      // Extract promptTokens and completionTokens for each message
      const tokenData = runData.run.messages.map(msg => (
        
        
        
        {

          promptTokens: msg.promptTokens || 0, // Default to 0 if missing
          completionTokens: msg.completionTokens || 0 // Default to 0 if missing
      }));


      console.log("Token data:", tokenData);

      // Send response to client
      return res.json({ tokens: tokenData });

  } catch (error) {
      console.error("Error fetching image data:", error);
      return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to get chats for a chat group
app.get("/api/chatgroup/:id/chats", isAuthenticated, async (req, res) => {
  try {
    const chatGroup = await RunModel.findById(req.params.id).populate("run.messages");
    // Update the session's current chat group id
    req.session.currentChatGroupId = req.params.id;
    res.json(chatGroup.run);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set up Socket.io with the server
const server = ViteExpress.listen(app, 5030, () =>
  console.log("Server is listening on port 5030...")
 );
 
 // Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5030",
    methods: ["GET", "POST"],
    credentials: true
  }
 });

 // Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client with chatGroup connected', socket.id);
   // Store user information when they authenticate
  socket.on('authenticate', (chatGroupID) => {
    socket.chatGroupID = chatGroupID;
    socket.join(`chatGroup:${chatGroupID}`); // Join a room specific to this user
    console.log(`chatGroup ${chatGroupID} authenticated with socket ${socket.id}`);
  });
 

  socket.on('characterTokens', async (data) => {
    try{ 
      const { inputValue, model } = data;
      let tokens = 0;
      if(model === "gpt-4o-mini" || model === "gpt-3.5-turbo" || model === "o1-mini" || model === "o3-mini"){
                const enc = encoding_for_model(model);
                tokens = enc.encode(inputValue).length;
                enc.free();
      }
      else{
        try {
          const client = new Anthropic();
          const response = await client.messages.countTokens({ model: model, 
             messages: [{ role: 'user', content: inputValue }] });
          tokens = response.input_tokens;
        }
        catch (error) {
          console.error("Error fetching character tokens:", error);
        }
      }
    
      // Emit the tokens back to the client
      socket.emit('characterTokens', { tokens });
    } catch (error) {
      console.error("Error fetching character tokens:", error);
   
    }



  }
  );
  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
 
});


