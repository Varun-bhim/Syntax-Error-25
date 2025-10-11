const express = require('express');
const multer = require('multer');
const Dataset = require('../models/Dataset');
const Transaction = require('../models/Transaction');
const { authenticateToken, optionalAuth, requireRole, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common data file types
    const allowedTypes = [
      'text/csv',
      'application/json',
      'application/xml',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Get all datasets (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      status: 'published',
      visibility: 'public'
    };

    // Apply filters
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Search functionality - use regex for more flexible search
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const datasets = await Dataset.find(query)
      .populate('provider', 'username profile reputation walletAddress')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Dataset.countDocuments(query);

    res.json({
      datasets,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get datasets error:', error);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

// Get category statistics
router.get('/stats/categories', async (req, res) => {
  try {
    const categoryStats = await Dataset.aggregate([
      { 
        $match: { 
          status: 'published', 
          visibility: 'public' 
        } 
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Convert to object format for easier frontend usage
    const categoryCounts = {};
    categoryStats.forEach(stat => {
      categoryCounts[stat._id] = stat.count;
    });

    res.json({ categoryCounts });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ error: 'Failed to fetch category statistics' });
  }
});

// Get single dataset
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id)
      .populate('provider', 'username profile reputation walletAddress')
      .populate('statistics.reviewCount');

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Check access permissions
    if (dataset.visibility === 'private' && 
        (!req.user || dataset.provider._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Increment view count
    await Dataset.findByIdAndUpdate(req.params.id, {
      $inc: { 'statistics.views': 1 }
    });

    console.log('Dataset fetched for payment:', {
      id: dataset._id,
      provider: dataset.provider,
      providerId: dataset.provider?._id
    });

    res.json({ dataset });
  } catch (error) {
    console.error('Get dataset error:', error);
    res.status(500).json({ error: 'Failed to fetch dataset' });
  }
});

// Create new dataset
router.post('/', authenticateToken, requireRole(['provider', 'both']), async (req, res) => {
  try {
    console.log('Dataset creation attempt:', {
      user: req.user?.email,
      role: req.user?.role,
      title: req.body.title,
      category: req.body.category
    });
    
    const datasetData = {
      ...req.body,
      provider: req.user._id,
      commission: {
        platformFee: 0.05, // 5% platform fee
        providerEarning: req.body.price * 0.95 // 95% goes to provider
      }
    };

    const dataset = new Dataset(datasetData);
    await dataset.save();
    
    console.log('Dataset created successfully:', dataset._id);

    res.status(201).json({
      message: 'Dataset created successfully',
      dataset
    });
  } catch (error) {
    console.error('Create dataset error:', error);
    res.status(500).json({ error: 'Failed to create dataset' });
  }
});

// Upload files to dataset
router.post('/:id/upload', authenticateToken, requireOwnership(Dataset), upload.array('files'), async (req, res) => {
  try {
    const dataset = req.resource;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process files and upload to Walrus (placeholder for now)
    const uploadedFiles = files.map(file => ({
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      walrusBlobId: `blob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Placeholder
      checksum: 'placeholder_checksum',
      uploadedAt: new Date()
    }));

    // Update dataset with file information
    const updatedFiles = [...(dataset.files || []), ...uploadedFiles];
    
    const updatedMetadata = {
      ...dataset.metadata,
      fileCount: updatedFiles.length,
      totalSize: updatedFiles.reduce((sum, file) => sum + file.size, 0),
      lastUpdated: new Date()
    };

    const updatedDataset = await Dataset.findByIdAndUpdate(
      dataset._id,
      {
        files: updatedFiles,
        metadata: updatedMetadata
      },
      { new: true }
    );

    res.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload files error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Update dataset
router.put('/:id', authenticateToken, requireOwnership(Dataset), async (req, res) => {
  try {
    const updates = req.body;
    delete updates.provider; // Prevent changing provider
    delete updates.files; // Use separate endpoint for file management

    const dataset = await Dataset.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Dataset updated successfully',
      dataset
    });
  } catch (error) {
    console.error('Update dataset error:', error);
    res.status(500).json({ error: 'Failed to update dataset' });
  }
});

// Delete dataset
router.delete('/:id', authenticateToken, requireOwnership(Dataset), async (req, res) => {
  try {
    await Dataset.findByIdAndDelete(req.params.id);
    res.json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    console.error('Delete dataset error:', error);
    res.status(500).json({ error: 'Failed to delete dataset' });
  }
});

// Get user's datasets
router.get('/user/my-datasets', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { provider: req.user._id };
    if (status) query.status = status;

    const datasets = await Dataset.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Dataset.countDocuments(query);

    res.json({
      datasets,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
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
    const dataset = await Dataset.findById(req.params.id);
    
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    if (dataset.provider.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot purchase your own dataset' });
    }

    if (dataset.status !== 'published') {
      return res.status(400).json({ error: 'Dataset is not available for purchase' });
    }

    // Check if already purchased
    const existingTransaction = await Transaction.findOne({
      buyer: req.user._id,
      dataset: dataset._id,
      status: 'completed'
    });

    if (existingTransaction) {
      return res.status(400).json({ error: 'Dataset already purchased' });
    }

    // Create transaction
    const transaction = new Transaction({
      transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      buyer: req.user._id,
      seller: dataset.provider,
      dataset: dataset._id,
      amount: dataset.price,
      currency: dataset.currency,
      platformFee: dataset.commission.platformFee * dataset.price,
      sellerAmount: dataset.commission.providerEarning,
      paymentMethod: 'wallet',
      walletAddress: {
        buyer: req.user.walletAddress,
        seller: dataset.provider.walletAddress
      }
    });

    await transaction.save();

    // TODO: Process actual payment here
    // For now, mark as completed
    transaction.status = 'completed';
    transaction.accessGranted = true;
    transaction.completedAt = new Date();
    await transaction.save();

    // Update dataset statistics
    await Dataset.findByIdAndUpdate(dataset._id, {
      $inc: { 'statistics.purchases': 1 }
    });

    res.json({
      message: 'Dataset purchased successfully',
      transaction
    });
  } catch (error) {
    console.error('Purchase dataset error:', error);
    res.status(500).json({ error: 'Failed to purchase dataset' });
  }
});

// Download dataset files
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Check if user has access
    const transaction = await Transaction.findOne({
      buyer: req.user._id,
      dataset: dataset._id,
      status: 'completed',
      accessGranted: true
    });

    if (!transaction && dataset.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. Purchase required.' });
    }

    // Update download count
    if (transaction) {
      transaction.downloadCount += 1;
      await transaction.save();
    }

    await Dataset.findByIdAndUpdate(dataset._id, {
      $inc: { 'statistics.downloads': 1 }
    });

    // TODO: Implement actual file download from Walrus
    res.json({
      message: 'Download access granted',
      files: dataset.files,
      downloadUrl: 'placeholder_download_url'
    });
  } catch (error) {
    console.error('Download dataset error:', error);
    res.status(500).json({ error: 'Failed to download dataset' });
  }
});

// Get dataset details with access check
router.get('/:id/details', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const dataset = await Dataset.findById(id)
      .populate('provider', 'username email')
      .populate('reviews.user', 'username');

    if (!dataset) {
      return res.status(404).json({ success: false, error: 'Dataset not found' });
    }

    // Check if user has access (either owner or has purchased)
    const hasAccess = dataset.provider._id.toString() === userId.toString() || 
                     await Transaction.findOne({ 
                       dataset: id, 
                       buyer: userId, 
                       status: 'completed',
                       accessGranted: true 
                     });

    res.json({
      success: true,
      dataset: {
        ...dataset.toObject(),
        hasAccess: !!hasAccess
      }
    });

  } catch (error) {
    console.error('Error getting dataset details:', error);
    res.status(500).json({ success: false, error: 'Failed to get dataset details' });
  }
});

// Download dataset file
router.get('/:id/download/:blobId', authenticateToken, async (req, res) => {
  try {
    const { id, blobId } = req.params;
    const userId = req.user._id;

    // Find the dataset
    const dataset = await Dataset.findById(id).populate('provider', 'username email');
    if (!dataset) {
      return res.status(404).json({ success: false, error: 'Dataset not found' });
    }

    // Check if user has access to download (either owner or has purchased)
    const hasAccess = dataset.provider._id.toString() === userId.toString() || 
                     await Transaction.findOne({ 
                       dataset: id, 
                       buyer: userId, 
                       status: 'completed',
                       accessGranted: true 
                     });

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied. You must purchase this dataset to download it.' });
    }

    // Find the specific file
    const file = dataset.files.find(f => f.walrusBlobId === blobId);
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Create mock file content based on file type
    let fileContent;
    let contentType = 'application/octet-stream';
    
    if (file.name.endsWith('.csv')) {
      contentType = 'text/csv';
      fileContent = `Name,Age,City\nJohn,25,New York\nJane,30,Los Angeles\nBob,35,Chicago`;
    } else if (file.name.endsWith('.json')) {
      contentType = 'application/json';
      fileContent = JSON.stringify({
        "dataset": file.name,
        "description": "Sample dataset file",
        "data": [
          {"id": 1, "value": "Sample 1"},
          {"id": 2, "value": "Sample 2"},
          {"id": 3, "value": "Sample 3"}
        ]
      }, null, 2);
    } else if (file.name.endsWith('.txt')) {
      contentType = 'text/plain';
      fileContent = `This is a sample text file: ${file.name}\n\nContent:\n- Line 1\n- Line 2\n- Line 3`;
    } else {
      fileContent = `Sample data file: ${file.name}\nSize: ${file.size} bytes\nType: ${file.type}`;
    }
    
    const fileData = Buffer.from(fileContent, 'utf8');
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Length', fileData.length);
    
    res.send(fileData);

    // Log the download
    console.log(`File downloaded: ${file.name} by user ${userId} from dataset ${id}`);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ success: false, error: 'Failed to download file' });
  }
});

module.exports = router;
