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
    // No sample data - start with empty database
    // Users and datasets will be created through the application
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
