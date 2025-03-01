import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import EditIcon from "@mui/icons-material/Edit";
import { useState } from "react";
import ReactMarkdown from "react-markdown";



export const ChatMessage = React.memo(
    ({message, handleEditing, handleSave, handleCancel})  =>

      
    {
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
                            error={LocalMessage.length > 3000}
                            helperText={LocalMessage.length > 3000 ? 'Character limit has been reached' : ''}

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
                    { (message.id!==null || message.id!==undefined) && <EditIcon onClick ={ () => handleEditing(message.id )}/> }
                    </Box>
                    
                ) }
                    </Box>
                ) } 
                
                </Box>
                );




});

