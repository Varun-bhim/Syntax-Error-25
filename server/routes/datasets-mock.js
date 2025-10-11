const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mockDb = require('../mock-db');
const WalrusStorageService = require('../services/walrusStorage');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Initialize Walrus storage service
const walrusStorage = new WalrusStorageService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow common data file types
    const allowedTypes = [
      'text/csv',
      'application/json',
      'text/plain',
      'application/xml',
      'text/xml',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'application/zip'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, JSON, TXT, XML, XLSX, PDF, and ZIP files are allowed.'), false);
    }
  }
});

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
    const datasetId = parseInt(req.params.id);
    const dataset = mockDb.findDatasetById(datasetId);

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

// Upload files to dataset (Walrus storage integration)
router.post('/:id/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const datasetId = parseInt(req.params.id);
    const dataset = mockDb.findDatasetById(datasetId);

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    if (dataset.provider !== req.user._id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    console.log(`Uploading ${req.files.length} files to Walrus for dataset ${datasetId}`);

    // Upload files to Walrus storage
    const uploadedFiles = [];
    for (const file of req.files) {
      try {
        const blobInfo = await walrusStorage.uploadFile(file.buffer, file.originalname, {
          contentType: file.mimetype,
          datasetId: datasetId,
          provider: req.user._id
        });
        
        uploadedFiles.push({
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
          walrusBlobId: blobInfo.blobId,
          checksum: blobInfo.checksum,
          uploadedAt: blobInfo.uploadedAt,
          walrusUrl: blobInfo.walrusUrl
        });
      } catch (error) {
        console.error(`Error uploading file ${file.originalname}:`, error);
        return res.status(500).json({ 
          error: `Failed to upload file ${file.originalname}: ${error.message}` 
        });
      }
    }

    // Update dataset with file information
    dataset.files.push(...uploadedFiles);
    dataset.metadata.fileCount = dataset.files.length;
    dataset.metadata.totalSize = dataset.files.reduce((sum, file) => sum + file.size, 0);
    dataset.metadata.lastUpdated = new Date();

    console.log(`Successfully uploaded ${uploadedFiles.length} files to Walrus`);

    res.json({
      message: 'Files uploaded successfully to Walrus storage',
      files: uploadedFiles,
      totalFiles: dataset.files.length,
      totalSize: dataset.metadata.totalSize
    });
  } catch (error) {
    console.error('Upload files error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Update dataset
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const datasetId = parseInt(req.params.id);
    const dataset = mockDb.findDatasetById(datasetId);

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    if (dataset.provider !== req.user._id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = req.body;
    delete updates.provider; // Prevent changing provider
    delete updates.files; // Use separate endpoint for file management
    
    const updatedDataset = mockDb.updateDataset(datasetId, updates);

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

    // Ensure metadata is accurate for each dataset
    const datasetsWithAccurateMetadata = datasets.map(dataset => {
      const totalSize = dataset.files?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
      const fileCount = dataset.files?.length || 0;
      
      return {
        ...dataset,
        metadata: {
          ...dataset.metadata,
          totalSize: totalSize,
          fileCount: fileCount,
          lastUpdated: new Date()
        }
      };
    });

    res.json({
      datasets: datasetsWithAccurateMetadata,
      pagination: {
        current: 1,
        pages: 1,
        total: datasetsWithAccurateMetadata.length
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
    const datasetId = parseInt(req.params.id);
    const dataset = mockDb.findDatasetById(datasetId);
    
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    if (dataset.provider === req.user._id) {
      return res.status(400).json({ error: 'Cannot purchase your own dataset' });
    }

    if (dataset.status !== 'published') {
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

    // Update dataset statistics
    dataset.statistics.purchases += 1;

    res.json({
      message: 'Dataset purchased successfully',
      transaction
    });
  } catch (error) {
    console.error('Purchase dataset error:', error);
    res.status(500).json({ error: 'Failed to purchase dataset' });
  }
});

// Download dataset file (Walrus storage integration)
router.get('/:id/download/:blobId', authenticateToken, async (req, res) => {
  try {
    const datasetId = parseInt(req.params.id);
    const blobId = req.params.blobId;
    const dataset = mockDb.findDatasetById(datasetId);

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Find the file in the dataset
    const file = dataset.files.find(f => f.walrusBlobId === blobId);
    if (!file) {
      return res.status(404).json({ error: 'File not found in dataset' });
    }

    // Check if user has access to this dataset
    const hasAccess = await checkDatasetAccess(datasetId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied. You need to purchase this dataset first.' });
    }

    console.log(`Downloading file ${file.name} (${blobId}) from Walrus`);

    // Download file from Walrus storage
    const fileContent = await walrusStorage.downloadFile(blobId);

    // Update download count
    file.downloadCount = (file.downloadCount || 0) + 1;
    dataset.statistics.downloads += 1;

    // Update transaction download count if this is a purchased dataset
    const transactions = Array.from(mockDb.transactions.values());
    const purchaseTransaction = transactions.find(t => 
      t.dataset === datasetId && 
      t.buyer === req.user._id && 
      t.status === 'completed'
    );
    
    if (purchaseTransaction) {
      purchaseTransaction.downloadCount = (purchaseTransaction.downloadCount || 0) + 1;
      console.log(`Updated download count for transaction ${purchaseTransaction._id}: ${purchaseTransaction.downloadCount}`);
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Length', fileContent.length);
    res.setHeader('X-File-Name', file.name);
    res.setHeader('X-File-Size', file.size);

    res.send(fileContent);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Get dataset details with file information
router.get('/:id/details', authenticateToken, async (req, res) => {
  try {
    const datasetId = parseInt(req.params.id);
    const dataset = mockDb.findDatasetById(datasetId);

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Check if user has access to this dataset
    const hasAccess = await checkDatasetAccess(datasetId, req.user._id);
    
    // Get detailed file information from Walrus
    const detailedFiles = [];
    for (const file of dataset.files) {
      try {
        const metadata = await walrusStorage.getBlobMetadata(file.walrusBlobId);
        detailedFiles.push({
          ...file,
          walrusMetadata: metadata,
          downloadUrl: hasAccess ? `/api/datasets/${datasetId}/download/${file.walrusBlobId}` : null
        });
      } catch (error) {
        console.error(`Error getting metadata for ${file.walrusBlobId}:`, error);
        detailedFiles.push({
          ...file,
          walrusMetadata: null,
          downloadUrl: hasAccess ? `/api/datasets/${datasetId}/download/${file.walrusBlobId}` : null
        });
      }
    }

    // Recalculate metadata to ensure accuracy
    const totalSize = detailedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
    const fileCount = detailedFiles.length;

    const datasetDetails = {
      ...dataset,
      files: detailedFiles,
      hasAccess: hasAccess,
      accessInfo: hasAccess ? await getAccessInfo(datasetId, req.user._id) : null,
      metadata: {
        ...dataset.metadata,
        totalSize: totalSize,
        fileCount: fileCount,
        lastUpdated: new Date()
      }
    };

    res.json({ dataset: datasetDetails });

  } catch (error) {
    console.error('Get dataset details error:', error);
    res.status(500).json({ error: 'Failed to get dataset details' });
  }
});

// Helper function to check if user has access to dataset
async function checkDatasetAccess(datasetId, userId) {
  try {
    // Check if user is the provider
    const dataset = mockDb.findDatasetById(datasetId);
    if (dataset.provider === userId) {
      return true;
    }

    // Check if user has purchased this dataset
    const transactions = Array.from(mockDb.transactions.values());
    const purchaseTransaction = transactions.find(t => 
      t.dataset === datasetId && 
      t.buyer === userId && 
      t.status === 'completed' && 
      t.accessGranted
    );

    return !!purchaseTransaction;
  } catch (error) {
    console.error('Error checking dataset access:', error);
    return false;
  }
}

// Helper function to get access information
async function getAccessInfo(datasetId, userId) {
  try {
    const transactions = Array.from(mockDb.transactions.values());
    const purchaseTransaction = transactions.find(t => 
      t.dataset === datasetId && 
      t.buyer === userId && 
      t.status === 'completed'
    );

    if (purchaseTransaction) {
      return {
        purchasedAt: purchaseTransaction.createdAt,
        downloadCount: purchaseTransaction.downloadCount || 0,
        maxDownloads: purchaseTransaction.maxDownloads || 5,
        accessExpiry: purchaseTransaction.accessExpiry,
        remainingDownloads: (purchaseTransaction.maxDownloads || 5) - (purchaseTransaction.downloadCount || 0)
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting access info:', error);
    return null;
  }
}

// Delete dataset
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const datasetId = parseInt(req.params.id);
    const dataset = mockDb.findDatasetById(datasetId);

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Check if user owns this dataset
    if (dataset.provider !== req.user._id) {
      return res.status(403).json({ error: 'You can only delete your own datasets' });
    }

    // Delete files from Walrus storage
    for (const file of dataset.files) {
      try {
        // In a real implementation, you would delete from Walrus storage here
        // For now, we'll just log the deletion
        console.log(`Deleting file ${file.walrusBlobId} from Walrus storage`);
      } catch (error) {
        console.error(`Error deleting file ${file.walrusBlobId}:`, error);
        // Continue with dataset deletion even if file deletion fails
      }
    }

    // Delete dataset from mock database
    const deleted = mockDb.deleteDataset(datasetId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    res.json({ 
      message: 'Dataset deleted successfully',
      datasetId: datasetId
    });

  } catch (error) {
    console.error('Delete dataset error:', error);
    res.status(500).json({ error: 'Failed to delete dataset' });
  }
});

module.exports = router;
