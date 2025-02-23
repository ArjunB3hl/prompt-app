import React from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";



export function CardCont({ }) {
return(
<div
            style={{
              display: "flex",
              height: "40vh",
              flexWrap: "wrap",
              width: "100vh",
              marginTop: 150,
              marginLeft: "auto",
              marginRight: "auto",
              justifyContent: "center",
            }}
            >
            <Card
              sx={{
              width: "40vh",
              height: "20vh",
              mt: 2,
              mr: 3,
              borderRadius: "16px",
              
              
              border: `1px solid`, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                 
                >
                  Capabilities
                </Typography>
                <Typography
                  variant="body2"
                 
                >
                  Remembers what you've said and uses it to generate responses
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card
            sx={{
              width: "40vh",
              height: "20vh",
              mt: 2,
              mr: 3,
              borderRadius: "16px",
             
              border: `1px solid `, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  
                >
                  Limitations
                </Typography>
                <Typography
                  variant="body2"
                  
                >
                  May not always provide accurate or relevant responses
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card
            sx={{
              width: "40vh",
              height: "10vh",
              mt: 2,
              mr: 3,
              borderRadius: "16px",
              
              border: `1px solid `, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
              
                <Typography
                  variant="body2"
                 
                >
                  Allows users to provide follow-up connections
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card
            sx={{
              width: "40vh",
              height: "10vh",
              mt: 2,
              mr: 3,
              borderRadius: "16px",
              border: `1px solid `, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
              
                <Typography
                  variant="body2"
                >
                 May occasionally provide harmful or biased responses
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card
            sx={{
              width: "40vh",
              height: "10vh",
              mt: 2,
              mr: 3,
              borderRadius: "16px",
              
              border: `1px solid `, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
            
                <Typography
                  variant="body2"
                >
                  trained to decline to provide information on inappropriate topics
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card
            sx={{
              width: "40vh",
              height: "10vh",
              mt: 2,
              mr: 3,
              borderRadius: "16px",
              border: `1px solid `, // Card border
            }}
          >
            <CardActionArea>
              <CardContent>
            
                <Typography
                  variant="body2"
                  
                >
                  Limited knowlegde of the world after Oct 2024
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </div>



        );

}