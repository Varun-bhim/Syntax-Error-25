const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  balance: {
    type: Number,
    default: 1000,
    min: 0
  },
  currency: {
    type: String,
    default: 'WAL',
    enum: ['WAL']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  transactionHistory: [{
    type: {
      type: String,
      enum: ['credit', 'debit', 'transfer_in', 'transfer_out'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    transactionId: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
});

// Update the updatedAt field before saving
walletSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate unique wallet address
walletSchema.statics.generateWalletAddress = function() {
  const prefix = '0xWalr';
  const suffix = Math.random().toString(36).substr(2, 8);
  return `${prefix}${suffix}`;
};

// Create wallet for user
walletSchema.statics.createWalletForUser = async function(userId) {
  try {
    // Check if user already has a wallet
    const existingWallet = await this.findOne({ userId });
    if (existingWallet) {
      return existingWallet;
    }

    // Generate unique wallet address
    let walletAddress;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      walletAddress = this.generateWalletAddress();
      const existing = await this.findOne({ walletAddress });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Unable to generate unique wallet address');
    }

    // Create new wallet
    const wallet = new this({
      userId,
      walletAddress,
      balance: 1000
    });

    await wallet.save();
    return wallet;
  } catch (error) {
    console.error('Error creating wallet for user:', error);
    throw error;
  }
};

// Update wallet balance
walletSchema.methods.updateBalance = async function(amount, type, description, transactionId) {
  try {
    const oldBalance = this.balance;
    const newBalance = type === 'debit' ? oldBalance - amount : oldBalance + amount;

    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }

    this.balance = newBalance;
    
    // Add transaction to history
    this.transactionHistory.push({
      type,
      amount,
      description,
      transactionId,
      timestamp: new Date()
    });

    await this.save();
    
    console.log(`Wallet ${this.walletAddress}: ${type} ${amount} WAL. Balance: ${oldBalance} → ${newBalance}`);
    return { success: true, newBalance };
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    throw error;
  }
};

// Get wallet by user ID
walletSchema.statics.getWalletByUserId = async function(userId) {
  try {
    let wallet = await this.findOne({ userId });
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await this.createWalletForUser(userId);
    }
    
    return wallet;
  } catch (error) {
    console.error('Error getting wallet by user ID:', error);
    throw error;
  }
};

// Get wallet by address
walletSchema.statics.getWalletByAddress = async function(walletAddress) {
  try {
    return await this.findOne({ walletAddress });
  } catch (error) {
    console.error('Error getting wallet by address:', error);
    throw error;
  }
};

module.exports = mongoose.model('Wallet', walletSchema);
