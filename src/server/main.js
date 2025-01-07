import express from "express";
import ViteExpress from "vite-express";
import { main as openAIChat } from '../LLM/openai.js';
import mongoose from "mongoose";
import session from 'express-session';
import bcryptjs from 'bcryptjs';
import { UserModel } from '../models/user.js';
import { ChatGroupModel } from '../models/chatgroup.js';
import { ChatModel } from '../models/chat.js';

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

    // Create a default chat group for the new user
    const chatGroup = new ChatGroupModel({
      user: user._id,
      chats: []
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
    const chatGroup =  await ChatGroupModel.findOne({ user: user._id });
    if (!chatGroup) {
      console.log('chatGroup not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set session
    req.session.userId = user._id;
    req.session.username = username; // Store username in session
    
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
    const chatGroup = new ChatGroupModel({
      user: user._id,
      chats: []
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
      const chatGroups = await ChatGroupModel.find({ user: req.session.userId });
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

// Protect chat endpoint
app.post("/api/chat", isAuthenticated, async (req, res) => {
  try {
    const response = await openAIChat(req.body.model,req.body.prompt);
    
    // Create new chat
    const chat = new ChatModel({
      prompt: req.body.prompt,
      response: response.choices[0].message.content
    });
    await chat.save();

    // Add chat to current chat group
    await ChatGroupModel.findByIdAndUpdate(
      req.session.currentChatGroupId,
      { $push: { chats: chat._id } }
    );

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add endpoint to get chats for a chat group
app.get("/api/chatgroup/:id/chats", isAuthenticated, async (req, res) => {
  try {
    const chatGroup = await ChatGroupModel.findById(req.params.id).populate('chats');
    req.session.currentChatGroupId = req.params.id;
    res.json(chatGroup.chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

ViteExpress.listen(app, 5030, () =>
  console.log("Server is listening on port 5030..."),
);
