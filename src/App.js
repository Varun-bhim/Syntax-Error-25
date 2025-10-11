import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/dashboard/Dashboard';
import Marketplace from './components/marketplace/Marketplace';
import UploadDataset from './components/upload/UploadDataset';
import BuyerInterface from './components/buyer/BuyerInterface';
import axios from 'axios';

// Set axios base URL
axios.defaults.baseURL = 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.user);
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    setCurrentView('login');
  };

  const handleUploadComplete = () => {
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <div className="auth-bg d-flex align-items-center justify-content-center" style={{minHeight:'100vh', position:'relative'}}>
        <div className="parallax-orbs">
          <span className="orb orb1" />
          <span className="orb orb2" />
          <span className="orb orb3" />
          <span className="orb orb4" />
        </div>
        <LoginRegister onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="main-nav">
        <div className="nav-brand">
          <h2>Walrus Data Marketplace</h2>
        </div>
        <div className="nav-links">
          <button 
            className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-link ${currentView === 'marketplace' ? 'active' : ''}`}
            onClick={() => setCurrentView('marketplace')}
          >
            Browse & Buy Data
          </button>
          <button 
            className={`nav-link ${currentView === 'buyer' ? 'active' : ''}`}
            onClick={() => setCurrentView('buyer')}
          >
            My Purchases
          </button>
          <button 
            className={`nav-link ${currentView === 'upload' ? 'active' : ''}`}
            onClick={() => setCurrentView('upload')}
          >
            Sell Data
          </button>
        </div>
        <div className="nav-user">
          <span className="user-name">{user?.username}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'dashboard' && (
          <Dashboard user={user} onLogout={handleLogout} />
        )}
        {currentView === 'buyer' && (
          <BuyerInterface user={user} onPurchaseComplete={handleUploadComplete} />
        )}
        {currentView === 'marketplace' && (
          <Marketplace user={user} />
        )}
        {currentView === 'upload' && (
          <UploadDataset user={user} onUploadComplete={handleUploadComplete} />
        )}
      </main>
    </div>
  );
}

export default App;
