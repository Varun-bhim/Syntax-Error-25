const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dataset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['WAL', 'SUI'],
    required: true
  },
  platformFee: {
    type: Number,
    required: true,
    min: 0
  },
  sellerAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'disputed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['wallet', 'crypto'],
    required: true
  },
  blockchainTxHash: {
    type: String,
    sparse: true
  },
  walletAddress: {
    buyer: String,
    seller: String
  },
  accessGranted: {
    type: Boolean,
    default: false
  },
  accessExpiry: Date,
  downloadCount: {
    type: Number,
    default: 0
  },
  maxDownloads: {
    type: Number,
    default: 1
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  },
  dispute: {
    reason: String,
    description: String,
    status: {
      type: String,
      enum: ['none', 'open', 'resolved', 'closed']
    },
    resolution: String,
    createdAt: Date,
    resolvedAt: Date
  },
  refund: {
    amount: Number,
    reason: String,
    processedAt: Date,
    status: {
      type: String,
      enum: ['none', 'requested', 'approved', 'rejected', 'processed']
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for queries
transactionSchema.index({ buyer: 1, status: 1 });
transactionSchema.index({ seller: 1, status: 1 });
transactionSchema.index({ dataset: 1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
