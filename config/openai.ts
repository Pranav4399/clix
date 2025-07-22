import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function createEmbedding(input: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input,
    encoding_format: "float",
  });
  return response.data[0].embedding;
}