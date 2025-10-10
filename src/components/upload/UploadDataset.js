import React, { useState } from 'react';
import axios from 'axios';

const UploadDataset = ({ user, onUploadComplete }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    currency: 'WAL',
    tags: '',
    license: '',
    language: 'en'
  });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);

  const categories = [
    'research', 'business', 'finance', 'healthcare', 'technology',
    'education', 'government', 'environment', 'social', 'other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      setStep(2);
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');

      // Create dataset
      const datasetResponse = await axios.post('http://localhost:5000/api/datasets', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const datasetId = datasetResponse.data.dataset._id;

      // Upload files
      if (files.length > 0) {
        const formDataFiles = new FormData();
        files.forEach(file => {
          formDataFiles.append('files', file);
        });

        await axios.post(`http://localhost:5000/api/datasets/${datasetId}/upload`, formDataFiles, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      // Publish dataset
      await axios.put(`http://localhost:5000/api/datasets/${datasetId}`, {
        status: 'published'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Dataset uploaded successfully!');
      onUploadComplete && onUploadComplete();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        price: '',
        currency: 'WAL',
        tags: '',
        license: '',
        language: 'en'
      });
      setFiles([]);
      setStep(1);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload dataset');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h2>Upload Dataset</h2>
        <p>Share your data with the community and earn rewards</p>
      </div>

      <div className="upload-progress">
        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Dataset Info</div>
        </div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Upload Files</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        {step === 1 && (
          <div className="form-step">
            <h3>Dataset Information</h3>
            
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
                placeholder="Enter dataset title"
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
                placeholder="Describe your dataset in detail"
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
                    placeholder="0.00"
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
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h3>Upload Files</h3>
            
            <div className="file-upload-area">
              <input
                type="file"
                id="files"
                multiple
                onChange={handleFileChange}
                className="file-input"
                accept=".csv,.json,.xml,.txt,.xlsx,.pdf,.zip"
              />
              <label htmlFor="files" className="file-upload-label">
                <div className="upload-icon">📁</div>
                <div className="upload-text">
                  <strong>Click to upload files</strong>
                  <p>or drag and drop files here</p>
                  <p className="file-types">CSV, JSON, XML, TXT, XLSX, PDF, ZIP</p>
                </div>
              </label>
            </div>

            {files.length > 0 && (
              <div className="file-list">
                <h4>Selected Files ({files.length})</h4>
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="remove-file-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="form-actions">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              Back
            </button>
          )}
          
          <button
            type="submit"
            disabled={uploading}
            className="btn-primary"
          >
            {uploading ? 'Uploading...' : step === 1 ? 'Next' : 'Upload Dataset'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadDataset;
