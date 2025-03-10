import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Paper,
  Grid,
  Avatar,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export function Home() {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const theme = createTheme({
    palette: {
      mode: "light",
      primary: {
        main: "#000", // Minimalistic black accent
      },
      background: {
        default: "#ececec", // Softer gray for overall background
        paper: "#f9f9f9", // Slightly lighter for paper sections
      },
      text: {
        primary: "#000",
        secondary: "#555",
      },
    },
    typography: {
      fontFamily: '"San Francisco", "Helvetica Neue", Arial, sans-serif',
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        {/* Navigation Bar */}
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, fontWeight: "bold" }}
            >
              Prompt App
            </Typography>
            <Button
              color="primary"
              onClick={() => handleNavigation("/login")}
              sx={{ mr: 2 }}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => handleNavigation("/signup")}
            >
              Sign Up
            </Button>
          </Toolbar>
        </AppBar>

        {/* Hero Section with Gradient */}
        <Box
          sx={{
            py: 10,
            background: "linear-gradient(to bottom right, #f2f2f2, #e6e6e6)",
          }}
        >
          <Container maxWidth="md">
            <Paper
              elevation={0}
              sx={{ textAlign: "center", p: 4, backgroundColor: "transparent" }}
            >
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                Welcome to Prompt App
              </Typography>
              <Typography variant="h6" color="text.secondary" paragraph>
                An AI-powered chat application for advanced prompt engineering.
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => handleNavigation("/signup")}
                  sx={{ mr: 2 }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  onClick={() => handleNavigation("/login")}
                >
                  Log In
                </Button>
              </Box>
            </Paper>
          </Container>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: 10, mt: 6, backgroundColor: "background.paper" }}>
          <Container maxWidth="lg">
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ fontWeight: "bold" }}
            >
              Why Choose Prompt App?
            </Typography>
            <Grid container spacing={4} sx={{ mt: 4 }}>
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="h5" gutterBottom>
                    Intuitive Design
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    A sleek, simple interface designed to make your experience
                    seamless.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="h5" gutterBottom>
                    Advanced AI
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Harness cutting-edge AI for effortless prompt engineering.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="h5" gutterBottom>
                    Secure & Reliable
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Designed with security and reliability, ensuring your data
                    is always safe.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Testimonials Section */}
        <Box sx={{ py: 10, mt: 6, backgroundColor: "#333", color: "#fff" }}>
          <Container maxWidth="lg">
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ fontWeight: "bold" }}
            >
              What Our Users Say
            </Typography>
            <Grid container spacing={4} sx={{ mt: 4 }}>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    backgroundColor: "#444",
                    color: "#fff",
                  }}
                >
                  <Avatar sx={{ margin: "0 auto", mb: 2, bgcolor: "#666" }}>
                    A
                  </Avatar>
                  <Typography variant="body1" paragraph>
                    "Prompt App has completely transformed the way I interact
                    with AI. Its design is phenomenal!"
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    Alex
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    backgroundColor: "#444",
                    color: "#fff",
                  }}
                >
                  <Avatar sx={{ margin: "0 auto", mb: 2, bgcolor: "#666" }}>
                    B
                  </Avatar>
                  <Typography variant="body1" paragraph>
                    "The intuitive layout and powerful features make prompt
                    engineering a breeze."
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    Brooke
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    backgroundColor: "#444",
                    color: "#fff",
                  }}
                >
                  <Avatar sx={{ margin: "0 auto", mb: 2, bgcolor: "#666" }}>
                    C
                  </Avatar>
                  <Typography variant="body1" paragraph>
                    "A seamless experience from start to finish, I love every
                    bit of it."
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    Chris
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 3,
            mt: 6,
            backgroundColor: "background.paper",
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Prompt App. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
