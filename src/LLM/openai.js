

import 'dotenv/config';  // Loads environment variables from .env
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function CreateRun(userModel = 'gpt-3.5-turbo') {
  try {
    const chatCompletion = await client.chat.completions.create({
      model: userModel,  // Replace with your chosen model (gpt-4, gpt-3.5-turbo, etc.)
      messages: [{ role: 'user', content: userPrompt }],
    });

    return chatCompletion;
  } catch (error) {
    console.error('Error during chat completion:', error);
    throw error;
  }
}

main();
