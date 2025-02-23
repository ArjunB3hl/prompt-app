import { Box, Typography } from "@mui/material";
import { useEffect } from "react";
import { useState } from "react";
import React from "react";
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { ThemeProvider, createTheme, useColorScheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import axios from "axios";
import {  FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { set } from "mongoose";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the components we need
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

import { Line } from 'react-chartjs-2';







export function ChartViewer({   currentChatGroupId }) {  


  
  const [chatGroups, setChatGroups] = useState([]);
  const [selectedChatGroup, setSelectedChatGroup] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChats, setSelectedChats] = useState([]);
  
  useEffect(() => {
    async function loadChatGroups() {
      try {
        const response = await axios.get("/api/check-auth");
        setChatGroups(response.data.chatGroups);
        // Optionally set selectedChatGroup based on currentChatGroupId
        const selected = response.data.chatGroups.find(group => group._id === currentChatGroupId);
        if (selected) setSelectedChatGroup(selected);
      } catch (error) {
        console.error("Error loading chatGroups:", error);
      }
    }
    loadChatGroups();
  }, [currentChatGroupId]);

  useEffect(() => {
    // Load chats for current chat group
    const loadChats = async () => {
      if (!selectedChatGroup) return;
      try {
        const response = await axios.get(`/api/chatgroup/${selectedChatGroup._id}/chats`);
        if(response.data.messages.length === 0) {
            console.log('No chats found');
           
        }
        else{

          setChats(response.data.messages);
          console.log('Chats loaded:', response.data.messages);
        }
     
      
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    };
    
    if (currentChatGroupId) {
      loadChats();
    }
  }, [selectedChatGroup]);

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'UserMessage', headerName: 'User message', width: 230 },
    { field: 'AIResponse', headerName: 'AI Response', flex: 1 },
    { field: 'promptTokens', headerName: 'Prompt tokens', width: 150 },
    { field: 'completionTokens', headerName: 'Completion tokens', width: 150 },
   
  ];

  console.log(' selected chats:', selectedChats);
  
  const rows = chats.map((chat) => ({
    id: chat._id, // Use chat._id for the row id
    UserMessage: chat.UserMessage, // Display the user message
    AIResponse: chat.AIMessage, // Display the AI response
    promptTokens: chat.promptTokens, // Display the prompt tokens
    completionTokens: chat.completionTokens, // Display the completion tokens
  }));
  
  const paginationModel = { page: 0, pageSize: 5 };
  
  /**
   * Generates design tokens for the theme based on the provided mode.
   *
   * @param {string} mode - The mode of the theme, either 'light' or 'dark'.
   * @returns {object} The design tokens for the theme.
   *
   * @property {object} palette - The color palette for the theme.
   * @property {string} palette.mode - The mode of the theme.
   * @property {object} palette.primary - The primary color settings.
   * @property {string} palette.primary.main - The main primary color (#212121 for dark mode,#000000 for light mode).
   * @property {string} palette.primary.light - The light primary color (#484848 for dark mode, #6d6d6d for light mode).
   * @property {string} palette.primary.dark - The dark primary color (#000000 for dark mode, #1b1b1b for light mode).
   * @property {object} palette.secondary - The secondary color settings.
   * @property {string} palette.secondary.main - The main secondary color (#ff4081 for dark mode, #1976d2 for light mode).
   * @property {object} palette.background - The background color settings.
   * @property {string} palette.background.default - The default background color (#0d0d0d for dark mode, #f5f5f5 for light mode).
   * @property {string} palette.background.paper - The paper background color (#1a1a1a for dark mode, #fff for light mode).
   * @property {object} palette.text - The text color settings.
   * @property {string} palette.text.primary - The primary text color (#ffffff for dark mode,rgb(105, 45, 45) for light mode).
   * @property {string} palette.text.secondary - The secondary text color (#e0e0e0 for dark mode, #424242 for light mode).
   * @property {object} shape - The shape settings.
   * @property {number} shape.borderRadius - The border radius for components (12).
   * @property {object} typography - The typography settings.
   * @property {string} typography.fontFamily - The font family for the theme.
   * @property {object} typography.allVariants - The text shadow settings for all text variants.
   * @property {string} typography.allVariants.textShadow - The text shadow effect (0 0 5px rgba(255,255,255,0.8) for dark mode, none for light mode).
   * @property {object} components - The component overrides.
   * @property {object} components.MuiPaper - The Paper component overrides.
   * @property {object} components.MuiPaper.styleOverrides - The style overrides for the Paper component.
   * @property {object} components.MuiPaper.styleOverrides.root - The root style overrides for the Paper component.
   * @property {string} components.MuiPaper.styleOverrides.root.backgroundImage - The background image setting (none).
   * @property {string} components.MuiPaper.styleOverrides.root.border - The border setting (1px #ff4081 for dark mode, #1976d2 for light mode).
   * @property {string} components.MuiPaper.styleOverrides.root.boxShadow - The box shadow setting (0 0 10px rgba(147, 144, 144, 0.2) for dark mode, 0 1px 3px rgba(0,0,0,0.2) for light mode).
   */
  const getDesignTokens = (mode) => ({
    palette: {
      mode,
      primary: {
        // Use a very dark tone for primary in both modes
        main: mode === 'dark' ? '#212121' : '#424242',
        light: mode === 'dark' ? '#484848' : '#6d6d6d',
        dark: mode === 'dark' ? '#000000' : '#1b1b1b',
      },
      secondary: {
        // A tinge of color for accent (for borders, etc.)
        main: mode === 'dark' ? '#ff4081' : '#1976d2',
      },
      background: {
        default: mode === 'dark' ? '#0d0d0d' : '#f5f5f5',
        paper: mode === 'dark' ? '#1a1a1a' : '#fff',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#000000',
        secondary: mode === 'dark' ? '#e0e0e0' : '#424242',
      },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      // Optionally add a glowing effect to all text in dark mode
      allVariants: {
        textShadow: mode === 'dark' ? '0 0 5px rgba(158, 142, 142, 0.8)' : 'none',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${mode === 'dark' ? '#bfb0b5' : '#1976d2'}`,
            boxShadow:
              mode === 'dark'
                ? '0 0 10px rgba(147, 144, 144, 0.2)'
                : '0 1px 3px rgba(0,0,0,0.2)',
          },
        },
      },
    },
  });
 

const [selectedChartOption, setSelectedChartOption] = useState("");

// modified tokenData component
const TokensChart = () => {

  // Create labels (e.g., message index)
 const labels = selectedChats.map((_, i) => i + 1);

 // Extract prompt tokens and completion tokens arrays
 const promptTokens = selectedChats.map((item) => item.promptTokens);
 const completionTokens = selectedChats.map((item) => item.completionTokens);

 // Define the data structure for Chart.js
 const data = {
   labels,
   datasets: [
     {
       label: 'Prompt Tokens',
       data: promptTokens,
       borderColor: 'rgba(75,192,192,1)',
       backgroundColor: 'rgba(75,192,192,0.2)',
       tension: 0.3,
       fill: false,
     },
     {
       label: 'Completion Tokens',
       data: completionTokens,
       borderColor: 'rgba(153,102,255,1)',
       backgroundColor: 'rgba(153,102,255,0.2)',
       tension: 0.3,
       fill: false,
     },
   ],
 };

 // Define chart options
 const options = {
   responsive: true,
   maintainAspectRatio: false,
   plugins: {
     legend: {
       position: 'top',
     },
     title: {
       display: true,
       text: 'Token Usage',
     },
   },
   scales: {
     x: {
       title: {
         display: true,
         text: 'Message Index',
       },
     },
     y: {
       title: {
         display: true,
         text: 'Tokens',
       },
     },
   },
 };

 return (
   <div
     style={{
       
       width: '500px',
       height: '300px',
       backgroundColor:  'black',
       boxShadow: '0px 0px 5px rgba(0,0,0,0.3)',
       padding: '16px',
     }}
   >
     <Line data={data} options={options} />
   </div>
 );

 };

  
    const isBrowserDefaultDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
    const [theme, setTheme] = useState(createTheme(getDesignTokens(isBrowserDefaultDark() ? 'dark' : 'light')));

      // Handler for chat group change
      const handleChatGroupChange = (e) => {
        const matchingGroup = chatGroups.find(group => group.name === e.target.value);
        if (matchingGroup) {
          setSelectedChatGroup(matchingGroup);
        }
      };

  // Handler for chart option change
  const handleChartOptionChange = (e) => {
    setSelectedChartOption(e.target.value);
    // Optionally update chart display accordingly.
  };

return (
    <ThemeProvider theme={theme}>
        <CssBaseline />
       
<Box sx={{ width: "100%", height: "100%"} }>



<Box sx={{ width: '100%', marginTop: selectedChartOption === 'tokenData' ? 5 : 10, marginLeft: 25 }}>

                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'left', marginBottom: 5 }}>
<FormControl variant="outlined" sx={{ minWidth: 200, marginRight: 5 }}>
          <InputLabel id="chatgroup-select-label">Chat Group</InputLabel>
          <Select
            labelId="chatgroup-select-label"
            id="chatgroup-select"
            value={selectedChatGroup ? selectedChatGroup.name : ''}
            onChange={handleChatGroupChange}
            label="Chat Group"
          >
            {chatGroups.map((group) => (
              <MenuItem key={group._id} value={group.name}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel id="chartoption-select-label">Select Chart Option</InputLabel>
          <Select
            labelId="chartoption-select-label"
            id="chartoption-select"
            value={selectedChartOption}
            onChange={handleChartOptionChange}
            label="Select Chart Option"
          >
            <MenuItem value="">
              <em>Select Chart Option</em>
            </MenuItem>
            <MenuItem value="tokenData">Token Data</MenuItem>
            <MenuItem value="latency">Latency</MenuItem>
            <MenuItem value="accuracy">Accuracy</MenuItem>
            <MenuItem value="coherence">Coherence</MenuItem>
            <MenuItem value="relevance">Relevance</MenuItem>
          </Select>
        </FormControl>

       

        </Box>

        {selectedChartOption === 'tokenData' && <TokensChart />}
                <Paper sx={{ height: 500, width: '80%' }}>
                   
                   
                   
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        initialState={{ pagination: { paginationModel } }}
                        pageSizeOptions={[5, 10]}
                        checkboxSelection
                        onRowSelectionModelChange={(newSelectionModel) => {
                          console.log("newSelectionModel:", newSelectionModel);
                          const selectedChatObjects = rows.filter((row) =>
                            newSelectionModel.includes(row.id)
                          );
                          console.log("selectedChatObjects:", selectedChatObjects);
                          setSelectedChats(selectedChatObjects);
                        }}
                        sx={{ // Remove outer border if you wish
                          border: 'none',
                          // Add a right border for every cell
                          '& .MuiDataGrid-cell': {
                            borderRight: '1px solid rgba(224, 224, 224, 1)',
                          }, }}
                    />
                    </Paper>
                    




            </Box>
    
    
    
    </Box>
</ThemeProvider>

)




}
