// Simple in-memory database for testing
class MockDatabase {
  constructor() {
    this.users = new Map();
    this.datasets = new Map();
    this.transactions = new Map();
    this.nextUserId = 1;
    this.nextDatasetId = 1;
    this.nextTransactionId = 1;
    
    // Add some sample datasets
    this.initializeSampleData();
  }

  initializeSampleData() {
    // Create sample user
    const sampleUser = this.createUser({
      email: 'sample@example.com',
      password: 'hashedpassword',
      username: 'sampleuser',
      role: 'both',
      walletAddress: '0xSampleProvider123456789'
    });

    // Create sample datasets
    const dataset1 = this.createDataset({
      title: 'E-commerce Sales Data 2024',
      description: 'Comprehensive e-commerce sales data including customer behavior, product performance, and revenue analytics for 2024.',
      category: 'business',
      price: 25.99,
      currency: 'WAL',
      tags: ['ecommerce', 'sales', 'analytics', 'business'],
      license: 'CC BY 4.0',
      language: 'en',
      provider: sampleUser._id
    });

    const dataset2 = this.createDataset({
      title: 'Climate Change Research Dataset',
      description: 'Global temperature and weather patterns data collected from meteorological stations worldwide over the past 50 years.',
      category: 'environment',
      price: 15.50,
      currency: 'WAL',
      tags: ['climate', 'weather', 'research', 'environment'],
      license: 'MIT',
      language: 'en',
      provider: sampleUser._id
    });

    const dataset3 = this.createDataset({
      title: 'Machine Learning Training Data',
      description: 'High-quality labeled dataset for training computer vision models, including 10,000+ images across 20 categories.',
      category: 'technology',
      price: 45.00,
      currency: 'WAL',
      tags: ['machine-learning', 'computer-vision', 'training-data', 'ai'],
      license: 'Apache 2.0',
      language: 'en',
      provider: sampleUser._id
    });

    const dataset4 = this.createDataset({
      title: 'Scientific Research Data Collection',
      description: 'Comprehensive research dataset containing experimental data from various scientific studies including physics, chemistry, and biology experiments.',
      category: 'research',
      price: 35.75,
      currency: 'WAL',
      tags: ['research', 'scientific', 'experimental', 'data'],
      license: 'CC BY-SA 4.0',
      language: 'en',
      provider: sampleUser._id
    });

    // Set sample datasets as published and ensure proper structure
    dataset1.status = 'published';
    dataset1.commission = {
      platformFee: 0.05,
      providerEarning: dataset1.price * 0.95
    };
    
    dataset2.status = 'published';
    dataset2.commission = {
      platformFee: 0.05,
      providerEarning: dataset2.price * 0.95
    };
    
    dataset3.status = 'published';
    dataset3.commission = {
      platformFee: 0.05,
      providerEarning: dataset3.price * 0.95
    };

    dataset4.status = 'published';
    dataset4.commission = {
      platformFee: 0.05,
      providerEarning: dataset4.price * 0.95
    };

    // Create a sample transaction for testing purchases
    const sampleTransaction = this.createTransaction({
      transactionId: 'TXN_' + Date.now(),
      buyer: sampleUser._id,
      seller: sampleUser._id,
      dataset: dataset1._id,
      amount: dataset1.price,
      currency: dataset1.currency,
      platformFee: dataset1.price * 0.05,
      sellerAmount: dataset1.price * 0.95,
      status: 'completed',
      paymentMethod: 'wallet',
      accessGranted: true,
      downloadCount: 0,
      maxDownloads: 1,
      completedAt: new Date()
    });
  }

  // User operations
  createUser(userData) {
    const user = {
      _id: this.nextUserId++,
      ...userData,
      createdAt: new Date(),
      isActive: true
    };
    this.users.set(user._id, user);
    return user;
  }

  findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  findUserById(id) {
    return this.users.get(parseInt(id));
  }

  // Dataset operations
  createDataset(datasetData) {
    const dataset = {
      _id: this.nextDatasetId++,
      ...datasetData,
      status: 'draft',
      visibility: 'public',
      files: [],
      statistics: {
        views: 0,
        downloads: 0,
        purchases: 0
      },
      commission: {
        platformFee: 0.05,
        providerEarning: datasetData.price * 0.95
      },
      metadata: {
        fileCount: 0,
        totalSize: 0,
        lastUpdated: new Date()
      },
      createdAt: new Date()
    };
    this.datasets.set(dataset._id, dataset);
    return dataset;
  }

  findDatasetById(id) {
    return this.datasets.get(parseInt(id));
  }

  updateDataset(id, updates) {
    const dataset = this.datasets.get(parseInt(id));
    if (dataset) {
      Object.assign(dataset, updates);
      dataset.metadata.lastUpdated = new Date();
      return dataset;
    }
    return null;
  }

  deleteDataset(id) {
    const datasetId = parseInt(id);
    if (this.datasets.has(datasetId)) {
      this.datasets.delete(datasetId);
      return true;
    }
    return false;
  }

  findDatasetsByProvider(providerId) {
    const datasets = [];
    for (const dataset of this.datasets.values()) {
      if (dataset.provider === parseInt(providerId)) {
        datasets.push(dataset);
      }
    }
    return datasets;
  }

  // Transaction operations
  createTransaction(transactionData) {
    const transaction = {
      _id: this.nextTransactionId++,
      ...transactionData,
      status: 'pending',
      accessGranted: false,
      downloadCount: 0,
      maxDownloads: 1,
      createdAt: new Date()
    };
    this.transactions.set(transaction._id, transaction);
    return transaction;
  }

  findTransactionById(id) {
    return this.transactions.get(parseInt(id));
  }

  updateTransaction(id, updates) {
    const transaction = this.transactions.get(parseInt(id));
    if (transaction) {
      Object.assign(transaction, updates);
      return transaction;
    }
    return null;
  }
}

module.exports = new MockDatabase();
