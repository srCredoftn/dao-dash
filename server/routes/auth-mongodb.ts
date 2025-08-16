import express from "express";
import { z } from "zod";

// Import MongoDB services (we'll create these)
import { AuthService } from "../../backend/src/services/authService.js";
import { EmailService } from "../../backend/src/services/emailService.js";
import type { LoginCredentials, UserRole } from "@shared/dao";

const router = express.Router();

// Initialize EmailService
// EmailService.initialize();

// Middleware to handle async routes
const asyncHandler =
  (fn: Function) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  role: z.enum(["admin", "user", "viewer"] as const),
});

// Authentication middleware
const authenticate = async (
  req: any,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);
    const user = await AuthService.getUserByToken(token);

    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

// Admin middleware
const requireAdmin = (
  req: any,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Routes
router.post(
  "/login",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const authResponse = await AuthService.login(validation.data);
    res.json(authResponse);
  }),
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: any, res: express.Response) => {
    res.json({ user: req.user });
  }),
);

router.get(
  "/users",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const users = await AuthService.getAllUsers();
    res.json(users);
  }),
);

router.post(
  "/users",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const result = await AuthService.createUser(validation.data);
    res.status(201).json({
      user: result.user,
      temporaryPassword: result.temporaryPassword,
      message:
        "User created successfully. Temporary password has been sent by email.",
    });
  }),
);

router.put(
  "/users/:id/role",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["admin", "user", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Valid role is required" });
    }

    const updatedUser = await AuthService.updateUserRole(id, role as UserRole);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  }),
);

router.delete(
  "/users/:id",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: any, res: express.Response) => {
    const { id } = req.params;

    if (req.user?.id === id) {
      return res
        .status(400)
        .json({ error: "Cannot deactivate your own account" });
    }

    const deactivated = await AuthService.deactivateUser(id);
    if (!deactivated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deactivated successfully" });
  }),
);

router.post(
  "/change-password",
  authenticate,
  asyncHandler(async (req: any, res: express.Response) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const success = await AuthService.changePassword(req.user.id, newPassword);
    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Password changed successfully" });
  }),
);

router.put(
  "/profile",
  authenticate,
  asyncHandler(async (req: any, res: express.Response) => {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const updatedUser = await AuthService.updateProfile(req.user.id, {
      name,
      email,
    });
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const authUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    };

    res.json(authUser);
  }),
);

router.post(
  "/forgot-password",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { email } = req.body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const token = await AuthService.generateResetToken(email);

    res.json({
      message: "Si cet email existe, un code de réinitialisation a été envoyé.",
      ...(process.env.NODE_ENV === "development" &&
        token && { developmentToken: token }),
    });
  }),
);

router.post(
  "/verify-reset-token",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: "Email and token are required" });
    }

    const isValid = await AuthService.verifyResetToken(token, email);
    if (!isValid) {
      return res.status(400).json({ error: "Code invalide ou expiré" });
    }

    res.json({ message: "Code vérifié avec succès" });
  }),
);

router.post(
  "/reset-password",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, token, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const success = await AuthService.resetPasswordWithToken(
      token,
      email,
      newPassword,
    );
    if (!success) {
      return res.status(400).json({ error: "Code invalide ou expiré" });
    }

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  }),
);

export default router;
