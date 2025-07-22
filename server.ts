import cors from "cors";
import express from "express";

// Import routes
import documentRoutes from "./routes/documents";
import webhookRoutes from "./routes/webhook";

const app = express();

// Middleware
app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use("/", webhookRoutes);
app.use("/documents", documentRoutes); // for GET /documents

// Health check endpoint
app.get("/ping", (_, res) => res.send("OK"));

app.listen(3000, () => {
  console.log("Express server listening on port 3000");
});