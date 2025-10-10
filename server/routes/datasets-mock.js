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

// Get all datasets (public)
router.get('/', async (req, res) => {
  try {
    const datasets = Array.from(mockDb.datasets.values())
      .filter(dataset => dataset.status === 'published' && dataset.visibility === 'public');

    res.json({
      datasets,
      pagination: {
        current: 1,
        pages: 1,
        total: datasets.length
      }
    });
  } catch (error) {
    console.error('Get datasets error:', error);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

// Get single dataset
router.get('/:id', async (req, res) => {
  try {
    const dataset = mockDb.findDatasetById(req.params.id);

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Increment view count
    dataset.statistics.views += 1;

    res.json({ dataset });
  } catch (error) {
    console.error('Get dataset error:', error);
    res.status(500).json({ error: 'Failed to fetch dataset' });
  }
});

// Create new dataset
router.post('/', authenticateToken, async (req, res) => {
  try {
    const datasetData = {
      ...req.body,
      provider: req.user._id
    };

    // Convert tags string to array if needed
    if (datasetData.tags && typeof datasetData.tags === 'string') {
      datasetData.tags = datasetData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    const dataset = mockDb.createDataset(datasetData);

    res.status(201).json({
      message: 'Dataset created successfully',
      dataset
    });
  } catch (error) {
    console.error('Create dataset error:', error);
    res.status(500).json({ error: 'Failed to create dataset' });
  }
});

// Upload files to dataset (mock implementation)
router.post('/:id/upload', authenticateToken, async (req, res) => {
  try {
    const dataset = mockDb.findDatasetById(req.params.id);

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    if (dataset.provider !== req.user._id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mock file upload - in real implementation, files would be uploaded to Walrus
    const mockFiles = [
      {
        name: 'sample_data.csv',
        size: 1024 * 1024, // 1MB
        type: 'text/csv',
        walrusBlobId: `blob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        checksum: 'mock_checksum',
        uploadedAt: new Date()
      }
    ];

    // Update dataset with file information
    dataset.files.push(...mockFiles);
    dataset.metadata.fileCount = dataset.files.length;
    dataset.metadata.totalSize = dataset.files.reduce((sum, file) => sum + file.size, 0);
    dataset.metadata.lastUpdated = new Date();

    res.json({
      message: 'Files uploaded successfully',
      files: mockFiles
    });
  } catch (error) {
    console.error('Upload files error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Update dataset
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const dataset = mockDb.findDatasetById(req.params.id);

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    if (dataset.provider !== req.user._id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = req.body;
    delete updates.provider; // Prevent changing provider
    delete updates.files; // Use separate endpoint for file management

    const updatedDataset = mockDb.updateDataset(req.params.id, updates);

    res.json({
      message: 'Dataset updated successfully',
      dataset: updatedDataset
    });
  } catch (error) {
    console.error('Update dataset error:', error);
    res.status(500).json({ error: 'Failed to update dataset' });
  }
});

// Get user's datasets
router.get('/user/my-datasets', authenticateToken, async (req, res) => {
  try {
    const datasets = mockDb.findDatasetsByProvider(req.user._id);

    res.json({
      datasets,
      pagination: {
        current: 1,
        pages: 1,
        total: datasets.length
      }
    });
  } catch (error) {
    console.error('Get user datasets error:', error);
    res.status(500).json({ error: 'Failed to fetch user datasets' });
  }
});

// Purchase dataset
router.post('/:id/purchase', authenticateToken, async (req, res) => {
  try {
    console.log('Purchase request for dataset:', req.params.id);
    console.log('User:', req.user._id);
    
    const dataset = mockDb.findDatasetById(req.params.id);
    
    if (!dataset) {
      console.log('Dataset not found:', req.params.id);
      return res.status(404).json({ error: 'Dataset not found' });
    }

    console.log('Dataset found:', dataset.title);
    console.log('Dataset provider:', dataset.provider);
    console.log('Dataset status:', dataset.status);

    if (dataset.provider === req.user._id) {
      console.log('User trying to purchase own dataset');
      return res.status(400).json({ error: 'Cannot purchase your own dataset' });
    }

    if (dataset.status !== 'published') {
      console.log('Dataset not published:', dataset.status);
      return res.status(400).json({ error: 'Dataset is not available for purchase' });
    }

    // Calculate commission
    const platformFeeRate = dataset.commission?.platformFee || 0.05;
    const platformFee = dataset.price * platformFeeRate;
    const sellerAmount = dataset.price - platformFee;

    // Create transaction
    const transaction = mockDb.createTransaction({
      transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      buyer: req.user._id,
      seller: dataset.provider,
      dataset: dataset._id,
      amount: dataset.price,
      currency: dataset.currency,
      platformFee: platformFee,
      sellerAmount: sellerAmount,
      paymentMethod: 'wallet',
      walletAddress: {
        buyer: req.user.walletAddress || 'mock_buyer_wallet',
        seller: 'mock_seller_wallet'
      }
    });

    // Mark as completed (mock payment)
    transaction.status = 'completed';
    transaction.accessGranted = true;
    transaction.completedAt = new Date();

    console.log('Transaction created:', transaction.transactionId);

    // Update dataset statistics
    dataset.statistics.purchases += 1;

    console.log('Purchase completed successfully');
    res.json({
      message: 'Dataset purchased successfully',
      transaction
    });
  } catch (error) {
    console.error('Purchase dataset error:', error);
    res.status(500).json({ error: 'Failed to purchase dataset' });
  }
});

module.exports = router;
