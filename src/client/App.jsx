import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { io } from 'socket.io-client';
import TextField from '@mui/material/TextField';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

import { Login } from './Login';
import { Signup } from './Signup';
import { ChartViewer } from './ChartViewer';
import { RightDrawer } from './RightDrawer';
import { BottomBar } from './BottomBar';
import { LoadingChat } from './LoadingChat';

import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import EditIcon from '@mui/icons-material/Edit';
import ReactMarkdown from 'react-markdown';

import { CardCont } from './CardCont';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LeftDrawer } from './LeftDrawer';
import { Appbar } from './AppBar';
import { useLocalStorage } from './useLocalStorage';
import { ChatMessage } from './ChatMessage';
import { Home } from './Home';

import { useActiveChats } from './useActiveChats';

const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage('isAuthenticated', false);
  const [username, setUsername] = useLocalStorage('username', '');
  const [imageData, setImageData] = useLocalStorage('imageData', '');
  const [chatGroups, setChatGroups] = useState([]);
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route 
          path="/c/:currentChatGroupId" 
          element={
            isAuthenticated ? (
              <MainApp 
                isAuthenticated={isAuthenticated} 
                setIsAuthenticated={setIsAuthenticated} 
                setUsername={setUsername} 
                username={username} 
                imageData={imageData} 
                setImageData={setImageData} 
                chatGroups={chatGroups} 
                setChatGroups={setChatGroups}
              />
            ) : (
              <Navigate to="/signup" />
            )
          } 
        />  
        <Route 
          path="/login" 
          element={
            <Login 
              setIsAuthenticated={setIsAuthenticated} 
              setUsername={setUsername} 
              setImageData={setImageData} 
            />
          } 
        />
        <Route 
          path="/signup" 
          element={
            <Signup 
              setIsAuthenticated={setIsAuthenticated} 
              setUsername={setUsername} 
              setImageData={setImageData}
            />
          } 
        />
        <Route 
          path="/charts" 
          element={
            isAuthenticated ? (
              <ChartViewer />
            ) : (
              <Navigate to="/signup" />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

function MainApp({ setUsername, username, setIsAuthenticated, imageData, chatGroups, setChatGroups, setImageData }) {
  const navigate = useNavigate();
  const { currentChatGroupId } = useParams();
  
  // UI state
  const [state, setState] = useState({
    left: true,
    right: false,
  });
  const [model, setModel] = useState('gpt-4o-mini');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [leftWidth, setLeftWidth] = useState(200);
  const [resizingLeft, setResizingLeft] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tokens, setTokens] = useState(0);
  const [characterTokens, setCharacterTokens] = useState(0);  
  const [memory, setMemory] = useState(true);
  const socketRef = useRef(null); 
  const [send, setSend] = useState(false);
  const [messages, setMessages] = useState([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  
  
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:5030', {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
   
   
    // Set up socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to server with socket ID:', socketRef.current.id);
     
      // Authenticate socket with user ID if available
      if (localStorage.getItem('isAuthenticated') === 'true') {
        socketRef.current.emit('authenticate', localStorage.getItem('currentChatGroupId'));
      }
    });
   
   
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
   }, []);


   
  

   useEffect(() => {
    // Add the event listener once, outside the condition
    if (socketRef.current) {
      socketRef.current.on('characterTokens', (data) => {
        setCharacterTokens(data.tokens);
      });
    }
  
    // Only emit the event when input value changes and is not empty
    if (inputValue.length > 0 && socketRef.current) {
      socketRef.current.emit('characterTokens', { inputValue, model });
    }
  
    // Clean up listener on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off('characterTokens');
      }
    };
  }, [inputValue, model]);


  const handleEditing = useCallback ( (id) => {
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
  });

  const handleCancel = useCallback ( (id) => {  
    setMessages((prevMessages) =>
      prevMessages.map((message) => {
        if (message.id === id && message.sender === 'user') {
          // Return a new object with the updated 'edit' property.
          return { ...message, edit: false };
        }
        return message;
      })
    );
   

  });

  const handleSave = useCallback (async (id, LocalMessage) => {
    
    setMessages((prevMessages) =>
      prevMessages.map((message) => {
        if (message.id === id && message.sender === 'user') {
          // Return a new object with the updated 'edit' property.
          return { ...message,text:LocalMessage,edit: false, load: true};
        }
        else if (message.id === id && message.sender === 'ai') {
          return { ...message, text: '', complete: false };
        }
        return message;
      })
    );

    setSend(true);
    try {
      const response = await axios.post('/api/tokens', { text: LocalMessage, model: model || "gpt-3.5-turbo", chatGroupId: currentChatGroupId, memory: memory });
      console.log('estimating :', response.data);
      setTokens(response.data.estimatedCompletionTokens);
       
     }
     catch (error) {
       console.error('Error calculating tokens:', error);
     }

  

    try {
      // Create an EventSource to listen for streaming responses
      let eventSource = null;
      
      if(memory === true){
      
     eventSource = new EventSource(
        `/api/chat?prompt=${encodeURIComponent(LocalMessage)}&model=${model || "gpt-3.5-turbo"}&currentChatGroupId=${currentChatGroupId}&messageId=${id} `
      );
    }
    else{

      eventSource = new EventSource(
        `/api/chatCompletion?prompt=${encodeURIComponent(LocalMessage)}&model=${model || "gpt-3.5-turbo"}&currentChatGroupId=${currentChatGroupId}&messageId=${id} `
      );
    } 
      eventSource.onmessage = (event) => {
        // Check if the message is the "[DONE]" indicator.
        if (event.data === "[DONE]") {
          // Optionally perform any cleanup, then close the connection.
          setMessages((prevMessages) =>
            prevMessages.map((message) => {
              if (message.id === id && message.sender === 'ai') {
                return { ...message, edit: false, complete : true };
              }
              return message;
            }
          ));
          setSend(false);
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
       
          setMessages((prevMessages) =>
            prevMessages.map((msg) => {
              if(msg.id === id && msg.load === true){
                return { ...msg, load: false };
              }
              if (msg.id === id && msg.sender === 'ai') {
                return { ...msg, text: msg.text + data.content };
              }
              return msg;
            }
          ));
            
        }

      eventSource.onerror = (error) => {
        console.error('Error in EventSource:', error);
        eventSource.close();
        setSend(false);
        
      };

    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = { text: 'Error fetching response from AI.', sender: 'ai' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
     
    }

  });
  

  const [chat, setChat] = useState(false);
  const isBrowserDefaultDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [themeMode, setThemeMode] = useState(isBrowserDefaultDark() ? 'dark' : 'light');
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
        console.log("response.data.chatGroupId in myApp", response.data.currentChatGroupId);
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
  console.log("Messages are : ", messages);
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

  
  // Import the IndexDB hook for chat groups caching
  const { addActiveChat, updateActiveChat, activeChats,clearActiveChats } = useActiveChats();
  
  // Memoize the fetchAndUpdateCache function to prevent it from being recreated on each render
  const fetchAndUpdateCache = useCallback(async () => {
    try {
      const response = await axios.get(`/api/chatgroup/${currentChatGroupId}/chats`);
      
      if (response.data.messages.length === 0) {
        console.log('No chats found');
        setChat(false);
      } else {
        setChat(true);
      }
      
      const formattedMessages = response.data.messages.map((chat) => ([
        chat.fileName 
          ? { text: chat.UserMessage, sender: 'user', file: chat.fileName, id: chat._id, edit: false } 
          : { text: chat.UserMessage, sender: 'user', id: chat._id, edit: false, toolUse: chat.toolUse, load: false },
        { text: chat.AIMessage, sender: 'ai', id: chat._id, complete: true },
      ])).flat();
      
      setMessages(formattedMessages);
      
      setModel(response.data.model);
      setMemory(response.data.memory);

      if (response.data.assistant !== "" && response.data.assistant !== undefined) {
        setAssistantText(response.data.assistant);
        setSelectedOption("Role prompting");
      } else if (response.data.tool !== "" && response.data.tool !== undefined) {
        setToolType(response.data.tool);
        setSelectedOption("React prompting");
      } else {
        setAssistantText("");
        setToolType("");
        setSelectedOption("");
      }
      
      // Update cache with the fetched data
      const chatGroupData = {
        _id: currentChatGroupId,
        messages: response.data.messages,
        model: response.data.model,
        memory: response.data.memory,
        assistant: response.data.assistant,
        tool: response.data.tool,
        timestamp: new Date().toISOString()
      };

      addActiveChat(chatGroupData);

    } catch (error) {
      console.error('Error fetching from API:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentChatGroupId, addActiveChat, setChat, setMessages, setModel, setMemory, setAssistantText, setSelectedOption, setToolType, setIsLoading]);
  
  // Load chat data when component mounts or currentChatGroupId changes
  useEffect(() => {
    const loadChats = async () => {
      if (!currentChatGroupId) return;
      
      setIsLoading(true);
      
      try {
        // Find the cached group
        const cachedGroup = activeChats.find(group => group._id === currentChatGroupId);

        
        if (cachedGroup && cachedGroup.messages) {
          console.log('Loading chat from cache');
          // Use cached data
          if (cachedGroup.messages.length === 0) {
            console.log('No chats found in cache');
            setChat(false);
          } else {
            setChat(true);
          }
          
          setMessages(cachedGroup.messages.map((chat) => ([
            chat.fileName 
              ? { text: chat.UserMessage, sender: 'user', file: chat.fileName, id: chat._id, edit: false } 
              : { text: chat.UserMessage, sender: 'user', id: chat._id, edit: false, toolUse: chat.toolUse, load: false },
            { text: chat.AIMessage, sender: 'ai', id: chat._id, complete: true },
          ])).flat());
          
          setModel(cachedGroup.model || 'gpt-4o-mini');
          setMemory(cachedGroup.memory !== undefined ? cachedGroup.memory : true);
    
          if (cachedGroup.assistant !== "" && cachedGroup.assistant !== undefined) {
            setAssistantText(cachedGroup.assistant);
            setSelectedOption("Role prompting");
          } else if (cachedGroup.tool !== "" && cachedGroup.tool !== undefined) {
            setToolType(cachedGroup.tool);
            setSelectedOption("React prompting");
          } else {
            setAssistantText("");
            setToolType("");
            setSelectedOption("");
          }
          
          // Fetch from API in background to update cache
          setTimeout(() => {
            fetchAndUpdateCache();
          }, 100);
        } else {
          // No cache, fetch from API
          await fetchAndUpdateCache();
        }
      } catch (error) {
        console.error('Error loading chats:', error);
        setIsLoading(false);
      }
    };
    
    loadChats();
  }, [currentChatGroupId, fetchAndUpdateCache]); // Only depend on currentChatGroupId and the memoized function

  useEffect(() => {
    if (messagesEndRef.current && !send) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); // Step 4: Scroll to bottom
    }
  }, [messages]); // Dependencies include messages and loading

  useEffect(() => {
    if (messages.filter(msg => msg.edit === true).length === 0) {
      setIsEditing(false);
    }
  }, [messages]);


 //In the bottom Bar component 
const handleSendClick = () => {
    if (send) {
        // If currently sending, abort the request.
        if(eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        setSend(false); // Update UI state
        setMessages((prevMessages) =>
          prevMessages.map(msg =>
            msg.load ? { ...msg, load: false } : msg
          )
        );
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

      if (inputValue.trim() && inputValue.length <= 3000) {
       
        let tempValue = inputValue;
        setInputValue('');
         
         const userMessage = selectedFile ? { text: tempValue, sender: 'user', file: selectedFile.name , edit: false, id: null, load: true} : { text: tempValue, sender: 'user' , edit: false, id: null, load: true};
         setMessages([...messages, userMessage]);
         setChat(true);
        
        
       
        try {
          const response = await axios.post('/api/tokens', { text: userMessage.text, model: model || "gpt-3.5-turbo", chatGroupId: currentChatGroupId, memory: memory });
          console.log('estimating :', response.data);
          setTokens(response.data.estimatedCompletionTokens);
           
         }
         catch (error) {
           console.error('Error calculating tokens:', error);
         }

         setSend(true);
         setSelectedFile(null);
         setNameChatGroup(true);
       
        

        
        try {
          // Create an EventSource to listen for streaming responses
            let eventSource = null;
            if(toolType === ""){


                    if(memory === true){

                            eventSource = new EventSource(`/api/chat?prompt=${encodeURIComponent(userMessage.text)}&model=${model || "gpt-3.5-turbo"}&currentChatGroupId=${currentChatGroupId}&technique=${selectedOption}&assistant=${assistantText} `); 
                    }
                    else{
                            eventSource = new EventSource(`/api/chatCompletion?prompt=${encodeURIComponent(userMessage.text)}&model=${model || "gpt-3.5-turbo"}&currentChatGroupId=${currentChatGroupId}  `);
                    }
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
                                        if(msg.sender === 'ai'){
                                        return { ...msg, id: data.id, complete: true };
                                        }
                                        return { ...msg, id: data.id };
                                     
                                    }
                                    return msg;

                                }));
                                
                              eventSource.close();
                              setSend(false);
                             
                  
                                return;
                            }
                            
                          
                              if (data.content) {

                                setMessages((prevMessages) => {
                                  const updatedMessages = prevMessages.map(msg => 
                                    msg.load ? { ...msg, load: false } : msg
                                  );
                                
                                  const lastMessage = updatedMessages[updatedMessages.length - 1];
                                  if (lastMessage && lastMessage.sender === 'ai') {
                                    updatedMessages[updatedMessages.length - 1] = {
                                      ...lastMessage, 
                                      text: lastMessage.text + data.content, 
                                      complete: false,
                                      id: null
                                    };
                                  } else {
                                    updatedMessages.push({ text: data.content, sender: 'ai', complete: false, id: null });
                                  }
                                
                                  return updatedMessages;
                                });
                              }
                              
                            } catch (error) {
                              console.error("Error parsing JSON", error);
                              setSend(false);
                              
                              setMessages((prevMessages) => 
                                prevMessages.map((msg) => 
                                  msg.load ? { ...msg, load: false } : msg
                                )
                              );
                              return;
                            }
                            
                          };
                        
                          eventSource.onerror = (error) => {
                            console.error('Error in EventSource:', error);
                            eventSource.close();
                            setMessages((prevMessages) => 
                              prevMessages.map((msg) => 
                                msg.load ? { ...msg, load: false } : msg
                              )
                            );
                            setSend(false);
                            
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
                        if (msg.sender === 'user') {
                          return { ...msg, id: data.id, toolUse: true };
                        }
                        else {
                        return { ...msg, id: data.id, complete: true };
                        }

                     
                      }
                      return msg;

                  }));
                  
                eventSource.close();
                setSend(false);
                
                  return;
              }
              
            
                if (data.content) {
                  setMessages((prevMessages) => {
                    const updatedMessages = prevMessages.map(msg => 
                      msg.load ? { ...msg, load: false } : msg
                    );
                  
                    const lastMessage = updatedMessages[updatedMessages.length - 1];
                    if (lastMessage && lastMessage.sender === 'ai') {
                      updatedMessages[updatedMessages.length - 1] = {
                        ...lastMessage, 
                        text: lastMessage.text + data.content, 
                        complete: false,
                        id: null
                      };
                    } else {
                      updatedMessages.push({ text: data.content, sender: 'ai', complete: false, id: null });
                    }
                  
                    return updatedMessages;
                  });
                  
                }
                
              } catch (error) {
                console.error("Error parsing JSON", error);
                setSend(false);
                
                setMessages((prevMessages) => 
                  prevMessages.map((msg) => 
                    msg.load ? { ...msg, load: false } : msg
                  )
                );

                return;
              }
          




          }
          
          eventSource.onerror = (error) => {
            console.error('Error in EventSource:', error);
            eventSource.close();
            setMessages((prevMessages) => 
              prevMessages.map((msg) => 
                msg.load ? { ...msg, load: false } : msg
              )
            );
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
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
   
        console.log(response.data.message);
        setIsAuthenticated(false);
        setUsername('');
        setImageData('');
        clearActiveChats();

      
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


  

  const leftDrawer = useMemo(() => 
    <LeftDrawer 
      setChatGroups={setChatGroups} 
      chatGroups={chatGroups} 
      currentChatGroupId={currentChatGroupId} 
      themeMode={themeMode} 
      leftWidth={leftWidth} 
      username={username} 
      setIsLoading={setIsLoading}
      model={model} 
    />
  , [chatGroups, currentChatGroupId, themeMode, leftWidth, username, model]);
  
  const rightDrawer = useMemo(() => 
    <RightDrawer 
      selectedOption={selectedOption} 
      setSelectedOption={setSelectedOption} 
      assistantText={assistantText} 
      setAssistantText={setAssistantText} 
      toolType={toolType} 
      setToolType={setToolType} 
      themeMode={themeMode} 
      memory={memory} 
      imageData={imageData}
    />
  , [selectedOption, assistantText, toolType, setAssistantText, setToolType, themeMode, memory]);
 
  

  // Content for drawers
  const drawerContent = (anchor) => (
    <Box
      sx={{
        width: anchor === 'left' || anchor === 'right' ? 200 : 'auto',
        
        height: "100%",
      }}
      role="presentation"
    >
      {anchor === 'left' ? leftDrawer : rightDrawer}
    </Box>
  );
  const cardContent = () => (
    <CardCont  username = {username}/>
  );
  


  
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
  <React.Fragment key={index}>
    <ChatMessage message={message} handleSave={handleSave} handleCancel={handleCancel} handleEditing={handleEditing} tokens = {tokens} />
    {message.load ? (
      <Box 
        sx={{
          position: 'relative',
          width: '65vw',
          display: 'flex',
          justifyContent: 'flex-start',
          mt: 1,
          mb: 2
        }}
        > <Box sx={{ display: 'flex', alignItems: 'flex-start'}}>
       <CircularProgress size="1.5rem" />  
      </Box> </Box>)    : null}
  </React.Fragment>
))}
      
   

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

  const memoizedTheme = useMemo(
    () =>
      createTheme({
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
      }),
    [themeMode]
  );

  return (
    <ThemeProvider
      theme={memoizedTheme}
    >
      <CssBaseline />
    <Box sx={{ 
      width: '100%',
  
      height: 'calc(100vh - 200px)',
    
    }}>
      <Appbar 
        getMainWidth={getMainWidth} 
        leftWidth={leftWidth} 
        state={state} 
        toggleDrawer={toggleDrawer} 
        themeMode={themeMode} 
        setThemeMode={setThemeMode} 
        username={username} 
        handleLogOut={handleLogOut} 
        model={model} 
        setModel={setModel} 
        imageData={imageData} 
        setMemory={setMemory} 
        memory={memory} 
      />

      {isLoading ? (
        <LoadingChat themeMode={themeMode} />
      ) : (
        chat ? chatContent() : cardContent()
      )}
      
      <BottomBar 
        selectedFile={selectedFile} 
        setSelectedFile={setSelectedFile} 
        currentChatGroupId={currentChatGroupId} 
        inputValue={inputValue} 
        setInputValue={setInputValue} 
        handleSendClick={handleSendClick} 
        state={state} 
        themeMode={themeMode} 
        toggleDrawer={toggleDrawer} 
        handleImageClick={handleImageClick} 
        send={send} 
        setSend={setSend} 
        handleKeyPress={handleKeyPress} 
        model={model} 
        characterTokens={characterTokens} 
        selectedOption={selectedOption} 
        memory={memory}
      />

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
