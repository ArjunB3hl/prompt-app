import React, { useEffect, useRef } from 'react'; // Step 1: Import useRef
import { useState } from 'react';
import Box from '@mui/material/Box';

import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';





import TextField from '@mui/material/TextField';


import axios from 'axios'; // Add axios for HTTP requests
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { Navigate } from 'react-router-dom';


import {Login } from './Login';
import {Signup } from './Signup';
import { ChartViewer } from './ChartViewer';
import { RightDrawer } from './RightDrawer';
import { BottomBar } from './BottomBar';

import CircularProgress from '@mui/material/CircularProgress';

import EditIcon from '@mui/icons-material/Edit';


import ReactMarkdown from 'react-markdown';

import { CardCont } from './CardCont';



import { ThemeProvider, createTheme, useColorScheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { dark } from '@mui/material/styles/createPalette';
import { LeftDrawer } from './LeftDrawer';
import { Appbar } from './AppBar';
import { use } from 'react';





const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
});

function App() {
  
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
  
  const [username, setUsername] = useState('');
  const [chatGroups, setChatGroups] = useState([]);
  const [currentChatGroupId, setCurrentChatGroupId] = useState(localStorage.getItem('currentChatGroupId'));
  const [imageData, setImageData] = useState('');
  
  
  


  


  return (
    
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
              <MainApp isAuthenticated={isAuthenticated} 
              setIsAuthenticated={setIsAuthenticated} setUsername = {setUsername} username={username} chatGroups={chatGroups} setChatGroups={setChatGroups} setCurrentChatGroupId={setCurrentChatGroupId} currentChatGroupId={currentChatGroupId} imageData={imageData}  />  : 
              <Navigate to="/signup" />
            } 
          />
          {console.log('chatGroupID is : ', currentChatGroupId)} 
         
          <Route path="/login" element={(!isAuthenticated) ? <Login setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} setCurrentChatGroupId={setCurrentChatGroupId} /> : <Navigate to="/" />} />
          <Route path="/signup" element={(!isAuthenticated) ? <Signup setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} setCurrentChatGroupId={setCurrentChatGroupId} setImageData={setImageData}/> : <Navigate to="/" />} />
          <Route path="/charts" element= {(isAuthenticated) ? <ChartViewer chatGroups ={chatGroups}  currentChatGroupId ={currentChatGroupId} /> : <Navigate to="/signup" />} />

        </Routes>
     
      </Router>

  );
}

function MainApp({ setUsername, username, chatGroups, setChatGroups, setCurrentChatGroupId, currentChatGroupId, setIsAuthenticated, imageData }) {
  // Add new state for messages
  
  const [state, setState] = useState({
    left: false,
    right: false,
  });
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null); // Step 2: Define ref
  const [selectedFile, setSelectedFile] = useState(null); // new state
  const [leftWidth, setLeftWidth] = useState(200);
  const [resizingLeft, setResizingLeft] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tokens, setTokens] = useState(0);
  
  const [send, setSend] = useState(false);
  const [messages, setMessages] = useState([]);
  
  

  

useEffect(() => {
}
, [inputValue]);  

 

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
          return { ...message,text:LocalMessage,edit: false };
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
          setMessages((prevMessages) =>
            prevMessages.map((message) => {
              if (message.id === id && message.sender === 'ai') {
                return { ...message, edit: false };
              }
              return message;
            }
          ));
          
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
                ? { ...msg, text: msg.text + data.content }
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
  



  const [chat, setChat] = useState(false);
  const isBrowserDefaultDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [themeMode, setThemeMode] = useState(isBrowserDefaultDark() ? 'dark' : 'light');
  const [loader, setLoader] = useState(false);
  const [nameChatGroup, setNameChatGroup] = useState(false); 
  const eventSourceRef = useRef(null);
 
  const [selectedOption, setSelectedOption] = useState("");
  const [assistantText, setAssistantText] = useState("");
  const [toolType, setToolType] = useState("");

  
  {console.log('chatGroupID is : ', currentChatGroupId)} 
  if(chatGroups.length === 0) {
    const loadChatGroups = async () => {
      try {
        const response = await axios.get("/api/check-auth");
        setChatGroups( response.data.chatGroups );
        if(username === '') {
          setUsername(response.data.username);
        };

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
        console.error('Error fetching AI response:', error);
    

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
          chat.fileName? { text: chat.UserMessage, sender: 'user', file: chat.fileName, id: chat._id, edit: false} : { text: chat.UserMessage, sender: 'user', id: chat._id, edit: false},
          { text: chat.AIMessage, sender: 'ai', id: chat._id },
         
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
    return () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        
    };
}, [currentChatGroupId]); // Run this effect when currentChatGroupId changes

 //In the bottom Bar component 
