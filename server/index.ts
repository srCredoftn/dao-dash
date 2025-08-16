import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { handleDemo } from "./routes/demo";
import daoRoutes from "./routes/dao-simple";
// Use MongoDB backend routes instead of in-memory routes
// import authRoutes from "./routes/auth";
import commentRoutes from "./routes/comments";

export function createServer() {
  const app = express();

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dao-management';
  mongoose.connect(mongoUri)
    .then(() => console.log('📊 Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // API routes
  app.use("/api/dao", daoRoutes);
  // app.use("/api/auth", authRoutes); // Using in-memory routes for now
  app.use("/api/comments", commentRoutes);

  // Proxy to MongoDB backend for auth routes
  app.use("/api/auth", (req, res, next) => {
    // For now, we'll use a simple proxy or you can set up a proper proxy
    // This is a placeholder - you might want to use http-proxy-middleware
    console.log('Auth route proxied:', req.method, req.path);
    next();
  });

  return app;
}
