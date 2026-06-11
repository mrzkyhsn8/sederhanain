import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import router from "./routes";
import { PORT } from "./config";

async function startServer() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(express.json());

  // Mount API router
  app.use("/api", router);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
