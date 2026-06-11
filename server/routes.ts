import { Router } from "express";
import { authMiddleware } from "./middleware/auth";
import { apiLimiter } from "./middleware/rateLimiter";
import { generateAnalogy } from "./services/aiService";
import { GOOGLE_CLIENT_ID } from "./config";

const router = Router();

router.post("/analogize", authMiddleware, apiLimiter, async (req: any, res: any) => {
  try {
    const { concept, lang = "id" } = req.body;
    if (!concept) {
      return res.status(400).json({ error: "Concept is required" });
    }

    const parsedJSON = await generateAnalogy(concept, lang);
    res.json(parsedJSON);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to generate analogy" });
  }
});

router.get("/config", (req, res) => {
  res.json({
    googleClientId: GOOGLE_CLIENT_ID,
  });
});

export default router;
