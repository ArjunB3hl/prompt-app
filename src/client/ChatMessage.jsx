import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import EditIcon from '@mui/icons-material/Edit';
import GavelIcon from '@mui/icons-material/Gavel';
import ReactMarkdown from 'react-markdown';
import CircularProgress from '@mui/material/CircularProgress';
import ErrorIcon from '@mui/icons-material/Error';
import axios from 'axios';

export const ChatMessage = React.memo(
    ({message, handleEditing, handleSave, handleCancel, tokens, toolType, assistantText})  =>
      
    {
        const [LocalMessage, setLocalMessage] = useState(message.text);
        const [copied, setCopied] = useState(false);
        const [isJudging, setIsJudging] = useState(false);
        const [error, setError] = useState(false);
        
        const handleCopy = () => {
          navigator.clipboard.writeText(message.text)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => console.error('Failed to copy text: ', err));
        };
        const handleLLMAsJudge = () => {
          setIsJudging(true);
            console.log('Judge clicked');
            // Call the API to judge the message
            axios.post('/api/judge', { id: message.id })
            .then(response => {
               console.log('Judged message:', response.data);
          })
            .catch(error => {
              console.error('Error judging message:', error);
              setError(true);
            // Clear the error after 2 seconds
            setTimeout(() => {
              setError(false);
            }, 2000);

             });
             setIsJudging(false);

            };

        
        return (
          <Box 
            sx={{
              position: 'relative',
              width: '65vw',
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              py: 1,
              '&:hover .edit-icon': { display: 'block' },
              '&:hover .copy-icon': { display: 'block' },
              '&:hover .judge-icon': { display: 'block' },
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
                ) : message.edit ? <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%'}}>
                <TextField
                id="input-with-sx"
                variant="outlined"
                multiline
                maxRows={4}
                value={LocalMessage}
                onChange={(e) => setLocalMessage(e.target.value)}
                fullWidth 
                error={LocalMessage.length > 3000}
                helperText={LocalMessage.length > 3000 ? 'Character limit has been reached' : ''}

            />
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button onClick={() => handleSave(message.id,LocalMessage)} variant="contained">
            Save
            </Button>
            <Button onClick = {() => handleCancel(message.id)} >Cancel</Button>
        
        </Box>

        
        </Box> : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  maxWidth: message.sender === 'user' ? '70%' : '100%',
                }}
              >
                <Box
                  sx={{
                    width: message.sender === 'user' ? 'fit-content' : "100%",
                    border: message.sender === 'user' ? `1px solid` : '',
                    borderRadius: message.sender === 'user' ? '15px' : '',
                    padding: '0px 15px',
                    wordWrap: 'break-word',
                    position: 'relative',
                  }}
                >
                  <Typography>
                    {message.complete === false && message.text.length > 0 && (assistantText === '' || assistantText === undefined)  && (toolType === '' || toolType === undefined)  && (
                      <Typography variant="caption" sx={{ color: 'grey', fontSize: '0.8rem' }}>
                        Predicting {tokens} Tokens
                      </Typography>
                    )}
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </Typography>
                </Box>
                  {/* Add copy button for AI messages */}
                  {message.sender === 'ai' && message.complete === true && (
                    <> 
                    <Box
                      className="copy-icon"
                      onClick={handleCopy}
                      sx={{
                        position: 'absolute',
                        bottom: '-10px',
                        left: '10px',
                        cursor: 'pointer',
                        display: { xs: 'block', sm: 'none' }, // Always visible on mobile, hover for desktop
                        backgroundColor: copied ? 'success.light' : 'background.paper',
                        borderRadius: '4px',
                        transform: 'scale(0.8)', // Makes it 80% of its original size
                        p: 0.5,
                        boxShadow: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                    
                      <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                        {copied ? <DoneIcon fontSize="small"  /> : <ContentCopyIcon fontSize="small"  />}
                      </Tooltip>
                   
                      
                    </Box>
                    <Box
                        onClick={handleLLMAsJudge}
                        className="judge-icon"
                      sx={{
                  
                        position: 'absolute',
                        bottom: '-10px',
                        left: '40px',
                        cursor: 'pointer',
                        display: { xs: 'block', sm: 'none' }, // Always visible on mobile, hover for desktop
                        backgroundColor: 'background.paper',
                        borderRadius: '4px',
                        p: 0.5,
                        transform: 'scale(0.8)', // Makes it 80% of its original size
                        boxShadow: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                        {isJudging ? <CircularProgress fontSize="small" color="inherit" /> : error ? <ErrorIcon/> : <GavelIcon fontSize="small" />}
                    </Box>

                    </>
                  )}
                {message.sender === 'user' && message.toolUse !== true  && (
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
                    { (message.id!==null || message.id!==undefined) && <EditIcon onClick ={ () => handleEditing(message.id )}/> }
                    </Box>
                    
                ) }
              </Box>
            )}
          </Box>
        );




});