const handleSendClick = () => {
    if (send) {
        // If currently sending, abort the request.
        if(eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        setSend(false); // Update UI state
        setLoader(false);
    } else {
        // If not sending, initiate sending
        handleKeyPress({ type: 'click' });
    }
};
  

  // Modify handleKeyPress to send prompt and model data
  const handleKeyPress = async (event) => {
    
    if  ( (event.type === 'click' || (event.key === 'Enter' && !event.shiftKey)) ) {

      if (event.type === 'keydown') {
      event.preventDefault();
      }
     


      if (inputValue.trim() && inputValue.length <= 500) {
       
      
    

        let tempValue = inputValue;
        setInputValue('');
        setAssistantText('');
        let userMessage ;
        if(selectedOption === 'Few Shot prompting'  || selectedOption === 'Chain of Thought prompting' || selectedOption === 'Self Consistency' ) {
          
          try{
            
            const response = await axios.get(
              `/api/prompting?prompt=${encodeURIComponent(tempValue)}&technique=${selectedOption}`
            );
            const rewrittenPrompt = response.data.content; 
    
            userMessage = selectedFile ? { text: rewrittenPrompt, sender: 'user', file: selectedFile.name , edit: false} : { text: rewrittenPrompt, sender: 'user' , edit: false};
            setMessages([...messages, userMessage]);
               
    
          }
          catch (error) {
            console.error('Error fetching AI response:', error);
        
    
          }
         


        }
        else{
         userMessage = selectedFile ? { text: tempValue, sender: 'user', file: selectedFile.name , edit: false} : { text: tempValue, sender: 'user' , edit: false};
         setMessages([...messages, userMessage]);
        }
       
        try {
          const response = await axios.post('/api/tokens', { text: userMessage.text, model: model || "gpt-3.5-turbo", chatGroupId: currentChatGroupId });
          console.log('estimating :', response.data);
          setTokens(response.data.estimatedCompletionTokens);
           
         }
         catch (error) {
           console.error('Error calculating tokens:', error);
         }

       
       
        setChat(true);
        setSend(true);
        setSelectedFile(null);
        setLoader(true);
        setNameChatGroup(true);

        
        try {
          // Create an EventSource to listen for streaming responses
            let eventSource = null;
            if(toolType === ""){

                eventSource = new EventSource(`/api/chat?prompt=${encodeURIComponent(userMessage.text)}&model=${model || "gpt-3.5-turbo"}&currentChatGroupId=${currentChatGroupId}&technique=${selectedOption}&assistant=${assistantText}`); 
              
              eventSourceRef.current = eventSource;
              
              eventSource.onmessage = (event) => {
                // Check if the message is the "[DONE]" indicator.
                try {

                  let data = JSON.parse(event.data);
                  if (data.flag === "DONE" ) {
                    // Optionally perform any cleanup, then close the connection. 
                    setMessages((prevMessages) => 
                      prevMessages.map((msg) => {
                        if ( msg.id === null) {
                          return { ...msg, id: data.id };
                        }
                        return msg;

                    }));
                    
                  eventSource.close();
                  setSend(false);
                  setLoader(false);
                    return;
                }
                
              
                  if (data.content) {
                    setLoader(false);
                    setMessages((prevMessages) => {
                      const lastMessage = prevMessages[prevMessages.length - 1];
                      if (lastMessage && lastMessage.sender === 'ai') {
                        // Update the last AI message
                        return [
                          ...prevMessages.slice(0, -1),
                          { text: `${lastMessage.text + data.content}`, sender: 'ai',  edit: false },
                        ];
                      } else {
                        // Add a new AI message
                        return [...prevMessages, { text: `${data.content}`, sender: 'ai',  edit: false}];
                      }
                    });
                  }
                  
                } catch (error) {
                  console.error("Error parsing JSON", error);
                  return;
                }
                
              };
      

          }

          else{
            eventSource = new EventSource(`/api/chatTool?prompt=${encodeURIComponent(userMessage.text)}&currentChatGroupId=${currentChatGroupId}&tool=${toolType}`); 
              
            eventSourceRef.current = eventSource;
            
            eventSource.onmessage = (event) => {
              // Check if the message is the "[DONE]" indicator.
              try {

                let data = JSON.parse(event.data);
                if (data.flag === "DONE" ) {
                  // Optionally perform any cleanup, then close the connection. 
                  setMessages((prevMessages) => 
                    prevMessages.map((msg) => {
                      if ( msg.id === null) {
                        return { ...msg, id: data.id };
                      }
                      return msg;

                  }));
                  
                eventSource.close();
                setSend(false);
                setLoader(false);
                  return;
              }
              
            
                if (data.content) {
                  setLoader(false);
                  setMessages((prevMessages) => {
                    const lastMessage = prevMessages[prevMessages.length - 1];
                    if (lastMessage && lastMessage.sender === 'ai') {
                      // Update the last AI message
                      return [
                        ...prevMessages.slice(0, -1),
                        { text: `${lastMessage.text + data.content}`, sender: 'ai',  edit: false },
                      ];
                    } else {
                      // Add a new AI message
                      return [...prevMessages, { text: `${data.content}`, sender: 'ai',  edit: false}];
                    }
                  });
                }
                
              } catch (error) {
                console.error("Error parsing JSON", error);
                return;
              }
          




          }
          
          eventSource.onerror = (error) => {
            console.error('Error in EventSource:', error);
            eventSource.close();
            setLoader(false);
            setSend(false);
            
          };
          
        }


        } catch (error) {
          console.error('Error fetching AI response:', error);
          const errorMessage = { text: 'Error fetching response from AI.', sender: 'ai' };
          setMessages((prevMessages) => [...prevMessages, errorMessage]);
         
        }
      }
    }
  };

  

  const handleLogOut = async () => {
    
    try {
      const response = await axios.get('/api/logout');
      if (response.data.message === 'Logout successful') {
        console.log(response.data.message);
        setIsAuthenticated(false);
        setCurrentChatGroupId(null);
        setUsername('');
        localStorage.setItem('isAuthenticated', false);
        localStorage.removeItem('currentChatGroupId');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }

  };
  


  const toggleDrawer = (anchor, open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setState({ ...state, [anchor]: open });
  };


  // Modify leftDrawer to show chat groups
  const leftDrawer = () => (
    <LeftDrawer setChatGroups={setChatGroups} chatGroups={chatGroups} setCurrentChatGroupId={setCurrentChatGroupId} currentChatGroupId={currentChatGroupId} themeMode={themeMode} leftWidth={leftWidth} username={username} />
  );

  const rightDrawer = () => (
      <RightDrawer selectedOption={selectedOption} setSelectedOption={setSelectedOption} assistantText = {assistantText}setAssistantText={setAssistantText} toolType={toolType} setToolType={setToolType} />
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
    <CardCont />
  );
  


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
            width: message.sender === 'user' ? 'fit-content' : "100%",
            border: message.sender === 'user' ? `1px solid`: '',
            borderRadius: message.sender === 'user' ? '15px': '',
            padding: '0px 15px',
            wordWrap: 'break-word',
          }}
        >
          <Typography> <ReactMarkdown>{message.text}</ReactMarkdown></Typography>
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
      window.open('/charts', '_blank'); // Opens /charts in a new tab
    } catch (error) {
      console.error('Error opening charts page:', error);
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
      <Appbar  getMainWidth={getMainWidth} leftWidth={leftWidth}  state={state}  toggleDrawer={toggleDrawer}  themeMode={themeMode} setThemeMode={setThemeMode} username={username} handleLogOut={handleLogOut} model={model} setModel={setModel} imageData={imageData} />

          { chat ? chatContent() : cardContent() }
        
          <BottomBar selectedFile={selectedFile}  setSelectedFile ={setSelectedFile}  currentChatGroupId ={currentChatGroupId} inputValue={inputValue} setInputValue={setInputValue} handleSendClick={handleSendClick}  state = {state} themeMode={themeMode} toggleDrawer = {toggleDrawer} handleImageClick={handleImageClick} send = {send} setSend={setSend} handleKeyPress={handleKeyPress} model = {model} />

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

     

      </Box>
    </ThemeProvider>
  );
}









export default App;





