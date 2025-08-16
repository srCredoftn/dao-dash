import express from "express";
import { z } from "zod";
import { AuthService } from "../services/authService.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import type { LoginCredentials, UserRole } from "../../../shared/dao.js";

const router = express.Router();

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

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  token: z.string().length(6, "Token must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// POST /api/auth/login - User login
router.post("/login", async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const credentials: LoginCredentials = validation.data;
    const authResponse = await AuthService.login(credentials);

    if (!authResponse) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json(authResponse);
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ error: "Login failed" });
  }
});

// GET /api/auth/me - Get current user info
router.get("/me", authenticate, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error("Get user info error:", error);
    res.status(500).json({ error: "Failed to get user info" });
  }
});

// GET /api/auth/users - Get all users (admin only)
router.get("/users", authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await AuthService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
});

// POST /api/auth/users - Create new user (admin only)
router.post("/users", authenticate, requireAdmin, async (req, res) => {
  try {
    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const userData = validation.data;
    const result = await AuthService.createUser(userData);

    // Return user info and temporary password for admin to see
    res.status(201).json({
      user: result.user,
      temporaryPassword: result.temporaryPassword,
      message:
        "User created successfully. Temporary password has been sent by email.",
    });
  } catch (error) {
    console.error("Create user error:", error);
    if (error instanceof Error && error.message === "User already exists") {
      return res.status(409).json({ error: "User already exists" });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PUT /api/auth/users/:id/role - Update user role (admin only)
router.put("/users/:id/role", authenticate, requireAdmin, async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

// DELETE /api/auth/users/:id - Deactivate user (admin only)
router.delete("/users/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deactivating themselves
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
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({ error: "Failed to deactivate user" });
  }
});

// POST /api/auth/change-password - Change password
router.post("/change-password", authenticate, async (req, res) => {
  try {
    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const { newPassword } = validation.data;
    const success = await AuthService.changePassword(req.user!.id, newPassword);

    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// PUT /api/auth/profile - Update user profile
router.put("/profile", authenticate, async (req, res) => {
  try {
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const profileData = validation.data;
    const updatedUser = await AuthService.updateProfile(
      req.user!.id,
      profileData,
    );

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
});

// POST /api/auth/forgot-password - Request password reset
router.post("/forgot-password", async (req, res) => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const { email } = validation.data;
    const token = await AuthService.generateResetToken(email);

    // Always return success message for security (don't reveal if email exists)
    res.json({
      message: "Si cet email existe, un code de réinitialisation a été envoyé.",
      // For development only - remove in production
      ...(process.env.NODE_ENV === "development" &&
        token && { developmentToken: token }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process password reset request" });
  }
});

// POST /api/auth/verify-reset-token - Verify reset token
router.post("/verify-reset-token", async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: "Email and token are required" });
    }

    const isValid = await AuthService.verifyResetToken(token, email);

    if (!isValid) {
      return res.status(400).json({ error: "Code invalide ou expiré" });
    }

    res.json({ message: "Code vérifié avec succès" });
  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({ error: "Failed to verify reset token" });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post("/reset-password", async (req, res) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
    }

    const { email, token, newPassword } = validation.data;
    const success = await AuthService.resetPasswordWithToken(
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
});

export default router;
