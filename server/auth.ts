import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "default_super_secret_key_nexus_admin_12345");
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "admin123");

if (process.env.NODE_ENV === "production") {
  if (!process.env.JWT_SECRET || !process.env.ADMIN_PASSWORD) {
    console.error("❌ [CRITICAL ERROR] JWT_SECRET and ADMIN_PASSWORD MUST be set in production.");
    process.exit(1);
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Allow health check, login to bypass auth
  if (req.path === "/auth/login" || req.path === "/health") {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

export const generateToken = () => {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
};
