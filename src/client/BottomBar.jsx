import React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import AddchartIcon from "@mui/icons-material/Addchart";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from '@mui/icons-material/Send';
import { useRef } from "react";
import axios from "axios";
import StopCircleIcon from '@mui/icons-material/StopCircle';

import { useState } from "react";
import { Typography } from "@mui/material";

import { useEffect } from "react";


export function BottomBar({ selectedFile, setSelectedFile, currentChatGroupId, inputValue, setInputValue, handleSendClick, state, toggleDrawer, themeMode, handleImageClick, send, setSend, handleKeyPress, model }) {

    const fileInputRef = useRef(null); // ref for hidden file input
    const [fileName, setFileName] = useState(null);
    const [tokenCount, setTokenCount] = useState(0);

    useEffect(() => {
        if (inputValue.length !== 0) {
            setTokenCount(getTokenCount());
        }
    }, [inputValue]);

    const getTokenCount = () => {

        if (model === 'gpt-3.5-turbo') {
            return  (1+Math.floor(inputValue.length * 0.3));
        }
        if (model === 'gpt-4o-mini') {
            return (1+Math.floor(inputValue.length * 0.7));
        }
        if (model === 'gpt-4-turbo-preview') {
            return (1+Math.floor(inputValue.length * 0.85));
        }


        return 0;


       
    }
    

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

    const handleFileAttachClick = async () => {
        fileInputRef.current.click();
       
    
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

    return (
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
      label= {inputValue.length === 0 ? "Add a prompt" : "Token Count: " + tokenCount}
      variant="standard"
      fullWidth
      multiline
      maxRows={4}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={send === false ? handleKeyPress : null}
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
    
      {send ? <IconButton
      onClick={handleSendClick}
      sx={{ ml: 1 }}
    >  <StopCircleIcon sx={{ cursor: "pointer" }} />  </IconButton> : <IconButton
    onClick={handleSendClick}
    sx={{ ml: 1 }}
  >  <SendIcon sx={{ cursor: "pointer" }} /> </IconButton>} 
     
  </Box>
 
</Box>






)



}