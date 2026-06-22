import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server/apiRoutes.ts";
import { initializeDiscordBot } from "./server/discordBot.ts";

const app = express();
const PORT = 3000;

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Anti-Crash Safeguard] Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Anti-Crash Safeguard] Uncaught Exception thrown:", err);
});

app.use(express.json());

app.use("/api", apiRouter);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express and Vite Server running on http://localhost:${PORT}`);
    
    // Auto initiate bot on startup!
    initializeDiscordBot().catch((e) => {
      console.log("[Discord Bot Info] Handled auto-start trigger on boot. Awaiting token configuration details...", e?.message || e);
    });
  });
}

startServer().catch((err) => {
  console.error("Fatal boot failure inside custom Express server: ", err);
});
