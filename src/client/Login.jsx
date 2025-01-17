import { useForm } from "react-hook-form";
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import axios from "axios";
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
export function Login( { setIsAuthenticated, setUsername, setCurrentChatGroupId })  {
  
  
 

    const handleRegistration = async (data) => {
     
  
      try {
        const response = await axios.post('/api/login', { 
          username: data.username,
          password: data.password,  
        
  
        });
        if(response.data.message === 'Login successful') {
          console.log('Login successful:   ', response.data.message);
          setIsAuthenticated(true);
          setUsername(response.data.username);
          setCurrentChatGroupId(response.data.chatGroupId);
        }
        
        // Handle successful login, e.g., save token and redirect
      } catch (error) {
        console.error('Login failed:', error);
      }
    };
  
      const {
          register,
          handleSubmit,
          formState: { errors },
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
          }
      };
  
     
    
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Login
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
  
                  <Button type="submit" variant="contained" color="primary">
                      Login
                  </Button>
  
              </form>
        </Paper>
      </Container>
    );
  }
  