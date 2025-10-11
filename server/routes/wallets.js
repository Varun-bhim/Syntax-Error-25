const express = require('express');
const Wallet = require('../models/Wallet');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's wallet
router.get('/', authenticateToken, async (req, res) => {
  try {
    const wallet = await Wallet.getWalletByUserId(req.user._id);
    
    res.json({
      success: true,
      wallet: {
        address: wallet.walletAddress,
        balance: wallet.balance,
        currency: wallet.currency,
        isActive: wallet.isActive,
        createdAt: wallet.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting wallet:', error);
    res.status(500).json({ success: false, error: 'Failed to get wallet' });
  }
});

// Get wallet balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const wallet = await Wallet.getWalletByUserId(req.user._id);
    
    res.json({
      success: true,
      balance: wallet.balance,
      currency: wallet.currency
    });
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    res.status(500).json({ success: false, error: 'Failed to get wallet balance' });
  }
});

// Update wallet balance (for internal use)
router.post('/update-balance', authenticateToken, async (req, res) => {
  try {
    const { amount, type, description, transactionId } = req.body;
    
    if (!amount || !type || !description || !transactionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const wallet = await Wallet.getWalletByUserId(req.user._id);
    const result = await wallet.updateBalance(amount, type, description, transactionId);
    
    res.json({
      success: true,
      newBalance: result.newBalance,
      message: 'Balance updated successfully'
    });
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update wallet balance' 
    });
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const wallet = await Wallet.getWalletByUserId(req.user._id);
    const limit = parseInt(req.query.limit) || 10;
    
    const transactions = wallet.transactionHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    res.json({
      success: true,
      transactions: transactions
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({ success: false, error: 'Failed to get transaction history' });
  }
});

// Get wallet by address (for payments)
router.get('/address/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const wallet = await Wallet.getWalletByAddress(address);
    
    if (!wallet) {
      return res.status(404).json({ 
        success: false, 
        error: 'Wallet not found' 
      });
    }
    
    res.json({
      success: true,
      wallet: {
        address: wallet.walletAddress,
        balance: wallet.balance,
        currency: wallet.currency,
        isActive: wallet.isActive
      }
    });
  } catch (error) {
    console.error('Error getting wallet by address:', error);
    res.status(500).json({ success: false, error: 'Failed to get wallet' });
  }
});

// Create wallet for user (admin/internal use)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const wallet = await Wallet.createWalletForUser(req.user._id);
    
    res.json({
      success: true,
      wallet: {
        address: wallet.walletAddress,
        balance: wallet.balance,
        currency: wallet.currency
      },
      message: 'Wallet created successfully'
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ success: false, error: 'Failed to create wallet' });
  }
});

// Credit seller wallet (for sales)
router.post('/credit-seller', async (req, res) => {
  try {
    const { sellerUserId, amount, description, transactionId } = req.body;
    
    if (!sellerUserId || !amount || !description || !transactionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Get or create wallet for seller
    const sellerWallet = await Wallet.getWalletByUserId(sellerUserId);
    
    // Credit the seller's wallet
    const result = await sellerWallet.updateBalance(amount, 'credit', description, transactionId);
    
    res.json({
      success: true,
      message: 'Seller credited successfully',
      newBalance: result.newBalance,
      sellerWallet: sellerWallet.walletAddress
    });
  } catch (error) {
    console.error('Error crediting seller:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to credit seller' 
    });
  }
});

// Transfer between wallets (for payments)
router.post('/transfer', async (req, res) => {
  try {
    const { fromAddress, toAddress, amount, description, transactionId } = req.body;
    
    if (!fromAddress || !toAddress || !amount || !description || !transactionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Get both wallets
    const fromWallet = await Wallet.getWalletByAddress(fromAddress);
    const toWallet = await Wallet.getWalletByAddress(toAddress);
    
    if (!fromWallet) {
      return res.status(404).json({ 
        success: false, 
        error: 'Sender wallet not found' 
      });
    }
    
    if (!toWallet) {
      return res.status(404).json({ 
        success: false, 
        error: 'Recipient wallet not found' 
      });
    }

    // Update sender wallet (debit)
    await fromWallet.updateBalance(amount, 'debit', description, transactionId);
    
    // Update recipient wallet (credit)
    await toWallet.updateBalance(amount, 'credit', description, transactionId);
    
    res.json({
      success: true,
      message: 'Transfer completed successfully',
      fromBalance: fromWallet.balance,
      toBalance: toWallet.balance
    });
  } catch (error) {
    console.error('Error transferring between wallets:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to transfer' 
    });
  }
});

// Reset database (for development/testing)
router.delete('/reset-database', async (req, res) => {
  try {
    // Clear all collections
    await Wallet.deleteMany({});
    
    console.log('Database reset: All wallet data cleared');
    
    res.json({
      success: true,
      message: 'Database reset successfully - all wallet data cleared'
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
