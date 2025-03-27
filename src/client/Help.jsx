import React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Card,
  CardContent,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import BarChartIcon from "@mui/icons-material/BarChart";
import ChatIcon from "@mui/icons-material/Chat";
import MemoryIcon from "@mui/icons-material/Memory";
import BuildIcon from "@mui/icons-material/Build";
import PersonIcon from "@mui/icons-material/Person";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import StorageIcon from "@mui/icons-material/Storage";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SettingsIcon from "@mui/icons-material/Settings";
import GavelIcon from "@mui/icons-material/Gavel";
import SearchIcon from "@mui/icons-material/Search";
import MailIcon from "@mui/icons-material/Mail";
import DescriptionIcon from "@mui/icons-material/Description";

export function Help() {
  // Theme definition from Home.jsx
  const theme = createTheme({
    palette: {
      mode: "light",
      primary: {
        main: "#000", // Minimalistic black accent
      },
      background: {
        default: "#ececec", // Softer gray for overall background
        paper: "#f9f9f9", // Slightly lighter for paper sections
      },
      text: {
        primary: "#000",
        secondary: "#555",
      },
    },
    typography: {
      fontFamily: '"San Francisco", "Helvetica Neue", Arial, sans-serif',
    },
  });

  // AI Models available in the application
  const aiModels = [
    {
      name: "GPT-4o",
      description: "OpenAI's most advanced model with multimodal capabilities",
      pricing: "$2.50 per 1M input tokens, $10 per 1M output tokens",
    },
    {
      name: "GPT-3.5-turbo",
      description: "Balanced model for most general-purpose tasks",
      pricing: "$0.50 per 1M input tokens, $1.50 per 1M output tokens",
    },
    {
      name: "GPT-4o-mini",
      description: "Smaller, faster version of GPT-4o",
      pricing: "$0.15 per 1M input tokens, $0.60 per 1M output tokens",
    },
    {
      name: "o1-mini",
      description: "Optimized for efficiency and speed",
      pricing: "$1.10 per 1M input tokens, $4.40 per 1M output tokens",
    },
    {
      name: "o3-mini",
      description: "Balanced performance and efficiency",
      pricing: "$1.10 per 1M input tokens, $4.40 per 1M output tokens",
    },
    {
      name: "Claude-3.5-haiku",
      description: "Anthropic's lightweight model for quick responses",
      pricing: "$0.80 per 1M input tokens, $4.0 per 1M output tokens",
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 4 }}>
        <Container maxWidth="lg">
          <Paper elevation={3} sx={{ p: 4, mb: 4, bgcolor: "background.paper" }}>
            <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: "bold" }}>
              Prompt App Help Center
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph align="center">
              Your comprehensive guide to using all features of the Prompt App
            </Typography>
          </Paper>

          {/* Getting Started Section */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>Getting Started</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Prompt App is an AI-powered chat application designed for advanced prompt engineering. 
                It allows you to interact with various AI models, track performance metrics, and optimize your prompts.
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Key Features:
              </Typography>
              <List sx={{ '& .MuiListItemText-primary': { fontSize: '0.95rem', fontWeight: 'normal' } }}>
                <ListItem>
                  <ListItemIcon><ChatIcon /></ListItemIcon>
                  <ListItemText primary="Chat with multiple AI models" secondary="Choose from a variety of state-of-the-art models" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><MemoryIcon /></ListItemIcon>
                  <ListItemText primary="Memory options" secondary="Toggle between stateful (with memory) and stateless conversations" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BarChartIcon /></ListItemIcon>
                  <ListItemText primary="Analytics dashboard" secondary="Track token usage, costs, and performance metrics" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><GavelIcon /></ListItemIcon>
                  <ListItemText primary="Response evaluation" secondary="Judge AI responses for accuracy, coherence, and relevance" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PsychologyIcon /></ListItemIcon>
                  <ListItemText primary="Advanced prompting techniques" secondary="Few Shot, Chain of Thought, Self Consistency, Role, and React prompting" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          {/* AI Models Section */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>AI Models</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Prompt App supports multiple AI models with different capabilities and pricing. 
                You can select the most appropriate model for your specific needs.
              </Typography>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {aiModels.map((model, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
                          {model.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          {model.description}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Pricing:</strong> {model.pricing}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Chat Features Section */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>Chat Features</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                The chat interface offers several features to enhance your interaction with AI models.
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Memory Options
              </Typography>
              <Typography paragraph>
                Toggle between stateful (with memory) and stateless conversations:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><MemoryIcon /></ListItemIcon>
                  <ListItemText 
                    primary="With Memory (Stateful)" 
                    secondary="The AI remembers previous messages in the conversation, allowing for contextual responses" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ChatIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Without Memory (Stateless)" 
                    secondary="Each message is treated independently, without context from previous messages" 
                  />
                </ListItem>
              </List>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Message Editing
              </Typography>
              <Typography paragraph>
                You can edit your previous messages to refine your prompts and get better responses.
                When you edit a message, the AI will generate a new response based on your updated prompt.
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                File Attachments
              </Typography>
              <Typography paragraph>
                You can attach files to your messages, allowing the AI to process and respond to the content of those files.
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Token Estimation
              </Typography>
              <Typography paragraph>
                The app provides real-time token estimation as you type, helping you understand the potential cost and complexity of your prompts.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Advanced Prompting Techniques */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>Advanced Prompting Techniques</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Prompt App supports multiple advanced prompting techniques to help you get the most out of AI models.
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Few Shot Prompting
              </Typography>
              <Typography paragraph>
                Provide examples of the desired input-output pairs to guide the AI's responses. This technique helps the model understand the pattern you want it to follow.
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Chain of Thought Prompting
              </Typography>
              <Typography paragraph>
                Encourage the AI to break down complex problems into step-by-step reasoning. This technique improves performance on tasks requiring multi-step logical reasoning.
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Self Consistency
              </Typography>
              <Typography paragraph>
                Generate multiple reasoning paths and select the most consistent answer. This technique helps improve accuracy on complex reasoning tasks.
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Role Prompting
              </Typography>
              <Typography paragraph>
                Define custom assistant roles to guide the AI's responses. This technique requires memory to be enabled.
              </Typography>
              <List sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: 'normal' } }}>
                <ListItem>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="Technical Expert" secondary="For detailed technical explanations" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="Creative Writer" secondary="For storytelling and creative content" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="Data Analyst" secondary="For analyzing and interpreting data" />
                </ListItem>
              </List>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                React Prompting
              </Typography>
              <Typography paragraph>
                Use specialized tool-based prompting techniques that guide the AI through a structured reasoning process.
                This can be particularly useful for complex problem-solving tasks.
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: "medium" }}>
                Available Tools:
              </Typography>
              <List sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: 'normal' } }}>
                <ListItem>
                  <ListItemIcon><MailIcon /></ListItemIcon>
                  <ListItemText primary="Mail" secondary="Send emails through the AI (requires a google account)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><DescriptionIcon /></ListItemIcon>
                  <ListItemText primary="Document" secondary="Create and process documents (requires a google account)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SearchIcon /></ListItemIcon>
                  <ListItemText primary="Search" secondary="Perform web searches (requires memory to be disabled)" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Analytics Dashboard */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>Analytics Dashboard</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                The Analytics Dashboard provides valuable insights into your AI interactions.
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Available Charts
              </Typography>
              <List sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: 'normal' } }}>
                <ListItem>
                  <ListItemIcon><BarChartIcon /></ListItemIcon>
                  <ListItemText primary="Token Data" secondary="Track prompt and completion token usage over time" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BarChartIcon /></ListItemIcon>
                  <ListItemText primary="Accuracy" secondary="Measure the accuracy of AI responses" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BarChartIcon /></ListItemIcon>
                  <ListItemText primary="Coherence" secondary="Evaluate the coherence of AI responses" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BarChartIcon /></ListItemIcon>
                  <ListItemText primary="Relevance" secondary="Assess the relevance of AI responses to your prompts" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BarChartIcon /></ListItemIcon>
                  <ListItemText primary="Model Comparison" secondary="Compare performance metrics across different AI models" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BarChartIcon /></ListItemIcon>
                  <ListItemText primary="Cost Analysis" secondary="Analyze the cost of your AI interactions" />
                </ListItem>
              </List>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Data Selection
              </Typography>
              <Typography paragraph>
                You can select specific chat groups and individual messages to analyze, allowing for targeted performance evaluation.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Account Management */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>Account Management</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Manage your account settings and authentication options.
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Authentication Options
              </Typography>
              <List sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: 'normal' } }}>
                <ListItem>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="Username/Password" secondary="Traditional login with username and password" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="Google Authentication" secondary="Sign in with your Google account" />
                </ListItem>
              </List>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Profile Settings
              </Typography>
              <Typography paragraph>
                You can update your profile information and preferences from the settings menu.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Technical Information */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>Technical Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Technical details about the application architecture and data storage.
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Data Storage
              </Typography>
              <List sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: 'normal' } }}>
                <ListItem>
                  <ListItemIcon><StorageIcon /></ListItemIcon>
                  <ListItemText primary="MongoDB" secondary="Primary database for storing chat data and user information" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><StorageIcon /></ListItemIcon>
                  <ListItemText primary="IndexedDB" secondary="Local browser storage for caching chat data and improving performance" />
                </ListItem>
              </List>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Frontend Technologies
              </Typography>
              <List sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: 'normal' } }}>
                <ListItem>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="React" secondary="JavaScript library for building the user interface" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Material-UI" secondary="React component library for consistent design" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Chart.js" secondary="JavaScript charting library for analytics visualizations" />
                </ListItem>
              </List>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Backend Technologies
              </Typography>
              <List sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: 'normal' } }}>
                <ListItem>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Node.js" secondary="JavaScript runtime for the server" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Express" secondary="Web framework for handling HTTP requests" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Socket.io" secondary="Real-time bidirectional event-based communication" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Troubleshooting */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>Troubleshooting</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Common issues and their solutions.
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Connection Issues
              </Typography>
              <Typography paragraph>
                If you're experiencing connection issues:
              </Typography>
              <List sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: 'normal' } }}>
                <ListItem>
                  <ListItemText primary="1. Check your internet connection" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="2. Refresh the page" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="3. Clear your browser cache" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="4. Try logging out and logging back in" />
                </ListItem>
              </List>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                AI Response Issues
              </Typography>
              <Typography paragraph>
                If you're not getting the expected responses from the AI:
              </Typography>
              <List sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: 'normal' } }}>
                <ListItem>
                  <ListItemText primary="1. Try rephrasing your prompt" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="2. Check if you're using the appropriate model for your task" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="3. Toggle the memory option to see if it affects the response" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="4. Try using role prompting or react prompting for more structured responses" />
                </ListItem>
              </List>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: "bold" }}>
                Response Evaluation
              </Typography>
              <Typography paragraph>
                The gavel icon allows you to evaluate AI responses based on three key metrics:
              </Typography>
              <List sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', fontWeight: 'normal' } }}>
                <ListItem>
                  <ListItemIcon><GavelIcon /></ListItemIcon>
                  <ListItemText primary="Accuracy" secondary="How factually correct the response is" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><GavelIcon /></ListItemIcon>
                  <ListItemText primary="Coherence" secondary="How well-structured and logical the response is" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><GavelIcon /></ListItemIcon>
                  <ListItemText primary="Relevance" secondary="How well the response addresses your specific query" />
                </ListItem>
              </List>
              <Typography paragraph>
                These evaluations are stored and can be viewed in the Analytics Dashboard to help you improve your prompting techniques.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
