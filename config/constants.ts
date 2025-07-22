// Configuration and constants
export const systemMessage = {
  role: "system",
  content: `You are a knowledgeable financial services assistant for our NBFS company partners. 
                You will be given:
                1. Context from uploaded documents (policies, procedures, product details)
                2. A partner's question
  
                Your responsibilities:
                - Provide ACCURATE, CONCISE answers using ONLY the provided context
                - For compliance questions, highlight relevant policy sections
                - For product queries, include key terms and conditions
                - If unsure, say: "This information isn't available in our documents. Please contact our partner support team" or "I'm not sure about that. Please contact our partner support team"
                - Never speculate or invent answers`,
};

export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: "Too many requests from this number. Please try again later.",
  keyGenerator: (req: any) => req.body.From, // Rate limit by WhatsApp number
};

export const textSplitterConfig = {
  chunkSize: 200,
  chunkOverlap: 15,
};

export const searchConfig = {
  match_threshold: 0.5,
  match_count: 3, // Get top 3 most relevant chunks
};

export const openaiConfig = {
  model: "gpt-4o-mini",
  max_tokens: 300,
  temperature: 0.5,
};
