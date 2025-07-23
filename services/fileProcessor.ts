import fs from "fs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import mammoth from "mammoth";
import pdf from "pdf-parse";
import { textSplitterConfig } from "../config/constants";
import { createEmbedding } from "../config/google";
import { supabase } from "../config/supabase";
import { Document } from "langchain/document";
import pRetry from "p-retry";
import pLimit from "p-limit";

export async function extractTextFromFile(file: any) {
  const { mimetype, path } = file;
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

// Optimized embedding + insertion function
export async function processAndInsertEmbeddingsInBatches(documentId: string, textChunks: Document[]) {
  const embeddingBatchSize = 15;
  const dbInsertBatchSize = 100;
  const concurrencyLimit = 5;

  const dbInsertQueue = [];
  const dbInsertPromises: Promise<any>[] = [];
  const limit = pLimit(concurrencyLimit);

  for (let i = 0; i < textChunks.length; i += embeddingBatchSize) {
    const batch = textChunks.slice(i, i + embeddingBatchSize);
    console.time(`Embedding batch ${i / embeddingBatchSize + 1}`);

    const embeddings = await Promise.all(
      batch.map(chunk =>
        limit(async () => {
          const cleanContent = chunk.pageContent.replace(/\u0000/g, "");
          const embeddingVector = await pRetry(() => createEmbedding(cleanContent), { retries: 3 });
          return {
            document_id: documentId,
            content: cleanContent,
            embedding: embeddingVector,
          };
        })
      )
    );

    console.timeEnd(`Embedding batch ${i / embeddingBatchSize + 1}`);
    dbInsertQueue.push(...embeddings);

    if (dbInsertQueue.length >= dbInsertBatchSize) {
      const batchToInsert = dbInsertQueue.splice(0, dbInsertBatchSize);
      console.log(`Queueing batch of ${batchToInsert.length} for DB insertion.`);
      dbInsertPromises.push(Promise.resolve(supabase.from("document_chunks").insert(batchToInsert).then(res => res)));
    }
  }

  if (dbInsertQueue.length > 0) {
    console.log(`Queueing final batch of ${dbInsertQueue.length} for DB insertion.`);
    dbInsertPromises.push(Promise.resolve(supabase.from("document_chunks").insert(dbInsertQueue).then(res => res)));
  }

  console.log("Waiting for all database insertions to complete...");
  const results = await Promise.allSettled(dbInsertPromises);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Database insertion error:", result.reason);
      throw new Error("Some database insertions failed. Check logs.");
    }
    if (result.status === "fulfilled" && result.value.error) {
      console.error("Database insertion Supabase error:", result.value.error);
      throw new Error(`Failed to insert document chunks: ${result.value.error.message}`);
    }
  }

  console.log("All database insertions are complete.");
  return textChunks.length;
}
