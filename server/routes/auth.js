const express = require('express');
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, role = 'both', walletAddress } = req.body;

    // Validation
    if (!email || !username) {
      return res.status(400).json({ error: 'Email and username are required' });
    }

    if (!password && !walletAddress) {
      return res.status(400).json({ error: 'Password or wallet address is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { walletAddress }]
    });

    if (existingUser) {
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

    // Generate token
    const token = generateToken(user._id);

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
    const { email, password, walletAddress } = req.body;

    // Find user by email or wallet address
    const user = await User.findOne({
      $or: [{ email }, { walletAddress }]
    });

    if (!user || !user.isActive) {
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
    const { username, profile, role } = req.body;
    const updates = {};

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

module.exports = router;
