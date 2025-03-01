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
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { use } from 'react';
import { useEffect } from 'react';

export function RightDrawer({selectedOption, setSelectedOption, assistantText, setAssistantText, toolType, setToolType, themeMode, memory}) {
    
    const handleClick = (option) => {
      setSelectedOption(prev => prev === option ? "" : option);
    };

    useEffect(() => {
      if (selectedOption !== 'Role prompting') {
        setAssistantText('');
      }
      if (selectedOption !== 'React prompting') {
        setToolType('');
      }
    }
    , [selectedOption]);

    return (
        <Box sx={{ 
            padding: '24px', 
            width: '100%', 
            backgroundColor: themeMode === 'dark' ? '#121212' : '#f5f5f5', 
            color: themeMode === 'dark' ? '#fff' : '#000', 
            height: '100vh',
            overflowY: 'auto'
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              textAlign: 'center',
              mb: 3,
              fontWeight: 500,
              color: themeMode === 'dark' ? '#fff' : '#333'
            }}>
            Prompt Engineering
          </Typography>
          
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup value={selectedOption} sx={{ width: '100%' }}>
              {['Few Shot prompting', 'Chain of Thought prompting', 'Self Consistency', 'Role prompting', 'React prompting'].map(option => (
                <React.Fragment key={option}>
                  <Box sx={{ mb: 1 }}>
                    <FormControlLabel 
                      value={option} 
                      control={
                        <Radio 
                        onClick={() => {
                          // Only allow clicking if:
                          // 1. It's not Role prompting, OR
                          // 2. It is Role prompting but memory is true
                          if (option !== 'Role prompting' || memory) {
                            handleClick(option);
                          }
                        }}
                          disabled={option === 'Role prompting' && !memory}
                          size="small"
                          sx={{ 
                            color: themeMode === 'dark' ? '#aaa' : '#666',
                            opacity: (option === 'Role prompting' && !memory) ? 0.3 : 1,
                            '&.Mui-disabled': {
                              color: themeMode === 'dark' ? '#555' : '#ccc',
                            }
                          }}
                        />
                      } 
                      label={
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.9rem',
                          opacity: (option === 'Role prompting' && !memory) ? 0.3 : 1
                        }}>
                          {option}
                        </Typography>
                      }
                      sx={{ my: 0.5 }} 
                      disabled={option === 'Role prompting' && !memory} // Also disable the label
                    />
                    
                    {option === 'Role prompting' && selectedOption === 'Role prompting' && (
                      <Box sx={{ pl: 4, pr: 1, mt: 1, mb: 2 }}>
                        <TextField 
                          label="Assistant"
                          variant="outlined"
                          size="small"
                          value={assistantText}
                          onChange={(e) => setAssistantText(e.target.value)}
                          sx={{ 
                            width: '100%',
                            '& .MuiInputLabel-root': {
                              fontSize: '0.85rem',
                            },
                            '& .MuiInputBase-input': {
                              fontSize: '0.85rem',
                              p: '8px 12px',
                            }
                          }}
                        />
                      </Box>
                    )}
                   
                    {option === 'React prompting' && selectedOption === 'React prompting' && (
                      <Box sx={{ pl: 4, pr: 1, mt: 1, mb: 2 }}>
                        <FormControl size="small" fullWidth>
                          <InputLabel sx={{ fontSize: '0.85rem' }}>Tool</InputLabel>
                          <Select
                            value={toolType}
                            onChange={(e) => setToolType(e.target.value)}
                            label="Tool"
                            sx={{ 
                              fontSize: '0.85rem',
                              '& .MuiSelect-select': {
                                py: 1
                              }
                            }}
                          >
                            <MenuItem value="mail" sx={{ fontSize: '0.85rem' }}>Mail</MenuItem>
                            <MenuItem value="document" sx={{ fontSize: '0.85rem' }}>Document</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                  </Box>
                  
                  <Divider sx={{ 
                    borderBottomWidth: 1, 
                    my: 1.5, 
                    opacity: themeMode === 'dark' ? 0.2 : 0.5 
                  }} />
                  
                </React.Fragment>
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
    );
}