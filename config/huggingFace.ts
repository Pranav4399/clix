
// Hugging Face Text Generation (replace OpenAI)
export async function generateText(prompt: string) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", // Or any other model
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        inputs: prompt,
        options: { wait_for_model: true } 
      }),
    }
  );
  return response.json();
}

export async function createEmbedding(input: string) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          source_sentence: input,
          sentences: [input]
        },
        options: { wait_for_model: true }
      }),
    }
  );

  const result = await response.json();

  if (!Array.isArray(result) || !Array.isArray(result[0])) {
    throw new Error("Failed to get valid embedding from HuggingFace: " + JSON.stringify(result));
  }

  return result[0]; // returns number[]
}