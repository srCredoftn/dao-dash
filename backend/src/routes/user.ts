import express from 'express';
import { z } from 'zod';
import { UserModel } from '../models/User.js';
import { authenticate, requireAdmin, requireOwnershipOrAdmin } from '../middleware/auth.js';
import { AuthService } from '../services/authService.js';

const router = express.Router();

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['admin', 'user', 'viewer'] as const).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/users - Get all users (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const users = await UserModel.find()
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await UserModel.countDocuments();

    const formattedUsers = users.map(AuthService.toUserFormat);

    res.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticate, requireOwnershipOrAdmin('id'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await UserModel.findById(id)
      .select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(AuthService.toUserFormat(user));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const validation = updateUserSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: validation.error.errors 
      });
    }

    const updateData = validation.data;

    // Check if email already exists (if email is being updated)
    if (updateData.email) {
      const existingUser = await UserModel.findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      updateData.email = updateData.email.toLowerCase();
    }

    // Add timestamp
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        updatedAt: new Date().toISOString(),
      },
      { 
        new: true,
        runValidators: true,
      }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(AuthService.toUserFormat(updatedUser));
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const deletedUser = await UserModel.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// POST /api/users/:id/activate - Activate user (admin only)
router.post('/:id/activate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findByIdAndUpdate(
      id,
      { 
        isActive: true,
        updatedAt: new Date().toISOString(),
      },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: AuthService.toUserFormat(user),
      message: 'User activated successfully',
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ error: 'Failed to activate user' });
  }
});

// POST /api/users/:id/deactivate - Deactivate user (admin only)
router.post('/:id/deactivate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deactivating themselves
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const user = await UserModel.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        updatedAt: new Date().toISOString(),
      },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: AuthService.toUserFormat(user),
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// GET /api/users/stats - Get user statistics (admin only)
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      regularUsers,
      viewerUsers,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ isActive: true }),
      UserModel.countDocuments({ isActive: false }),
      UserModel.countDocuments({ role: 'admin', isActive: true }),
      UserModel.countDocuments({ role: 'user', isActive: true }),
      UserModel.countDocuments({ role: 'viewer', isActive: true }),
    ]);

    const stats = {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: {
        admin: adminUsers,
        user: regularUsers,
        viewer: viewerUsers,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

export default router;
