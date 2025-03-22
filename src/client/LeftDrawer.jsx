import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import Divider from '@mui/material/Divider';
import axios from 'axios';
import IconButton from '@mui/material/IconButton';
import { useNavigate } from 'react-router-dom';
import { Menu } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import TextField from "@mui/material/TextField";
import { set } from 'mongoose';

export const  LeftDrawer = 
React.memo( ({setChatGroups, chatGroups, currentChatGroupId, themeMode, leftWidth, username, model}) => {

    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [name, setName] = React.useState('');
    const [selectedGroup, setSelectedGroup] = React.useState(null);
    const [editChatGroupId, setEditChatGroupId] = React.useState(null);
    const handleClick = (event, chatGroup) => {
      setAnchorEl(event.currentTarget);
      setSelectedGroup(chatGroup);
    };

    const handleDelete = async (chatGroupId) => {
        try {

          const response = await axios.delete(`/api/chatgroup/${chatGroupId}`, {
            data: { currentChatGroupId }
          });
         
          if (currentChatGroupId === chatGroupId ) {

            window.location.href = `/c/${response.data.chatGroupId}`;
          }
          setChatGroups(prevChatGroups => {
            const updatedChatGroups = prevChatGroups.filter(group => group._id !== chatGroupId);
            return updatedChatGroups;
          });


        } catch (error) {
          console.error('Error deleting chat group:', error);
        }
      }

      const handleRenaming = async (chatGroupId) => {
        try {
          await axios.put(`/api/chatgroup/${chatGroupId}`, { name });
          setChatGroups(prevChatGroups => {
            const updatedChatGroups = prevChatGroups.map(group => {
              if (group._id === chatGroupId) {
                group.name = name;
              }
              return group;
            });
            return updatedChatGroups;
          });
          
          setEditChatGroupId(null);
          setName('');
         
        
        } catch (error) {
          console.error('Error renaming chat group:', error);
        }
      }


    const createNewChat = async () => {
        try {
          const response = await axios.post('/api/chatgroup', { username, model });
          const newChatGroup = {
            name: response.data.name,
            _id: response.data.chatGroupId,
            chats: []
          };
          setChatGroups(prevChatGroups => {
            const updatedChatGroups = [newChatGroup, ...prevChatGroups];
            return updatedChatGroups;
          });
          window.location.href = `/c/${response.data.chatGroupId}`;
          
    
        } catch (error) {
          console.error('Error creating chat group:', error);
        }
      };
    
    return (
        <Box sx={{ width: leftWidth,backgroundColor: themeMode === 'dark' ? '#121212' : '#f5f5f5', color: themeMode === 'dark' ? '#fff' : '#000', height: '100vh', overflow: 'auto',   }}>
          <Button
            variant="contained"
            startIcon={<AddIcon/>}
            onClick={createNewChat}
          
            sx={{
              border: '1px solid',
              borderRadius: '50px',
            
              textTransform: 'none',
              fontSize: '16px',
              mt: 2,
              ml: 2,
              width: '80%',
            }}
          >
            New Chat
          </Button>
          <Divider sx={{  mt: 2 }} />
          <List sx={{ width: '100%', mt: 2 }}>
            {chatGroups.map((group, index) => 
            
            
            editChatGroupId ===  group._id  ? ( <TextField
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={() => {
                                 
                                  handleRenaming(group._id)

                                }}
                           
                                fullWidth
                              
                                variant="outlined"
                               
                              /> ) : (
              <ListItem 
                key={group._id}
                disablePadding
                sx={{
                 
                  bgcolor: currentChatGroupId === group._id ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                  borderLeft: currentChatGroupId === group._id ? themeMode === 'dark'? '4px solid#ede6e6' : '4px solid#141414': 'none',
                  '&:hover .more-icon': { display: 'block' },
                }}
              >
                <ListItemButton
                  conmponent ="a"
                  href={`/c/${group._id}`}
                >
                  <ListItemText 
                    primary={group.name}
                    primaryTypographyProps={{ noWrap: true }}
                    sx={{ 
                      pl: 0.5,
                      width: '90%',
                     
                    }} 
                  />
                </ListItemButton>
                <IconButton
                    className="more-icon"
                    id={`more-button`}
                    aria-controls={`more-menu`}
                    aria-haspopup='true'
                    aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
                    onClick={(event) => {
                      handleClick(event, group);
                    } }
                    size='small'
                      sx={{
                        display: { xs: 'none', sm: 'block' }, // or use a hover rule to toggle visibility
                       
                        
                      }}
                      
                    >
                <MoreHorizRoundedIcon  sx={{ cursor: 'pointer' }} />
                </IconButton>

                
              </ListItem>
            ))}
          </List>
          <Menu

                  id={`more-menu`}
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => {setAnchorEl(null)
                  setSelectedGroup(null);
                  }
                  }
                  MenuListProps={{
                    'aria-labelledby': `more-button`,
                  }}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  
                
                >
                  <MenuItem onClick={() => {
                    setAnchorEl(null);
                    setName(selectedGroup.name);
                    setEditChatGroupId(selectedGroup._id);

                  }
                  }>
                    <ListItemIcon>
                      <EditIcon />
                    </ListItemIcon>
                    Rename
                    
                  </MenuItem>

                  <MenuItem onClick={() => {
                    setAnchorEl(null);
                    handleDelete(selectedGroup._id);
                  }
                  }>
                    <ListItemIcon>
                      <DeleteIcon />
                    </ListItemIcon >
                       Delete
                  </MenuItem>




                </Menu>
        </Box>
      );


}
);


