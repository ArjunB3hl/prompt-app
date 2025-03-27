import { useForm } from "react-hook-form";
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'; // Added imports
import axios from "axios";
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import {useEffect } from "react";
import { useNavigate } from 'react-router-dom';



export function Signup({ setIsAuthenticated, setUsername, setImageData }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await axios.get("/api/check-auth");
        if (response.data.isAuthenticated) {
          setIsAuthenticated(true);
          setUsername(response.data.username);
          
          setImageData(response.data.image);
          navigate(`/c/${response.data.currentChatGroupId}`);
          
        }
      } catch (error) {
        console.error("Error loading chatGroups:", error);
      }
    }
    checkAuth();
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({ mode: "onChange" });

  
   
  const registerOptions = {
    username: { required: "Username cannot be blank" },
    password: {
      required: "Password is required",
      minLength: {
        value: 6,
        message: "Password must be at least 6 characters",
      },
    },
    confirmPassword: {
      required: "Confirm Password is required",
      validate: (value) =>
        value === watch("password") || "The passwords do not match",
    },
  };

  const handleRegistration = async (data) => {
    try {
      // Send the form data to the `/api/signup` endpoint
      const response = await axios.post("/api/signup", {
        username: data.username,
        password: data.password,
      });

      if (response.data.message === "Registration successful") {
        console.log("Registration successful:", response.data.message);
        setIsAuthenticated(true);
        setUsername(response.data.username);
        navigate(`/c/${response.data.chatGroupId}`);
       
      
        // Optionally, redirect the user or auto-login
      }
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const handleError = (errors) => {
    // Optionally handle form errors here
  };

  // Theme definition from Home.jsx
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
    <ThemeProvider theme={theme}> {/* Added ThemeProvider */}
      <CssBaseline /> {/* Added CssBaseline */}
      {/* Apply background color to the body or a full-height container */}
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm" sx={{ mt: { xs: 4, sm: 8 }, mb: { xs: 4, sm: 8 } }}> {/* Adjusted margins */}
          <Paper elevation={3} sx={{ p: 4, bgcolor: 'background.paper' }}> {/* Use theme paper color */}
            <Typography variant="h4" align="center" gutterBottom>
          Sign Up
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit(handleRegistration, handleError)}
          noValidate
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3, // Vertical spacing between items
          }}
        >
          <TextField
            id="username-input"
            placeholder="Enter your username"
            label="Username"
            variant="outlined"
            {...register("username", registerOptions.username)}
            error={!!errors.username}
            helperText={errors?.username?.message}
            fullWidth
          />

          <TextField
            id="password-input"
            type="password"
            placeholder="Enter your password"
            label="Password"
            variant="outlined"
            {...register("password", registerOptions.password)}
            error={!!errors.password}
            helperText={errors?.password?.message}
            fullWidth
          />

          <TextField
            id="confirm-password-input"
            type="password"
            placeholder="Confirm your password"
            label="Confirm Password"
            variant="outlined"
            {...register("confirmPassword", registerOptions.confirmPassword)}
            error={!!errors.confirmPassword}
            helperText={errors?.confirmPassword?.message}
            fullWidth
          />

          <Button type="submit" variant="contained" color="primary">
            Register
          </Button>
        </Box>
        
        <Box sx={{ mt: 2 }} />
       
        <Button 
          variant="outlined" 
          fullWidth
          href="/auth/google?action=signup"

          startIcon={
            <Box component="img" 
              src="https://developers.google.com/identity/images/g-logo.png" 
              alt="Google logo"
              sx={{ width: 18, height: 18 }}
            />
          }
          sx={{ 
            textTransform: 'none',
            borderColor: '#DADCE0',
            color: 'text.primary',
            '&:hover': {
              borderColor: '#DADCE0',
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          Continue with Google
        </Button>
        <Typography sx={{ mt: 2, textAlign: "center", width: "100%" }}>
          Already have an account?{" "}
          <Link href="/login" underline="hover">
            Login
          </Link>
        </Typography>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
