import express from "express";
import { AuthServiceMongo } from "../services/authServiceMongo";
import type { LoginCredentials, UserRole } from "@shared/dao";

const router = express.Router();

// Middleware to handle async routes
const asyncHandler =
  (fn: Function) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

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
    const user = await AuthServiceMongo.getUserByToken(token);

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

// POST /api/auth/login - User login
router.post(
  "/login",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const credentials: LoginCredentials = req.body;

      if (!credentials.email || !credentials.password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const authResponse = await AuthServiceMongo.login(credentials);
      if (!authResponse) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json(authResponse);
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ error: error.message || "Login failed" });
    }
  }),
);

// GET /api/auth/me - Get current user info
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: any, res: express.Response) => {
    res.json({ user: req.user });
  }),
);

// GET /api/auth/users - Get all users (admin only)
router.get(
  "/users",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const users = await AuthServiceMongo.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  }),
);

// POST /api/auth/users - Create new user (admin only)
router.post(
  "/users",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { name, email, role } = req.body;

      if (!name || !email || !role) {
        return res
          .status(400)
          .json({ error: "Name, email, and role are required" });
      }

      if (!["admin", "user", "viewer"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const result = await AuthServiceMongo.createUser({
        name,
        email,
        role: role as UserRole,
      });

      res.status(201).json({
        user: result.user,
        temporaryPassword: result.temporaryPassword,
        message:
          "User created successfully. Temporary password has been generated.",
      });
    } catch (error) {
      console.error("Create user error:", error);
      if (error instanceof Error && error.message === "User already exists") {
        return res.status(409).json({ error: "User already exists" });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  }),
);

// PUT /api/auth/users/:id/role - Update user role (admin only)
router.put(
  "/users/:id/role",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !["admin", "user", "viewer"].includes(role)) {
        return res.status(400).json({ error: "Valid role is required" });
      }

      const updatedUser = await AuthServiceMongo.updateUserRole(
        id,
        role as UserRole,
      );
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  }),
);

// DELETE /api/auth/users/:id - Deactivate user (admin only)
router.delete(
  "/users/:id",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: any, res: express.Response) => {
    try {
      const { id } = req.params;

      // Prevent admin from deactivating themselves
      if (req.user?.id === id) {
        return res
          .status(400)
          .json({ error: "Cannot deactivate your own account" });
      }

      const deactivated = await AuthServiceMongo.deactivateUser(id);
      if (!deactivated) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      console.error("Deactivate user error:", error);
      res.status(500).json({ error: "Failed to deactivate user" });
    }
  }),
);

// POST /api/auth/change-password - Change password
router.post(
  "/change-password",
  authenticate,
  asyncHandler(async (req: any, res: express.Response) => {
    try {
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });
      }

      const success = await AuthServiceMongo.changePassword(
        req.user.id,
        newPassword,
      );
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  }),
);

// PUT /api/auth/profile - Update user profile
router.put(
  "/profile",
  authenticate,
  asyncHandler(async (req: any, res: express.Response) => {
    try {
      const { name, email } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const updatedUser = await AuthServiceMongo.updateProfile(req.user.id, {
        name,
        email,
      });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return updated auth user format
      const authUser = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      };

      res.json(authUser);
    } catch (error) {
      console.error("Update profile error:", error);
      if (error instanceof Error && error.message === "Email already exists") {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Failed to update profile" });
    }
  }),
);

// POST /api/auth/forgot-password - Request password reset
router.post(
  "/forgot-password",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { email } = req.body;

      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ error: "Valid email is required" });
      }

      const token = await AuthServiceMongo.generateResetToken(email);

      // Always return success message for security (don't reveal if email exists)
      res.json({
        message:
          "Si cet email existe, un code de réinitialisation a été envoyé.",
        // For development only - remove in production
        ...(process.env.NODE_ENV === "development" &&
          token && { developmentToken: token }),
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res
        .status(500)
        .json({ error: "Failed to process password reset request" });
    }
  }),
);

// POST /api/auth/verify-reset-token - Verify reset token
router.post(
  "/verify-reset-token",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { email, token } = req.body;

      if (!email || !token) {
        return res.status(400).json({ error: "Email and token are required" });
      }

      const isValid = await AuthServiceMongo.verifyResetToken(token, email);
      if (!isValid) {
        return res.status(400).json({ error: "Code invalide ou expiré" });
      }

      res.json({ message: "Code vérifié avec succès" });
    } catch (error) {
      console.error("Verify reset token error:", error);
      res.status(500).json({ error: "Failed to verify reset token" });
    }
  }),
);

// POST /api/auth/reset-password - Reset password with token
router.post(
  "/reset-password",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { email, token, newPassword } = req.body;

      if (!email || !token || !newPassword) {
        return res
          .status(400)
          .json({ error: "Email, token, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({
            error: "Le mot de passe doit contenir au moins 6 caractères",
          });
      }

      const success = await AuthServiceMongo.resetPasswordWithToken(
        token,
        email,
        newPassword,
      );
      if (!success) {
        return res.status(400).json({ error: "Code invalide ou expiré" });
      }

      res.json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  }),
);

export default router;
