const express = require('express');
const Transaction = require('../models/Transaction');
const Dataset = require('../models/Dataset');
const { authenticateToken, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// Get user's transactions
router.get('/my-transactions', authenticateToken, async (req, res) => {
  try {
    const { type = 'all', status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    if (type === 'purchases') {
      query.buyer = req.user._id;
    } else if (type === 'sales') {
      query.seller = req.user._id;
    } else {
      query.$or = [
        { buyer: req.user._id },
        { seller: req.user._id }
      ];
    }

    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .populate('buyer', 'username profile')
      .populate('seller', 'username profile')
      .populate('dataset', 'title category price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get single transaction
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      $or: [
        { buyer: req.user._id },
        { seller: req.user._id }
      ]
    })
    .populate('buyer', 'username profile')
    .populate('seller', 'username profile')
    .populate('dataset', 'title category price files');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Record a new transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      datasetId,
      amount,
      currency,
      fee,
      totalAmount,
      sellerAmount,
      sellerUserId,
      transactionHash,
      chain,
      status = 'pending'
    } = req.body;

    // Validate required fields
    if (!datasetId || !amount || !currency || !transactionHash) {
      return res.status(400).json({ error: 'Missing required transaction fields' });
    }

    // Get dataset to find seller
    const dataset = await Dataset.findById(datasetId).populate('provider');
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Create transaction record
    const transaction = new Transaction({
      transactionId: transactionHash,
      buyer: req.user._id,
      seller: dataset.provider._id,
      dataset: datasetId,
      amount: parseFloat(amount),
      currency,
      platformFee: fee || 0,
      sellerAmount: sellerAmount || (parseFloat(amount) - (fee || 0)),
      sellerUserId: sellerUserId || dataset.provider._id,
      status,
      paymentMethod: 'crypto',
      chain,
      transactionHash,
      accessGranted: status === 'completed',
      completedAt: status === 'completed' ? new Date() : null
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      transaction: {
        id: transaction._id,
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        transactionHash: transaction.transactionHash
      }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Get transaction statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get purchase statistics
    const purchaseStats = await Transaction.aggregate([
      { $match: { buyer: userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' },
          totalPurchases: { $sum: 1 },
          averagePurchase: { $avg: '$amount' }
        }
      }
    ]);

    // Get sales statistics
    const salesStats = await Transaction.aggregate([
      { $match: { seller: userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: '$sellerAmount' },
          totalSales: { $sum: 1 },
          averageSale: { $avg: '$sellerAmount' },
          totalFees: { $sum: '$platformFee' }
        }
      }
    ]);

    // Get recent activity
    const recentTransactions = await Transaction.find({
      $or: [{ buyer: userId }, { seller: userId }]
    })
    .populate('buyer', 'username')
    .populate('seller', 'username')
    .populate('dataset', 'title')
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      purchases: purchaseStats[0] || {
        totalSpent: 0,
        totalPurchases: 0,
        averagePurchase: 0
      },
      sales: salesStats[0] || {
        totalEarned: 0,
        totalSales: 0,
        averageSale: 0,
        totalFees: 0
      },
      recentTransactions
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction statistics' });
  }
});

// Request refund
router.post('/:id/refund', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      buyer: req.user._id,
      status: 'completed'
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.refund.status !== 'none') {
      return res.status(400).json({ error: 'Refund already requested' });
    }

    // Check if refund is within allowed timeframe (e.g., 7 days)
    const refundDeadline = new Date(transaction.completedAt);
    refundDeadline.setDate(refundDeadline.getDate() + 7);
    
    if (new Date() > refundDeadline) {
      return res.status(400).json({ error: 'Refund period has expired' });
    }

    transaction.refund = {
      amount: transaction.amount,
      reason,
      status: 'requested'
    };

    await transaction.save();

    res.json({
      message: 'Refund requested successfully',
      refund: transaction.refund
    });
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({ error: 'Failed to request refund' });
  }
});

// Process refund (admin/seller)
router.put('/:id/refund/process', authenticateToken, async (req, res) => {
  try {
    const { action, resolution } = req.body; // action: 'approve' or 'reject'
    
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      seller: req.user._id,
      'refund.status': 'requested'
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Refund request not found' });
    }

    if (action === 'approve') {
      transaction.refund.status = 'approved';
      transaction.status = 'refunded';
      transaction.refund.processedAt = new Date();
    } else if (action === 'reject') {
      transaction.refund.status = 'rejected';
    }

    if (resolution) {
      transaction.refund.resolution = resolution;
    }

    await transaction.save();

    res.json({
      message: `Refund ${action}d successfully`,
      refund: transaction.refund
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Create dispute
router.post('/:id/dispute', authenticateToken, async (req, res) => {
  try {
    const { reason, description } = req.body;
    
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      $or: [{ buyer: req.user._id }, { seller: req.user._id }],
      status: 'completed'
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.dispute.status !== 'none') {
      return res.status(400).json({ error: 'Dispute already exists' });
    }

    transaction.dispute = {
      reason,
      description,
      status: 'open',
      createdAt: new Date()
    };

    await transaction.save();

    res.json({
      message: 'Dispute created successfully',
      dispute: transaction.dispute
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ error: 'Failed to create dispute' });
  }
});

// Resolve dispute
router.put('/:id/dispute/resolve', authenticateToken, async (req, res) => {
  try {
    const { resolution } = req.body;
    
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      'dispute.status': 'open'
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Open dispute not found' });
    }

    // TODO: Add admin role check
    transaction.dispute.status = 'resolved';
    transaction.dispute.resolution = resolution;
    transaction.dispute.resolvedAt = new Date();

    await transaction.save();

    res.json({
      message: 'Dispute resolved successfully',
      dispute: transaction.dispute
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

module.exports = router;
