import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Fade, Skeleton, LinearProgress } from '@mui/material';

export function LoadingChat({ themeMode }) {
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef(null);
  
  const loadingMessages = [
    "Loading chat...",
    "Retrieving messages...",
    "Almost there..."
  ];

  useEffect(() => {
    // Simulate loading steps
    const stepTimer = setTimeout(() => {
      if (loadingStep < loadingMessages.length - 1) {
        setLoadingStep(loadingStep + 1);
      }
    }, 1200);
    
    return () => clearTimeout(stepTimer);
  }, [loadingStep, loadingMessages.length]);

  useEffect(() => {
    // Progress bar animation
    progressTimerRef.current = setInterval(() => {
      setProgress((oldProgress) => {
        // When we reach 100%, clear the interval
        if (oldProgress >= 100) {
          if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
          }
          return 100;
        }
        
        // Calculate the next progress value
        // Speed up progress as we get closer to completion
        const diff = loadingStep === 0 ? 5 : loadingStep === 1 ? 8 : 12;
        return Math.min(oldProgress + diff * Math.random(), 100);
      });
    }, 500);
    
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [loadingStep]);

  return (
    <Fade in={true} timeout={500}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 200px)',
          width: '100%',
          backgroundColor: themeMode === 'dark' ? '#121212' : '#f5f5f5',
        }}
      >
        {/* Horizontal progress bar */}
        <Box sx={{ width: '50%', mb: 4 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{
              height: 6,
              borderRadius: 3,
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor: themeMode === 'dark' ? '#fff' : '#1976d2',
              },
              backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}
          />
        </Box>
        
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3, 
            color: themeMode === 'dark' ? '#fff' : '#000',
            fontWeight: 'medium',
            opacity: 0.8
          }}
        >
          {loadingMessages[loadingStep]}
        </Typography>
        
        {/* Message skeleton placeholders */}
        <Box 
          sx={{ 
            width: '65vw', 
            mt: 2,
            opacity: loadingStep > 0 ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }}
        >
          <Skeleton 
            variant="rounded" 
            width="40%" 
            height={60} 
            sx={{ 
              mb: 2, 
              ml: 'auto',
              bgcolor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }} 
          />
          <Skeleton 
            variant="rounded" 
            width="70%" 
            height={100} 
            sx={{ 
              mb: 2,
              bgcolor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }} 
          />
          <Skeleton 
            variant="rounded" 
            width="50%" 
            height={80} 
            sx={{ 
              mb: 2, 
              ml: 'auto',
              bgcolor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              opacity: loadingStep > 1 ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out'
            }} 
          />
        </Box>
      </Box>
    </Fade>
  );
}
