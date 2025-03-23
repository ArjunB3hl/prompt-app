import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function CardCont({ username }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
        padding: "0 20px",
      }}
    >
      <Typography
        variant="h2"
        sx={{
          fontWeight: 700,
          background: "linear-gradient(45deg, #FF6B6B, #4ECDC4)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          marginBottom: 2,
        }}
      >
        Hello {username}!
      </Typography>
      <Typography
        variant="h4"
        sx={{
          maxWidth: 800,
          background: "linear-gradient(45deg, #6c5ce7, #a8e6cf)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          lineHeight: 1.5,
        }}
      >
        Welcome to LLM Analyzer, where you can explore and interact with prompts in 
        exciting new ways.
      </Typography>
    </Box>
  );
}