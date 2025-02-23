import React, { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';


export function RightDrawer({selectedOption, setSelectedOption, assistantText, setAssistantText, toolType, setToolType}) {
   
    
    const handleClick = (option) => {
      setSelectedOption(prev => prev === option ? "" : option);
    };

   return (
        <>
          <FormControl component="fieldset">
            <FormLabel 
              component="legend" 
              sx={{ 
                display: 'block',  // ensures margins work as expected
                color: 'white', 
                fontFamily: 'Helvetica, Arial, sans-serif', 
                fontSize: '24px',
                textAlign: 'center',
                width: '100%',
                marginTop: '16px',
                marginBottom: '16px'
              }}>
              
            </FormLabel>
            <RadioGroup value={selectedOption}>
              {['Few Shot prompting', 'Chain of Thought prompting', 'Self Consistency', 'Role prompting', 'React prompting'].map(option => (
                <React.Fragment key={option}>
                  <FormControlLabel 
                    value={option} 
                    control={<Radio onClick={() => handleClick(option)} />} 
                    label={option} 
                    sx={{ marginY: '8px' }} 
                  />
                  
                  {option === 'Role prompting' && selectedOption === 'Role prompting' && (
                    <TextField 
                      label="Assistant"
                      variant="outlined"
                      size="small"
                      value={assistantText}
                      onChange={(e) => setAssistantText(e.target.value)}
                      sx={{ width: '80%', marginY: '8px', mx: 'auto' }}
                    />
                  )}
                 
                 {option === 'React prompting' && selectedOption === 'React prompting' && (<FormControl sx={{ width: '80%', marginY: '8px', mx: 'auto' }}>
                        <InputLabel sx ={{marginBottom : '2px'}}>Tool</InputLabel>
                        <Select
                          value={toolType}
                          onChange={(e) => setToolType(e.target.value)}
                          size="small"
                          label="Tool"
                        >
                          <MenuItem value="mail">Mail</MenuItem>
                          <MenuItem value="document">Document</MenuItem>
                        </Select>
                      </FormControl> )}
                
              
                  <Divider sx={{ borderBottomWidth: 2, marginY: '8px' }} />
                  
                </React.Fragment>
              ))}
            </RadioGroup>
          </FormControl>
          
        </>
      );
}