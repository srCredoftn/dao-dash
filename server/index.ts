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
    .then(async () => {
      console.log('📊 Connected to MongoDB');
      // Initialize admin user
      await AuthServiceMongo.initializeAdminUser();
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err);
      console.log('🔄 Falling back to in-memory authentication');
    });

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

  // Use MongoDB authentication routes with fallback
  let useMongoAuth = false;

  // Test MongoDB connection
  mongoose.connection.on('connected', () => {
    useMongoAuth = true;
    console.log('🔗 MongoDB auth routes activated');
  });

  mongoose.connection.on('error', () => {
    useMongoAuth = false;
    console.log('🔗 Using in-memory auth routes (MongoDB not available)');
  });

  app.use("/api/auth", (req, res, next) => {
    if (useMongoAuth && mongoose.connection.readyState === 1) {
      // MongoDB is connected, use MongoDB routes
      authMongoRoutes(req, res, next);
    } else {
      // MongoDB not connected, use in-memory routes
      authRoutes(req, res, next);
    }
  });

  app.use("/api/comments", commentRoutes);

  return app;
}
