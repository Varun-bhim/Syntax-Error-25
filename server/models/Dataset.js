const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['WAL'],
    default: 'WAL'
  },
  category: {
    type: String,
    required: true,
    enum: [
      'research',
      'business',
      'finance',
      'healthcare',
      'technology',
      'education',
      'government',
      'environment',
      'social',
      'other'
    ]
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  files: [{
    name: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },
    walrusBlobId: { type: String, required: true },
    checksum: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  metadata: {
    fileCount: { type: Number, default: 0 },
    totalSize: { type: Number, default: 0 },
    format: String,
    version: { type: String, default: '1.0' },
    license: String,
    language: String,
    lastUpdated: Date
  },
  preview: {
    sampleData: mongoose.Schema.Types.Mixed,
    screenshots: [String],
    documentation: String
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'suspended'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  statistics: {
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  },
  commission: {
    platformFee: { type: Number, default: 0.05 }, // 5% platform fee
    providerEarning: { type: Number, default: 0 }
  },
  accessControl: {
    requiresApproval: { type: Boolean, default: false },
    maxDownloads: Number,
    expiryDate: Date
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
datasetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});


// Index for search
datasetSchema.index({ title: 'text', description: 'text', tags: 'text' });
datasetSchema.index({ category: 1, status: 1, visibility: 1 });
datasetSchema.index({ provider: 1, status: 1 });

module.exports = mongoose.model('Dataset', datasetSchema);
