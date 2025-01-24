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

import { ThemeProvider, createTheme, useColorScheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

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
  const [loading, setLoading] = useState(false);
  const [dotCount, setDotCount] = useState(0); // New state for dots
  const messagesEndRef = useRef(null); // Step 2: Define ref

  // Add useEffect to handle dot animation
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setDotCount((prev) => (prev < 5 ? prev + 1 : 0));
      }, 500);
    } else {
      setDotCount(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const [chat, setChat] = useState(false);
  const isBrowserDefaultDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [themeMode, setThemeMode] = useState(isBrowserDefaultDark() ? 'dark' : 'light');
  const [loader, setLoader] = useState(false);
  
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
    // Load chats for current chat group
    const loadChats = async () => {
      try {
        const response = await axios.get(`/api/chatgroup/${currentChatGroupId}/chats`);
        if(response.data.length === 0) {
            console.log('No chats found');
            setChat(false);
        }
        else{

          setChat(true);
        }
        setMessages(response.data.map(chat => ([
          { text: chat.prompt, sender: 'user' },
          { text: chat.response, sender: 'ai' }
        ])).flat());
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
  }, [messages, loading]); // Dependencies include messages and loading

  const handleChange = (event) => {
   
    setModel(event.target.value);
  };

  // Modify handleKeyPress to send prompt and model data
  const handleKeyPress = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (inputValue.trim() && inputValue.length <= 500) {
        const userMessage = { text: inputValue, sender: 'user' };
        setMessages([...messages, userMessage]);
        setChat(true);
        setInputValue('');
        setLoading(true); // Start loading

        try {
          const response = await axios.post('/api/chat', {
            prompt: inputValue,
            model: model || 'gpt-3.5-turbo',
          });
          const aiMessage = { text: response.data.choices[0].message.content, sender: 'ai' };
          setMessages((prevMessages) => [...prevMessages, aiMessage]);
        } catch (error) {
          console.error('Error fetching AI response:', error);
          const errorMessage = { text: 'Error fetching response from AI.', sender: 'ai' };
          setMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
          setLoading(false); // Stop loading
        }
      }
    }
  };

  


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
    <>
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
            }}
          >
            <ListItemButton
              onClick={() => {
                setCurrentChatGroupId(group._id);
              }}
            >
              <ListItemText 
                primary={`Chat ${index + 1}`}
                sx={{ 
                  pl: 2,
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
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
      <Divider
        
      />
      <Box sx={{ minWidth: 40, mt: 2, ml: 2 }}>
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
          
          <MenuItem value={'gpt-4'}> gpt-4 </MenuItem>
          <MenuItem value={'gpt-4o-mini'}> gpt-4o-mini </MenuItem>
          <MenuItem value={'gpt-3.5-turbo'}> gpt-3.5-turbo </MenuItem>
        </Select>
      </FormControl>
    </Box> 
    </>
  );


  // Content for drawers
  const drawerContent = (anchor) => (
    <Box
      sx={{
        width: anchor === 'left' || anchor === 'right' ? 250 : 'auto',
        
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
                 May occasionally provide harmfun or biased responses
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

  // Modify ChatMessage component for full width response box
  const ChatMessage = ({ message }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
     
        mb: 2,
        px: 2,
      }}
    >
      <Box
        sx={{
          width: message.sender === 'user' ? '70%' : '100%', // Full width for AI messages
        
          border: `1px solid `,
          borderRadius: '15px',
          padding: '10px 15px',
          wordWrap: 'break-word',
        }}
      >
        <Typography>{message.text}</Typography>
      </Box>
    </Box>
  );

  // Add messages display area - place this before the input Box component
  const chatContent = () => (
    <Box
      sx={{
        height: 'calc(100vh)',
        overflow: 'auto',
        marginTop: '80px',
        paddingBottom: '80px',
      }}
    >
      {messages.map((message, index) => (

        <> 
        
        <ChatMessage key={index} message={message} /> 
        
        
        </>
        
      ))}

{loading? <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
     
        mb: 2,
        px: 2,
      }}
    >
      <Box
        sx={{
          width: '15%', // Full width for AI messages
        
          border: `1px solid `,
          borderRadius: '15px',
          padding: '10px 15px',
          wordWrap: 'break-word',
        }}
      >
        <Typography> Loading <span style={{ color: themeMode === 'dark' ? '#bbb' : '#777' }}>
                {'.'.repeat(dotCount)}
              </span></Typography>
      </Box>
    </Box> : null}
    
    <div ref={messagesEndRef} /> {/* Step 3: Attach ref */}
    </Box>
  );

  const getMainWidth = () => {
    if (state.left && state.right) return "calc(100% - 500px)";
    if (state.left || state.right) return "calc(100% - 250px)";
    return "100%";
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
                backgroundColor: themeMode === 'dark' ? '#444' : '#fff',
                '&:hover': {
                  backgroundColor: themeMode === 'dark' ? '#333' : '#f5f5f5',
                },
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: themeMode === 'dark' ? '#333' : '#fff',
              },
            },
          },
         
        },
      })}
    >
      <CssBaseline />
    <Box sx={{ 
      width: getMainWidth(),
      
      height: "100vh",
      ml: state.left ? "250px" : 0,
      mr: state.right ? "250px" : 0,
      transition: "all 0.3s ease",
    }}>
      <AppBar
        position="fixed"
        sx={{
          width: getMainWidth(),
          
          transition: "all 0.3s ease",
          ml: state.left ? "250px" : 0,
          mr: state.right ? "250px" : 0,
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
          width: "100vh",
          display: "flex",
          border: `1px solid `, // Input box border
          p: 1,
          borderRadius: "20px",
          mt: 2,
          backgroundColor: themeMode === 'dark' ? '#333' : '#fff',
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
          <AttachFileIcon
            sx={{ mt: 2, cursor: "pointer" }}
          />
          <ImageIcon
            sx={{
              
              mt: 2,
              mr: 1,
              cursor: "pointer",
            }}
          />
          <TextField
            id="input-with-sx"
            label="Add a prompt"
            variant="standard"
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
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
            sx={{ mt: 2, ml: 1 }}
          >
            <SettingsIcon
              sx={{  cursor: "pointer" }}
            />
          </IconButton>
        







        
      </Box>
       
    


      <Drawer
        anchor="left"
        open={state.left}
        onClose={toggleDrawer("left", false)}
      >
        {drawerContent("left")}
      </Drawer>
      <Drawer
        anchor="right"
        open={state.right}
        onClose={toggleDrawer("right", false)}
      >
        {drawerContent("right")}
      </Drawer>
      </Box>
    </ThemeProvider>
  );
}









export default App;





