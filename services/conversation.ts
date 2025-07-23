import { systemMessage } from "../config/constants";
import { createEmbedding, generateText } from "../config/google";
import { findNearestMatch, logPartnerInteraction } from "./db";

// Module-level store for conversation history
const conversationStore: Map<string, { role: string; content: string }[]> = new Map();

export async function reply(phoneNumber: string, msg: string) {
  if (!conversationStore.has(phoneNumber)) {
    conversationStore.set(phoneNumber, [systemMessage]);
  }

  const conversation = conversationStore.get(phoneNumber);
  const embedding = await createEmbedding(msg);
  const chunks = await findNearestMatch(embedding);

  let userMessageContent = msg;
  if (chunks && chunks.length > 0) {
    userMessageContent = `Context: ${chunks[0].content}\n\nQuestion: ${msg}`;
  }

  conversation?.push({
    role: "user",
    content: userMessageContent
  });

  // Using Google Gemini for text generation
  const prompt = conversation?.map(m => `${m.role}: ${m.content}`).join("\n");
  const aiReply = await generateText(prompt || "");

  // Audit logging
  await logPartnerInteraction(phoneNumber, msg, aiReply);

  return aiReply;
}

export function formatReplyForWhatsApp(aiReply: string): string {
  return aiReply
    .replace(/\n{2,}/g, '\n')
    .replace(/([•-])/g, '\n$1');
}
