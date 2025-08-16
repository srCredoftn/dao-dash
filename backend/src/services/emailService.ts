import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user?: string;
    pass?: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: Transporter | null = null;
  private static isConfigured = false;

  // Initialize email service
  static initialize(): void {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    // Check if email is configured
    if (!config.auth.user || !config.auth.pass) {
      console.log('📧 Email service not configured - emails will be logged to console');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter(config);
      this.isConfigured = true;
      console.log('📧 Email service initialized successfully');
      
      // Verify connection
      this.verifyConnection();
    } catch (error) {
      console.error('📧 Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  // Verify email connection
  private static async verifyConnection(): Promise<void> {
    if (!this.transporter) return;

    try {
      await this.transporter.verify();
      console.log('📧 Email connection verified successfully');
    } catch (error) {
      console.error('📧 Email connection verification failed:', error);
      this.isConfigured = false;
    }
  }

  // Send email
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.isConfigured || !this.transporter) {
        console.log('📧 Email not configured - logging email content:');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Content:', options.html.replace(/<[^>]*>/g, ''));
        return false;
      }

      const mailOptions = {
        from: {
          name: process.env.FROM_EMAIL_NAME || 'DAO Management System',
          address: process.env.SMTP_USER || 'noreply@example.com',
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('📧 Failed to send email:', error);
      return false;
    }
  }

  // Welcome email template
  static async sendWelcomeEmail(
    email: string,
    name: string,
    temporaryPassword: string
  ): Promise<boolean> {
    const subject = 'Bienvenue ! Votre compte a été créé';
    const html = this.getWelcomeEmailTemplate(name, email, temporaryPassword);

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  // Password reset email template
  static async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string
  ): Promise<boolean> {
    const subject = 'Code de réinitialisation de mot de passe';
    const html = this.getPasswordResetEmailTemplate(name, token);

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  // Password change confirmation email
  static async sendPasswordChangeConfirmation(
    email: string,
    name: string
  ): Promise<boolean> {
    const subject = 'Confirmation de changement de mot de passe';
    const html = this.getPasswordChangeConfirmationTemplate(name);

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  // Welcome email template
  private static getWelcomeEmailTemplate(
    name: string,
    email: string,
    temporaryPassword: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue !</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .credentials { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .password { background-color: #e5e7eb; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: bold; }
          .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Bienvenue ${name} !</h1>
        </div>
        
        <div class="content">
          <p>Votre compte a été créé avec succès dans le système de gestion des DAO. Voici vos informations de connexion :</p>
          
          <div class="credentials">
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Mot de passe temporaire :</strong></p>
            <div class="password">${temporaryPassword}</div>
          </div>
          
          <div class="warning">
            <h3>⚠️ Important :</h3>
            <ul>
              <li>Ce mot de passe est <strong>temporaire</strong> et expire dans <strong>24 heures</strong></li>
              <li>Vous devez changer votre mot de passe lors de votre première connexion</li>
              <li>Ne partagez jamais vos informations de connexion</li>
              <li>Si vous ne changez pas votre mot de passe dans les 24 heures, vous devrez demander une réinitialisation</li>
            </ul>
          </div>
          
          <p>Connectez-vous dès maintenant pour accéder à votre espace et modifier votre mot de passe.</p>
          
          <p>Si vous rencontrez des difficultés, contactez l'administrateur système.</p>
        </div>
        
        <div class="footer">
          <p>Cordialement,<br>L'équipe de gestion des DAO</p>
          <p>Cet email a été généré automatiquement, merci de ne pas y répondre.</p>
        </div>
      </body>
      </html>
    `;
  }

  // Password reset email template
  private static getPasswordResetEmailTemplate(name: string, token: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .token { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .token-code { font-size: 28px; font-weight: bold; color: #2563eb; letter-spacing: 3px; font-family: monospace; }
          .warning { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Réinitialisation de mot de passe</h1>
        </div>
        
        <div class="content">
          <p>Bonjour ${name},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code de vérification :</p>
          
          <div class="token">
            <p><strong>Code de vérification :</strong></p>
            <div class="token-code">${token}</div>
          </div>
          
          <div class="warning">
            <p><strong>⚠️ Ce code expire dans 15 minutes.</strong></p>
            <p>Pour des raisons de sécurité, ce code ne peut être utilisé qu'une seule fois.</p>
          </div>
          
          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez ce message. Votre compte reste sécurisé.</p>
          
          <p>Utilisez ce code sur la page de réinitialisation pour définir un nouveau mot de passe.</p>
        </div>
        
        <div class="footer">
          <p>Cordialement,<br>L'équipe de gestion des DAO</p>
          <p>Cet email a été généré automatiquement, merci de ne pas y répondre.</p>
        </div>
      </body>
      </html>
    `;
  }

  // Password change confirmation template
  private static getPasswordChangeConfirmationTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mot de passe modifié</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .success { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Mot de passe modifié avec succès</h1>
        </div>
        
        <div class="content">
          <p>Bonjour ${name},</p>
          
          <div class="success">
            <p><strong>✅ Votre mot de passe a été modifié avec succès !</strong></p>
            <p>Cette modification a eu lieu le ${new Date().toLocaleString('fr-FR')}.</p>
          </div>
          
          <p>Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement l'administrateur système.</p>
          
          <p>Votre compte est maintenant sécurisé avec votre nouveau mot de passe.</p>
        </div>
        
        <div class="footer">
          <p>Cordialement,<br>L'équipe de gestion des DAO</p>
          <p>Cet email a été généré automatiquement, merci de ne pas y répondre.</p>
        </div>
      </body>
      </html>
    `;
  }
}

// Initialize email service on module load
EmailService.initialize();
