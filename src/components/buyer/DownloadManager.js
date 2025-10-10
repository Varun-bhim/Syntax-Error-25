import React, { useState } from 'react';
import './DownloadManager.css';

const DownloadManager = ({ transaction, onDownload }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadProgress(0);

      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setDownloading(false);
            onDownload && onDownload(transaction);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

    } catch (error) {
      console.error('Download error:', error);
      setDownloading(false);
      setDownloadProgress(0);
    }
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
    <div className="download-manager">
      <div className="download-header">
        <h3>Download Dataset</h3>
        <div className="download-status">
          <span className={`status-badge ${transaction.status}`}>
            {transaction.status}
          </span>
        </div>
      </div>

      <div className="download-content">
        <div className="dataset-info">
          <h4>{transaction.dataset?.title || 'Dataset'}</h4>
          <p>Purchased on {formatDate(transaction.createdAt)}</p>
          <p>Transaction ID: {transaction.transactionId}</p>
        </div>

        <div className="download-details">
          <div className="detail-item">
            <span className="label">Files:</span>
            <span className="value">{transaction.dataset?.metadata?.fileCount || 0}</span>
          </div>
          <div className="detail-item">
            <span className="label">Total Size:</span>
            <span className="value">{formatFileSize(transaction.dataset?.metadata?.totalSize || 0)}</span>
          </div>
          <div className="detail-item">
            <span className="label">Downloads Remaining:</span>
            <span className="value">{transaction.maxDownloads - transaction.downloadCount}</span>
          </div>
        </div>

        {transaction.status === 'completed' && transaction.accessGranted && (
          <div className="download-section">
            {downloading ? (
              <div className="download-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${downloadProgress}%` }}
                  ></div>
                </div>
                <p>Downloading... {downloadProgress}%</p>
              </div>
            ) : (
              <div className="download-actions">
                <button 
                  className="download-btn"
                  onClick={handleDownload}
                  disabled={transaction.downloadCount >= transaction.maxDownloads}
                >
                  {transaction.downloadCount >= transaction.maxDownloads 
                    ? 'Download Limit Reached' 
                    : 'Download Dataset'
                  }
                </button>
                <p className="download-note">
                  You can download this dataset {transaction.maxDownloads - transaction.downloadCount} more time(s)
                </p>
              </div>
            )}
          </div>
        )}

        {transaction.status !== 'completed' && (
          <div className="pending-notice">
            <p>Your purchase is being processed. You'll be able to download the dataset once the transaction is completed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadManager;
