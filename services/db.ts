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
      status: "processing",
    })
    .select();

  return document?.[0] || null;
}



export async function getDocuments() {
  const { data } = await supabase.from("documents").select("*").order('uploaded_at', { ascending: false });
  return data;
}

export async function deleteDocumentChunks(documentId: string) {
    console.log(`Cleaning up chunks for failed document: ${documentId}`);
    const { error } = await supabase
        .from("document_chunks")
        .delete()
        .eq("document_id", documentId);

    if (error) {
        // Log this critical error, as it could mean orphaned data
        console.error(`CRITICAL: Failed to clean up chunks for document ${documentId}:`, error);
    }
}

export async function updateDocumentStatus(
  documentId: string,
  status: "completed" | "failed",
  chunksCount?: number
) {
  const updateData: { status: string; chunks?: number } = { status };
  if (chunksCount !== undefined) {
    updateData.chunks = chunksCount;
  }

  const { error } = await supabase
    .from("documents")
    .update(updateData)
    .eq("id", documentId);

  if (error) {
    console.error(`Error updating document status for id ${documentId}:`, error);
    throw new Error("Failed to update document status.");
  }
}
