import { searchConfig } from "../config/constants";
import { supabase } from "../config/supabase";

export async function findNearestMatch(query_embedding: number[]) {
  const { data: chunks } = await supabase.rpc("match_document_chunks", {
    query_embedding,
    match_threshold: searchConfig.match_threshold,
    match_count: searchConfig.match_count,
  });

  return chunks.length > 0 ? chunks : null;
}

export async function logPartnerInteraction(
  phoneNumber: string,
  query: string,
  response: string
) {
  await supabase.from("partner_interactions").insert({
    phone_number: phoneNumber,
    query: query,
    response: response,
    timestamp: new Date(),
  });
}

export async function storeDocument(
  originalname: string,
  mimetype: string,
  chunksCount: number
) {
  const { data: document } = await supabase
    .from("documents")
    .insert({
      name: originalname,
      type: mimetype,
      chunks: chunksCount,
      uploaded_at: new Date(),
    })
    .select();

  return document?.[0] || null;
}

export async function storeDocumentChunks(
  documentId: string,
  embeddings: Array<{ content: string; embedding: number[] }>
) {
  const batchSize = 100; // Process 100 embeddings at a time
  for (let i = 0; i < embeddings.length; i += batchSize) {
    const batch = embeddings.slice(i, i + batchSize);
    const { error } = await supabase.from("document_chunks").insert(
      batch.map((embedding) => ({
        document_id: documentId,
        content: embedding.content,
        embedding: embedding.embedding,
      }))
    );

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      throw new Error(`Failed to insert document chunks. Check logs for details.`);
    } else {
      console.log(`Successfully inserted batch ${i / batchSize + 1} of ${Math.ceil(embeddings.length / batchSize)}`);
    }
  }
}

export async function getDocuments() {
  const { data } = await supabase.from("documents").select("*").order('uploaded_at', { ascending: false });
  return data;
}

export async function updateDocumentStatus(
  documentId: string,
  status: 'completed' | 'failed',
  chunksCount?: number
) {
  const updateData: { status: string, chunks?: number } = { status };
  if (chunksCount !== undefined) {
    updateData.chunks = chunksCount;
  }

  await supabase
    .from("documents")
    .update(updateData)
    .eq("id", documentId);
}
