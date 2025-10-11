import React, { useState } from 'react';
import axios from 'axios';
import './DownloadManager.css';

const DownloadManager = ({ transaction, onDownload }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadProgress(0);

      if (!transaction.dataset || !transaction.dataset._id) {
        alert('Dataset information not available');
        return;
      }

      const token = localStorage.getItem('token');
      
      // Get dataset details first to get file information
      const detailsResponse = await axios.get(`http://localhost:5000/api/datasets/${transaction.dataset._id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const dataset = detailsResponse.data.dataset;
      
      if (!dataset.hasAccess) {
        alert('You do not have access to download this dataset');
        return;
      }

      if (dataset.files.length === 0) {
        alert('No files available for download');
        return;
      }

      // Simulate progress for single file
      if (dataset.files.length === 1) {
        const file = dataset.files[0];
        
        // Simulate download progress
        const progressInterval = setInterval(() => {
          setDownloadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 15;
          });
        }, 200);

        // Download the file
        await downloadFile(transaction.dataset._id, file.walrusBlobId, file.name, token);
        
        setDownloadProgress(100);
        setTimeout(() => {
          setDownloading(false);
          setDownloadProgress(0);
          onDownload && onDownload(transaction);
        }, 500);
      } else {
        // Multiple files - show selection
        showFileSelectionModal(dataset.files, transaction.dataset._id, token);
        setDownloading(false);
      }

    } catch (error) {
      console.error('Download error:', error);
      setDownloading(false);
      setDownloadProgress(0);
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

  const showFileSelectionModal = (files, datasetId, token) => {
    const selectedFile = prompt(
      `Multiple files available. Please enter the file number to download:\n\n${files.map((file, index) => `${index + 1}. ${file.name}`).join('\n')}\n\nEnter file number (1-${files.length}):`
    );

    if (selectedFile) {
      const fileIndex = parseInt(selectedFile) - 1;
      if (fileIndex >= 0 && fileIndex < files.length) {
        const file = files[fileIndex];
        downloadFile(datasetId, file.walrusBlobId, file.name, token);
      } else {
        alert('Invalid file number selected');
      }
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