import fs from "fs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import mammoth from "mammoth";
import pdf from "pdf-parse";
import { textSplitterConfig } from "../config/constants";
//import { createEmbedding } from "../config/openai";
import { createEmbedding } from "../config/google"; // Import Google embedding function


export async function extractTextFromFile(file: any) {
  const { originalname, mimetype, path } = file;
  let text;

  if (mimetype === "application/pdf") {
    const dataBuffer = fs.readFileSync(path);
    text = (await pdf(dataBuffer)).text;
  } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ path });
    text = result.value;
  } else if (mimetype === "text/plain") {
    text = fs.readFileSync(path, "utf-8");
  } else {
    throw new Error("Unsupported file type");
  }

  return text;
}

export async function processTextToEmbeddings(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: textSplitterConfig.chunkSize,
    chunkOverlap: textSplitterConfig.chunkOverlap
  });

  const chunks = await splitter.createDocuments([text]);
  const allEmbeddings = [];
  const batchSize = 15; // Process 15 chunks in parallel (safer limit)

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batchChunks = chunks.slice(i, i + batchSize);
    
    const batchEmbeddings = await Promise.all(
      batchChunks.map(async (chunk) => {
        const embedding = await createEmbedding(chunk.pageContent);
        return {
          content: chunk.pageContent,
          embedding: embedding,
        };
      })
    );

    allEmbeddings.push(...batchEmbeddings);
    console.log(`Processed batch ${i / batchSize + 1} of ${Math.ceil(chunks.length / batchSize)}`);
  }

  return allEmbeddings;
}

export async function processFile(file: any) {
  const text = await extractTextFromFile(file);
  const embeddings = await processTextToEmbeddings(text);
  return embeddings;
}

