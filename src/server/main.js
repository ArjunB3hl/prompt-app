import express from "express";
import ViteExpress from "vite-express";

import mongoose from "mongoose";
import session from "express-session";
import bcryptjs from "bcryptjs";
import { UserModel } from "../models/user.js";
import { RunModel } from "../models/run.js";
import { MessageModel } from "../models/message.js";
import { FileModel } from "../models/file.js";
import { encoding_for_model } from "@dqbd/tiktoken";

import "dotenv/config"; // Loads environment variables from .env
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    const emptyThread = await openai.beta.threads.create();
    const myAssistant = await openai.beta.assistants.create({
      instructions: "Answer questions using file_search",
      model: "gpt-3.5-turbo",
      
    });

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
    const chatGroup = await RunModel.findOne({ user: user._id });
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

// Add endpoint to create a new chat group
app.post("/api/chatgroup", isAuthenticated, async (req, res) => {
  try {
    const user = await UserModel.findOne({ username: req.body.username });
    const myAssistant = await openai.beta.assistants.create({
      instructions: "Answer questions using file_search",
      model: "gpt-3.5-turbo",
      
    });
    const emptyThread = await openai.beta.threads.create();

    // Create a new chat group for the user
    const chatGroup = new RunModel({
      name: "New Chat",
      user: user._id,
      run: { threadId: emptyThread.id, AssistantId: myAssistant.id, messages: [], model: "gpt-3.5-turbo" },
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
      const chatGroups = await RunModel.find({ user: req.session.userId });
      console.log("chatGroupID: ", req.session.currentChatGroupId);
      res.json({
        isAuthenticated: true,
        username: user.username,
        chatGroups: chatGroups,
        currentChatGroupId: req.session.currentChatGroupId,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.json({ isAuthenticated: false });
  }
});

import multer from "multer";
import fs from "fs";
import path from "path";

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
    const openaiFile = await openai.files.create({
      file: fs.createReadStream(req.file.path),
      purpose: "assistants",
    });

    const vectorStore = await openai.beta.vectorStores.create({
      name: `User-${req.session.userId}-${Date.now()}`,
    });

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
app.get("/api/chat", isAuthenticated, async (req, res) => {
  // Set SSE headers immediately
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

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

    const myAssistant = await openai.beta.assistants.retrieve(
      run.run.AssistantId
    );
    if(myAssistant.model !== responseData.model){ 

      await openai.beta.assistants.update(run.run.AssistantId, {
        model: responseData.model,
      });
    }
    // Add the user's message to the existing thread
    await openai.beta.threads.messages.create(run.run.threadId, {
      role: "user",
      content: responseData.prompt,
    });

    // Create and execute a new run with streaming enabled
    const newRun = await openai.beta.threads.runs.create(run.run.threadId, {
      assistant_id: run.run.AssistantId,
      stream: true,
      model: responseData.model,
    });

    let aiMessage = "";
    let promptTokens = 0;
    let completionTokens = 0;

    // Stream events from the assistant
    for await (const event of newRun) {
      if(event.data.usage){
      console.log("Usage:", event.data.usage);
      promptTokens += event.data.usage.prompt_tokens;
      completionTokens += event.data.usage.completion_tokens;

      }
      if (event.event === "thread.message.delta") {
        const content = event.data.delta.content?.[0]?.text?.value;
        if (content) {
          aiMessage += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    }

    // Send a "done" event to indicate the end of the stream
    res.write("data: [DONE]\n\n");
    res.end();

    // Save the chat message in the database
    if (req.query.messageId) {
      console.log("Editing messageId");
    
      const tempRun = await RunModel.findById(responseData.currentChatGroupId).populate("run.messages");
    
      
    
      // Find the message inside the run
      const chatMessage = tempRun.run.messages[req.query.messageId];
    
      
    
      console.log("Changing the AI response:", chatMessage.AIMessage);
      chatMessage.UserMessage = responseData.prompt;  
      chatMessage.AIMessage = aiMessage;
    
      await chatMessage.save(); // Save only the modified message

        // Add chat to the chat group's messages
  
     
    }
    else{
    const chat = new MessageModel({
      UserMessage: responseData.prompt,
      AIMessage: aiMessage,
      promptTokens: promptTokens,
      completionTokens: completionTokens,
    });
    await chat.save();

      // Add chat to the chat group's messages
      await RunModel.findByIdAndUpdate(responseData.currentChatGroupId, {
        $push: { "run.messages": chat._id},
        $set: { "run.model": responseData.model }
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
    const { text, model, chatGroupId } = req.body;

    if (!text || !model || !chatGroupId) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    // Load the correct tokenizer for the model
    const enc = encoding_for_model(model);
    
    // Get the chat history from the database
    const chatRun = await RunModel.findById(chatGroupId).populate("run.messages");

    if (!chatRun) {
        return res.status(404).json({ error: "Chat group not found" });
    }

    // Tokenize previous messages (system + user + assistant)
    let pastTokens = 0;
    chatRun.run.messages.forEach((msg) => {
        pastTokens += enc.encode(msg.UserMessage || "").length;
        pastTokens += enc.encode(msg.AIMessage || "").length;
    });

    // Tokenize the new input message
    const inputTokens = enc.encode(text).length;

    // Define estimated completion token limits based on the model
    const modelCompletionFactors = {
        "gpt-4-turbo-preview": 1.5, // Predicts 1.5x input tokens
        "gpt-4o-mini": 1.3, // Predicts 1.3x input tokens
        "gpt-3.5-turbo": 1.2, // Predicts 1.2x input tokens
    };

    const completionFactor = modelCompletionFactors[model] || 1.2;
    const estimatedCompletionTokens = pastTokens + Math.ceil(inputTokens * completionFactor);

    

    // Free memory for tokenizer
    enc.free();

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
      $set: { "name": aiMessage }
    });

  } catch (error) {
    console.error("Error in /api/chat SSE route:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
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

ViteExpress.listen(app, 5030, () =>
  console.log("Server is listening on port 5030...")
);