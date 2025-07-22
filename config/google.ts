import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the Google AI client with the API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Get the specific models for embedding and text generation
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
const generativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Creates a numerical embedding for a given text using the "embedding-001" model.
 * @param text The text to embed.
 * @returns A promise that resolves to an array of numbers representing the embedding.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
  const embedding = result.embedding;
  return embedding.values;
}

/**
 * Generates text based on a given prompt using the "gemini-1.5-flash" model.
 * @param prompt The prompt to generate text from.
 * @returns A promise that resolves to the generated text as a string.
 */
export async function generateText(prompt: string): Promise<string> {
  const result = await generativeModel.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
