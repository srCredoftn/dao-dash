import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel, UserDocument } from '../models/User.js';
import { EmailService } from './emailService.js';
import type { User, AuthUser, LoginCredentials, AuthResponse, UserRole } from '../../../shared/dao.js';

// JWT Secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';


export class AuthService {
  // Generate a random password
  static generateRandomPassword(): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
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

  // Convert UserDocument to User (frontend format)
  static toUserFormat(userDoc: UserDocument): User {
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

  // Convert UserDocument to AuthUser (authenticated user format)
  static toAuthUserFormat(userDoc: UserDocument): AuthUser {
    return {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
    };
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResponse | null> {
    try {
      const { email, password } = credentials;

      // Find user by email
      const user = await UserModel.findOne({
        email: email.toLowerCase(),
        isActive: true
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if temporary password has expired
      if ((user as any).isTemporaryPasswordExpired()) {
        throw new Error('Temporary password has expired. Please request a password reset.');
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      await user.save();

      // Generate token
      const token = this.generateToken(user._id.toString());

      const authResponse: AuthResponse = {
        user: this.toAuthUserFormat(user),
        token,
        // Include information about temporary password
        ...(((user as any).isTemporaryPassword) && {
          requiresPasswordChange: true,
          message: 'Please change your temporary password'
        })
      };

      console.log('🔐 User logged in:', user.email, 'Role:', user.role);
      return authResponse;
    } catch (error) {
      console.error('Login error:', error);
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
      console.error('Get user by token error:', error);
      return null;
    }
  }

  // Get all users (admin only)
  static async getAllUsers(): Promise<User[]> {
    try {
      const users = await UserModel.find({ isActive: true }).sort({ createdAt: -1 });
      return users.map(this.toUserFormat);
    } catch (error) {
      console.error('Get all users error:', error);
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
        email: userData.email.toLowerCase()
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Generate temporary password
      const temporaryPassword = this.generateRandomPassword();

      // Create user with temporary password
      const user = await UserModel.createUser({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        password: temporaryPassword,
      });

      // Mark password as temporary (expires in 24 hours)
      (user as any).markPasswordAsTemporary(24);
      await user.save();

      console.log('👤 New user created:', user.email, 'Temporary password:', temporaryPassword);

      // Send welcome email with temporary password
      await EmailService.sendWelcomeEmail(user.email, user.name, temporaryPassword);

      return {
        user: this.toUserFormat(user),
        temporaryPassword,
      };
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  // Update user role (admin only)
  static async updateUserRole(userId: string, role: UserRole): Promise<User | null> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { role, updatedAt: new Date().toISOString() },
        { new: true }
      );

      if (!user) {
        return null;
      }

      console.log('🔄 User role updated:', user.email, 'New role:', role);
      return this.toUserFormat(user);
    } catch (error) {
      console.error('Update user role error:', error);
      throw error;
    }
  }

  // Deactivate user (admin only)
  static async deactivateUser(userId: string): Promise<boolean> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { isActive: false, updatedAt: new Date().toISOString() },
        { new: true }
      );

      if (!user) {
        return false;
      }

      console.log('🚫 User deactivated:', user.email);
      return true;
    } catch (error) {
      console.error('Deactivate user error:', error);
      throw error;
    }
  }

  // Change password
  static async changePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return false;
      }

      user.password = newPassword;
      // Remove temporary password status
      (user as any).isTemporaryPassword = false;
      (user as any).temporaryPasswordExpires = null;
      await user.save();

      console.log('🔑 Password changed for:', user.email);
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(
    userId: string,
    profileData: { name: string; email: string }
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
          throw new Error('Email already exists');
        }
      }

      const user = await UserModel.findByIdAndUpdate(
        userId,
        {
          name: profileData.name,
          email: profileData.email.toLowerCase(),
          updatedAt: new Date().toISOString(),
        },
        { new: true }
      );

      if (!user) {
        return null;
      }

      console.log('👤 Profile updated for:', user.email);
      return this.toUserFormat(user);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Generate password reset token
  static async generateResetToken(email: string): Promise<string | null> {
    try {
      const user = await UserModel.findOne({ 
        email: email.toLowerCase(), 
        isActive: true 
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

      // Send reset email
      await this.sendPasswordResetEmail(user.email, user.name, token);

      console.log('🔑 Password reset token generated for:', email);
      return token;
    } catch (error) {
      console.error('Generate reset token error:', error);
      throw error;
    }
  }

  // Verify reset token
  static async verifyResetToken(token: string, email: string): Promise<boolean> {
    try {
      const user = await UserModel.findOne({
        email: email.toLowerCase(),
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
        isActive: true,
      });

      return !!user;
    } catch (error) {
      console.error('Verify reset token error:', error);
      return false;
    }
  }

  // Reset password with token
  static async resetPasswordWithToken(
    token: string,
    email: string,
    newPassword: string
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
      await user.save();

      console.log('🔑 Password reset successful for:', email);
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  }

  // Send welcome email with temporary password
  static async sendWelcomeEmail(email: string, name: string, temporaryPassword: string): Promise<void> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 Email not configured. Temporary password for', email, ':', temporaryPassword);
        return;
      }

      const transporter = nodemailer.createTransporter(emailConfig);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Bienvenue ! Votre compte a été créé',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Bienvenue ${name} !</h2>
            <p>Votre compte a été créé avec succès. Voici vos informations de connexion :</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Mot de passe temporaire:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code></p>
            </div>
            
            <p style="color: #dc2626; font-weight: bold;">⚠️ Important :</p>
            <ul>
              <li>Ce mot de passe est temporaire et expire dans 24 heures</li>
              <li>Vous devez changer votre mot de passe lors de votre première connexion</li>
              <li>Ne partagez jamais vos informations de connexion</li>
            </ul>
            
            <p>Connectez-vous dès maintenant pour accéder à votre espace.</p>
            
            <p>Cordialement,<br>L'équipe de gestion des DAO</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log('📧 Welcome email sent to:', email);
    } catch (error) {
      console.error('Send welcome email error:', error);
      // Don't throw error, just log it
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 Email not configured. Reset code for', email, ':', token);
        return;
      }

      const transporter = nodemailer.createTransporter(emailConfig);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Code de réinitialisation de mot de passe',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Réinitialisation de mot de passe</h2>
            <p>Bonjour ${name},</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code de vérification :</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #2563eb; font-size: 24px; margin: 0; letter-spacing: 2px;">${token}</h3>
            </div>
            
            <p style="color: #dc2626;">⚠️ Ce code expire dans 15 minutes.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p>
            
            <p>Cordialement,<br>L'équipe de gestion des DAO</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log('📧 Password reset email sent to:', email);
    } catch (error) {
      console.error('Send reset email error:', error);
      // Don't throw error, just log it
    }
  }
}
