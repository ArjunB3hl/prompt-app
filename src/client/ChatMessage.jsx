import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import EditIcon from '@mui/icons-material/Edit';
import GavelIcon from '@mui/icons-material/Gavel';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

export const ChatMessage = React.memo(
    ({message, handleEditing, handleSave, handleCancel})  =>

      
    {
        const [LocalMessage, setLocalMessage] = useState(message.text);
        const [copied, setCopied] = useState(false);
        
        const handleCopy = () => {
          navigator.clipboard.writeText(message.text)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => console.error('Failed to copy text: ', err));
        };
        const handleLLMAsJudge = () => {
            console.log('Judge clicked');
            // Call the API to judge the message
            axios.post('/api/judge', { id: message.id })
            .then(response => {
               console.log('Judged message:', response.data);
          })
            .catch(error => {
              console.error('Error judging message:', error);
             });

            };

        
        
        return (
          <Box 
            sx={{
              position: 'relative',
              width: '65vw',
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              py: 2,
              '&:hover .edit-icon': { display: 'block' },
              '&:hover .copy-icon': { display: 'block' },
              '&:hover .judge-icon': { display: 'block' },
            }}
          >
            {message.file ? (
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
                    position: 'relative', // Add position relative
                  }}
                >
                  <Typography>
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: '100%',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      marginTop: '10px',
                      padding: '10px',
                    }}
                  >
                    <img
                      src={`/uploads/${message.file}`}
                      alt={message.file}
                      style={{ maxWidth: '100%', maxHeight: '300px' }}
                    />
                  </Box>
                </Box>
                {message.sender === 'user' && (
                  <EditIcon
                    className="edit-icon"
                    onClick={() => handleEditing(message.id)}
                    sx={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      cursor: 'pointer',
                      display: { xs: 'block', sm: 'none' }, // Always visible on mobile, hover for desktop
                      backgroundColor: 'background.paper',
                      borderRadius: '4px',
                      p: 0.5,
                      boxShadow: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  />
                )}
              </Box>
            ) : message.edit ? (
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
                    position: 'relative', // Add position relative
                  }}
                >
                  <TextField
                    value={LocalMessage}
                    onChange={(e) => setLocalMessage(e.target.value)}
                    multiline
                    fullWidth
                    rows={4}
                    variant="outlined"
                    sx={{ marginBottom: '10px' }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      onClick={() => handleSave(message.id, LocalMessage)}
                      variant="contained"
                      color="primary"
                      sx={{ marginRight: '10px' }}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => handleCancel(message.id)}
                      variant="contained"
                      color="secondary"
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </Box>
            ) : (
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
                    position: 'relative', // Add position relative
                  }}
                >
                  <Typography>
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </Typography>
                
                </Box>
                  {/* Add copy button for AI messages */}
                  {message.sender === 'ai' && (
                    <> 
                    <Box
                      className="copy-icon"
                      onClick={handleCopy}
                      sx={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
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
                        bottom: '0',
                        left: '30px',
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
                        <GavelIcon fontSize="small" />
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





