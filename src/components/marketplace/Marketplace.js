import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Marketplace = ({ user, onPurchase }) => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const categories = [
    'research', 'business', 'finance', 'healthcare', 'technology',
    'education', 'government', 'environment', 'social', 'other'
  ];

  useEffect(() => {
    fetchDatasets();
  }, [filters, pagination.current]);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 12,
        ...filters
      });

      const response = await axios.get(`http://localhost:5000/api/datasets?${params}`);
      setDatasets(response.data.datasets);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePurchase = async (dataset) => {
    if (!user) {
      alert('Please login to purchase datasets');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/datasets/${dataset._id}/purchase`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Dataset purchased successfully!');
      onPurchase && onPurchase(dataset);
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to purchase dataset');
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
            <option value="statistics.views-desc">Most Viewed</option>
            <option value="statistics.purchases-desc">Most Popular</option>
          </select>
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
    </div>
  );
};

export default Marketplace;
