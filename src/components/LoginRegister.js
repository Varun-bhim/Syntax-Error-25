import React, { useState } from 'react';
import axios from 'axios';

export default function LoginRegister({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Reset form when switching tabs
  const handleTabChange = (newTab) => {
    setTab(newTab);
    setEmail('');
    setPassword('');
    setMessage('');
    setIsLoading(false);
    setEmailFocused(false);
    setPasswordFocused(false);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    
    // Clear any existing tokens and data before login/register
    localStorage.clear();
    sessionStorage.clear();
    
    // Basic validation
    if (!email || !password) {
      setMessage('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }
    
    const url = tab==='login' ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';
    try {
      const requestData = { 
        email, 
        password
      };
      
      // Only add username for registration
      if (tab === 'register') {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substr(2, 6);
        requestData.username = email.split('@')[0] + timestamp + randomSuffix; // More unique username
      }
      
      console.log('Making auth request for:', email);
      
      // Ensure no cached headers are sent
      const response = await axios.post(url, requestData, {
        headers: {
          'Content-Type': 'application/json',
          // Explicitly clear any cached authorization
          'Authorization': undefined
        }
      });
      
      if (response.data.token) {
        if (tab === 'register') {
          // For registration, just show success message and stay on register page
          setMessage("Registration successful! Please login now.");
          // Clear the form
          setEmail('');
          setPassword('');
        } else {
          // For login, proceed with authentication
          localStorage.setItem('token', response.data.token);
          console.log('Login successful:', {
            user: response.data.user,
            token: response.data.token ? 'present' : 'missing',
            userId: response.data.user._id
          });
          onLogin(response.data.user, response.data.token);
        }
      } else {
        setMessage(tab==='login' ? "Login successful!" : "Registration successful! Login now.");
      }
    } catch (err) {
      console.error('Auth error:', err);
      const errorMessage = err.response?.data?.error || err.message || "Connection error. Please check if the server is running.";
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="card auth-card-3d shadow mx-auto">
      <div className="text-center mb-4">
        <div className="auth-logo-container">
          <div className="data-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#gradient1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="url(#gradient2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="url(#gradient3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="gradient1" x1="2" y1="7" x2="22" y2="7" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00d4ff"/>
                  <stop offset="1" stopColor="#7c3aed"/>
                </linearGradient>
                <linearGradient id="gradient2" x1="2" y1="17" x2="22" y2="17" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7c3aed"/>
                  <stop offset="1" stopColor="#00ff88"/>
                </linearGradient>
                <linearGradient id="gradient3" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00ff88"/>
                  <stop offset="1" stopColor="#00d4ff"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <h2 className="auth-title mb-0">
          {tab === 'login' ? 'Welcome to Walrus' : 'Join Walrus'}
        </h2>
        <p className="auth-subtitle text-muted">
          {tab === 'login' ? 'Access the decentralized data marketplace' : 'Start trading data on the blockchain'}
        </p>
      </div>
      
      <div className="tab-container mb-4">
        <button 
          className={`tab-button ${tab==='login' ? 'active' : ''}`}
          onClick={()=>handleTabChange('login')}
        >
          Login
        </button>
        <button 
          className={`tab-button ${tab==='register' ? 'active' : ''}`}
          onClick={()=>handleTabChange('register')}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group mb-4">
          <div className="input-container">
            <input 
              className="form-input" 
              type="email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              required 
              autoFocus 
            />
            <label className={`form-label ${emailFocused || email ? 'focused' : ''}`}>
              Email Address
            </label>
            <div className="input-border"></div>
          </div>
        </div>
        
        <div className="form-group mb-4">
          <div className="input-container">
            <input 
              className="form-input" 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              required 
            />
            <label className={`form-label ${passwordFocused || password ? 'focused' : ''}`}>
              Password
            </label>
            <div className="input-border"></div>
          </div>
        </div>
        
        <button 
          type="submit"
          className={`submit-button ${tab==='login' ? 'login' : 'register'} ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="spinner"></div>
          ) : (
            <span>{tab==='login' ? 'Sign In' : 'Create Account'}</span>
          )}
        </button>
        
        {message && (
          <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
