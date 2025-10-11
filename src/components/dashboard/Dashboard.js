import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import UploadDataset from '../upload/UploadDataset';
import './Dashboard.css';

// Edit Dataset Form Component
const EditDatasetForm = ({ dataset, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    title: dataset.title || '',
    description: dataset.description || '',
    category: dataset.category || '',
    price: dataset.price || '',
    currency: dataset.currency || 'WAL',
    tags: dataset.tags || '',
    license: dataset.license || '',
    language: dataset.language || 'en'
  });
  const [updating, setUpdating] = useState(false);

  const categories = [
    'research', 'business', 'finance', 'healthcare', 'technology',
    'education', 'government', 'environment', 'social', 'other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await onUpdate(formData);
    } catch (error) {
      console.error('Error updating dataset:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-form">
      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          className="form-textarea"
          rows="4"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="form-select"
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="price">Price *</label>
          <div className="price-input-group">
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="form-input"
            />
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="WAL">WAL</option>
              <option value="SUI">SUI</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="tags">Tags</label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleInputChange}
          className="form-input"
          placeholder="Enter tags separated by commas"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="license">License</label>
          <input
            type="text"
            id="license"
            name="license"
            value={formData.license}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g., MIT, CC BY 4.0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="language">Language</label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleInputChange}
            className="form-select"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={updating}
          className="btn-primary"
        >
          {updating ? 'Updating...' : 'Update Dataset'}
        </button>
      </div>
    </form>
  );
};

