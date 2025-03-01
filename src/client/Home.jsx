import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box,
  Paper,
  createTheme,
  ThemeProvider,
  CssBaseline
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const navigate = useNavigate();
  
  const handleNavigation = (path) => {
    navigate(path);
  };

  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#3f51b5',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
              Prompt App
            </Typography>
            <Button 
              color="inherit" 
              variant="outlined" 
              onClick={() => handleNavigation('/login')}
              sx={{ mr: 2 }}
            >
              Login
            </Button>
            <Button 
              color="inherit" 
              variant="contained" 
              onClick={() => handleNavigation('/signup')}
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: '#e0e0e0' } }}
            >
              Sign Up
            </Button>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="md" sx={{ mt: 8, flexGrow: 1 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom>
              Welcome to Prompt App
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              An AI-powered chat application for advanced prompt engineering
            </Typography>
            <Box sx={{ mt: 4 }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={() => handleNavigation('/signup')}
                sx={{ mr: 2 }}
              >
                Get Started
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="large"
                onClick={() => handleNavigation('/login')}
              >
                Log In
              </Button>
            </Box>
          </Paper>
        </Container>
        
        <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Prompt App. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

