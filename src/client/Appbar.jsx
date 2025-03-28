import React, { useState } from 'react';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import { FormControl } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import axios from 'axios';

import GavelIcon from '@mui/icons-material/Gavel';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';


export function Appbar({getMainWidth, leftWidth, state, toggleDrawer, themeMode, setThemeMode, username, handleLogOut, model, setModel,imageData,setMemory, memory}) {


    
      const [anchorEl, setAnchorEl] = React.useState(null);
      const open = Boolean(anchorEl);
      const [isJudging, setIsJudging] = useState(false);
      const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // ... existing handlers

  const handleJudgeAll = async () => {
    try {
      setIsJudging(true);
      const response = await axios.post('/api/judgeMass');
      setSnackbarMessage(`Judgment complete! Judged: ${response.data.stats.judged}, Skipped: ${response.data.stats.skipped}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error judging messages:', error);
      setSnackbarMessage('Failed to judge messages');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsJudging(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

      const handleChange = (event) => {
   
        setModel(event.target.value);
      };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
      };
      const handleClose = () => {
        setAnchorEl(null);
      };
      const handleMemory = (event) => {
        setMemory(event.target.checked);
      };

  return (
    <AppBar
        position="fixed"
        sx={{
          width: getMainWidth(),
          
          
          transition: "all 0.3s ease",
          ml: state.left ? `${leftWidth}` : 0,
          mr: state.right ? "200px" : 0,
        }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            aria-label="menu"
            
            onClick={
              state.left ? toggleDrawer("left", false) : toggleDrawer("left", true)
            }
          >
            <MenuIcon />
          </IconButton>
        
       

          <Box sx={{ maxWidth: 200, m: 0 }}>
      <FormControl fullWidth>
        <InputLabel
          id="demo-simple-select-label"
          
        >
          LLM Analyzer
        </InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={model}
          label="LLM Analyzer"
          onChange={handleChange}
          sx={{
            height: '40px', // Adjust overall height as needed
            '& .MuiSelect-select': {
              paddingTop: '6px',   // Adjust padding to fit the new height
              paddingBottom: '6px',
            },
          }}
          
        >
                    <MenuItem 
            value={'o1-mini'}   
            disabled={memory}
            sx={{ 
              opacity: memory ? 0.3 : 1,
            }}     
          > 
            o1-mini 
          </MenuItem>
          <MenuItem 
            value={'claude-3-5-haiku-20241022'} 
            disabled={memory}
            sx={{ 
              opacity: memory ? 0.3 : 1,
            }}
          > 
            claude-3-5-haiku
          </MenuItem>
          <MenuItem 
            value={'o3-mini'} 
          > 
            o3-mini
          </MenuItem>
          <MenuItem value={'gpt-4o-mini'}> gpt-4o-mini </MenuItem>
          <MenuItem value={'gpt-3.5-turbo'}> gpt-3.5-turbo </MenuItem>
          
        </Select>
      </FormControl>

    




    </Box> 

    <FormControl sx={{ ml: 2 }}>
    <FormControlLabel
      control={
        <Checkbox 
          checked={memory} 
          onChange={handleMemory}
          size="small" // Make checkbox smaller
        />
      }
      label={
        <Typography  variant="caption">Use Memory</Typography> // Smaller text
      }
      sx={{ 
        mt: 0.5, // Add a small top margin
        '& .MuiFormControlLabel-label': {
          fontSize: '0.75rem' // Even smaller text if needed
        }
      }}
    />
  </FormControl>
{/* Add Gavel Icon Button here */}
<Tooltip title="Judge all messages">
          <IconButton 
            color="inherit" 
            onClick={handleJudgeAll}
            disabled={isJudging}
            size="small"
           
          >
            {isJudging ? <CircularProgress size={20} color="inherit" /> : <GavelIcon />}
          </IconButton>
        </Tooltip>

  



           
          
            <Box sx={{ flex:1 }}/>  


            <Button
               id="basic-button"
               aria-controls={open ? 'basic-menu' : undefined}
               aria-haspopup="true"
               aria-expanded={open ? 'true' : undefined}
               onClick={handleClick}
            >
             { imageData ? <img src={imageData}
                alt="Profile"
                style={{ width: 24, height: 24, borderRadius: '50%' }}
              /> : (<AccountCircleIcon />)}
              <Box sx={{ ml:1 }}/>  
              <Typography
              variant="h8"
              component="div"
              
              >
              {username || 'User Name'}
              </Typography>
            </Button>
              <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
          }}
        >
     
          <MenuItem  onClick={handleLogOut}> 
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          Log out
          
          </MenuItem>


          <MenuItem>
          
         <Box sx={{  }}>
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={themeMode === 'dark'}
              onChange={event => setThemeMode(event.target.checked ? 'dark' : 'light')}
              color="default"
            />
          }
          label="Dark"
        // Change label color
        />
      </FormGroup>
      </Box>
          
          
          </MenuItem>

          <MenuItem  onClick={() => {
  window.open('/help', '_blank');
}}> 
          <ListItemIcon>
            <HelpOutlineIcon />
          </ListItemIcon>
          Help
          
          </MenuItem>
     

        </Menu>
           

            </Toolbar>

            {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
          </AppBar>
  );
}