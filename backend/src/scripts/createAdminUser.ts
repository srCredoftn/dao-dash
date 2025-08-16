import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { UserModel } from '../models/User.js';
import { EmailService } from '../services/emailService.js';

// Load environment variables
dotenv.config();

async function createAdminUser() {
  try {
    console.log('🚀 Starting admin user creation...');
    
    // Connect to database
    await connectDB();
    
    // Check if admin user already exists
    const existingAdmin = await UserModel.findOne({ 
      email: 'admin@2snd.fr',
      role: 'admin' 
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }
    
    // Create admin user
    const adminUser = await UserModel.createUser({
      name: 'Administrateur Système',
      email: 'admin@2snd.fr',
      role: 'admin',
      password: 'admin123' // Default password - should be changed
    });
    
    // Set password as permanent (not temporary)
    (adminUser as any).isTemporaryPassword = false;
    (adminUser as any).temporaryPasswordExpires = null;
    await adminUser.save();
    
    console.log('✅ Admin user created successfully:');
    console.log('   Email:', adminUser.email);
    console.log('   Password: admin123');
    console.log('   Role:', adminUser.role);
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    
    // Try to send welcome email
    try {
      await EmailService.sendWelcomeEmail(
        adminUser.email, 
        adminUser.name, 
        'admin123'
      );
      console.log('📧 Welcome email sent (if email service is configured)');
    } catch (emailError) {
      console.log('📧 Email service not configured - email not sent');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();
