import React, { useState, useEffect } from 'react';
import walletManager from '../../services/walletManager';
import './WalletConnection.css';

const WalletConnection = ({ onWalletConnected, onWalletDisconnected, user }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([]);
  const [selectedChain, setSelectedChain] = useState('walrus');
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    loadConnectionStatus();
    loadAvailableWallets();
  }, [selectedChain]);

  useEffect(() => {
    if (connectionStatus?.isConnected) {
      loadBalance();
    }
  }, [connectionStatus]);

  const loadConnectionStatus = async () => {
    const status = walletManager.getConnectionStatus();
    setConnectionStatus(status);
  };

  const loadAvailableWallets = async () => {
    try {
      const wallets = await walletManager.getAvailableWallets(selectedChain);
      setAvailableWallets(wallets);
    } catch (error) {
      console.error('Error loading wallets:', error);
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
    }
  };

  const handleChainChange = async (chain) => {
    setSelectedChain(chain);
    setAvailableWallets([]);
    setIsConnecting(false);
    
    // Disconnect current wallet if connected to different chain
    if (connectionStatus?.isConnected && connectionStatus.chain !== chain) {
      await handleDisconnect();
    }
    
    await loadAvailableWallets();
  };

  const handleConnect = async (walletId) => {
    try {
      setIsConnecting(true);
      const result = await walletManager.connectWallet(selectedChain, walletId, user?._id);
      
      if (result.success) {
        setConnectionStatus({
          isConnected: true,
          chain: selectedChain,
          wallet: result.wallet,
          account: result.account
        });
        
        onWalletConnected && onWalletConnected(result);
        await loadBalance();
      } else {
        alert(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert(`Connection error: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const result = await walletManager.disconnectWallet();
      
      if (result.success) {
        setConnectionStatus({
          isConnected: false,
          chain: null,
          wallet: null,
          account: null
        });
        
        setBalance(null);
        onWalletDisconnected && onWalletDisconnected();
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance, currency) => {
    if (!balance) return '0';
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  const getChainIcon = (chain) => {
    switch (chain) {
      case 'sui':
        return '🔵';
      case 'walrus':
        return '🦭';
      default:
        return '🔗';
    }
  };

  const getCurrencySymbol = (chain) => {
    switch (chain) {
      case 'sui':
        return 'SUI';
      case 'walrus':
        return 'WAL';
      default:
        return 'TOKEN';
    }
  };

  if (connectionStatus?.isConnected) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <div className="wallet-header">
            <span className="chain-icon">{getChainIcon(connectionStatus.chain)}</span>
            <div className="wallet-details">
              <div className="wallet-name">{connectionStatus.wallet}</div>
              <div className="wallet-address">{formatAddress(connectionStatus.account)}</div>
            </div>
          </div>
          
          {balance !== null && (
            <div className="wallet-balance">
              <span className="balance-amount">
                {formatBalance(balance)} {getCurrencySymbol(connectionStatus.chain)}
              </span>
            </div>
          )}
        </div>
        
        <button 
          className="disconnect-btn"
          onClick={handleDisconnect}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connection">
      <div className="connection-header">
        <h3>Connect Wallet</h3>
        <p>Connect your wallet to make payments</p>
      </div>

      <div className="chain-selector">
        <label>Select Blockchain:</label>
        <div className="chain-options">
          {walletManager.getSupportedChains().map(chain => (
            <button
              key={chain}
              className={`chain-option ${selectedChain === chain ? 'active' : ''}`}
              onClick={() => handleChainChange(chain)}
            >
              <span className="chain-icon">{getChainIcon(chain)}</span>
              <span className="chain-name">{chain.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="wallet-list">
        {isConnecting ? (
          <div className="connecting">
            <div className="spinner"></div>
            <span>Connecting...</span>
          </div>
        ) : (
          <>
            {availableWallets.length > 0 ? (
              <div className="wallets">
                {availableWallets.map(wallet => (
                  <button
                    key={wallet.id}
                    className="wallet-option"
                    onClick={() => handleConnect(wallet.id)}
                    disabled={isConnecting}
                  >
                    <div className="wallet-icon">
                      {wallet.icon ? (
                        <img src={wallet.icon} alt={wallet.name} />
                      ) : (
                        <span className="default-icon">🔗</span>
                      )}
                    </div>
                    <div className="wallet-info">
                      <div className="wallet-name">{wallet.name}</div>
                      <div className="wallet-version">{wallet.version}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="no-wallets">
                <p>No {selectedChain.toUpperCase()} wallets found</p>
                <p className="install-hint">
                  Please install a {selectedChain.toUpperCase()} wallet extension
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="connection-help">
        <h4>Need Help?</h4>
        <ul>
          <li>Make sure you have a {selectedChain.toUpperCase()} wallet installed</li>
          <li>Refresh the page if wallets don't appear</li>
          <li>Check that your wallet is unlocked</li>
        </ul>
      </div>
    </div>
  );
};

export default WalletConnection;
