import React, { useState, useEffect } from 'react';
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
import { Menu, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import TextField from "@mui/material/TextField";
import { useActiveChats } from './useActiveChats';


export const LeftDrawer = 
React.memo(({setChatGroups, chatGroups, currentChatGroupId, themeMode, leftWidth, username, model, setIsLoading}) => {

    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [name, setName] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [editChatGroupId, setEditChatGroupId] = useState(null);
    const { activeChats, addActiveChat, updateActiveChat, removeActiveChat } = useActiveChats();
   
    // Find current chat group and add it to active chats
    useEffect(() => {
      if (currentChatGroupId && chatGroups.length > 0) {
        const currentGroup = chatGroups.find(group => group._id === currentChatGroupId);
        if (currentGroup) {
          addActiveChat(currentGroup);
        }
      }
    }, [currentChatGroupId, chatGroups, addActiveChat]);
    const handleClick = (event, chatGroup) => {
      setAnchorEl(event.currentTarget);
      setSelectedGroup(chatGroup);
    };

    const handleDelete = async (chatGroupId) => {
        try {
          // Remove from active chats
          removeActiveChat(chatGroupId);
          
          const response = await axios.delete(`/api/chatgroup/${chatGroupId}`, {
            data: { currentChatGroupId }
          });
         
          // Update chat groups state
          setChatGroups(prevChatGroups => {
            const updatedChatGroups = prevChatGroups.filter(group => group._id !== chatGroupId);
            return updatedChatGroups;
          });
          
          // If we're deleting the current chat, navigate to another one
          if (currentChatGroupId === chatGroupId) {
            navigate(`/c/${response.data.chatGroupId}`);
          }
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
                updateActiveChat(group);
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
          // Show loading state
          setIsLoading(true);
          
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
          
          // Add to active chats
          addActiveChat(newChatGroup);
          
          // Use React Router navigation instead of window.location
          navigate(`/c/${response.data.chatGroupId}`);
        } catch (error) {
          console.error('Error creating chat group:', error);
        } finally {
          setIsLoading(false);
        }
    };
    
    // Update navigation to use React Router
    const handleChatClick = (chatGroupId, event) => {
      // If middle click or ctrl/cmd+click, open in new tab/window
      if (event.button === 1 || (event.button === 0 && (event.ctrlKey || event.metaKey))) {
        window.open(`/c/${chatGroupId}`, '_blank');
      } else {
        // Regular left click - navigate in same window
        navigate(`/c/${chatGroupId}`);
      }
    };
    
    // Handle opening chat in new window
    const handleOpenInNewWindow = (chatGroupId) => {
      window.open(`/c/${chatGroupId}`, '_blank');
    };

    return (
      <Box
      sx={{
        width: leftWidth,
        backgroundColor: themeMode === 'dark' ? '#121212' : '#f5f5f5',
        color: themeMode === 'dark' ? '#fff' : '#000',
        height: '100vh',
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '0px',
        },
        
      }}
    >
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
          <Divider sx={{ mt: 2 }} />
          
          {/* Chats List */}
          <Box sx={{ mt: 2 }}>
            
            <List sx={{ width: '100%', mt: 1 }}>
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
                  onClick={(event) => handleChatClick(group._id, event)}
                  onAuxClick={(event) => handleChatClick(group._id, event)}
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
          </Box>
          <Menu
            id={`more-menu`}
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => {
              setAnchorEl(null);
              setSelectedGroup(null);
            }}
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
              if (selectedGroup) handleOpenInNewWindow(selectedGroup._id);
            }}>
              <ListItemIcon>
                <OpenInNewIcon />
              </ListItemIcon>
              Open in New Window
            </MenuItem>
            
            <MenuItem onClick={() => {
              setAnchorEl(null);
              setName(selectedGroup?.name || '');
              setEditChatGroupId(selectedGroup?._id);
            }}>
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              Rename
            </MenuItem>

            <MenuItem onClick={() => {
              setAnchorEl(null);
              if (selectedGroup) handleDelete(selectedGroup._id);
            }}>
              <ListItemIcon>
                <DeleteIcon />
              </ListItemIcon>
              Delete
            </MenuItem>
          </Menu>
        </Box>
      );


}
);
