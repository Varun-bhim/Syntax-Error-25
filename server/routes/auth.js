const express = require('express');
const User = require('../models/User');
const Dataset = require('../models/Dataset');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const Wallet = require('../models/Wallet');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt for:', req.body.email);
    const { email, password, username, role = 'both', walletAddress } = req.body;

    // Validation
    if (!email || !username) {
      console.log('Validation failed: missing email or username');
      return res.status(400).json({ error: 'Email and username are required' });
    }

    if (!password && !walletAddress) {
      console.log('Validation failed: missing password or wallet address');
      return res.status(400).json({ error: 'Password or wallet address is required' });
    }

    // Check if user already exists
    const queryConditions = [{ email }, { username }];
    if (walletAddress) {
      queryConditions.push({ walletAddress });
    }
    
    const existingUser = await User.findOne({
      $or: queryConditions
    });

    if (existingUser) {
      console.log('User already exists:', { 
        existingEmail: existingUser.email, 
        existingUsername: existingUser.username,
        existingWallet: existingUser.walletAddress 
      });
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      username,
      role,
      walletAddress
    });

    await user.save();
    console.log('User created successfully:', user.email);

    // Generate token
    const token = generateToken(user._id);

    console.log('Registration successful:', {
      userId: user._id,
      email: user.email,
      username: user.username,
      tokenGenerated: !!token
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    const { email, password, walletAddress } = req.body;

    // Find user by email only (more specific)
    const user = await User.findOne({ email: email });

    console.log('Login search result:', {
      email: email,
      foundUser: user ? {
        id: user._id,
        email: user.email,
        username: user.username
      } : null
    });

    if (!user || !user.isActive) {
      console.log('Login failed: user not found or inactive');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password if provided
    if (password && !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    console.log('Login successful:', {
      userId: user._id,
      email: user.email,
      username: user.username,
      tokenGenerated: !!token
    });

    res.json({
      message: 'Login successful',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Profile request for user:', {
      id: req.user._id,
      email: req.user.email,
      username: req.user.username
    });
    
    res.json({
      user: req.user.getPublicProfile()
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email, username, profile, role } = req.body;
    const updates = {};

    if (email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      updates.email = email;
    }
    if (username) updates.username = username;
    if (profile) updates.profile = { ...req.user.profile, ...profile };
    if (role) updates.role = role;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get user with password
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Connect wallet
router.post('/connect-wallet', authenticateToken, async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Check if wallet is already connected to another user
    const existingUser = await User.findOne({ walletAddress });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ error: 'Wallet already connected to another account' });
    }

    // Update user with wallet address
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { walletAddress },
      { new: true }
    );

    res.json({
      message: 'Wallet connected successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Wallet connection error:', error);
    res.status(500).json({ error: 'Failed to connect wallet' });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Reset entire database (for development/testing)
router.delete('/reset-all', async (req, res) => {
  try {
    // Clear all collections
    await User.deleteMany({});
    await Dataset.deleteMany({});
    await Transaction.deleteMany({});
    await Review.deleteMany({});
    
    await Wallet.deleteMany({});
    
    console.log('Complete database reset: All collections cleared');
    
    res.json({
      success: true,
      message: 'Complete database reset successful - all data cleared'
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reset database' 
    });
  }
});

module.exports = router;
