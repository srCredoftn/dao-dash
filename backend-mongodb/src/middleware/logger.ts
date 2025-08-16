import { Request, Response, NextFunction } from "express";

// Simple request logger middleware
export const logger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  // Store original end method
  const originalEnd = res.end;

  // Override end method to log response
  res.end = function (chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get("User-Agent") || "Unknown";
    const ip = req.ip || req.connection.remoteAddress || "Unknown";

    // Log color based on status code
    let statusColor = "\x1b[32m"; // Green for 2xx
    if (statusCode >= 300 && statusCode < 400) statusColor = "\x1b[33m"; // Yellow for 3xx
    if (statusCode >= 400 && statusCode < 500) statusColor = "\x1b[31m"; // Red for 4xx
    if (statusCode >= 500) statusColor = "\x1b[35m"; // Magenta for 5xx

    // Method color
    const methodColor =
      method === "GET"
        ? "\x1b[36m"
        : method === "POST"
          ? "\x1b[32m"
          : method === "PUT"
            ? "\x1b[33m"
            : method === "DELETE"
              ? "\x1b[31m"
              : "\x1b[37m";

    const timestamp = new Date().toISOString();

    console.log(
      `${timestamp} ${methodColor}${method}\x1b[0m ${url} ${statusColor}${statusCode}\x1b[0m ${duration}ms - ${ip}`,
    );

    // Log errors with more detail
    if (statusCode >= 400) {
      console.log(`  ↳ User-Agent: ${userAgent}`);
      if (req.body && Object.keys(req.body).length > 0) {
        console.log(`  ↳ Body:`, JSON.stringify(req.body, null, 2));
      }
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Enhanced logger for development
export const devLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`\n📥 ${timestamp}`);
  console.log(`${req.method} ${req.originalUrl}`);
  console.log(`IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`User-Agent: ${req.get("User-Agent")}`);

  if (req.headers.authorization) {
    console.log(`Auth: Bearer ***${req.headers.authorization.slice(-10)}`);
  }

  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`Body:`, JSON.stringify(req.body, null, 2));
  }

  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`Query:`, req.query);
  }

  // Store original methods
  const originalJson = res.json;
  const originalSend = res.send;

  // Override json method
  res.json = function (body) {
    const duration = Date.now() - start;
    console.log(`📤 Response (${duration}ms):`, JSON.stringify(body, null, 2));
    return originalJson.call(this, body);
  };

  // Override send method
  res.send = function (body) {
    const duration = Date.now() - start;
    console.log(`📤 Response (${duration}ms):`, body);
    return originalSend.call(this, body);
  };

  next();
};

// API metrics logger
export const metricsLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const duration = diff[0] * 1e3 + diff[1] * 1e-6; // Convert to milliseconds

    // Log metrics in JSON format for easy parsing
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: Math.round(duration * 100) / 100,
      userAgent: req.get("User-Agent"),
      ip: req.ip || req.connection.remoteAddress,
      contentLength: res.get("content-length") || 0,
    };

    console.log("METRICS:", JSON.stringify(logData));
  });

  next();
};
