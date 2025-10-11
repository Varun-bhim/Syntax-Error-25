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
    const userId = req.user._id;
    
    // Get user's transactions
    const userTransactions = Array.from(mockDb.transactions.values())
      .filter(transaction => 
        transaction.buyer === userId || transaction.seller === userId
      );

    // Calculate purchase stats
    const purchases = userTransactions.filter(t => t.buyer === userId && t.status === 'completed');
    const totalPurchases = purchases.length;
    const totalSpent = purchases.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate sales stats
    const sales = userTransactions.filter(t => t.seller === userId && t.status === 'completed');
    const totalSales = sales.length;
    const totalEarned = sales.reduce((sum, t) => sum + (t.sellerAmount || t.amount * 0.95 || 0), 0);

    res.json({
      purchases: {
        totalPurchases,
        totalSpent,
        averagePurchase: totalPurchases > 0 ? totalSpent / totalPurchases : 0
      },
      sales: {
        totalSales,
        totalEarned,
        averageSale: totalSales > 0 ? totalEarned / totalSales : 0,
        totalFees: sales.reduce((sum, t) => sum + (t.platformFee || t.amount * 0.05 || 0), 0)
      },
      recentTransactions: userTransactions.slice(0, 5)
    });
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
      )
      .map(transaction => {
        // Populate dataset information
        const dataset = mockDb.findDatasetById(transaction.dataset);
        return {
          ...transaction,
          dataset: dataset ? {
            _id: dataset._id,
            title: dataset.title,
            description: dataset.description,
            category: dataset.category,
            price: dataset.price,
            currency: dataset.currency,
            files: dataset.files || [],
            status: dataset.status,
            provider: dataset.provider,
            createdAt: dataset.createdAt,
            statistics: dataset.statistics
          } : null
        };
      });

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
    const transactionId = parseInt(req.params.id);
    const transaction = mockDb.findTransactionById(transactionId);

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