// Dataset Details View Component
const DatasetDetailsView = ({ dataset }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="dataset-details">
      <div className="details-section">
        <h4>Basic Information</h4>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Title:</span>
            <span className="detail-value">{dataset.title}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Category:</span>
            <span className="detail-value">{dataset.category}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Price:</span>
            <span className="detail-value">{dataset.price} {dataset.currency}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className={`status-badge ${dataset.status}`}>{dataset.status}</span>
          </div>
        </div>
      </div>

      <div className="details-section">
        <h4>Description</h4>
        <p className="description-text">{dataset.description}</p>
      </div>

      <div className="details-section">
        <h4>Metadata</h4>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Tags:</span>
            <span className="detail-value">{dataset.tags || 'None'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">License:</span>
            <span className="detail-value">{dataset.license || 'Not specified'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Language:</span>
            <span className="detail-value">{dataset.language}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Created:</span>
            <span className="detail-value">{formatDate(dataset.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="details-section">
        <h4>Files ({dataset.files?.length || 0})</h4>
        {dataset.files && dataset.files.length > 0 ? (
          <div className="files-list">
            {dataset.files.map((file, index) => (
              <div key={index} className="file-item">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-files">No files uploaded</p>
        )}
      </div>

      <div className="details-section">
        <h4>Statistics</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Downloads:</span>
            <span className="stat-value">{dataset.downloadCount || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Size:</span>
            <span className="stat-value">{formatFileSize(
              dataset.files?.reduce((total, file) => total + (file.size || 0), 0) || 
              dataset.metadata?.totalSize || 0
            )}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Files Count:</span>
            <span className="stat-value">{dataset.files?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalDatasets: 0,
    totalSales: 0,
    totalEarnings: 0,
  });
  const [userDatasets, setUserDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [editingDataset, setEditingDataset] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const [datasetsRes, transactionsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/datasets/user/my-datasets', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/transactions/stats/overview', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats({
        totalDatasets: datasetsRes.data.pagination.total,
        totalSales: transactionsRes.data.sales.totalSales,
        totalEarnings: transactionsRes.data.sales.totalEarned,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };


  const fetchUserDatasets = useCallback(async () => {
    try {
      setLoadingDatasets(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/datasets/user/my-datasets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUserDatasets(response.data.datasets);
    } catch (error) {
      console.error('Error fetching user datasets:', error);
    } finally {
      setLoadingDatasets(false);
    }
  }, []);

  const fetchSalesData = useCallback(async () => {
    try {
      setLoadingSales(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/transactions/my-transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter only completed sales (where user is the seller)
      const sales = response.data.transactions.filter(
        transaction => transaction.seller === user.id && transaction.status === 'completed'
      );
      
      setSalesData(sales);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoadingSales(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'datasets') {
      fetchUserDatasets();
    } else if (activeTab === 'sales') {
      fetchSalesData();
    }
  }, [activeTab, user.id, fetchUserDatasets, fetchSalesData]);

  // Auto-refresh data every 30 seconds when on relevant tabs
  useEffect(() => {
    const tabsToAutoRefresh = ['datasets', 'sales'];
    if (!tabsToAutoRefresh.includes(activeTab)) return;

    const interval = setInterval(() => {
      setLastRefreshTime(new Date());
      if (activeTab === 'datasets') {
        fetchUserDatasets();
      } else if (activeTab === 'sales') {
        fetchSalesData();
      }
      // Also refresh dashboard stats
      fetchDashboardStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [activeTab, fetchUserDatasets, fetchSalesData, fetchDashboardStats]);

  const handleDownloadOwnDataset = async (dataset) => {
    try {
      if (!dataset.files || dataset.files.length === 0) {
        alert('No files available for download');
        return;
      }

      const token = localStorage.getItem('token');
      
      // If there's only one file, download it directly
      if (dataset.files.length === 1) {
        const file = dataset.files[0];
        await downloadFile(dataset._id, file.walrusBlobId, file.name, token);
      } else {
        // If multiple files, show a modal to select which file to download
        await showFileSelectionModal(dataset.files, dataset._id, token);
      }

    } catch (error) {
      console.error('Error downloading dataset:', error);
      alert('Failed to download dataset: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDownloadDataset = async (transaction) => {
    try {
      if (!transaction.dataset || !transaction.dataset._id) {
        alert('Dataset information not available');
        return;
      }
      console.log(transaction);

      const token = localStorage.getItem('token');
      
      // Get dataset details first to get file information
      const detailsResponse = await axios.get(`http://localhost:5000/api/datasets/${transaction.dataset._id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(detailsResponse);

      const dataset = detailsResponse.data.dataset;
      console.log(dataset);

      if (!dataset.hasAccess) {
        alert('You do not have access to download this dataset');
        return;
      }

      if (dataset.files.length === 0) {
        alert('No files available for download');
        return;
      }

      // If there's only one file, download it directly
      if (dataset.files.length === 1) {
        const file = dataset.files[0];
        await downloadFile(transaction.dataset._id, file.walrusBlobId, file.name, token);
      } else {
        // If multiple files, show a modal to select which file to download
        await showFileSelectionModal(dataset.files, transaction.dataset._id, token);
      }

    } catch (error) {
      console.error('Error downloading dataset:', error);
      alert('Failed to download dataset: ' + (error.response?.data?.error || error.message));
    }
  };

  const downloadFile = async (datasetId, blobId, fileName, token) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/datasets/${datasetId}/download/${blobId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(`File "${fileName}" downloaded successfully!`);
      
      // Refresh data after successful download
      refreshDataAfterDownload();
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  };

  const refreshDataAfterDownload = () => {
    // Update last refresh time
    setLastRefreshTime(new Date());
    
    // Refresh dashboard stats
    fetchDashboardStats();
    
    // Refresh current tab data
    if (activeTab === 'datasets') {
      fetchUserDatasets();
    } else if (activeTab === 'sales') {
      fetchSalesData();
    }
  };

  const showFileSelectionModal = async (files, datasetId, token) => {
    const selectedFile = prompt(
      `Multiple files available. Please enter the file number to download:\n\n${files.map((file, index) => `${index + 1}. ${file.name}`).join('\n')}\n\nEnter file number (1-${files.length}):`
    );

    if (selectedFile) {
      const fileIndex = parseInt(selectedFile) - 1;
      if (fileIndex >= 0 && fileIndex < files.length) {
        const file = files[fileIndex];
        try {
          await downloadFile(datasetId, file.walrusBlobId, file.name, token);
        } catch (error) {
          console.error('Error downloading selected file:', error);
        }
      } else {
        alert('Invalid file number selected');
      }
    }
  };

  const handleViewDetails = async (transaction) => {
    try {
      if (!transaction.dataset || !transaction.dataset._id) {
        alert('Dataset information not available');
        return;
      }

      const token = localStorage.getItem('token');
      
      // Get detailed dataset information
      const response = await axios.get(`http://localhost:5000/api/datasets/${transaction.dataset._id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const dataset = response.data.dataset;
      showDatasetDetailsModal(dataset, transaction);

    } catch (error) {
      console.error('Error getting dataset details:', error);
      alert('Failed to get dataset details: ' + (error.response?.data?.error || error.message));
    }
  };

  const showDatasetDetailsModal = (dataset, transaction) => {
    const accessInfo = dataset.accessInfo;
    const filesList = dataset.files.map(file => 
      `• ${file.name} (${formatFileSize(file.size)}) - ${file.type}`
    ).join('\n');

    const details = `
Dataset: ${dataset.title}
Category: ${dataset.category}
Description: ${dataset.description}
Price: ${formatPrice(dataset.price, dataset.currency)}
Provider: ${dataset.provider?.username || 'Unknown'}

Files (${dataset.files.length}):
${filesList}

Access Information:
• Purchased: ${formatDate(accessInfo?.purchasedAt || transaction.createdAt)}
• Downloads Used: ${accessInfo?.downloadCount || 0} / ${accessInfo?.maxDownloads || 5}
• Remaining Downloads: ${accessInfo?.remainingDownloads || 5}
• Access Expires: ${accessInfo?.accessExpiry ? formatDate(accessInfo.accessExpiry) : 'Never'}

Status: ${transaction.status}
Access Granted: ${transaction.accessGranted ? 'Yes' : 'No'}
    `;

    alert(details);
  };

  const showTransactionDetails = (transaction) => {
    const dataset = transaction.dataset;
    const earnings = transaction.sellerAmount || transaction.amount * 0.95;
    const platformFee = transaction.platformFee || transaction.amount * 0.05;

    const details = `
Transaction Details:
• Transaction ID: ${transaction._id}
• Date: ${formatDate(transaction.createdAt)}
• Status: ${transaction.status}

Dataset Information:
• Title: ${dataset?.title || 'Unknown'}
• Category: ${dataset?.category || 'Unknown'}
• Price: ${formatPrice(transaction.amount, transaction.currency)}

Financial Details:
• Total Amount: ${formatPrice(transaction.amount, transaction.currency)}
• Your Earnings: ${formatPrice(earnings, transaction.currency)}
• Platform Fee: ${formatPrice(platformFee, transaction.currency)}
• Fee Percentage: 5%

Buyer Information:
• Buyer: ${transaction.buyer?.username || 'Unknown'}
• Buyer ID: ${transaction.buyer}

Transaction Status:
• Access Granted: ${transaction.accessGranted ? 'Yes' : 'No'}
• Downloads Used: ${transaction.downloadCount || 0}
• Max Downloads: ${transaction.maxDownloads || 1}
    `;

    alert(details);
  };

  const handleUploadComplete = () => {
    // Refresh dashboard stats and datasets
    fetchDashboardStats();
    if (activeTab === 'datasets') {
      fetchUserDatasets();
    }
  };

  const handleSaleUpdate = () => {
    // Refresh sales data when a new sale occurs
    if (activeTab === 'sales') {
      fetchSalesData();
    }
    // Also refresh dashboard stats to update earnings
    fetchDashboardStats();
  };

  const handleRefreshSales = () => {
    fetchSalesData();
    fetchDashboardStats();
  };

  const handleEditDataset = (dataset) => {
    setEditingDataset(dataset);
  };

  const handleViewDatasetDetails = (dataset) => {
    setSelectedDataset(dataset);
    setShowDetailsModal(true);
  };

  const handleUpdateDataset = async (updatedData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/datasets/${editingDataset._id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh datasets list
      fetchUserDatasets();
      setEditingDataset(null);
      alert('Dataset updated successfully!');
    } catch (error) {
      console.error('Error updating dataset:', error);
      alert('Failed to update dataset: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteDataset = async (dataset) => {
    // Use window.confirm to avoid ESLint no-restricted-globals error
    if (!window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/datasets/${dataset._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh datasets list and stats
      fetchUserDatasets();
      fetchDashboardStats();
      alert('Dataset deleted successfully!');
    } catch (error) {
      console.error('Error deleting dataset:', error);
      alert('Failed to delete dataset: ' + (error.response?.data?.error || error.message));
    }
  };

  const formatPrice = (price, currency) => {
    return `${price} ${currency}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'datasets', label: 'My Datasets', icon: '📁' },
    { id: 'sales', label: 'Sales', icon: '💰' },
    { id: 'upload', label: 'Upload Dataset', icon: '⬆️' }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-info">
          <h2>Welcome back, {user.username}!</h2>
          <p>Manage your data marketplace activities</p>
        </div>
      </div>

      <div className="dashboard-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📁</div>
                <div className="stat-info">
                  <h3>{stats.totalDatasets}</h3>
                  <p>My Datasets</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>{stats.totalSales}</h3>
                  <p>Total Sales</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💵</div>
                <div className="stat-info">
                  <h3>{stats.totalEarnings.toFixed(2)} WAL</h3>
                  <p>Total Earnings</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'datasets' && (
          <div className="datasets-section">
            <div className="datasets-header">
              <div className="header-content">
                <div>
                  <h3>My Datasets</h3>
                  <p>Manage your uploaded datasets</p>
                </div>
                <div className="refresh-section">
                  <button 
                    className="refresh-btn"
                    onClick={() => {
                      setLastRefreshTime(new Date());
                      fetchUserDatasets();
                      fetchDashboardStats();
                    }}
                    disabled={loadingDatasets}
                  >
                    {loadingDatasets ? '⏳' : '🔄'} Refresh
                  </button>
                  {lastRefreshTime && (
                    <div className="last-refresh">
                      Last updated: {lastRefreshTime.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {loadingDatasets ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading your datasets...</p>
              </div>
            ) : userDatasets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <h4>No datasets yet</h4>
                <p>Upload your first dataset to get started</p>
                <button 
                  className="btn-primary"
                  onClick={() => setActiveTab('upload')}
                >
                  Upload Dataset
                </button>
              </div>
            ) : (
              <div className="datasets-grid">
                {userDatasets.map(dataset => (
                  <div key={dataset._id} className="dataset-card">
                    <div className="dataset-header">
                      <h4>{dataset.title}</h4>
                      <span className={`status-badge ${dataset.status}`}>
                        {dataset.status}
                      </span>
                    </div>
                    
                    <div className="dataset-info">
                      <p className="dataset-description">{dataset.description}</p>
                      <div className="dataset-meta">
                        <span className="category">{dataset.category}</span>
                        <span className="price">{formatPrice(dataset.price, dataset.currency)}</span>
                        <span className="date">{formatDate(dataset.createdAt)}</span>
                      </div>
                      
                      <div className="dataset-stats">
                        <div className="stat">
                          <span className="stat-label">Files:</span>
                          <span className="stat-value">{dataset.files?.length || 0}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Size:</span>
                          <span className="stat-value">{formatFileSize(
                            dataset.files?.reduce((total, file) => total + (file.size || 0), 0) || 
                            dataset.metadata?.totalSize || 0
                          )}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Downloads:</span>
                          <span className="stat-value">{dataset.downloadCount || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="dataset-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => handleEditDataset(dataset)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-primary"
                        onClick={() => handleViewDatasetDetails(dataset)}
                      >
                        View Details
                      </button>
                      <button 
                        className="btn-success"
                        onClick={() => handleDownloadOwnDataset(dataset)}
                        style={{ background: '#28a745', color: 'white' }}
                      >
                        📥 Download
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={() => handleDeleteDataset(dataset)}
                        style={{ background: '#dc3545', color: 'white' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {activeTab === 'sales' && (
          <div className="sales-section">
            <div className="sales-header">
              <div className="header-content">
                <div>
                  <h3>My Sales</h3>
                  <p>Track your dataset sales and earnings</p>
                </div>
                <div className="refresh-section">
                  <button 
                    className="refresh-btn"
                    onClick={handleRefreshSales}
                    disabled={loadingSales}
                  >
                    {loadingSales ? '⏳' : '🔄'} Refresh
                  </button>
                  {lastRefreshTime && (
                    <div className="last-refresh">
                      Last updated: {lastRefreshTime.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loadingSales ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading your sales...</p>
              </div>
            ) : salesData.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💰</div>
                <h4>No sales yet</h4>
                <p>Your datasets haven't been purchased yet. Keep uploading quality datasets to attract buyers!</p>
                <button 
                  className="btn-primary"
                  onClick={() => setActiveTab('upload')}
                >
                  Upload Dataset
                </button>
              </div>
            ) : (
              <div className="sales-list">
                {salesData.map(transaction => (
                  <div key={transaction._id} className="sale-item">
                    <div className="sale-info">
                      <div className="dataset-header">
                        <h4>{transaction.dataset?.title || 'Dataset'}</h4>
                        <span className="sale-date">
                          Sold on {formatDate(transaction.createdAt)}
                        </span>
                      </div>
                      
                      <div className="sale-details">
                        <div className="detail-item">
                          <span className="label">Buyer:</span>
                          <span className="value">{transaction.buyer?.username || 'Unknown'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Amount:</span>
                          <span className="value">{formatPrice(transaction.amount, transaction.currency)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Your Earnings:</span>
                          <span className="value earnings">{formatPrice(transaction.sellerAmount || transaction.amount * 0.95, transaction.currency)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Platform Fee:</span>
                          <span className="value fee">{formatPrice(transaction.platformFee || transaction.amount * 0.05, transaction.currency)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Status:</span>
                          <span className={`status ${transaction.status}`}>{transaction.status}</span>
                        </div>
                        {transaction.dataset?.category && (
                          <div className="detail-item">
                            <span className="label">Category:</span>
                            <span className="value">{transaction.dataset.category}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="sale-actions">
                      <div className="action-buttons">
                        <button 
                          className="view-dataset-btn"
                          onClick={() => handleViewDatasetDetails(transaction.dataset)}
                        >
                          👁️ View Dataset
                        </button>
                        <button 
                          className="view-transaction-btn"
                          onClick={() => showTransactionDetails(transaction)}
                        >
                          📋 Transaction Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="upload-section">
            <UploadDataset 
              user={user} 
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}
      </div>

      {/* Edit Dataset Modal */}
      {editingDataset && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Dataset</h3>
              <button 
                className="modal-close"
                onClick={() => setEditingDataset(null)}
              >
                ✕
              </button>
            </div>
            <EditDatasetForm 
              dataset={editingDataset}
              onUpdate={handleUpdateDataset}
              onCancel={() => setEditingDataset(null)}
            />
          </div>
        </div>
      )}

      {/* Dataset Details Modal */}
      {showDetailsModal && selectedDataset && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Dataset Details</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDataset(null);
                }}
              >
                ✕
              </button>
            </div>
            <DatasetDetailsView dataset={selectedDataset} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
