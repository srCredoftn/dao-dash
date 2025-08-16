import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService.js";
import type { AuthUser } from "../../../shared/dao.js";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Middleware to authenticate user
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await AuthService.getUserByToken(token);

    if (!user) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

// Middleware to require admin role
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
};

// Middleware to require specific roles
export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        error: "Insufficient permissions",
        required: roles,
        current: req.user?.role || "none",
      });
      return;
    }

    next();
  };
};

// Middleware to check if user owns resource or is admin
export const requireOwnershipOrAdmin = (userIdField: string = "userId") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];

    if (req.user.role === "admin" || req.user.id === resourceUserId) {
      next();
      return;
    }

    res.status(403).json({ error: "Access denied" });
  };
};
