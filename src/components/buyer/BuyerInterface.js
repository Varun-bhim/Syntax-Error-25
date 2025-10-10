import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DownloadManager from './DownloadManager';
import PaymentModal from './PaymentModal';
import './BuyerInterface.css';

const BuyerInterface = ({ user, onPurchaseComplete }) => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const categories = [
    'research', 'business', 'finance', 'healthcare', 'technology',
    'education', 'government', 'environment', 'social', 'other'
  ];

  useEffect(() => {
    fetchDatasets();
    if (user) {
      fetchPurchaseHistory();
    }
  }, [user, filters]);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`http://localhost:5000/api/datasets?${params}`);
      setDatasets(response.data.datasets);
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/transactions/my-transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPurchaseHistory(response.data.transactions);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePurchase = (dataset) => {
    setSelectedDataset(dataset);
    setShowPaymentModal(true);
  };

  const handlePayment = async (paymentData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/datasets/${selectedDataset._id}/purchase`,
        paymentData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Purchase successful! You can now download the dataset.');
      setShowPaymentModal(false);
      setSelectedDataset(null);
      fetchPurchaseHistory();
      onPurchaseComplete && onPurchaseComplete(response.data.transaction);
    } catch (error) {
      console.error('Purchase error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      alert('Purchase failed: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    }
  };

  const formatPrice = (price, currency) => {
    return `${price} ${currency}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="buyer-interface">
      <div className="buyer-header">
        <h2>Data Marketplace</h2>
        <p>Discover and purchase high-quality datasets</p>
      </div>

      <div className="buyer-tabs">
        <button
          className={`tab-button ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          Browse Datasets
        </button>
        <button
          className={`tab-button ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          My Purchases ({purchaseHistory.length})
        </button>
      </div>

      {activeTab === 'browse' && (
        <div className="browse-section">
          <div className="filters-panel">
            <div className="filter-group">
              <input
                type="text"
                placeholder="Search datasets..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="price-input"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="price-input"
              />
            </div>

            <div className="filter-group">
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="filter-select"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="statistics.downloads-desc">Most Popular</option>
              </select>
            </div>
          </div>

          <div className="datasets-grid">
            {loading ? (
              <div className="loading">Loading datasets...</div>
            ) : datasets.length === 0 ? (
              <div className="no-datasets">No datasets found matching your criteria.</div>
            ) : (
              datasets.map(dataset => (
                <div key={dataset._id} className="dataset-card">
                  <div className="dataset-header">
                    <h3 className="dataset-title">{dataset.title}</h3>
                    <div className="dataset-category">{dataset.category}</div>
                  </div>

                  <div className="dataset-description">
                    <p>{dataset.description.substring(0, 120)}...</p>
                  </div>

                  <div className="dataset-meta">
                    <div className="meta-item">
                      <span className="meta-label">Provider:</span>
                      <span className="meta-value">{dataset.provider?.username || 'Sample User'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Files:</span>
                      <span className="meta-value">{dataset.metadata?.fileCount || 0}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Size:</span>
                      <span className="meta-value">{formatFileSize(dataset.metadata?.totalSize || 0)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Downloads:</span>
                      <span className="meta-value">{dataset.statistics?.downloads || 0}</span>
                    </div>
                  </div>

                  <div className="dataset-tags">
                    {(Array.isArray(dataset.tags) ? dataset.tags : (dataset.tags || '').split(',').map(tag => tag.trim()).filter(tag => tag)).slice(0, 3).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>

                  <div className="dataset-footer">
                    <div className="dataset-price">
                      {formatPrice(dataset.price, dataset.currency)}
                    </div>
                    <button
                      className="purchase-btn"
                      onClick={() => handlePurchase(dataset)}
                    >
                      Purchase
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="purchases-section">
          <div className="purchases-header">
            <h3>Your Purchased Datasets</h3>
            <p>Access and download your purchased datasets</p>
          </div>

          {purchaseHistory.length === 0 ? (
            <div className="no-purchases">
              <p>You haven't purchased any datasets yet.</p>
              <button
                className="browse-btn"
                onClick={() => setActiveTab('browse')}
              >
                Browse Datasets
              </button>
            </div>
          ) : (
            <div className="purchases-list">
              {purchaseHistory.map(transaction => (
                <div key={transaction._id} className="purchase-item">
                  <div className="purchase-info">
                    <h4>{transaction.dataset?.title || 'Dataset'}</h4>
                    <p>Purchased on {formatDate(transaction.createdAt)}</p>
                    <p>Amount: {formatPrice(transaction.amount, transaction.currency)}</p>
                    <p>Status: <span className={`status ${transaction.status}`}>{transaction.status}</span></p>
                  </div>
                  <div className="purchase-actions">
                    {transaction.status === 'completed' && transaction.accessGranted && (
                      <DownloadManager 
                        transaction={transaction}
                        onDownload={(transaction) => {
                          console.log('Download completed for transaction:', transaction.transactionId);
                          // Refresh purchase history
                          fetchPurchaseHistory();
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showPaymentModal && selectedDataset && (
        <PaymentModal
          dataset={selectedDataset}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedDataset(null);
          }}
          onPayment={handlePayment}
        />
      )}
    </div>
  );
};

export default BuyerInterface;
