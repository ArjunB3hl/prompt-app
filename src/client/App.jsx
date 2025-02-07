import React, { useEffect, useRef } from 'react'; // Step 1: Import useRef
import { useState } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LinkIcon from '@mui/icons-material/Link';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import SettingsIcon from '@mui/icons-material/Settings';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios'; // Add axios for HTTP requests
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import Link from '@mui/material/Link';
import { useNavigate } from 'react-router-dom';
import { set } from 'mongoose';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { colors } from '@mui/material';
import {Login } from './Login';
import {Signup } from './Signup';
import { useContext } from 'react';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import Slider from '@mui/material/Slider';
import EditIcon from '@mui/icons-material/Edit';
import AddchartIcon from '@mui/icons-material/Addchart';

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the components we need
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

import { Line } from 'react-chartjs-2';
import { ThemeProvider, createTheme, useColorScheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { dark } from '@mui/material/styles/createPalette';
import { Messages } from 'openai/resources/beta/threads/messages.mjs';


const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [username, setUsername] = useState('');
  const [chatGroups, setChatGroups] = useState([]);
  const [currentChatGroupId, setCurrentChatGroupId] = useState(null);
  


  return (
    
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
              <MainApp username={username} chatGroups={chatGroups} setChatGroups={setChatGroups} setCurrentChatGroupId={setCurrentChatGroupId} currentChatGroupId={currentChatGroupId} /> : 
              <Navigate to="/signup" />
            } 
          />
          {console.log('chatGroupID is : ', currentChatGroupId)} 
         
          <Route path="/login" element={(!isAuthenticated) ? <Login setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} setCurrentChatGroupId={setCurrentChatGroupId} /> : <Navigate to="/" />} />
          <Route path="/signup" element={(!isAuthenticated) ? <Signup setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} setCurrentChatGroupId={setCurrentChatGroupId} /> : <Navigate to="/" />} />
        </Routes>
      </Router>

  );
}

