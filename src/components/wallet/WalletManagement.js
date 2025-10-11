import React, { useState, useEffect } from 'react';
import walletManager from '../../services/walletManager';
import './WalletManagement.css';

const WalletManagement = ({ user }) => {
  const [selectedChain, setSelectedChain] = useState('walrus');
  const [availableWallets, setAvailableWallets] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadConnectionStatus();
    loadAvailableWallets();
  }, [selectedChain]);

  useEffect(() => {
    if (connectionStatus?.isConnected) {
      loadBalance();
      loadTransactionHistory();
    }
  }, [connectionStatus]);

  const loadConnectionStatus = () => {
    const status = walletManager.getConnectionStatus();
    setConnectionStatus(status);
  };

  const loadAvailableWallets = async () => {
    try {
      const wallets = await walletManager.getAvailableWallets(selectedChain);
      setAvailableWallets(wallets);
    } catch (error) {
      console.error('Error loading wallets:', error);
      setAvailableWallets([]);
    }
  };

  const loadBalance = async () => {
    try {
      const result = await walletManager.getBalance();
      if (result.success) {
        setBalance(result.balance);
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

  const handleConnectWallet = async (walletId) => {
    setIsConnecting(true);
    try {
      const result = await walletManager.connectWallet(selectedChain, walletId, user?._id);
      if (result.success) {
        loadConnectionStatus();
        alert(`Successfully connected to ${result.wallet}!`);
      } else {
        alert(`Failed to connect: ${result.error}`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert(`Connection failed: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      const result = await walletManager.disconnectWallet();
      if (result.success) {
        loadConnectionStatus();
        setBalance(null);
        setTransactionHistory([]);
        alert('Wallet disconnected successfully!');
      } else {
        alert(`Failed to disconnect: ${result.error}`);
      }
    } catch (error) {
      console.error('Disconnection error:', error);
      alert(`Disconnection failed: ${error.message}`);
    }
  };

  const handleSwitchChain = (chain) => {
    setSelectedChain(chain);
    setAvailableWallets([]);
    setConnectionStatus(null);
    setBalance(null);
    setTransactionHistory([]);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount) => {
    return walletManager.formatAmount(amount);
  };

  const getChainIcon = (chain) => {
    switch (chain) {
      case 'sui':
        return '🔵';
      case 'walrus':
        return '🟠';
      default:
        return '⚪';
    }
  };

  return (
    <div className="wallet-management">
      <div className="wallet-header">
        <h2>Wallet Management</h2>
        <p>Connect and manage your cryptocurrency wallets</p>
      </div>

      {/* Chain Selection */}
      <div className="chain-selector">
        <h3>Blockchain</h3>
        <div className="chain-buttons">
          <button className="chain-button active">
            <span className="chain-icon">🦭</span>
            <span className="chain-name">WALRUS</span>
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <h3>Connection Status</h3>
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
              {balance && (
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
                onClick={loadBalance}
                disabled={isConnecting}
              >
                🔄 Refresh Balance
              </button>
              <button
                className="history-btn"
                onClick={() => setShowHistory(!showHistory)}
              >
                📋 Transaction History
              </button>
              <button
                className="disconnect-btn"
                onClick={handleDisconnectWallet}
                disabled={isConnecting}
              >
                🔌 Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="status-disconnected">
            <div className="status-header">
              <span className="status-icon">❌</span>
              <span className="status-text">Not Connected</span>
            </div>
            <p>Connect a wallet to start using {selectedChain.toUpperCase()} payments</p>
          </div>
        )}
      </div>

      {/* Available Wallets */}
      {!connectionStatus?.isConnected && (
        <div className="available-wallets">
          <h3>Available Wallets</h3>
          {availableWallets.length > 0 ? (
            <div className="wallet-list">
              {availableWallets.map(wallet => (
                <div key={wallet.id} className="wallet-item">
                  <div className="wallet-info">
                    {wallet.icon && (
                      <img src={wallet.icon} alt={`${wallet.name} icon`} className="wallet-icon" />
                    )}
                    <div className="wallet-details">
                      <span className="wallet-name">{wallet.name}</span>
                      <span className="wallet-chain">{wallet.chain?.toUpperCase()}</span>
                    </div>
                  </div>
                  <button
                    className="connect-btn"
                    onClick={() => handleConnectWallet(wallet.id)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <span className="spinner"></span>
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-wallets">
              <p>No wallets available for {selectedChain.toUpperCase()}</p>
              <p className="help-text">
                Make sure you have a compatible wallet installed or use the mock wallets for testing.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Transaction History */}
      {showHistory && connectionStatus?.isConnected && (
        <div className="transaction-history">
          <h3>Recent Transactions</h3>
          {transactionHistory.length > 0 ? (
            <div className="history-list">
              {transactionHistory.map((tx, index) => (
                <div key={index} className="history-item">
                  <div className="tx-info">
                    <span className="tx-hash">{formatAddress(tx.digest || tx.hash)}</span>
                    <span className="tx-status">
                      {tx.effects?.status?.status || tx.status || 'success'}
                    </span>
                  </div>
                  <div className="tx-details">
                    <span className="tx-time">
                      {new Date(tx.timestampMs || tx.timestamp).toLocaleString()}
                    </span>
                    {tx.effects?.gasUsed && (
                      <span className="tx-gas">
                        Gas: {tx.effects.gasUsed.computationCost || tx.gasUsed}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transactions">
              <p>No transactions found</p>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="help-section">
        <h3>How to Use</h3>
        <div className="help-content">
          <div className="help-item">
            <span className="help-icon">1️⃣</span>
            <div className="help-text">
              <strong>Select Blockchain:</strong> Choose between Sui or Walrus
            </div>
          </div>
          <div className="help-item">
            <span className="help-icon">2️⃣</span>
            <div className="help-text">
              <strong>Connect Wallet:</strong> Click "Connect" on your preferred wallet
            </div>
          </div>
          <div className="help-item">
            <span className="help-icon">3️⃣</span>
            <div className="help-text">
              <strong>View Balance:</strong> Your wallet balance will be displayed
            </div>
          </div>
          <div className="help-item">
            <span className="help-icon">4️⃣</span>
            <div className="help-text">
              <strong>Make Payments:</strong> Use your connected wallet for dataset purchases
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletManagement;
