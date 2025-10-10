const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - using mock routes for testing
app.use('/api/auth', require('./routes/auth-mock'));
app.use('/api/datasets', require('./routes/datasets-mock'));
app.use('/api/transactions', require('./routes/transactions-mock'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Walrus Data Marketplace API is running' });
});

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/walrus-marketplace';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Server will continue running without database for testing');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
