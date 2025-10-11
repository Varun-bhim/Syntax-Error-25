import React, { useState, useEffect } from 'react';
import walletManager from '../../services/walletManager';
import './WalletManagement.css';

const WalletManagement = ({ user }) => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [balance, setBalance] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Automatically connect user to their wallet when component loads
    autoConnectWallet();

    // Listen for wallet transaction events
    const handleWalletTransaction = (event) => {
      console.log('Wallet transaction detected:', event.detail);
      // Refresh wallet data when transactions occur
      refreshWalletData();
    };

    window.addEventListener('walletTransaction', handleWalletTransaction);

    // Cleanup event listener
    return () => {
      window.removeEventListener('walletTransaction', handleWalletTransaction);
    };
  }, [user]);

  useEffect(() => {
    if (connectionStatus?.isConnected) {
      loadBalance();
      loadTransactionHistory();
    }
  }, [connectionStatus]);

  const autoConnectWallet = async () => {
    try {
      setIsLoading(true);
      
      if (!user?._id) {
        console.log('No user ID available for auto-connect');
        setIsLoading(false);
        return;
      }

      // Check if user already has a wallet connected
      const existingStatus = walletManager.getConnectionStatus();
      if (existingStatus.isConnected) {
        console.log('Wallet already connected');
        setConnectionStatus(existingStatus);
        setIsLoading(false);
        return;
      }

      // Auto-connect to mock wallet for the user
      const result = await walletManager.connectWallet('walrus', 'walrus-wallet-mock', user._id);
      
      if (result.success) {
        console.log('Auto-connected to wallet for user:', user._id);
        loadConnectionStatus();
      } else {
        console.error('Auto-connect failed:', result.error);
      }
    } catch (error) {
      console.error('Auto-connect error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConnectionStatus = () => {
    const status = walletManager.getConnectionStatus();
    setConnectionStatus(status);
  };

  const loadBalance = async () => {
    try {
      const result = await walletManager.getBalance();
      if (result.success) {
        setBalance(result.balance);
      }
      
      // Also check if user has any earnings from sales
      if (user?._id) {
        const earningsResult = walletManager.getBalanceByUserId(user._id, 'walrus');
        if (earningsResult.success && earningsResult.balance > 0) {
          console.log(`User has earnings: ${earningsResult.balance} WAL in wallet ${earningsResult.walletAddress}`);
          // Update the main balance to include earnings
          setBalance(prevBalance => {
            const totalBalance = (prevBalance || 0) + earningsResult.balance;
            return totalBalance;
          });
        }
      }
    } catch (error) {
      console.error('Error loading balance:', error);
      setBalance(null);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      const result = await walletManager.getTransactionHistory(10);
      if (result.success) {
        setTransactionHistory(result.transactions);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setTransactionHistory([]);
    }
  };

  // Refresh wallet data (called when transactions occur)
  const refreshWalletData = async () => {
    try {
      await loadBalance();
      await loadTransactionHistory();
      console.log('Wallet data refreshed');
    } catch (error) {
      console.error('Error refreshing wallet data:', error);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount) => {
    return walletManager.formatAmount(amount);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="wallet-management">
        <div className="wallet-header">
          <h2>Wallet Management</h2>
          <p>Setting up your wallet...</p>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Connecting to Walrus Wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-management">
      <div className="wallet-header">
        <h2>Wallet Management</h2>
        <p>Your Walrus wallet is automatically connected</p>
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <h3>Wallet Status</h3>
        {connectionStatus?.isConnected ? (
          <div className="status-connected">
            <div className="status-header">
              <span className="status-icon">✅</span>
              <span className="status-text">Connected</span>
            </div>
            <div className="wallet-details">
              <div className="wallet-info">
                <span className="wallet-name">{connectionStatus.wallet}</span>
                <span className="wallet-address">{formatAddress(connectionStatus.account)}</span>
              </div>
              {balance !== null && (
                <div className="balance-info">
                  <span className="balance-label">Balance:</span>
                  <span className="balance-amount">
                    {formatAmount(balance)} WAL
                  </span>
                </div>
              )}
            </div>
            <div className="wallet-actions">
              <button
                className="refresh-btn"
                onClick={refreshWalletData}
              >
                🔄 Refresh Balance
              </button>
              <button
                className="history-btn"
                onClick={() => setShowHistory(!showHistory)}
              >
                📋 Transaction History
              </button>
            </div>
          </div>
        ) : (
          <div className="status-disconnected">
            <div className="status-header">
              <span className="status-icon">❌</span>
              <span className="status-text">Not Connected</span>
            </div>
            <p>Unable to connect to wallet. Please try refreshing the page.</p>
            <button
              className="retry-btn"
              onClick={autoConnectWallet}
            >
              🔄 Retry Connection
            </button>
          </div>
        )}
      </div>

      {/* Transaction History */}
      {showHistory && (
        <div className="transaction-history">
          <h3>Transaction History</h3>
          {transactionHistory.length > 0 ? (
            <div className="transaction-list">
              {transactionHistory.map((tx, index) => (
                <div key={tx.hash || index} className="transaction-item">
                  <div className="transaction-info">
                    <div className="transaction-details">
                      <span className="transaction-hash">
                        {formatAddress(tx.hash || tx.transactionHash)}
                      </span>
                      <span className="transaction-amount">
                        {tx.amount} {tx.currency || 'WAL'}
                      </span>
                    </div>
                    <div className="transaction-meta">
                      <span className="transaction-status">
                        {tx.status === 'success' ? '✅' : '⏳'} {tx.status}
                      </span>
                      <span className="transaction-date">
                        {formatDate(tx.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transactions">
              <p>No transactions found</p>
              <p className="help-text">
                Your transaction history will appear here once you make payments or receive earnings.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default WalletManagement;