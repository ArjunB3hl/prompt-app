import React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import AddchartIcon from "@mui/icons-material/Addchart";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";

import CloseIcon from "@mui/icons-material/Close";
import SendIcon from '@mui/icons-material/Send';
import { useRef } from "react";
import axios from "axios";
import StopCircleIcon from '@mui/icons-material/StopCircle';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { useState } from "react";
import { Typography } from "@mui/material";

import { useEffect } from "react";


export function BottomBar({ selectedFile, setSelectedFile, currentChatGroupId, inputValue, setInputValue, handleSendClick, state, toggleDrawer, themeMode, handleImageClick, send, setSend, handleKeyPress, model, characterTokens, selectedOption,memory}) {

    const fileInputRef = useRef(null); // ref for hidden file input
    const [fileName, setFileName] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
  const [glowIndex, setGlowIndex] = useState(0);
  const generatingText = "Generating text...";

    // Effect to animate the glowing text
  useEffect(() => {
    let interval;
    if (isGenerating) {
      interval = setInterval(() => {
        setGlowIndex((prevIndex) => (prevIndex + 1) % generatingText.length);
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Modified handleAwesomeClick
  const handleAwesomeClick = async () => {
    // Save original input
    const originalInput = inputValue;
    
    // Set generating state and replace input temporarily
    setIsGenerating(true);
    

    try {
      const response = await axios.get(
        `/api/prompting?prompt=${encodeURIComponent(originalInput)}&technique=${selectedOption}`
      );
      const rewrittenPrompt = response.data.content;
      setInputValue(rewrittenPrompt);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      // On error, restore the original input
      setInputValue(originalInput);
    } finally {
      setIsGenerating(false);
    }

  };








    useEffect(() => {
      if ((model !== "gpt-4o-mini" || model !== "gpt-3.5-turbo") && selectedFile !== null) {
        handleFileDelete();
      }
      
      }, [model]);

      




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
    minHeight: 120, // Change fixed height to minHeight
    maxHeight: selectedFile ? 300 : 280, // Add maxHeight with extra space for file chip
    height: "auto", // Let it grow based on content
    overflow: "visible", // Allow content to be visible outside the box
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
      sx={{ mr: 1, cursor: (model === "gpt-4o-mini" || model === "gpt-3.5-turbo") ? "pointer" : "not-allowed" }}
      onClick={(model === "gpt-4o-mini" || model === "gpt-3.5-turbo") ? handleFileAttachClick : undefined}
      opacity={(model === "gpt-4o-mini" || model === "gpt-3.5-turbo") ? 1 : 0.3}
    />
    <input
      ref={fileInputRef}
      type="file"
      style={{ display: 'none' }}
      onChange={handleFileChange}
    />

    <AddchartIcon sx={{ mr: 2, cursor: "pointer" }} onClick={handleImageClick}  />

    <TextField
          id="input-with-sx"
          label={isGenerating ? '' : inputValue.length === 0 ? "" : "Token Count: " + characterTokens}
          variant="standard"
          fullWidth
          multiline
          maxRows={7}
          value={isGenerating ? '' : inputValue}
          onChange={(e) => !isGenerating && setInputValue(e.target.value)}
          onKeyDown={!isGenerating && !send && (memory === false || model === "o3-mini"  || model === "gpt-4o-mini" || model === "gpt-3.5-turbo")  ? handleKeyPress : null}
          error={inputValue.length > 3000 || !(memory === false || model === "o3-mini"  || model === "gpt-4o-mini" || model === "gpt-3.5-turbo")}
          helperText={inputValue.length > 3000 ? 'Character limit has been reached'  : !(memory === false || model === "o3-mini"  || model === "gpt-4o-mini" || model === "gpt-3.5-turbo") ? 'Memory is not available for this model' : ''} 
          sx={{
            flex: 1,
            "& .MuiInputBase-root": {
              fontFamily: "monospace" // Use a monospace font to maintain spacing
            }
          }}

          slotProps={{
            readOnly: isGenerating,
            inputLabel: {
              style: { color: themeMode === 'dark' ? '#fff' : '#000', fontSize: '18px' },

            },
    
          }}

          
        />

{isGenerating && (
    <Box sx={{ position: 'absolute', top: 52, left: 79, width: '100%', zIndex: 1 }}>
      {generatingText.split('').map((char, index) => (
        <span
          key={index}
          style={{
            textShadow:
              index === glowIndex
                ? `0 0 10px ${themeMode === 'dark' ? '#fff' : '#000'}`
                : 'none',
            color: themeMode === 'dark' ? '#fff' : '#000',
            fontWeight: index === glowIndex ? 'bold' : 'normal'
          }}
        >
          {char}
        </span>
      ))}
    </Box>
  )}

    <IconButton
      onClick={
        state.right
          ? toggleDrawer("right", false)
          : toggleDrawer("right", true)
      }
      sx={{ ml: 1 }}
    >
      <MenuOpenIcon  sx={{ cursor: "pointer" }} />
    </IconButton>

    <IconButton
          onClick={(selectedOption === 'Few Shot prompting' || selectedOption === 'Chain of Thought prompting' || selectedOption === 'Self Consistency') && !isGenerating ? handleAwesomeClick : null}
          sx={{ ml: 1 }}
          disabled={isGenerating}
        >
          <AutoAwesomeIcon  
            sx={{cursor: selectedOption !== null && !isGenerating ? "pointer" : "not-allowed"}} 
            opacity={(selectedOption === 'Few Shot prompting' || selectedOption === 'Chain of Thought prompting' || selectedOption === 'Self Consistency') && !isGenerating ? 1 : 0.3}
          />
        </IconButton>
    
      {send ? <IconButton
      onClick={handleSendClick}
      sx={{ ml: 1 }}
    >  <StopCircleIcon sx={{ cursor: "pointer" }} />  </IconButton> : <IconButton
    onClick={inputValue.length>0 ? handleSendClick : null}
    sx={{ ml: 1 }}
  >  <SendIcon sx={{ cursor: inputValue.length>0 ? "pointer" : "not-allowed", opacity: inputValue.length>0 ? 1: 0.3 }} /> </IconButton>} 
     
  </Box>
 
</Box>






)



}