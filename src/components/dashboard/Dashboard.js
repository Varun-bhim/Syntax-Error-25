import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalDatasets: 0,
    totalSales: 0,
    totalEarnings: 0,
    totalPurchases: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

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
        totalPurchases: transactionsRes.data.purchases.totalPurchases
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'datasets', label: 'My Datasets', icon: '📁' },
    { id: 'purchases', label: 'Purchases', icon: '🛒' },
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
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
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
              <div className="stat-card">
                <div className="stat-icon">🛒</div>
                <div className="stat-info">
                  <h3>{stats.totalPurchases}</h3>
                  <p>Total Purchases</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'datasets' && (
          <div className="datasets-section">
            <h3>My Datasets</h3>
            <p>Manage your uploaded datasets</p>
          </div>
        )}

        {activeTab === 'purchases' && (
          <div className="purchases-section">
            <h3>My Purchases</h3>
            <p>View your purchased datasets</p>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="sales-section">
            <h3>Sales History</h3>
            <p>Track your dataset sales</p>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="upload-section">
            <h3>Upload New Dataset</h3>
            <p>Share your data with the community</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
