import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { handleDemo } from "./routes/demo";
import daoRoutes from "./routes/dao-simple";
import authRoutes from "./routes/auth"; // In-memory fallback
import authMongoRoutes from "./routes/auth-mongo"; // MongoDB routes (corrected import)
import commentRoutes from "./routes/comments";
import { AuthServiceMongo } from "./services/authServiceMongo";

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

  // Use MongoDB authentication routes if available, fallback to in-memory
  try {
    app.use("/api/auth", authMongoRoutes);
    console.log('📊 Using MongoDB authentication routes');
  } catch (error) {
    console.warn('⚠️ MongoDB routes failed, falling back to in-memory auth:', error.message);
    app.use("/api/auth", authRoutes);
  }

  app.use("/api/comments", commentRoutes);

  return app;
}
