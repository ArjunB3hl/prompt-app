import { Box, Typography, Paper } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import React from "react";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import axios from "axios";
import { FormControl, InputLabel, Select, MenuItem, Grid, Container } from "@mui/material";
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
import { Line } from 'react-chartjs-2';
import './chartViewer.css'; // We'll create this CSS file next

// Register the chart components we need
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function ChartViewer({ currentChatGroupId }) {  
  const [chatGroups, setChatGroups] = useState([]);
  const [selectedChatGroup, setSelectedChatGroup] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChats, setSelectedChats] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  
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
        else {
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
  
  const rows = chats.map((chat) => ({
    id: chat._id,
    UserMessage: chat.UserMessage,
    AIResponse: chat.AIMessage,
    fileName: chat.fileName,
    promptTokens: chat.promptTokens,
    completionTokens: chat.completionTokens,
    accuracy: chat.accuracy,
    relevance: chat.relevance,
    coherence: chat.coherence,
    toolUse: chat.toolUse,
    model: chat.model,
  }));
  
  // Theme configuration
  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#90caf9',
      },
      background: {
        default: '#121212',
        paper: '#121212',
      },
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
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: 'none',
          },
        },
      },
    },
  });
 
  const [selectedChartOption, setSelectedChartOption] = useState("");

  // Handle row selection
  const handleRowClick = (id) => {
    const isSelected = selectedRows.includes(id);
    let newSelectedRows;
    
    if (isSelected) {
      newSelectedRows = selectedRows.filter(rowId => rowId !== id);
    } else {
      newSelectedRows = [...selectedRows, id];
    }
    
    setSelectedRows(newSelectedRows);
    
    // Update selected chats based on selected rows
    const selectedChatObjects = rows.filter(row => newSelectedRows.includes(row.id));
    setSelectedChats(selectedChatObjects);
  };

  // Handle select all rows
  const handleSelectAllRows = () => {
    if (selectedRows.length === rows.length) {
      // If all rows are selected, deselect all
      setSelectedRows([]);
      setSelectedChats([]);
    } else {
      // Otherwise, select all rows
      const allRowIds = rows.map(row => row.id);
      setSelectedRows(allRowIds);
      setSelectedChats(rows);
    }
  };

  // TokensChart component
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
          borderColor: '#90caf9',
          backgroundColor: 'rgba(144, 202, 249, 0.1)',
          borderWidth: 1.5,
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Completion Tokens',
          data: completionTokens,
          borderColor: '#ce93d8',
          backgroundColor: 'rgba(206, 147, 216, 0.1)',
          borderWidth: 1.5,
          tension: 0.3,
          fill: true,
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
          labels: {
            color: '#ffffff'
          }
        },
        title: {
          display: true,
          text: 'Token Usage',
          color: '#ffffff'
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Message Index',
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Tokens',
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff'
          }
        },
      },
    };

    return (
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    );
  };

  // AccuracyChart component
  const AccuracyChart = () => {
    if (selectedChats.length === 0) {
      return <div className="no-data-chart">Please select chats to display accuracy data</div>;
    }

    const labels = selectedChats.map((_, i) => i + 1);
    const accuracyData = selectedChats.map((item) => item.accuracy);

    const data = {
      labels,
      datasets: [
        {
          label: 'Accuracy',
          data: accuracyData,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 1.5,
          tension: 0.3,
          fill: true,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#ffffff'
          }
        },
        title: {
          display: true,
          text: 'Accuracy Metrics',
          color: '#ffffff'
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Message Index',
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Accuracy Score',
            color: '#ffffff'
          },
          min: 0,
          max: 1,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff',
            callback: function(value) {
              return (value * 100) + '%';
            }
          }
        },
      },
    };

    return (
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    );
  };

  // CoherenceChart component
  const CoherenceChart = () => {
    if (selectedChats.length === 0) {
      return <div className="no-data-chart">Please select chats to display coherence data</div>;
    }

    const labels = selectedChats.map((_, i) => i + 1);
    const coherenceData = selectedChats.map((item) => item.coherence);

    const data = {
      labels,
      datasets: [
        {
          label: 'Coherence',
          data: coherenceData,
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          borderWidth: 1.5,
          tension: 0.3,
          fill: true,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#ffffff'
          }
        },
        title: {
          display: true,
          text: 'Coherence Metrics',
          color: '#ffffff'
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Message Index',
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Coherence Score',
            color: '#ffffff'
          },
          min: 0,
          max: 1,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff',
            callback: function(value) {
              return (value * 100) + '%';
            }
          }
        },
      },
    };

    return (
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    );
  };

  // RelevanceChart component
  const RelevanceChart = () => {
    if (selectedChats.length === 0) {
      return <div className="no-data-chart">Please select chats to display relevance data</div>;
    }

    const labels = selectedChats.map((_, i) => i + 1);
    const relevanceData = selectedChats.map((item) => item.relevance);

    const data = {
      labels,
      datasets: [
        {
          label: 'Relevance',
          data: relevanceData,
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          borderWidth: 1.5,
          tension: 0.3,
          fill: true,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#ffffff'
          }
        },
        title: {
          display: true,
          text: 'Relevance Metrics',
          color: '#ffffff'
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Message Index',
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Relevance Score',
            color: '#ffffff'
          },
          min: 0,
          max: 1,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff',
            callback: function(value) {
              return (value * 100) + '%';
            }
          }
        },
      },
    };

    return (
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    );
  };

  // ModelComparisonChart component
  const ModelComparisonChart = () => {
    if (selectedChats.length === 0) {
      return <div className="no-data-chart">Please select chats to display model comparison data</div>;
    }

    // Group chats by model
    const modelGroups = {};
    selectedChats.forEach(chat => {
      if (!modelGroups[chat.model]) {
        modelGroups[chat.model] = [];
      }
      modelGroups[chat.model].push(chat);
    });

    // Calculate average metrics for each model
    const modelData = Object.keys(modelGroups).map(model => {
      const chats = modelGroups[model];
      const avgAccuracy = chats.reduce((sum, chat) => sum + (chat.accuracy || 0), 0) / chats.length;
      const avgRelevance = chats.reduce((sum, chat) => sum + (chat.relevance || 0), 0) / chats.length;
      const avgCoherence = chats.reduce((sum, chat) => sum + (chat.coherence || 0), 0) / chats.length;
      
      return {
        model,
        accuracy: avgAccuracy,
        relevance: avgRelevance,
        coherence: avgCoherence
      };
    });

    const labels = modelData.map(item => item.model);
    
    const data = {
      labels,
      datasets: [
        {
          label: 'Accuracy',
          data: modelData.map(item => item.accuracy),
          backgroundColor: 'rgba(76, 175, 80, 0.7)',
          borderWidth: 1,
        },
        {
          label: 'Relevance',
          data: modelData.map(item => item.relevance),
          backgroundColor: 'rgba(244, 67, 54, 0.7)',
          borderWidth: 1,
        },
        {
          label: 'Coherence',
          data: modelData.map(item => item.coherence),
          backgroundColor: 'rgba(255, 152, 0, 0.7)',
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#ffffff'
          }
        },
        title: {
          display: true,
          text: 'Model Comparison',
          color: '#ffffff'
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Model',
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Score',
            color: '#ffffff'
          },
          min: 0,
          max: 1,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff',
            callback: function(value) {
              return (value * 100) + '%';
            }
          }
        },
      },
    };

    return (
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    );
  };

  // CostAnalysisChart component
  const CostAnalysisChart = () => {
    if (selectedChats.length === 0) {
      return <div className="no-data-chart">Please select chats to display cost analysis data</div>;
    }

    // Calculate cost for each chat
    const chatCosts = selectedChats.map(chat => {
      // Implement cost calculation based on the model and token usage
      // This should match the logic in the MessageSchema.methods.calculateCost function
      const promptTokens = chat.promptTokens || 0;
      const completionTokens = chat.completionTokens || 0;
      let cost = 0;
      
      switch (chat.model) {
        case 'gpt-4o':
          cost = (promptTokens * (2.50 / 1000000)) + (completionTokens * (10 / 1000000));
          break;
        case 'gpt-3.5-turbo':
          cost = (promptTokens * (0.50 / 1000000)) + (completionTokens * (1.50 / 1000000));
          break;
        case 'gpt-4o-mini':
          cost = (promptTokens * (0.15 / 1000000)) + (completionTokens * (0.60 / 1000000));
          break;
        case 'o1-mini':
          cost = (promptTokens * (1.10 / 1000000)) + (completionTokens * (4.40 / 1000000));
          break;
        case 'o3-mini':
          cost = (promptTokens * (1.10 / 1000000)) + (completionTokens * (4.40 / 1000000));
          break;
        case 'claude-3-5-haiku-20241022':
          cost = (promptTokens * (0.80 / 1000000)) + (completionTokens * (4.0 / 1000000));
          break;
        default:
          cost = 0;
      }
      
      return {
        index: chat.id,
        cost: cost,
        model: chat.model
      };
    });

    const labels = chatCosts.map((_, i) => i + 1);
    
    // Group by model for stacked view
    const modelGroups = {};
    chatCosts.forEach(chat => {
      if (!modelGroups[chat.model]) {
        modelGroups[chat.model] = Array(chatCosts.length).fill(null);
      }
      const index = chatCosts.findIndex(c => c.index === chat.index);
      modelGroups[chat.model][index] = chat.cost;
    });

    // Create datasets for each model
    const datasets = Object.keys(modelGroups).map((model, index) => {
      const colors = [
        '#4caf50', '#f44336', '#ff9800', '#2196f3', '#9c27b0', '#00bcd4'
      ];
      
      return {
        label: model,
        data: modelGroups[model],
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length],
        borderWidth: 1.5,
      };
    });

    const data = {
      labels,
      datasets,
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#ffffff'
          }
        },
        title: {
          display: true,
          text: 'Cost Analysis',
          color: '#ffffff'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: $${context.raw.toFixed(6)}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Message Index',
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Cost (USD)',
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff',
            callback: function(value) {
              return '$' + value.toFixed(6);
            }
          }
        },
      },
    };

    return (
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    );
  };
  
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
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ overflow: 'hidden' }}>
        <Box sx={{ width: '100%', py: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                gap: 3, 
                mb: 4,
                alignItems: { xs: 'stretch', sm: 'center' }
              }}>
                <FormControl variant="outlined" sx={{ minWidth: 200 }}>
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
            <MenuItem value="accuracy">Accuracy</MenuItem>
            <MenuItem value="coherence">Coherence</MenuItem>
            <MenuItem value="relevance">Relevance</MenuItem>
            <MenuItem value="modelComparison">Model Comparison</MenuItem>
            <MenuItem value="costAnalysis">Cost Analysis</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            
            {selectedChartOption === 'tokenData' && (
              <Grid item xs={12}>
                <TokensChart />
              </Grid>
            )}
            
            {selectedChartOption === 'accuracy' && (
              <Grid item xs={12}>
                <AccuracyChart />
              </Grid>
            )}
            
            {selectedChartOption === 'coherence' && (
              <Grid item xs={12}>
                <CoherenceChart />
              </Grid>
            )}
            
            {selectedChartOption === 'relevance' && (
              <Grid item xs={12}>
                <RelevanceChart />
              </Grid>
            )}
            
            {selectedChartOption === 'modelComparison' && (
              <Grid item xs={12}>
                <ModelComparisonChart />
              </Grid>
            )}
            
            {selectedChartOption === 'costAnalysis' && (
              <Grid item xs={12}>
                <CostAnalysisChart />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th className="checkbox-column">
                        <div className="checkbox-header">
                          <div 
                            className={`checkbox ${selectedRows.length === rows.length && rows.length > 0 ? 'checked' : ''}`}
                            onClick={handleSelectAllRows}
                          ></div>
                        </div>
                      </th>
                      <th>ID</th>
                      <th>User Message</th>
                      <th>AI Response</th>
                      <th>File Name</th>
                      <th>Prompt Tokens</th>
                      <th>Completion Tokens</th>
                      <th>Accuracy</th>
                      <th>Relevance</th>
                      <th>Coherence</th>
                      <th>Tool Use</th>
                      <th>Model</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length > 0 ? (
                      rows.map((row) => (
                        <tr 
                          key={row.id} 
                          className={selectedRows.includes(row.id) ? 'selected' : ''}
                          onClick={() => handleRowClick(row.id)}
                        >
                          <td className="checkbox-column">
                            <div className="custom-checkbox">
                              <div className={`checkbox ${selectedRows.includes(row.id) ? 'checked' : ''}`}></div>
                            </div>
                          </td>
                          <td>{row.id}</td>
                          <td className="message-cell" title={row.UserMessage}>{row.UserMessage}</td>
                          <td className="message-cell" title={row.AIResponse}>{row.AIResponse}</td>
                          <td>{row.fileName}</td>
                          <td className="number-cell">{row.promptTokens}</td>
                          <td className="number-cell">{row.completionTokens}</td>
                          <td className="number-cell">{row.accuracy}</td>
                          <td className="number-cell">{row.relevance}</td>
                          <td className="number-cell">{row.coherence}</td>
                          <td className="boolean-cell">{row.toolUse ? 'Yes' : 'No'}</td>
                          <td>{row.model}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="12" className="no-data">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
