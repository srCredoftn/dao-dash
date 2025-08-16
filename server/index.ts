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

  // Connect to MongoDB with timeout
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dao-management';

  // Set connection options
  const mongoOptions = {
    serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    connectTimeoutMS: 5000,
  };

  console.log('🔄 Attempting MongoDB connection...');
  mongoose.connect(mongoUri, mongoOptions)
    .then(async () => {
      console.log('📊 Connected to MongoDB at', mongoUri);
      try {
        // Initialize admin user
        await AuthServiceMongo.initializeAdminUser();
      } catch (error) {
        console.error('❌ Error initializing admin user:', error);
      }
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
      console.log('🔄 Continuing with in-memory authentication');
    });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping pong";
    res.json({ message: ping });
  });

  app.get("/api/status", (_req, res) => {
    res.json({
      status: "OK",
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      auth: mongoose.connection.readyState === 1 ? "mongodb" : "in-memory",
      timestamp: new Date().toISOString()
    });
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
