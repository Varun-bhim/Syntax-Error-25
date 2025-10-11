import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DownloadManager from './DownloadManager';
import PaymentModal from './PaymentModal';
import './BuyerInterface.css';

const BuyerInterface = ({ user, onPurchaseComplete }) => {
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPurchaseHistory();
    }
  }, [user]);


  const fetchPurchaseHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/transactions/my-transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPurchaseHistory(response.data.transactions);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
    } finally {
      setLoading(false);
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
        <h2>My Purchases</h2>
        <p>Access and download your purchased datasets</p>
      </div>

      <div className="purchases-section">
        {loading ? (
          <div className="loading">Loading your purchases...</div>
        ) : purchaseHistory.length === 0 ? (
          <div className="no-purchases">
            <div className="no-purchases-content">
              <h3>No purchases yet</h3>
              <p>You haven't purchased any datasets yet. Start exploring our marketplace!</p>
              <button
                className="browse-btn"
                onClick={() => window.location.href = '/marketplace'}
              >
                Browse Datasets
              </button>
            </div>
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
    </div>
  );
};

export default BuyerInterface;
