import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/dashboard/Dashboard';
import Marketplace from './components/marketplace/Marketplace';
import UploadDataset from './components/upload/UploadDataset';
import BuyerInterface from './components/buyer/BuyerInterface';
import WalletManagement from './components/wallet/WalletManagement';
import Profile from './components/Profile';
import axios from 'axios';

// Set axios base URL
axios.defaults.baseURL = 'http://localhost:5000';

// Clear any existing axios interceptors to prevent token caching
axios.interceptors.request.clear();
axios.interceptors.response.clear();

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
      const sessionId = localStorage.getItem('sessionId');
      const storedUserId = localStorage.getItem('userId');
      
      if (token) {
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const userData = response.data.user;
        
        // Validate that the user ID matches what we expect
        if (storedUserId && userData._id !== storedUserId) {
          console.warn('User ID mismatch! Clearing session.');
          localStorage.clear();
          sessionStorage.clear();
          setUser(null);
          setCurrentView('login');
          return;
        }
        
        if (sessionId) {
          userData.sessionId = sessionId;
        }
        
        console.log('Auth check successful:', userData);
        console.log('Current user ID:', userData._id);
        console.log('Stored user ID:', storedUserId);
        console.log('Session ID:', userData.sessionId);
        
        setUser(userData);
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.clear();
      sessionStorage.clear();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    // Clear any existing user data first
    setUser(null);
    
    // Clear all possible cached data
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cached data in memory
    if (window.caches) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Force a small delay to ensure state is cleared
    setTimeout(() => {
      // Add a unique session ID to prevent caching issues
      const sessionId = Date.now() + Math.random().toString(36).substr(2, 9);
      const userWithSession = {
        ...userData,
        sessionId: sessionId
      };
      
      setUser(userWithSession);
      localStorage.setItem('token', token);
      localStorage.setItem('sessionId', sessionId);
      localStorage.setItem('userId', userData._id); // Store user ID separately
      setCurrentView('dashboard');
      console.log('User logged in:', userWithSession);
      console.log('Stored user ID:', userData._id);
      console.log('User email:', userData.email);
    }, 100);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.clear(); // Clear ALL localStorage data
    sessionStorage.clear(); // Clear ALL sessionStorage data
    
    // Clear any cached data in memory
    if (window.caches) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    setCurrentView('login');
    
    // Force a complete page reload with cache busting
    const timestamp = Date.now();
    window.location.href = `${window.location.origin}${window.location.pathname}?t=${timestamp}`;
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
          <button 
            className={`nav-link ${currentView === 'wallet' ? 'active' : ''}`}
            onClick={() => setCurrentView('wallet')}
          >
            Wallet Management
          </button>
        </div>
        <div className="nav-user">
          <button 
            className="nav-link profile-link"
            onClick={() => setCurrentView('profile')}
          >
            {user?.username}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content" key={`main-${user?._id}-${user?.sessionId}-${Date.now()}`}>
        {currentView === 'dashboard' && (
          <Dashboard key={`dashboard-${user?._id}-${user?.sessionId}-${Date.now()}`} user={user} onLogout={handleLogout} />
        )}
        {currentView === 'buyer' && (
          <BuyerInterface key={`buyer-${user?._id}-${user?.sessionId}-${Date.now()}`} user={user} onPurchaseComplete={handleUploadComplete} />
        )}
        {currentView === 'marketplace' && (
          <Marketplace key={`marketplace-${user?._id}-${user?.sessionId}-${Date.now()}`} user={user} />
        )}
        {currentView === 'upload' && (
          <UploadDataset key={`upload-${user?._id}-${user?.sessionId}-${Date.now()}`} user={user} onUploadComplete={handleUploadComplete} />
        )}
        {currentView === 'wallet' && (
          <WalletManagement key={`wallet-${user?._id}-${user?.sessionId}-${Date.now()}`} user={user} />
        )}
        {currentView === 'profile' && (
          <Profile key={`profile-${user?._id}-${user?.sessionId}-${Date.now()}`} user={user} onLogout={handleLogout} />
        )}
      </main>
    </div>
  );
}

export default App;
