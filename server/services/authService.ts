import type {
  User,
  AuthUser,
  LoginCredentials,
  AuthResponse,
  UserRole,
} from "@shared/dao";
import { SessionStore } from "../utils/sessionStore";

// In-memory user storage (in production, this would be a database)
let users: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@2snd.fr",
    role: "admin",
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: "2",
    name: "Marie Dubois",
    email: "marie.dubois@2snd.fr",
    role: "user",
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: "3",
    name: "Pierre Martin",
    email: "pierre.martin@2snd.fr",
    role: "user",
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: "4",
    name: "Sophie Laurent",
    email: "sophie.laurent@2snd.fr",
    role: "viewer",
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

// Simple password storage (in production, use proper hashing)
const passwords: Record<string, string> = {
  "admin@2snd.fr": "admin123",
  "marie.dubois@2snd.fr": "marie123",
  "pierre.martin@2snd.fr": "pierre123",
  "sophie.laurent@2snd.fr": "sophie123",
};

// Sessions are now handled by SessionStore for persistence across restarts

export class AuthService {
  // Login user
  static async login(
    credentials: LoginCredentials,
  ): Promise<AuthResponse | null> {
    const { email, password } = credentials;

    // Find user
    const user = users.find((u) => u.email === email && u.isActive);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check password
    if (passwords[email] !== password) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Create session
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    SessionStore.setSession(token, authUser);

    console.log("🔐 User logged in:", user.email, "Role:", user.role);

    return {
      user: authUser,
      token,
    };
  }

  // Logout user
  static async logout(token: string): Promise<boolean> {
    const deleted = SessionStore.deleteSession(token);
    if (deleted) {
      console.log("👋 User logged out");
    }
    return deleted;
  }

  // Verify token and get user
  static async verifyToken(token: string): Promise<AuthUser | null> {
    const user = SessionStore.getSession(token);
    if (!user) {
      console.log("🔒 Token verification failed - token not found in sessions");
    }
    return user || null;
  }

  // Get all users (admin only)
  static async getAllUsers(): Promise<User[]> {
    return users.filter((u) => u.isActive);
  }

  // Get user by ID
  static async getUserById(id: string): Promise<User | null> {
    return users.find((u) => u.id === id && u.isActive) || null;
  }

  // Create new user (admin only)
  static async createUser(
    userData: Omit<User, "id" | "createdAt">,
  ): Promise<User> {
    const id = Date.now().toString();
    const newUser: User = {
      ...userData,
      id,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    // Set default password
    passwords[newUser.email] = "changeme123";

    console.log("👤 New user created:", newUser.email);
    return newUser;
  }

  // Update user role (admin only)
  static async updateUserRole(
    userId: string,
    role: UserRole,
  ): Promise<User | null> {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return null;
    }

    user.role = role;
    console.log("🔄 User role updated:", user.email, "New role:", role);
    return user;
  }

  // Deactivate user (admin only)
  static async deactivateUser(userId: string): Promise<boolean> {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return false;
    }

    user.isActive = false;

    // Remove from active sessions
    for (const [token, sessionUser] of sessions.entries()) {
      if (sessionUser.id === userId) {
        sessions.delete(token);
      }
    }

    console.log("🚫 User deactivated:", user.email);
    return true;
  }

  // Change password
  static async changePassword(
    userId: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return false;
    }

    passwords[user.email] = newPassword;
    console.log("🔑 Password changed for:", user.email);
    return true;
  }
}
