import express from "express";
import multer from "multer";
import { getDocuments, storeDocument, storeDocumentChunks, updateDocumentStatus } from "../services/db";
import { processFile } from "../services/fileProcessor";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// This function runs the long process in the background
const processDocumentInBackground = async (file: any, documentId: string) => {
  try {
    const embeddings = await processFile(file);
    console.log(`File processed: ${file.originalname}, Chunks: ${embeddings.length}`);
    
    await storeDocumentChunks(documentId, embeddings);
    await updateDocumentStatus(documentId, 'completed', embeddings.length);
    console.log(`Successfully processed and stored document: ${file.originalname}`);
  } catch (err: any) {
    console.error(`Background processing error for ${file.originalname}:`, err.stack);
    await updateDocumentStatus(documentId, 'failed');
  }
};

// File upload endpoint now responds immediately
router.post("/", upload.single("file"), async (req: any, res: any) => {
  try {
    const { originalname, mimetype } = req.file;
    
    // 1. Immediately create a document record with "processing" status
    const document = await storeDocument(originalname, mimetype, 0); // Start with 0 chunks
    if (!document) {
      throw new Error("Failed to create initial document record.");
    }

    // 2. Start the long-running process but don't wait for it to finish
    processDocumentInBackground(req.file, document.id);

    // 3. Respond to the user immediately
    res.status(202).json({ success: true, message: "File upload accepted and is being processed." });

  } catch (err: any) {
    console.error("Upload Error:", err.stack);
    res.status(500).json({ error: "Failed to start document processing." });
  }
});

// Document metadata endpoint (accessible as GET /documents due to server.ts routing)
router.get("/", async (req: any, res: any) => {
  try {
    const documents = await getDocuments();
    res.json(documents);
  } catch (err: any) {
    console.error("Documents Error:", err.stack);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

export default router;