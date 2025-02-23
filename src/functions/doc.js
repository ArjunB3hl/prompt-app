import { EventEmitter } from 'events';
import { google } from 'googleapis';
import "dotenv/config"; // Loads environment variables from .env

class EventHandlerDocs extends EventEmitter {
  constructor(client, sseRes, subRunPromises, tokens) {
    super();
    this.client = client;
    this.sseRes = sseRes; // SSE response object
    this.subRunPromises = subRunPromises; // Array of promises
    this.tokens = tokens; // Google API tokens
    this.tempObj = {
      promptTokens: 0,
      completionTokens: 0,
      aiMessage: "",
    };

    // Initialize OAuth2 Client
    const config = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: process.env.REDIRECT_URI,
    };

    this.oauth2Client = new google.auth.OAuth2(
      config.client_id,
      config.client_secret,
      config.redirect_uri
    );
    this.oauth2Client.setCredentials(tokens);

    // Initialize Google Docs API client
    this.docs = google.docs({ version: "v1", auth: this.oauth2Client });
  }

  async onEvent(event) {
    try {
      if (event.event === "thread.run.requires_action") {
        const subRunPromise = this.handleRequiresAction(
          event.data,
          event.data.id,
          event.data.thread_id
        );
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
          // Here, we expect the tool call to include an instruction, a title, and maybe some content.
          const { instruction, title, content } = parsedArgs;

          let output;
          if (instruction === "Create") {
            console.log("Creating new document:", title);
            output = await this.createDocument(title, content);
          } else if (instruction === "Read") {
            console.log("Reading document:", title);
            output = await this.readDocument(title);
          } else if (instruction === "Append") {
            console.log("Appending to document:", title);
            output = await this.appendToDocument(title, content);
          } else {
            output = "Invalid instruction.";
          }

          return {
            tool_call_id: toolCall.id,
            output,
          };
        })
      );

      return this.submitToolOutputs(toolOutputs, runId, threadId);
    } catch (error) {
      console.error("Error processing required action:", error);
    }
  }

  async submitToolOutputs(toolOutputs, runId, threadId) {
    try {
      const stream = this.client.beta.threads.runs.submitToolOutputsStream(
        threadId,
        runId,
        { tool_outputs: toolOutputs }
      );
      for await (const event of stream) {
        if (event.event === "thread.message.delta") {
          const content = event.data.delta.content?.[0]?.text?.value;
          if (content) {
            this.tempObj.aiMessage += content;
            this.sseRes.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
        if (event.event === "thread.run.completed") {
          this.tempObj.promptTokens = event.data.usage.prompt_tokens;
          this.tempObj.completionTokens = event.data.usage.completion_tokens;
        }
      }

      this.emit("aiMessageComplete", this.tempObj.aiMessage);
      return this.tempObj;
    } catch (error) {
      console.error("Error submitting tool outputs:", error);
    }
  }

  // ── Helper function: Find a document by title using the Drive API ──
  async findDocumentIdByTitle(title) {
    try {
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });
      const res = await drive.files.list({
        q: `name='${title}' and mimeType='application/vnd.google-apps.document' and trashed=false`,
        fields: "files(id, name)",
        spaces: "drive",
      });

      if (!res.data.files || res.data.files.length === 0) {
        throw new Error(`No document found with title: ${title}`);
      }

      return res.data.files[0].id;
    } catch (error) {
      console.error("Error finding document by title:", error);
      throw new Error(`Failed to find document: ${error.message}`);
    }
  }

  // ── Create a new Google Document ──
  async createDocument(title, content) {
    try {
      const res = await this.docs.documents.create({
        requestBody: { title: title },
      });

      const docId = res.data.documentId;
      console.log(`Created document with ID: ${docId}`);

      // Append the initial content to the new document.
      await this.appendToDocumentById(docId, content);

      return `Document created successfully! Document ID: ${docId}`;
    } catch (error) {
      console.error("Error creating document:", error);
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  // ── Read the content of an existing Google Document (by title) ──
  async readDocument(title) {
    try {
      const docId = await this.findDocumentIdByTitle(title);
      const res = await this.docs.documents.get({ documentId: docId });
      const content = res.data.body?.content || [];

      let text = "";
      content.forEach((element) => {
        if (element.paragraph && element.paragraph.elements) {
          element.paragraph.elements.forEach((elem) => {
            if (elem.textRun) {
              text += elem.textRun.content;
            }
          });
        }
      });

      return `Document Content:\n${text}`;
    } catch (error) {
      console.error("Error reading document:", error);
      throw new Error(`Failed to read document: ${error.message}`);
    }
  }

  // ── Append new content to an existing Google Document (by title) ──
  async appendToDocument(title, newText) {
    try {
      const docId = await this.findDocumentIdByTitle(title);
      return await this.appendToDocumentById(docId, newText);
    } catch (error) {
      console.error("Error appending to document:", error);
      throw new Error(`Failed to append content: ${error.message}`);
    }
  }

  // ── Helper function to append content using a document ID ──
  async appendToDocumentById(docId, newText) {
    try {
      const requests = [
        {
          insertText: {
            location: { index: 1 }, // Inserts after the first character
            text: `\n${newText}\n`,
          },
        },
      ];

      await this.docs.documents.batchUpdate({
        documentId: docId,
        requestBody: { requests: requests },
      });

      return "Content appended successfully!";
    } catch (error) {
      console.error("Error appending to document by id:", error);
      throw new Error(`Failed to append content: ${error.message}`);
    }
  }
}

export default EventHandlerDocs;
