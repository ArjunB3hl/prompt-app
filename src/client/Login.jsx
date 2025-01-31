import { useForm } from "react-hook-form";
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import axios from "axios";
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

export function Login({ setIsAuthenticated, setUsername, setCurrentChatGroupId }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
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
  };

  const handleRegistration = async (data) => {
    try {
      const response = await axios.post('/api/login', {
        username: data.username,
        password: data.password,
      });
      if (response.data.message === 'Login successful') {
        console.log('Login successful: ', response.data.message);
        setIsAuthenticated(true);
        setUsername(response.data.username);
        setCurrentChatGroupId(response.data.chatGroupId);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleError = (errors) => {
    // Optionally handle form errors here
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Login
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit(handleRegistration, handleError)}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3, // vertical spacing between items
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

          <Button type="submit" variant="contained" color="primary" sx={{ mt: 1 }}>
            Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}