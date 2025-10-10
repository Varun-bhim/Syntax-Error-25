const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dataset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset',
    required: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  aspects: {
    dataQuality: { type: Number, min: 1, max: 5 },
    documentation: { type: Number, min: 1, max: 5 },
    valueForMoney: { type: Number, min: 1, max: 5 },
    support: { type: Number, min: 1, max: 5 }
  },
  helpful: {
    count: { type: Number, default: 0 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'removed'],
    default: 'active'
  },
  response: {
    text: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure one review per transaction
reviewSchema.index({ transaction: 1 }, { unique: true });

// Index for queries
reviewSchema.index({ dataset: 1, status: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ rating: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
