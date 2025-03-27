import "dotenv/config"; // Loads environment variables from .env
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.responses.create({
  model: "gpt-4o",
  tools: [ { type: "web_search_preview" } ],
  input: "What was a positive news story from today?",
});

console.log(response.output_text);