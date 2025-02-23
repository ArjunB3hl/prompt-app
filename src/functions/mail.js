import { EventEmitter } from 'events';
import { google } from 'googleapis';
import "dotenv/config"; // Loads environment variables from .env

class EventHandlerMail extends EventEmitter {
  constructor(client, sseRes, subRunPromises, tokens) {
    super();
    this.client = client;
    this.sseRes = sseRes; // The SSE response, so you can write events
    this.subRunPromises = subRunPromises; // Reference to the array in the route
    this.tokens = tokens; // Reference to the tokens in the route
    this.tempObj = {
        promptTokens: 0,
        completionTokens: 0,
        aiMessage: "",


    }; // Initialize the property to store the AI message

     // Initialize OAuth2 Client
     const config = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        // This should match one of your approved JavaScript origins or redirect URIs
        redirect_uri: process.env.REDIRECT_URI,
      };
      
      
    
     this.oauth2Client = new google.auth.OAuth2(config.client_id,
        config.client_secret,
        config.redirect_uri);
     this.oauth2Client.setCredentials(tokens);
 
     // Initialize Gmail API client
     this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
  }

  async onEvent(event) {
    try {
      // Check for required action events
      if (event.event === "thread.run.requires_action") {
        // Capture the promise returned by handleRequiresAction
        const subRunPromise = this.handleRequiresAction(
          event.data,
          event.data.id,
          event.data.thread_id
        );
        // Add this promise to the array so that the route knows to wait for it.
        this.subRunPromises.push(subRunPromise);
      }
    } catch (error) {
      console.error("Error handling event:", error);
    }
  }

  async handleRequiresAction(data, runId, threadId) {
    try {
      const toolCalls = data.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = await Promise.all(
            toolCalls.map(async (toolCall) => {
              console.log("Processing tool call: ", toolCall);
              const parsedArgs = JSON.parse(toolCall.function.arguments);
              const { instruction, email, emailContent } = parsedArgs;
      
              let output;
              if (instruction === "Write") {
                console.log("writing email to:", email);
                output = await this.sendEmail(email, "Assistant Response", emailContent);
              } else if (instruction === "Read") {
                console.log("reading email from:", email);
                output = await this.readEmail(email);
              } else {
                output = "Invalid instruction.";
              }
      
              // Return the final object for this tool call
              return {
                tool_call_id: toolCall.id,
                output,
              };
            })
          );
      // Return the promise from submitToolOutputs so it can be awaited later.
      return this.submitToolOutputs(toolOutputs, runId, threadId);
    } catch (error) {
      console.error("Error processing required action:", error);
    }
  }

  async submitToolOutputs(toolOutputs, runId, threadId) {
    try {
      // Use the submitToolOutputsStream helper
      const stream = this.client.beta.threads.runs.submitToolOutputsStream(
        threadId,
        runId,
        { tool_outputs: toolOutputs }
      );
      for await (const event of stream) {
        
        if (event.event === "thread.message.delta") {
          const content = event.data.delta.content?.[0]?.text?.value;
          if (content) {
            // Append the content to our instance property
            this.tempObj.aiMessage += content;
            // Write to the SSE response
            this.sseRes.write(`data: ${JSON.stringify({ content })}\n\n`);
          }

        }
        if (event.event === "thread.run.completed") {
          this.tempObj.promptTokens = event.data.usage.prompt_tokens;
          this.tempObj.completionTokens = event.data.usage.completion_tokens;
        }
      }
      // Optionally, you can emit an event when the AI message is complete:
      this.emit("aiMessageComplete", this.tempObj.aiMessage);
      return this.tempObj;
    } catch (error) {
      console.error("Error submitting tool outputs:", error);
    }
  }

  // Helper function to send emails
  async sendEmail(to, subject, body) {
    try {
        const raw = this.makeBody(to, subject, body);
        const res = await this.gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: raw,
            },
        });
        console.log("Email sent:", res.data);
        return `Email sent successfully! Message ID: ${res.data.id}`; // Success message
      } catch (error) {
        console.error("Error sending email:", error);
        throw new Error(`Failed to send email: ${error.message}`); // More informative error
      }
}
  makeBody(to, subject, body) {
      const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      body,
      ].join('\r\n');
      const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
      return encodedMessage;
  }

// Helper function to read a specific email by ID
async readEmail(emailId) {
  try {

    // First, list messages for that recipient
const listRes = await this.gmail.users.messages.list({
    userId: 'me',
    q: `from:${emailId}`,
    maxResults: 1,
  });
  
  if (!listRes.data.messages || listRes.data.messages.length === 0) {
    return "No emails found.";
  }
  
  const latestMessageId = listRes.data.messages[0].id;
  
  // Now, fetch the email using the valid message ID
  const res = await this.gmail.users.messages.get({
    userId: 'me',
    id: latestMessageId,
    format: 'full',
  });
   

    const message = res.data;
    if (!message) {
      return "Email not found.";
    }
      // Extract relevant parts (safely handle missing data)
      const headers = message.payload.headers;
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const snippet = message.snippet || 'No Snippet'; // Use snippet

      // Mark as read after processing (optional, but good practice)
        await this.gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          requestBody: {
            removeLabelIds: ['UNREAD'], // Remove the UNREAD label
          },
        });

    return `From: ${from}\nSubject: ${subject}\nSnippet: ${snippet}\n---\n`; // Return a formatted string

  } catch (error) {
    console.error("Error reading email:", error);
    throw new Error(`Failed to read email: ${error.message}`); // More informative error
  }
}
}

export default EventHandlerMail;