function MainApp({ username, chatGroups, setChatGroups, setCurrentChatGroupId, currentChatGroupId}) {
  // Add new state for messages
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState({
    left: false,
    right: false,
  });
  const [model, setModel] = useState('');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null); // Step 2: Define ref
  const [selectedFile, setSelectedFile] = useState(null); // new state
  const [temperature, setTemperature] = useState(0);
  const [leftWidth, setLeftWidth] = useState(200);
  const [resizingLeft, setResizingLeft] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tokens, setTokens] = useState(0);
  const [tokenData, setTokenData] = useState(null);




  const fileInputRef = useRef(null); // ref for hidden file input

  const handleEditing = (id) => {
    setMessages((prevMessages) =>
      prevMessages.map((message) => {
        if (message.id === id && message.sender === 'user') {
          // Return a new object with the updated 'edit' property.
          return { ...message, edit: true };
        }
        return message;
      })
    );
    setIsEditing(true);
  };

  const handleCancel = (id) => {  
    setMessages((prevMessages) =>
      prevMessages.map((message) => {
        if (message.id === id && message.sender === 'user') {
          // Return a new object with the updated 'edit' property.
          return { ...message, edit: false };
        }
        return message;
      })
    );
   

  }

  const handleSave = (id, LocalMessage) => {
    setMessages((prevMessages) =>
      prevMessages.map((message) => {
        if (message.id === id && message.sender === 'user') {
          // Return a new object with the updated 'edit' property.
          return { ...message,text:LocalMessage, edit: false };
        }
        else if (message.id === id && message.sender === 'ai') {
          return { ...message, text: '' };
        }
        return message;
      })
    );

    try {
      // Create an EventSource to listen for streaming responses
      
      const eventSource = new EventSource(
        `/api/chat?prompt=${encodeURIComponent(LocalMessage)}&model=${model || "gpt-3.5-turbo"}&currentChatGroupId=${currentChatGroupId}&messageId=${id}`
      );
      
      eventSource.onmessage = (event) => {
        // Check if the message is the "[DONE]" indicator.
        if (event.data === "[DONE]") {
          // Optionally perform any cleanup, then close the connection.
          
          eventSource.close();
          return;
        }
        
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (error) {
          console.error("Error parsing JSON", error);
          return;
        }
        
        // Now you can process the parsed JSON data.
        if (data.content) {
          setMessages((prevMessages) => 
            prevMessages.map((msg) =>
              msg.id === id && msg.sender === 'ai'
                ? { ...msg, text: msg.text + data.content, edit: false }
                : msg
            )
          );
            
        }
      };

      eventSource.onerror = (error) => {
        console.error('Error in EventSource:', error);
        eventSource.close();
        
      };
      



    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = { text: 'Error fetching response from AI.', sender: 'ai' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
     
    }





  }
 
  const handleFileAttachClick = async () => {
    fileInputRef.current.click();
   

  };
  const [fileName, setFileName] = useState(null);
  const handleFileChange = async (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
  
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatGroupId', currentChatGroupId);
  
      try {
        const response = await axios.post(`/api/upload/${currentChatGroupId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('File uploaded:', response.data.filename);
        setFileName(response.data.filename);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };



  const handleFileDelete = async () => {
    setSelectedFile(null);
    try {
      const response = await axios.delete(`/api/delete-file/${currentChatGroupId}/${fileName}`);
      console.log('File deleted:', response.data.filename);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

  };
  

  const [chat, setChat] = useState(false);
  const isBrowserDefaultDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [themeMode, setThemeMode] = useState(isBrowserDefaultDark() ? 'dark' : 'light');
  const [loader, setLoader] = useState(false);
  const [nameChatGroup, setNameChatGroup] = useState(false); 
  
  {console.log('chatGroupID is : ', currentChatGroupId)} 
  if(chatGroups.length === 0) {
    const loadChatGroups = async () => {
      try {
        const response = await axios.get("/api/check-auth");
        setChatGroups( response.data.chatGroups );
      } catch (error) {
        console.error('Error loading chatGroups:', error);
      }
    };
    
    
      loadChatGroups();
   

}


useEffect(() => {
  // If there's exactly 1 user message total, run the second SSE
  const userMessageCount = messages.filter(msg => msg.sender === 'user').length;
  
  if (userMessageCount === 1 && nameChatGroup === true) {
     const promptMessage = messages.filter(msg => msg.sender === 'user').map(msg => msg.text).join('');
      try{
        setChatGroups(prevChatGroups =>
          prevChatGroups.map(group =>
            
            group._id === currentChatGroupId ? { ...group, name: '' } : group
          )
        );
        const eventSource = new EventSource(
          `/api/chatGroupName?prompt=${encodeURIComponent(promptMessage)}&currentChatGroupId=${currentChatGroupId}`
        );

        eventSource.onmessage = (event) => {
          // Check if the message is the "[DONE]" indicator.
          if (event.data === "[DONE]") {
            // Optionally perform any cleanup, then close the connection.
            
            eventSource.close();
            return;
          }
          
          let data;
          try {
            data = JSON.parse(event.data);
          } catch (error) {
            console.error("Error parsing JSON", error);
            return;
          }
           if (data.content) {
            
            // Append the chunk to the messages
            setChatGroups(prevChatGroups =>
              prevChatGroups.map(group =>
                group._id === currentChatGroupId ? { ...group, name: group.name + data.content } : group
              )
            );
          
          } 
        };

        setNameChatGroup(false);
        eventSource.onerror = (error) => {
          console.error('Error in EventSource:', error);
          eventSource.close();
          
        };


      }
      catch (error) {
        onsole.error('Error fetching AI response:', error);
    

      }


    
  }
}, [messages]);



 
  
  useEffect(() => {
    // Load chats for current chat group
    const loadChats = async () => {
      try {
        const response = await axios.get(`/api/chatgroup/${currentChatGroupId}/chats`);
        if(response.data.messages.length === 0) {
            console.log('No chats found');
            setChat(false);
        }
        else{

          setChat(true);
        }
        setMessages(response.data.messages.map( (chat, index) => ([
          chat.fileName? { text: chat.UserMessage, sender: 'user', file: chat.fileName, id: index, edit: false} : { text: chat.UserMessage, sender: 'user', id: index, edit: false},
          { text: chat.AIMessage, sender: 'ai', id: index },
         
        ])).flat());
        setModel(response.data.model);
      
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    };
    
    if (currentChatGroupId) {
      loadChats();
    }
  }, [currentChatGroupId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); // Step 4: Scroll to bottom
    }
  }, [messages]); // Dependencies include messages and loading

  useEffect(() => {
    if (messages.filter(msg => msg.edit === true).length === 0) {
      setIsEditing(false);
    }
  }, [messages]);

  useEffect(() => {
    setTokenData(null);
  }, [messages]);


  useEffect(() => {
    setTokenData(null);
  }, [currentChatGroupId]);

  const handleChange = (event) => {
   
    setModel(event.target.value);
  };

  // Modify handleKeyPress to send prompt and model data
  const handleKeyPress = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
     
        try {
         const response = await axios.post('/api/tokens', { text: inputValue, model: model || "gpt-3.5-turbo", chatGroupId: currentChatGroupId });
         console.log('estimating :', response.data);
         setTokens(response.data.estimatedCompletionTokens);
          
        }
        catch (error) {
          console.error('Error calculating tokens:', error);
        }







      if (inputValue.trim() && inputValue.length <= 500) {
        const userMessage = selectedFile ? { text: inputValue, sender: 'user', file: selectedFile.name,id: messages[messages.length -1] ? messages[messages.length -1] +1 : 0 , edit: false} : { text: inputValue, sender: 'user', id: messages[messages.length -1] ? messages[messages.length -1] +1 : 0 , edit: false};
        setMessages([...messages, userMessage]);
        setChat(true);
        setInputValue('');
        setSelectedFile(null);
        setLoader(true);
        setNameChatGroup(true);
       

  
        try {
          // Create an EventSource to listen for streaming responses
          
          const eventSource = new EventSource(
            `/api/chat?prompt=${encodeURIComponent(inputValue)}&model=${model || "gpt-3.5-turbo"}&currentChatGroupId=${currentChatGroupId}`
          );
          
          eventSource.onmessage = (event) => {
            // Check if the message is the "[DONE]" indicator.
            if (event.data === "[DONE]") {
              // Optionally perform any cleanup, then close the connection.
              
              eventSource.close();
              return;
            }
            
            let data;
            try {
              data = JSON.parse(event.data);
            } catch (error) {
              console.error("Error parsing JSON", error);
              return;
            }
            
            // Now you can process the parsed JSON data.
            if (data.content) {
              setLoader(false);
              setMessages((prevMessages) => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'ai') {
                  // Update the last AI message
                  return [
                    ...prevMessages.slice(0, -1),
                    { text: lastMessage.text + data.content, sender: 'ai', id: lastMessage.id, edit: false },
                  ];
                } else {
                  // Add a new AI message
                  return [...prevMessages, { text: data.content, sender: 'ai', id: lastMessage.id, edit: false}];
                }
              });
            }
          };
  
          eventSource.onerror = (error) => {
            console.error('Error in EventSource:', error);
            eventSource.close();
            
          };
          



        } catch (error) {
          console.error('Error fetching AI response:', error);
          const errorMessage = { text: 'Error fetching response from AI.', sender: 'ai' };
          setMessages((prevMessages) => [...prevMessages, errorMessage]);
         
        }
      }
    }
  };

  
  
  function handleTemperatureChange(event, value) {
    setTemperature(value);
    
  }


  const toggleDrawer = (anchor, open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setState({ ...state, [anchor]: open });
  };

  // Modify createNewChat to create new chat group
  const createNewChat = async () => {
    try {
      const response = await axios.post('/api/chatgroup', { username });
      const newChatGroup = {
        name: response.data.name,
        _id: response.data.chatGroupId,
        chats: []
      };
      setChatGroups(prevChatGroups => {
        const updatedChatGroups = [...prevChatGroups, newChatGroup];
        return updatedChatGroups;
      });
      setCurrentChatGroupId(response.data.chatGroupId);

    } catch (error) {
      console.error('Error creating chat group:', error);
    }
  };

  // Modify leftDrawer to show chat groups
  const leftDrawer = () => (
    <Box sx={{ width: leftWidth }}>
      <Button
        variant="contained"
        startIcon={<AddIcon/>}
        onClick={createNewChat}
        sx={{
          border: '1px solid',
          borderRadius: '50px',
          textTransform: 'none',
          fontSize: '16px',
          mt: 2,
          ml: 2,
          width: '80%',
        }}
      >
        New Chat
      </Button>
      <Divider sx={{  mt: 2 }} />
      <List sx={{ width: '100%', mt: 2 }}>
        {chatGroups.map((group, index) => (
          <ListItem 
            key={group._id}
            disablePadding
            sx={{
             
              bgcolor: currentChatGroupId === group._id ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              borderLeft: currentChatGroupId === group._id ? themeMode === 'dark'? '4px solid#ede6e6' : '4px solid#141414': 'none',
            }}
          >
            <ListItemButton
              onClick={() => {
                setCurrentChatGroupId(group._id);
              }}
            >
              <ListItemText 
                primary={group.name}
                primaryTypographyProps={{ noWrap: true }}
                sx={{ 
                  pl: 2,
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const rightDrawer = () => (
    <>
      <List>
        {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemText
                primary={text}
                
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider
      
      />
      <Box sx={{ ml: 2 }}>
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={themeMode === 'dark'}
              onChange={event => setThemeMode(event.target.checked ? 'dark' : 'light')}
              color="default"
            />
          }
          label="Dark"
        // Change label color
        />
      </FormGroup>
      </Box>
      <Divider
        
      />
      <Box sx={{ minWidth: 40, mt: 2, ml: 2, mb: 2 }}>
      <FormControl fullWidth>
        <InputLabel
          id="demo-simple-select-label"
          
        >
          Model
        </InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={model}
          label="Model"
          onChange={handleChange}
          
        >
          <MenuItem value={'gpt-4-turbo-preview'}> gpt-4-turbo-preview </MenuItem> 
          <MenuItem value={'gpt-4o-mini'}> gpt-4o-mini </MenuItem>
          <MenuItem value={'gpt-3.5-turbo'}> gpt-3.5-turbo </MenuItem>
          
        </Select>
      </FormControl>


    </Box> 

    <Divider/>
    <Box sx={{ width: 150,ml: 2, mt: 2, mb: 2 }}>
      <Typography id="discrete-slider" gutterBottom>

        Temperature
      </Typography>
      <Slider
        value={temperature}
        step={0.01}
        max={2}
        aria-label="Temperature"
        onChange={handleTemperatureChange}
        valueLabelDisplay="auto"
        color= {themeMode === 'dark' ? '#fff' : '#000'}
      />
    </Box>
    
    </>
  );


  // Content for drawers
  const drawerContent = (anchor) => (
    <Box
      sx={{
        width: anchor === 'left' || anchor === 'right' ? 200 : 'auto',
        
        height: "100%",
      }}
      role="presentation"
    >
      {anchor === 'left' ? leftDrawer() : rightDrawer()}
    </Box>
  );
  const cardContent = () => (
  <div
            style={{
              display: "flex",
              height: "40vh",
              flexWrap: "wrap",
              width: "100vh",
              marginTop: 150,
              marginLeft: "auto",
              marginRight: "auto",
              justifyContent: "center",
            }}
            >
            <Card
              sx={{
              width: "40vh",
              height: "20vh",
              mt: 2,
              mr: 3,
              borderRadius: "16px",
              
              
              border: `1px solid`, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                 
                >
                  Capabilities
                </Typography>
                <Typography
                  variant="body2"
                 
                >
                  Remembers what you've said and uses it to generate responses
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card
            sx={{
              width: "40vh",
              height: "20vh",
              mt: 2,
              mr: 3,
              borderRadius: "16px",
             
              border: `1px solid `, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  
                >
                  Limitations
                </Typography>
                <Typography
                  variant="body2"
                  
                >
                  May not always provide accurate or relevant responses
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card
            sx={{
              width: "40vh",
              height: "10vh",
              mt: 2,
              mr: 3,
              borderRadius: "16px",
              
              border: `1px solid `, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
              
                <Typography
                  variant="body2"
                 
                >
                  Allows users to provide follow-up connections
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card
            sx={{
              width: "40vh",
              height: "10vh",
              mt: 2,
              mr: 3,
              borderRadius: "16px",
              border: `1px solid `, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
              
                <Typography
                  variant="body2"
                >
                 May occasionally provide harmful or biased responses
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card
            sx={{
              width: "40vh",
              height: "10vh",
              mt: 2,
              mr: 3,
              borderRadius: "16px",
              
              border: `1px solid `, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
            
                <Typography
                  variant="body2"
                >
                  trained to decline to provide information on inappropriate topics
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card
            sx={{
              width: "40vh",
              height: "10vh",
              mt: 2,
              mr: 3,
              borderRadius: "16px",
              border: `1px solid `, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
            
                <Typography
                  variant="body2"
                  
                >
                  Limited knowlegde of the world after Oct 2024
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </div>
  );
  // modified tokenData component
  const TokensChart = () => {

   // Create labels (e.g., message index)
  const labels = tokenData.map((_, i) => i + 1);

  // Extract prompt tokens and completion tokens arrays
  const promptTokens = tokenData.map((item) => item.promptTokens);
  const completionTokens = tokenData.map((item) => item.completionTokens);

  // Define the data structure for Chart.js
  const data = {
    labels,
    datasets: [
      {
        label: 'Prompt Tokens',
        data: promptTokens,
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Completion Tokens',
        data: completionTokens,
        borderColor: 'rgba(153,102,255,1)',
        backgroundColor: 'rgba(153,102,255,0.2)',
        tension: 0.3,
        fill: false,
      },
    ],
  };

  // Define chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Token Usage',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Message Index',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Tokens',
        },
      },
    },
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '100px', // adjust vertical position as needed
        left: 'calc(70vw + 200px)', // positioned roughly 70vw + 300px from the left
        width: '200px',
        height: '500px',
        zIndex: 1200,
        backgroundColor: themeMode === 'dark' ? 'black': 'white',
        boxShadow: '0px 0px 5px rgba(0,0,0,0.3)',
        padding: '16px',
      }}
    >
      <Line data={data} options={options} />
    </div>
  );

  };


  // Modified ChatMessage component
  const ChatMessage = ({ message }) => {
    
    const [LocalMessage, setLocalMessage] = useState(message.text); 
    
    
    
    return (

    <Box 
      sx={{
        position: 'relative',
        width: '65vw',
        display: 'flex',
        justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
        py: 2,
       
        '&:hover .edit-icon': { display: 'block' }
      }}
    >
      {message.file ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '70%' }}>
          {/* File Name */}
          <Box
            sx={{
              width: 'fit-content',
              border: `1px solid`,
              borderRadius: '15px',
              padding: '3px 5px',
              wordWrap: 'break-word',
            }}
          >
            <Typography sx={{ fontSize: '0.75rem' }}>{message.file}</Typography>
          </Box>
          {/* Text Message */}
          <Box
            sx={{
              width: 'fit-content', 
              border: `1px solid`,
              borderRadius: '15px',
              padding: '10px 15px',
              wordWrap: 'break-word',
            }}
          >
            <Typography>{message.text}</Typography>
          </Box>
     
        </Box>
      ) : message.edit? <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%'}}>
                  <TextField
                id="input-with-sx"
                variant="outlined"
                multiline
                maxRows={4}
                value={LocalMessage}
                onChange={(e) => setLocalMessage(e.target.value)}
                fullWidth 
                error={LocalMessage.length > 500}
                helperText={LocalMessage.length > 500 ? 'Character limit has been reached' : ''}

              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button onClick={() => handleSave(message.id,LocalMessage)} variant="contained">
              Save
            </Button>
            <Button onClick = {() => handleCancel(message.id)} >Cancel</Button>
        
          </Box>

           
        </Box>:  (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: message.sender === 'user' ? '70%' : '100%', }}>
        <Box
          sx={{
            width: 'fit-content',
            border: `1px solid`,
            borderRadius: '15px',
            padding: '10px 15px',
            wordWrap: 'break-word',
          }}
        >
          <Typography>{message.text}</Typography>
        </Box>
        {message.sender === 'user'  && (
        <Box
          className="edit-icon"
          sx={{
            display: 'none',
            position: 'absolute',
            cursor: 'pointer',
            transform: 'translateX(-30px) scale(0.8)', // moves it slightly left and makes it 80% of its original size
            opacity: 0.8,
            
          }}
        >
          <EditIcon onClick ={ () => handleEditing(message.id )}/>
        </Box>
        
      ) }
        </Box>
      ) } 
      
    </Box>
  )};

  // Add messages display area - place this before the input Box component
  const chatContent = () => (
    <Box
      sx={{
        // Full width for AI messages
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        
        overflowY: 'auto', // Only show scrollbar when needed
        marginTop: '100px',
        paddingBottom: '190px', // Adjust to match input box height
      
      }}
    >
      {messages.map((message, index) => (

        <> 
        
        <ChatMessage key={index} message={message} /> 
        
        
        </>
        
      ))}
    {loader ? (<Box 
      sx={{
        width: '65vw',
        display: 'flex',
        justifyContent:  'flex-start',
      }}
    ><Box sx={{ display: 'flex', alignItems: 'flex-start'}}>
        <CircularProgress size="1.5rem"/> 
        <Typography sx={{ ml: 1 }}> Estimating {tokens} completion tokens</Typography>
      </Box> </Box>)    : null}

    {!isEditing && <div ref={messagesEndRef} /> } {/* Step 3: Attach ref */}
    </Box>
  );

  const getMainWidth = () => {
    if (state.left && state.right) return `calc(100% - 200px - ${leftWidth}px)`;
    if ( state.right) return "calc(100% - 200px)";
    if (state.left)  return `calc(100% - ${leftWidth}px)`;
    return "100%";
  };

  const handleImageClick = async () => {
    try {
      const response = await axios.get(`/api/image/${currentChatGroupId}`);
      console.log('Image response:', response.data.tokens);
      setTokenData(response.data.tokens);
      // ...handle the data from the API as needed...
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  };

  return (
    <ThemeProvider
      theme={createTheme({
        palette: { mode: themeMode },
        components: {
          MuiIconButton: {
            styleOverrides: {
              root: {
                color: themeMode === 'dark' ? '#fff' : '#000',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                color: themeMode === 'dark' ? '#fff' : '#000',
                backgroundColor: 'inherit',
                '&:hover': {
                  backgroundColor: themeMode === 'dark' ? '#000' : '#fff',
                },
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: themeMode === 'dark' ? '#000' : '#fff',
              },
            },
          },
         
        },
      })}
    >
      <CssBaseline />
    <Box sx={{ 
      width: '100%',
  
      height: 'calc(100vh - 200px)',
    
    }}>
      <AppBar
        position="fixed"
        sx={{
          width: getMainWidth(),
          
          
          transition: "all 0.3s ease",
          ml: state.left ? `${leftWidth}` : 0,
          mr: state.right ? "200px" : 0,
        }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            aria-label="menu"
            
            onClick={
              state.left ? toggleDrawer("left", false) : toggleDrawer("left", true)
            }
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h8"
            component="div"
            sx={{ flex: 1, color: (themeMode === 'dark' ? 'white' : 'black') }} // Title color
          >
            LLM Analyzer
          </Typography>



          <Box sx={{ flex: 1 }}>
            <Button
              startIcon={<HelpOutlineIcon />}
              sx={{ textTransform: "none" }} // Help button color
            >
              Help
            </Button>
            <Button
              startIcon={<LinkIcon />}
              sx={{ textTransform: "none"}} // API button color
              >
              API
              </Button>
            </Box>


            <Button
              
              startIcon={<AccountCircleIcon />}
            >
              <Typography
              variant="h8"
              component="div"
              
              >
              {username || 'User Name'}
              </Typography>
            </Button>
            </Toolbar>
          </AppBar>

          { chat ? chatContent() : cardContent() }
        
          <Box
  sx={{
    width: "65vw",
    display: "flex",
    flexDirection: "column", // Step 1: column layout
    border: `1px solid`,
    p: 1,
    borderRadius: "20px",
    mt: 2,
    backgroundColor: themeMode === 'dark' ? '#333' : '#fff',
    position: "fixed",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    height: 120, 
  }}
>
  {/* If a file is selected, show a Chip on top */}
  {selectedFile && (
    <Chip
      label={selectedFile.name}
      onDelete={() => handleFileDelete()}
      deleteIcon={<CloseIcon />}
      sx={{ mb: 1 }} 
    />
  )}

  {/* Step 3: wrap icon & TextField in nested row */}
  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
    <AttachFileIcon
      sx={{ mr: 1, cursor: "pointer" }}
      onClick={handleFileAttachClick}
    />
    <input
      ref={fileInputRef}
      type="file"
      style={{ display: 'none' }}
      onChange={handleFileChange}
    />

    <AddchartIcon sx={{ mr: 2, cursor: "pointer" }} onClick={handleImageClick} />

    <TextField
      id="input-with-sx"
      label="Add a prompt"
      variant="standard"
      fullWidth
      multiline
      maxRows={4}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyPress}
      error={inputValue.length > 500}
      helperText={inputValue.length > 500 ? 'Character limit has been reached' : ''}
      sx={{
        flex: 1,
      }}
    />
    <IconButton
      onClick={
        state.right
          ? toggleDrawer("right", false)
          : toggleDrawer("right", true)
      }
      sx={{ ml: 1 }}
    >
      <SettingsIcon sx={{ cursor: "pointer" }} />
    </IconButton>
  </Box>
</Box>
{state.left && ( <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: leftWidth,
            backgroundColor: themeMode === 'dark' ? '#000' : '#fff',
            boxShadow: 3,
            zIndex: 1300,
            overflowY: 'auto',
            transition: 'width 0.3s ease',
          }}
        >
          {drawerContent("left")}
          
          <Box
            onMouseDown={() => setResizingLeft(true)}
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '5px',
              height: '100%',
              cursor: 'col-resize',
              zIndex: 1400,
            }}
          />



        {resizingLeft && (
                <Box
                  onMouseMove={(e) => {
                    let newWidth = e.clientX;
                    newWidth = Math.max(newWidth, 200);
                    newWidth = Math.min(newWidth, 250);
                    setLeftWidth(newWidth);
                  }}
                  onMouseUp={() => setResizingLeft(false)}
                  sx={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "col-resize",
                    zIndex: 9999,
                    // optional: backgroundColor: "rgba(0, 0, 0, 0.1)",
                  }}
                />
              )}
        </Box>

        
      )}

      {/* Custom Right Drawer */}
      {state.right && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 200, // fixed width for right drawer
            backgroundColor: themeMode === 'dark' ? '#000' : '#fff',
            boxShadow: 3,
            zIndex: 1300,
            overflowY: 'auto',
            transition: 'width 0.3s ease',
          }}
        >
          {drawerContent("right")}
          
        </Box>
      )}

     { tokenData !== null ? <TokensChart /> : null }

      </Box>
    </ThemeProvider>
  );
}









export default App;





