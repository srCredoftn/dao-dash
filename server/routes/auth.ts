import express from "express";
import { AuthService } from "../services/authService";
import { authenticate, requireAdmin } from "../middleware/auth";
import type { LoginCredentials } from "@shared/dao";

const router = express.Router();

// POST /api/auth/login - User login
router.post("/login", async (req, res) => {
  try {
    const credentials: LoginCredentials = req.body;

    if (!credentials.email || !credentials.password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const authResponse = await AuthService.login(credentials);
    if (!authResponse) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json(authResponse);
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ error: error.message || "Login failed" });
  }
});

// POST /api/auth/logout - User logout
router.post("/logout", authenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7); // Remove 'Bearer ' prefix

    if (token) {
      await AuthService.logout(token);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
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
    const userData = req.body;

    if (!userData.name || !userData.email || !userData.role) {
      return res
        .status(400)
        .json({ error: "Name, email, and role are required" });
    }

    const newUser = await AuthService.createUser({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      isActive: true,
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PUT /api/auth/users/:id/role - Update user role (admin only)
router.put("/users/:id/role", authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    const updatedUser = await AuthService.updateUserRole(id, role);
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
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

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

export default router;
