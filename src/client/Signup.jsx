import { useForm } from "react-hook-form";
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import axios from "axios";
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { use, useEffect } from "react";



export function Signup({ setIsAuthenticated, setUsername, setCurrentChatGroupId, setImageData }) {
  
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await axios.get("/api/check-auth");
        if (response.data.isAuthenticated) {
          setIsAuthenticated(true);
          localStorage.setItem("isAuthenticated", true);
          localStorage.setItem('currentChatGroupId', response.data.chatGroupId);
          
          setUsername(response.data.username);
          console.log("response.data.chatGroupId", response.data.currentChatGroupId);
          setCurrentChatGroupId(response.data.currentChatGroupId);
          setImageData(response.data.image);
         
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
        setCurrentChatGroupId(response.data.chatGroupId);
        localStorage.setItem("isAuthenticated", true);
        localStorage.setItem('currentChatGroupId', response.data.chatGroupId);
        // Optionally, redirect the user or auto-login
      }
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const handleError = (errors) => {
    // Optionally handle form errors here
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
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
        <Typography sx={{ mt: 2, textAlign: "center", width: "100%" }}>
          Already have an account?{" "}
          <Link href="/login" underline="hover">
            Login
          </Link>
        </Typography>
         <Typography sx={{ mt: 2, textAlign: "center", width: "100%" }}>
          Or sign up with{" "}
          <Link href="/auth/google" underline="hover">
            Google
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}