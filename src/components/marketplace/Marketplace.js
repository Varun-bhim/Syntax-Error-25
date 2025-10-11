import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentModal from '../wallet/PaymentModal';
import walletManager from '../../services/walletManager';
import './Marketplace.css';

const Marketplace = ({ user, onPurchase }) => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [walletStatus, setWalletStatus] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);

  const categories = [
    'research', 'business', 'finance', 'healthcare', 'technology',
    'education', 'government', 'environment', 'social', 'other'
  ];

  useEffect(() => {
    // Fetch category statistics on component mount
    fetchCategoryStats();
    // Load wallet status
    loadWalletStatus();
  }, []);

  const loadWalletStatus = () => {
    const status = walletManager.getConnectionStatus();
    setWalletStatus(status);
  };

  useEffect(() => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // For search, add debouncing
    if (filters.search !== undefined) {
      const timeout = setTimeout(() => {
        fetchDatasets();
      }, 300); // 300ms debounce
      setSearchTimeout(timeout);
    } else {
      fetchDatasets();
    }

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [filters, pagination.current]);

  const fetchCategoryStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/datasets/stats/categories');
      setCategoryCounts(response.data.categoryCounts || {});
    } catch (error) {
      console.error('Error fetching category stats:', error);
      setCategoryCounts({});
    }
  };

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 12
      });
      
      // Only add non-empty filter values
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim() !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`http://localhost:5000/api/datasets?${params}`);
      let fetchedDatasets = response.data.datasets || [];
      
      // Filter out user's own datasets if user is logged in
      if (user) {
        fetchedDatasets = fetchedDatasets.filter(dataset => 
          dataset.provider && dataset.provider._id !== user._id
        );
      }
      
      setDatasets(fetchedDatasets);
      setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Error fetching datasets:', error);
      setDatasets([]);
      setPagination({ current: 1, pages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
    
    // For non-search filters, fetch immediately
    if (key !== 'search') {
      // Clear any existing search timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
        setSearchTimeout(null);
      }
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setPagination(prev => ({ ...prev, current: 1 }));
    
    // Clear any existing search timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc') count++;
    return count;
  };

  const handlePurchase = async (dataset) => {
    if (!user) {
      alert('Please login to purchase datasets');
      return;
    }

    // Check if wallet is connected
    if (!walletStatus?.isConnected) {
      alert('Please connect a wallet first. Go to "Wallet Management" tab to connect your wallet.');
      return;
    }

    // Check if wallet supports the dataset's currency
    const datasetCurrency = dataset.currency;
    const walletChain = walletStatus.chain;
    
    if (datasetCurrency === 'WAL' && walletChain !== 'walrus') {
      alert(`Please connect a Walrus wallet for ${datasetCurrency} payments. Go to "Wallet Management" tab to connect your wallet.`);
      return;
    }

    // Show payment modal
    setSelectedDataset(dataset);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentResult) => {
    setShowPaymentModal(false);
    setSelectedDataset(null);
    alert(`Payment successful! Transaction: ${paymentResult.transactionHash}`);
    onPurchase && onPurchase(selectedDataset);
  };

  const handlePaymentError = (error) => {
    alert(`Payment failed: ${error}`);
  };

  const handleDownloadDataset = async (dataset) => {
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
      
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
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

  return (
    <div className="marketplace-container">
        <div className="marketplace-header">
          <h2>Data Marketplace</h2>
          <p>Discover and purchase high-quality datasets</p>
          {walletStatus?.isConnected ? (
            <div className="wallet-status-indicator">
              <span className="status-icon">✅</span>
              <span className="status-text">
                Wallet Connected: {walletStatus.wallet} (WALRUS)
              </span>
            </div>
          ) : (
            <div className="wallet-status-indicator disconnected">
              <span className="status-icon">❌</span>
              <span className="status-text">
                No wallet connected. Go to "Wallet Management" to connect a wallet.
              </span>
            </div>
          )}
        </div>

      <div className="marketplace-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search datasets..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
          {loading && <div className="loading-indicator">Searching...</div>}
        </div>

        <div className="filter-group">
          <label>Category</label>
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
            min="0"
            step="0.01"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="price-input"
            min="0"
            step="0.01"
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

        <div className="filter-group">
          <button
            onClick={clearFilters}
            className="clear-filters-btn"
            type="button"
            disabled={getActiveFiltersCount() === 0}
          >
            Clear Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="category-chips">
        <div className="category-chips-header">
          <h3>Browse by Category</h3>
          <span className="category-count">
            {filters.category ? `Showing ${datasets.length} results for "${filters.category}"` : `Showing all ${datasets.length} datasets`}
          </span>
        </div>
        <div className="category-chips-container">
          <button
            className={`category-chip ${!filters.category ? 'active' : ''}`}
            onClick={() => handleFilterChange('category', '')}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-chip ${filters.category === cat ? 'active' : ''}`}
              onClick={() => handleFilterChange('category', cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
              {categoryCounts[cat] && (
                <span className="category-count-badge">
                  {categoryCounts[cat]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="datasets-grid">
        {loading ? (
          <div className="loading">Loading datasets...</div>
        ) : datasets.length === 0 ? (
          <div className="no-datasets">No datasets found</div>
        ) : (
          datasets.map(dataset => (
            <div key={dataset._id} className="dataset-card">
              <div className="dataset-header">
                <h3 className="dataset-title">{dataset.title}</h3>
                <span className="dataset-category">{dataset.category}</span>
              </div>
              
              <div className="dataset-description">
                <p>{dataset.description.substring(0, 150)}...</p>
              </div>

              <div className="dataset-meta">
                <div className="meta-item">
                  <span className="meta-label">Provider:</span>
                  <span className="meta-value">{dataset.provider?.username || dataset.provider?.email || 'Unknown Provider'}</span>
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
                {dataset.hasAccess ? (
                  <button
                    className="download-btn"
                    onClick={() => handleDownloadDataset(dataset)}
                    style={{ background: '#28a745', color: 'white' }}
                  >
                    📥 Download
                  </button>
                ) : (
                  <button
                    className="purchase-btn"
                    onClick={() => handlePurchase(dataset)}
                  >
                    Purchase
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.current === 1}
            onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.current} of {pagination.pages}
          </span>
          
          <button
            disabled={pagination.current === pagination.pages}
            onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

          {/* Payment Modal */}
      {showPaymentModal && selectedDataset && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedDataset(null);
          }}
          dataset={selectedDataset}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </div>
  );
};

export default Marketplace;
