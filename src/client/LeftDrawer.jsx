
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import axios from 'axios';

export function LeftDrawer({setChatGroups, chatGroups, setCurrentChatGroupId, currentChatGroupId, themeMode, leftWidth, username}){

    const createNewChat = async () => {
        try {
          const response = await axios.post('/api/chatgroup', { username });
          const newChatGroup = {
            name: response.data.name,
            _id: response.data.chatGroupId,
            chats: []
          };
          setChatGroups(prevChatGroups => {
            const updatedChatGroups = [...prevChatGroups, newChatGroup];
            return updatedChatGroups;
          });
          setCurrentChatGroupId(response.data.chatGroupId);
    
        } catch (error) {
          console.error('Error creating chat group:', error);
        }
      };
    
    return (
        <Box sx={{ width: leftWidth }}>
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
            {chatGroups.map((group, index) => (
              <ListItem 
                key={group._id}
                disablePadding
                sx={{
                 
                  bgcolor: currentChatGroupId === group._id ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                  borderLeft: currentChatGroupId === group._id ? themeMode === 'dark'? '4px solid#ede6e6' : '4px solid#141414': 'none',
                }}
              >
                <ListItemButton
                  onClick={() => {
                    setCurrentChatGroupId(group._id);
                  }}
                >
                  <ListItemText 
                    primary={group.name}
                    primaryTypographyProps={{ noWrap: true }}
                    sx={{ 
                      pl: 2,
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      );


}
