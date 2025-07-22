import express from "express";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse";
import { formatReplyForWhatsApp, reply } from "../services/conversation";
import rateLimiter from "../services/rateLimiter";

const router = express.Router();

router.post("/incoming", rateLimiter, async (req, res) => {
  try {
    const message = req.body;
    if (!message?.From || !message?.Body) {
      throw new Error("Invalid Twilio message format");
    }

    const twiml = new MessagingResponse();
    const aiReply = await reply(message.From, message.Body);
    
    // Format for better WhatsApp display
    const formattedReply = formatReplyForWhatsApp(aiReply);
    
    twiml.message(formattedReply);
    res.status(200).type("text/xml").end(twiml.toString());

  } catch (err: any) {
    console.error("Webhook Error:", err.stack);
    res.status(500).json({ error: "Failed to process message" });
  }
});

export default router;