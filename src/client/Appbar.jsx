import React from 'react';

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





export function Appbar({getMainWidth, leftWidth, state, toggleDrawer, themeMode, setThemeMode, username, handleLogOut, model, setModel,imageData}) {


    
        const [anchorEl, setAnchorEl] = React.useState(null);
      const open = Boolean(anchorEl);

      const handleChange = (event) => {
   
        setModel(event.target.value);
      };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
      };
      const handleClose = () => {
        setAnchorEl(null);
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
          



       

          <Box sx={{ maxWidth: 150, m: 0 }}>
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
          <MenuItem value={'gpt-4-turbo-preview'}> gpt-4-turbo-preview </MenuItem> 
          <MenuItem value={'gpt-4o-mini'}> gpt-4o-mini </MenuItem>
          <MenuItem value={'gpt-3.5-turbo'}> gpt-3.5-turbo </MenuItem>
          
        </Select>
      </FormControl>


    </Box> 
           
          
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
        </Menu>
           

            </Toolbar>
          </AppBar>
  );
}