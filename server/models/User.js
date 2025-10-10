const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.walletAddress;
    }
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['provider', 'buyer', 'both'],
    default: 'both'
  },
  profile: {
    firstName: String,
    lastName: String,
    bio: String,
    avatar: String
  },
  reputation: {
    score: { type: Number, default: 0 },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
  },
  earnings: {
    total: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    role: this.role,
    profile: this.profile,
    reputation: this.reputation,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
