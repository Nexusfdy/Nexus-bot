import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server/apiRoutes.ts";
import { initializeDiscordBot } from "./server/discordBot.ts";
import { loadServerState } from "./server/discordState.ts";
import helmet from "helmet";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security HTTP Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabling CSP for Vite dev environment compatibility if needed
}));

// Centralized Request Logging
app.use(morgan("combined"));

// Apply rate limiting to all /api routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // Limit each IP to 3000 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Terlalu banyak request (Rate limit exceeded), silakan coba lagi setelah 15 menit." }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Anti-Crash Safeguard] Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Anti-Crash Safeguard] Uncaught Exception thrown:", err);
});

app.use(express.json());

app.use("/api", apiLimiter, apiRouter);

async function startServer() {
  loadServerState();

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

  // Centralized Error Handling Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[Centralized Error Logger] ${req.method} ${req.url}`, err.stack);
    res.status(err.status || 500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message
    });
  });

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
