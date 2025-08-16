import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

export const errorHandler = (
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error("Error occurred:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Default error
  let status = error.status || error.statusCode || 500;
  let message = error.message || "Internal Server Error";

  // Mongoose validation error
  if (error instanceof mongoose.Error.ValidationError) {
    status = 400;
    const messages = Object.values(error.errors).map((err) => err.message);
    message = `Validation Error: ${messages.join(", ")}`;
  }

  // Mongoose duplicate key error
  if ((error as any).code === 11000) {
    status = 409;
    const field = Object.keys((error as any).keyValue)[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Mongoose cast error
  if (error instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${error.path}: ${error.value}`;
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    status = 401;
    message = "Invalid token";
  }

  if (error.name === "TokenExpiredError") {
    status = 401;
    message = "Token expired";
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === "production" && status === 500) {
    message = "Something went wrong";
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
      details: error,
    }),
  });
};
