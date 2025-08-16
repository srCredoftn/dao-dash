import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type {
  User,
  AuthUser,
  LoginCredentials,
  AuthResponse,
  UserRole,
} from "@shared/dao";

// JWT Configuration
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// User Schema for MongoDB
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "user", "viewer"],
      default: "user",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: String,
      default: null,
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    isTemporaryPassword: {
      type: Boolean,
      default: false,
    },
    temporaryPasswordExpires: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.isTemporaryPassword;
        delete ret.temporaryPasswordExpires;
        return ret;
      },
    },
  },
);

// Pre-save middleware for password hashing
userSchema.pre("save", async function (next) {
  const user = this;

  // Update timestamp
  if (user.isModified() && !user.isNew) {
    user.updatedAt = new Date().toISOString();
  }

  // Hash password if it was modified
  if (user.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(user.password, salt);
    } catch (error) {
      return next(error as Error);
    }
  }

  next();
});

// Instance methods
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

userSchema.methods.isTemporaryPasswordExpired = function (): boolean {
  if (!this.isTemporaryPassword || !this.temporaryPasswordExpires) {
    return false;
  }
  return new Date() > this.temporaryPasswordExpires;
};

userSchema.methods.markPasswordAsTemporary = function (
  expirationHours: number = 24,
): void {
  this.isTemporaryPassword = true;
  this.temporaryPasswordExpires = new Date(
    Date.now() + expirationHours * 60 * 60 * 1000,
  );
};

// Create or get the User model
const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

