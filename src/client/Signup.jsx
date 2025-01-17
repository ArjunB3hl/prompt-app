import { useForm } from "react-hook-form";
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import axios from "axios";
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';


export function Signup( { setIsAuthenticated, setUsername, setCurrentChatGroupId } ) {

    const handleRegistration = async (data) => {
      try {
        // Send the form data to the `/api/signup` endpoint
        const response = await axios.post('/api/signup', {
          username: data.username,
          password: data.password,
        });
    
        if (response.data.message === 'Registration successful') {
          console.log('Registration successful:', response.data.message);
          setIsAuthenticated(true);
          setUsername(response.data.username);
          setCurrentChatGroupId(response.data.chatGroupId);
          // You can redirect the user to the login page or automatically log them in
          
        }
      } catch (error) {
        console.error('Registration failed:', error);
      }
    };
  
      const {
          register,
          handleSubmit,
          formState: { errors },
          watch,
      } = useForm({ mode: "onChange" });
  
  
  
      const handleError = (errors) => { };
  
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
              validate: value =>
                  value === watch('password') || "The passwords do not match",
          },
      };
  
      return (
          <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
              <Typography variant="h4" align="center" gutterBottom>
                Sign Up
              </Typography>
              <form onSubmit={handleSubmit(handleRegistration, handleError)}>
                  <TextField
                      id="username-input"
                      placeholder="username"
                      label="Username"
                      variant="outlined"
                      {...register("username", registerOptions.username)}
                      error={!!errors.username}
                      helperText={errors?.username?.message}
                  />
  
                  <TextField
                      id="password-input"
                      type="password"
                      placeholder="Password"
                      label="Password"
                      variant="outlined"
                      {...register("password", registerOptions.password)}
                      error={!!errors.password}
                      helperText={errors?.password?.message}
                  />
  
                  <TextField
                      id="confirm-password-input"
                      type="password"
                      placeholder="Confirm Password"
                      label="Confirm Password"
                      variant="outlined"
                      {...register("confirmPassword", registerOptions.confirmPassword)}
                      error={!!errors.confirmPassword}
                      helperText={errors?.confirmPassword?.message}
                  />
                  <Button type="submit" variant="contained" color="primary">
                      Register
                  </Button>
  
              </form>
              <Typography sx={{ mt: 2, textAlign: 'center', width: '100%' }}>
                  Already have an account?{' '}
                  <Link href="\login"> Login </Link>
              </Typography>
            </Paper>
          </Container>
      );
  }
  
  