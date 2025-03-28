import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Tabs,
  Tab,
  Button,
  AppBar,
  Toolbar,
  Card,
  CardMedia,
  CardContent,
  Divider,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export function EvaluationResults() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulating fetching results from server
  useEffect(() => {
    // In a real app, this would be an API call
    const fetchResults = async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Combined data from both Simple Test and Comprehensive results
      const allResults = [
        // Simple Test results
        {
          id: 1,
          category: "simple",
          title: "Simple Overall Comparison (Latest)",
          description: "Visual comparison of model performance across all evaluation tasks",
          image: "/evaluation_results/Simple%20Test/simple_overall_20250312_175844.png", 
          date: "March 12, 2025"
        },
        {
          id: 2,
          category: "simple",
          title: "Simple Detailed Comparison (Latest)",
          description: "Detailed heatmap of performance metrics across models and tasks",
          image: "/evaluation_results/Simple%20Test/simple_comparison_20250312_175844.png",
          date: "March 12, 2025"
        },
        {
          id: 3,
          category: "simple",
          title: "Simple Overall Comparison (Previous)",
          description: "Previous overall performance visualization",
          image: "/evaluation_results/Simple%20Test/simple_overall_20250312_174016.png",
          date: "March 12, 2025"
        },
        {
          id: 4,
          category: "simple",
          title: "Simple Detailed Comparison (Previous)",
          description: "Previous detailed comparison across metrics",
          image: "/evaluation_results/Simple%20Test/simple_comparison_20250312_174016.png",
          date: "March 12, 2025"
        },
        // Comprehensive evaluation results
        {
          id: 5,
          category: "comprehensive",
          title: "Comprehensive Comparison (Latest)",
          description: "Latest comprehensive evaluation across all tasks and models",
          image: "/evaluation_results/comprehensive_comparison_20250314_172750.png",
          date: "March 14, 2025"
        },
        {
          id: 6,
          category: "comprehensive",
          title: "Comprehensive Comparison (Previous)",
          description: "Previous comprehensive evaluation across all tasks and models",
          image: "/evaluation_results/comprehensive_comparison_20250314_161746.png",
          date: "March 14, 2025"
        },
        {
          id: 7,
          category: "comprehensive",
          title: "QA Task Comparison",
          description: "Comparison of model performance on Question Answering tasks",
          image: "/evaluation_results/qa_comparison_20250314_154031.png", 
          date: "March 14, 2025"
        },
        {
          id: 8,
          category: "comprehensive",
          title: "QA Task Bar Chart",
          description: "Bar chart visualization of Question Answering performance metrics",
          image: "/evaluation_results/qa_comparison_bars_20250314_154031.png",
          date: "March 14, 2025"
        },
        // Anthropic Vs OpenAI models results
        {
          id: 9,
          category: "claudevsgpt",
          title: "Accuracy Comparison by Task",
          description: "Comparison of accuracy between OpenAI and Anthropic models across different task types",
          image: "/evaluation_results/ClaudeVGpt/accuracy_comparison_20250328_150449.png",
          date: "March 28, 2025"
        },
        {
          id: 10,
          category: "claudevsgpt",
          title: "Response Time Comparison",
          description: "Average response time comparison between OpenAI and Anthropic models by task type",
          image: "/evaluation_results/ClaudeVGpt/time_comparison_20250328_150449.png",
          date: "March 28, 2025"
        },
        {
          id: 11,
          category: "claudevsgpt",
          title: "BLEU Score Performance",
          description: "BLEU score comparison across different models and prompting techniques",
          image: "/evaluation_results/ClaudeVGpt/bleu_score_comparison_20250328_151248.png",
          date: "March 28, 2025"
        },
        {
          id: 12,
          category: "claudevsgpt",
          title: "ROUGE-1 Performance",
          description: "ROUGE-1 metric comparison between Claude and GPT models",
          image: "/evaluation_results/ClaudeVGpt/rouge1_comparison_20250328_151248.png",
          date: "March 28, 2025"
        },
        {
          id: 13,
          category: "claudevsgpt",
          title: "ROUGE-2 Performance",
          description: "ROUGE-2 metric evaluation across different models and techniques",
          image: "/evaluation_results/ClaudeVGpt/rouge2_comparison_20250328_151248.png",
          date: "March 28, 2025"
        },
        {
          id: 14,
          category: "claudevsgpt",
          title: "ROUGE-L Performance",
          description: "ROUGE-L metric comparison showing longest common subsequence matches",
          image: "/evaluation_results/ClaudeVGpt/rougeL_comparison_20250328_151248.png",
          date: "March 28, 2025"
        }
      ];
      
      setResults(allResults);
      setLoading(false);
    };

    fetchResults();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const filteredResults = () => {
    if (activeTab === 0) return results;
    if (activeTab === 1) return results.filter(r => r.category === "simple");
    if (activeTab === 2) return results.filter(r => r.category === "comprehensive");
    if (activeTab === 3) return results.filter(r => r.category === "claudevsgpt");
    if (activeTab === 4) return results.filter(r => r.title.includes("Overall") || r.title.includes("Comprehensive"));
    if (activeTab === 5) return results.filter(r => r.title.includes("Detailed") || r.title.includes("QA"));
    return results;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Navigation Bar */}
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Button 
            color="primary" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
            sx={{ mr: 2 }}
          >
            Back to Home
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            Model Evaluation Results
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ py: 4, background: "linear-gradient(to right, #f2f2f2, #e6e6e6)" }}>
        <Container maxWidth="md">
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
            AI Model Evaluation Results
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Comprehensive benchmarking of models across various tasks and evaluation methodologies.
          </Typography>
        </Container>
      </Box>

      {/* Filter Tabs */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Results" />
            <Tab label="Simple Benchmark" />
            <Tab label="Comprehensive Evaluation" />
            <Tab label="Anthropic Vs OpenAI models" />
            <Tab label="Overall Comparisons" />
            <Tab label="Detailed Breakdowns" />
          </Tabs>
        </Paper>

        {/* Results Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading evaluation results...</Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={4}>
              {filteredResults().map((result) => (
                <Grid item xs={12} md={6} key={result.id}>
                  <Card elevation={2}>
                    <CardMedia
                      component="img"
                      height="300"
                      image={result.image}
                      alt={result.title}
                      sx={{ objectFit: "contain", bgcolor: "#f9f9f9", p: 2 }}
                    />
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {result.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {result.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Generated: {result.date}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => window.open(result.image, '_blank')}
                        >
                          View Full Size
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {filteredResults().length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6">No results found for this filter.</Typography>
              </Box>
            )}
          </>
        )}
        
        {/* Explanation Section */}
        <Paper sx={{ mt: 6, p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Evaluation Approaches
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Simple Benchmark
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Direct Task Evaluation:</strong> Our simple benchmark focuses on practical, real-world tasks such as
                factual question answering, reasoning, summarization, and coding challenges.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Multi-task Assessment:</strong> Each model is evaluated across various tasks to provide a complete
                picture of capabilities across different types of applications.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Prompting Techniques:</strong> We test multiple prompting strategies to determine which approaches
                yield the best results for different models and use cases.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Comprehensive Evaluation
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Metric-based Analysis:</strong> Using established metrics including ROUGE, BLEU, and F1 scores
                to quantitatively measure model performance.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Standardized Testing:</strong> Datasets like SQuAD for question answering and CNN/DailyMail
                for summarization provide standardized evaluation benchmarks.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Advanced Techniques:</strong> Incorporating techniques like chain-of-thought prompting, 
                self-consistency, and role prompting to explore advanced capabilities.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Anthropic Vs OpenAI models
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Head-to-Head Comparison:</strong> Direct comparison between Anthropic's Claude models and OpenAI's GPT models
                across identical tasks and evaluation criteria.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Specialized Capabilities:</strong> Analysis of each model family's strengths and weaknesses in areas like
                reasoning, factual accuracy, instruction following, and creative tasks.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Performance Metrics:</strong> Detailed evaluation of response quality, generation speed, and overall
                effectiveness for different use cases and application scenarios.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          mt: 'auto',
          backgroundColor: "background.paper",
          textAlign: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Prompt App. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
} 