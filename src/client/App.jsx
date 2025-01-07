import React, { useEffect } from 'react';
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
  const [darkMode, setDarkMode] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const [chat, setChat] = useState(false);

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

  const handleThemeChange = (event) => {
    setDarkMode(event.target.checked);
  };
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
        }
      }
    }
  };

  const colorStyles = {
    background: darkMode ? "black" : "white",
    text: darkMode ? "white" : "black",
    secondaryText: darkMode ? "lightgray" : "gray",
    borderColor: darkMode ? "darkgray" : "lightgray",
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
        startIcon={<AddIcon />}
        onClick={createNewChat}
        sx={{
          bgcolor: colorStyles.background,
          color: colorStyles.secondaryText,
          border: `1px solid ${colorStyles.borderColor}`,
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
      <Divider sx={{ bgcolor: colorStyles.borderColor, mt: 2 }} />
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
                  color: colorStyles.text,
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
                sx={{ color: colorStyles.text }} // Change text color
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider
        sx={{ bgcolor: colorStyles.borderColor }} // Change divider color
      />
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={handleThemeChange}
              color="default"
            />
          }
          label="Dark"
          sx={{ color: colorStyles.text }} // Change label color
        />
      </FormGroup>
      <Divider
        sx={{ bgcolor: colorStyles.borderColor }} // Change divider color
      />
      <Box sx={{ minWidth: 40, mt: 2, ml: 2 }}>
      <FormControl fullWidth>
        <InputLabel
          id="demo-simple-select-label"
          sx={{ color: colorStyles.secondaryText }} // Change label color
        >
          Model
        </InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={model}
          label="Model"
          onChange={handleChange}
          sx={{
            color: colorStyles.text, // Change select text color
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: colorStyles.borderColor, // Change border color
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colorStyles.secondaryText, // Change border color on hover
            },
            '.MuiSvgIcon-root': {
              color: colorStyles.secondaryText, // Change dropdown icon color
            },
          }}
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
        bgcolor: colorStyles.background, // Set background color
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
              bgcolor: colorStyles.background, // Card background
              color: colorStyles.text, // Card text
              border: `1px solid ${colorStyles.borderColor}`, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  sx={{ color: colorStyles.text }}
                >
                  Capabilities
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: colorStyles.secondaryText }}
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
              bgcolor: colorStyles.background, // Card background
              color: colorStyles.text, // Card text
              border: `1px solid ${colorStyles.borderColor}`, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  sx={{ color: colorStyles.text }}
                >
                  Limitations
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: colorStyles.secondaryText }}
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
              bgcolor: colorStyles.background, // Card background
              color: colorStyles.text, // Card text
              border: `1px solid ${colorStyles.borderColor}`, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
              
                <Typography
                  variant="body2"
                  sx={{ color: colorStyles.secondaryText }}
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
              bgcolor: colorStyles.background, // Card background
              color: colorStyles.text, // Card text
              border: `1px solid ${colorStyles.borderColor}`, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
              
                <Typography
                  variant="body2"
                  sx={{ color: colorStyles.secondaryText }}
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
              bgcolor: colorStyles.background, // Card background
              color: colorStyles.text, // Card text
              border: `1px solid ${colorStyles.borderColor}`, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
            
                <Typography
                  variant="body2"
                  sx={{ color: colorStyles.secondaryText }}
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
              bgcolor: colorStyles.background, // Card background
              color: colorStyles.text, // Card text
              border: `1px solid ${colorStyles.borderColor}`, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
            
                <Typography
                  variant="body2"
                  sx={{ color: colorStyles.secondaryText }}
                >
                  Limited knowlegde of the world after 2024
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
          backgroundColor:  colorStyles.background,
          color: colorStyles.text,
          border: `1px solid ${colorStyles.borderColor}`,
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
        height: 'calc(100vh - 200px)',
        overflow: 'auto',
        marginTop: '80px',
        paddingBottom: '80px',
      }}
    >
      {messages.map((message, index) => (
        <ChatMessage key={index} message={message} />
      ))}
    </Box>
  );

  const getMainWidth = () => {
    if (state.left && state.right) return "calc(100% - 500px)";
    if (state.left || state.right) return "calc(100% - 250px)";
    return "100%";
  };

  return (
    <Box sx={{ 
      width: getMainWidth(),
      bgcolor: colorStyles.background, 
      height: "100vh",
      ml: state.left ? "250px" : 0,
      mr: state.right ? "250px" : 0,
      transition: "all 0.3s ease",
    }}>
      <AppBar
        position="fixed"
        sx={{
          width: getMainWidth(),
          bgcolor: colorStyles.background,
          color: colorStyles.text,
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
            sx={{ color: colorStyles.text }} // Menu icon color
            onClick={
              state.left ? toggleDrawer("left", false) : toggleDrawer("left", true)
            }
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h8"
            component="div"
            sx={{ color: colorStyles.text, flex: 2 }}
          >
            LLM Analyzer
          </Typography>



          <Box sx={{ flex: 1 }}>
            <Button
              startIcon={<HelpOutlineIcon />}
              sx={{ textTransform: "none", color: colorStyles.secondaryText }} // Help button color
            >
              Help
            </Button>
            <Button
              startIcon={<LinkIcon />}
              sx={{ textTransform: "none", color: colorStyles.secondaryText }} // API button color
              >
              API
              </Button>
            </Box>


            <Button
              sx={{ color: colorStyles.text }}
              startIcon={<AccountCircleIcon />}
            >
              <Typography
              variant="h8"
              component="div"
              sx={{ color: colorStyles.text }}
              >
              {username || 'User Name'}
              </Typography>
            </Button>
            </Toolbar>
          </AppBar>

          {chat ? chatContent() : cardContent()}
        
        <Box
        sx={{
          width: "100vh",
          display: "flex",
          border: `1px solid ${colorStyles.borderColor}`, // Input box border
          p: 1,
          borderRadius: "20px",
          mt: 2,
          bgcolor: colorStyles.background, // Input box background
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
          <AttachFileIcon
            sx={{ color: colorStyles.secondaryText, mt: 2, cursor: "pointer" }}
          />
          <ImageIcon
            sx={{
              color: colorStyles.secondaryText,
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
              input: { color: colorStyles.text }, // TextField input color
              label: { color: colorStyles.secondaryText }, // TextField label color
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
              sx={{ color: colorStyles.secondaryText, cursor: "pointer" }}
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
  );
}


function Login( { setIsAuthenticated, setUsername, setCurrentChatGroupId })  {
  
  
 

  const handleRegistration = async (data) => {
   

    try {
      const response = await axios.post('/api/login', { 
        username: data.username,
        password: data.password,  
      

      });
      if(response.data.message === 'Login successful') {
        console.log('Login successful:   ', response.data.message);
        setIsAuthenticated(true);
        setUsername(response.data.username);
        setCurrentChatGroupId(response.data.chatGroupId);
      }
      
      // Handle successful login, e.g., save token and redirect
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ mode: "onChange" });



    const handleError = (errors) => { };

    const registerOptions = {
        username: { required: "Username cannot be blank" },
        password: {
            required: "Password is required",
            minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
            },
        }
    };

   
  
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Login
        </Typography>
        <form onSubmit={handleSubmit(handleRegistration, handleError)}>
                <TextField
                    id="username-input"
                    placeholder="username"
                    label="Username"
                    variant="outlined"
                    {...register("username", registerOptions.username)}
                    error={!!errors.username}
                    helperText={errors?.username?.message}
                />

                <TextField
                    id="password-input"
                    type="password"
                    placeholder="Password"
                    label="Password"
                    variant="outlined"
                    {...register("password", registerOptions.password)}
                    error={!!errors.password}
                    helperText={errors?.password?.message}
                />

                <Button type="submit" variant="contained" color="primary">
                    Login
                </Button>

            </form>
      </Paper>
    </Container>
  );
}




function Signup( { setIsAuthenticated, setUsername, setCurrentChatGroupId } ) {

  const handleRegistration = async (data) => {
    try {
      // Send the form data to the `/api/signup` endpoint
      const response = await axios.post('/api/signup', {
        username: data.username,
        password: data.password,
      });
  
      if (response.data.message === 'Registration successful') {
        console.log('Registration successful:', response.data.message);
        setIsAuthenticated(true);
        setUsername(response.data.username);
        setCurrentChatGroupId(response.data.chatGroupId);
        // You can redirect the user to the login page or automatically log them in
        
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm({ mode: "onChange" });



    const handleError = (errors) => { };

    const registerOptions = {
        username: { required: "Username cannot be blank" },
        password: {
            required: "Password is required",
            minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
            },
        },
        confirmPassword: {
            required: "Confirm Password is required",
            validate: value =>
                value === watch('password') || "The passwords do not match",
        },
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" align="center" gutterBottom>
              Sign Up
            </Typography>
            <form onSubmit={handleSubmit(handleRegistration, handleError)}>
                <TextField
                    id="username-input"
                    placeholder="username"
                    label="Username"
                    variant="outlined"
                    {...register("username", registerOptions.username)}
                    error={!!errors.username}
                    helperText={errors?.username?.message}
                />

                <TextField
                    id="password-input"
                    type="password"
                    placeholder="Password"
                    label="Password"
                    variant="outlined"
                    {...register("password", registerOptions.password)}
                    error={!!errors.password}
                    helperText={errors?.password?.message}
                />

                <TextField
                    id="confirm-password-input"
                    type="password"
                    placeholder="Confirm Password"
                    label="Confirm Password"
                    variant="outlined"
                    {...register("confirmPassword", registerOptions.confirmPassword)}
                    error={!!errors.confirmPassword}
                    helperText={errors?.confirmPassword?.message}
                />
                <Button type="submit" variant="contained" color="primary">
                    Register
                </Button>

            </form>
            <Typography sx={{ mt: 2, textAlign: 'center', width: '100%' }}>
                Already have an account?{' '}
                <Link href="\login"> Login </Link>
            </Typography>
          </Paper>
        </Container>
    );
}




export default App;





