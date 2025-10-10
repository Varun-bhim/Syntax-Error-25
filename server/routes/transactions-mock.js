const express = require('express');
const jwt = require('jsonwebtoken');
const mockDb = require('../mock-db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = mockDb.findUserById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get transaction statistics overview
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    // Mock transaction stats
    const stats = {
      totalTransactions: 0,
      totalEarnings: 0,
      totalSpent: 0,
      pendingEarnings: 0,
      recentTransactions: []
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction statistics' });
  }
});

// Get user's transactions
router.get('/my-transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = Array.from(mockDb.transactions.values())
      .filter(transaction => 
        transaction.buyer === req.user._id || transaction.seller === req.user._id
      );

    res.json({
      transactions,
      pagination: {
        current: 1,
        pages: 1,
        total: transactions.length
      }
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get single transaction
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = mockDb.findTransactionById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if user has access to this transaction
    if (transaction.buyer !== req.user._id && transaction.seller !== req.user._id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

module.exports = router;