export class AuthServiceMongo {
  // Generate a random password
  static generateRandomPassword(): string {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Generate JWT token
  static generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Verify JWT token
  static verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Convert to frontend User format
  static toUserFormat(userDoc: any): User {
    return {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      isActive: userDoc.isActive,
      lastLogin: userDoc.lastLogin,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt,
    };
  }

  // Convert to AuthUser format
  static toAuthUserFormat(userDoc: any): AuthUser {
    return {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
    };
  }

  // Initialize admin user if not exists
  static async initializeAdminUser(): Promise<void> {
    try {
      const existingAdmin = await UserModel.findOne({
        email: "admin@2snd.fr",
        role: "admin",
      });

      if (!existingAdmin) {
        const adminUser = new UserModel({
          name: "Administrateur Système",
          email: "admin@2snd.fr",
          role: "admin",
          password: "admin123",
          isActive: true,
          isTemporaryPassword: false,
        });

        await adminUser.save();
        console.log("👤 Admin user created: admin@2snd.fr / admin123");
      }
    } catch (error) {
      console.error("Error initializing admin user:", error);
    }
  }

  // Login user
  static async login(
    credentials: LoginCredentials,
  ): Promise<AuthResponse | null> {
    try {
      const { email, password } = credentials;

      // Find user by email
      const user = await UserModel.findOne({
        email: email.toLowerCase(),
        isActive: true,
      });

      if (!user) {
        throw new Error("Invalid credentials");
      }

      // Check if temporary password has expired
      if (user.isTemporaryPasswordExpired()) {
        throw new Error(
          "Temporary password has expired. Please request a password reset.",
        );
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        throw new Error("Invalid credentials");
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      await user.save();

      // Generate token
      const token = this.generateToken(user._id.toString());

      const authResponse: AuthResponse = {
        user: this.toAuthUserFormat(user),
        token,
        ...(user.isTemporaryPassword && {
          requiresPasswordChange: true,
          message: "Please change your temporary password",
        }),
      };

      console.log("🔐 User logged in:", user.email, "Role:", user.role);
      return authResponse;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Get user by token
  static async getUserByToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded) {
        return null;
      }

      const user = await UserModel.findById(decoded.userId);
      if (!user || !user.isActive) {
        return null;
      }

      return this.toAuthUserFormat(user);
    } catch (error) {
      console.error("Get user by token error:", error);
      return null;
    }
  }

  // Get all users (admin only)
  static async getAllUsers(): Promise<User[]> {
    try {
      const users = await UserModel.find({ isActive: true }).sort({
        createdAt: -1,
      });
      return users.map(this.toUserFormat);
    } catch (error) {
      console.error("Get all users error:", error);
      throw error;
    }
  }

  // Create new user (admin only)
  static async createUser(userData: {
    name: string;
    email: string;
    role: UserRole;
  }): Promise<{ user: User; temporaryPassword: string }> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({
        email: userData.email.toLowerCase(),
      });

      if (existingUser) {
        throw new Error("User already exists");
      }

      // Generate temporary password
      const temporaryPassword = this.generateRandomPassword();

      // Create user with temporary password
      const user = new UserModel({
        name: userData.name,
        email: userData.email.toLowerCase(),
        role: userData.role,
        password: temporaryPassword,
        isActive: true,
      });

      // Mark password as temporary (expires in 24 hours)
      user.markPasswordAsTemporary(24);
      await user.save();

      console.log(
        "��� New user created:",
        user.email,
        "Temporary password:",
        temporaryPassword,
      );

      return {
        user: this.toUserFormat(user),
        temporaryPassword,
      };
    } catch (error) {
      console.error("Create user error:", error);
      throw error;
    }
  }

  // Update user role (admin only)
  static async updateUserRole(
    userId: string,
    role: UserRole,
  ): Promise<User | null> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { role, updatedAt: new Date().toISOString() },
        { new: true },
      );

      if (!user) {
        return null;
      }

      console.log("🔄 User role updated:", user.email, "New role:", role);
      return this.toUserFormat(user);
    } catch (error) {
      console.error("Update user role error:", error);
      throw error;
    }
  }

  // Deactivate user (admin only)
  static async deactivateUser(userId: string): Promise<boolean> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { isActive: false, updatedAt: new Date().toISOString() },
        { new: true },
      );

      if (!user) {
        return false;
      }

      console.log("🚫 User deactivated:", user.email);
      return true;
    } catch (error) {
      console.error("Deactivate user error:", error);
      throw error;
    }
  }

  // Change password
  static async changePassword(
    userId: string,
    newPassword: string,
  ): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return false;
      }

      user.password = newPassword;
      // Remove temporary password status
      user.isTemporaryPassword = false;
      user.temporaryPasswordExpires = null;
      await user.save();

      console.log("🔑 Password changed for:", user.email);
      return true;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(
    userId: string,
    profileData: { name: string; email: string },
  ): Promise<User | null> {
    try {
      // Check if new email already exists (only if different from current)
      const currentUser = await UserModel.findById(userId);
      if (!currentUser) {
        return null;
      }

      if (profileData.email !== currentUser.email) {
        const existingUser = await UserModel.findOne({
          email: profileData.email.toLowerCase(),
          _id: { $ne: userId },
        });
        if (existingUser) {
          throw new Error("Email already exists");
        }
      }

      const user = await UserModel.findByIdAndUpdate(
        userId,
        {
          name: profileData.name,
          email: profileData.email.toLowerCase(),
          updatedAt: new Date().toISOString(),
        },
        { new: true },
      );

      if (!user) {
        return null;
      }

      console.log("👤 Profile updated for:", user.email);
      return this.toUserFormat(user);
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  }

  // Generate password reset token
  static async generateResetToken(email: string): Promise<string | null> {
    try {
      const user = await UserModel.findOne({
        email: email.toLowerCase(),
        isActive: true,
      });

      if (!user) {
        return null;
      }

      // Generate 6-digit code
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiration

      // Store reset token in user document
      user.resetPasswordToken = token;
      user.resetPasswordExpires = expiresAt;
      await user.save();

      console.log(
        "🔑 Password reset token generated for:",
        email,
        "Token:",
        token,
      );
      return token;
    } catch (error) {
      console.error("Generate reset token error:", error);
      throw error;
    }
  }

  // Verify reset token
  static async verifyResetToken(
    token: string,
    email: string,
  ): Promise<boolean> {
    try {
      const user = await UserModel.findOne({
        email: email.toLowerCase(),
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
        isActive: true,
      });

      return !!user;
    } catch (error) {
      console.error("Verify reset token error:", error);
      return false;
    }
  }

  // Reset password with token
  static async resetPasswordWithToken(
    token: string,
    email: string,
    newPassword: string,
  ): Promise<boolean> {
    try {
      const user = await UserModel.findOne({
        email: email.toLowerCase(),
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
        isActive: true,
      });

      if (!user) {
        return false;
      }

      // Update password and clear reset token
      user.password = newPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      user.isTemporaryPassword = false;
      user.temporaryPasswordExpires = null;
      await user.save();

      console.log("🔑 Password reset successful for:", email);
      return true;
    } catch (error) {
      console.error("Reset password error:", error);
      return false;
    }
  }
}
