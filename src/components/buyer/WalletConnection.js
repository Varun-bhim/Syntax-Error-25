import React, { useState } from 'react';
import './WalletConnection.css';

const WalletConnection = ({ onWalletConnected, onClose }) => {
  const [selectedWallet, setSelectedWallet] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const wallets = [
    {
      id: 'sui-wallet',
      name: 'Sui Wallet',
      icon: '🔗',
      description: 'Official Sui blockchain wallet'
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Popular multi-chain wallet'
    },
    {
      id: 'wallet-connect',
      name: 'WalletConnect',
      icon: '🔌',
      description: 'Connect any compatible wallet'
    }
  ];

  const handleConnect = async () => {
    if (!selectedWallet) return;

    setConnecting(true);
    
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock wallet address generation
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      setWalletAddress(mockAddress);
      setConnected(true);
      
      // Call parent callback
      onWalletConnected({
        walletType: selectedWallet,
        address: mockAddress,
        connected: true
      });
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setWalletAddress('');
    setSelectedWallet('');
    onWalletConnected({
      walletType: '',
      address: '',
      connected: false
    });
  };

  return (
    <div className="wallet-connection-overlay">
      <div className="wallet-connection-modal">
        <div className="wallet-header">
          <h3>Connect Wallet</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="wallet-content">
          {!connected ? (
            <>
              <div className="wallet-intro">
                <p>Connect your wallet to purchase datasets with crypto</p>
              </div>

              <div className="wallet-options">
                {wallets.map(wallet => (
                  <div 
                    key={wallet.id}
                    className={`wallet-option ${selectedWallet === wallet.id ? 'selected' : ''}`}
                    onClick={() => setSelectedWallet(wallet.id)}
                  >
                    <div className="wallet-icon">{wallet.icon}</div>
                    <div className="wallet-info">
                      <div className="wallet-name">{wallet.name}</div>
                      <div className="wallet-description">{wallet.description}</div>
                    </div>
                    <div className="wallet-radio">
                      <input
                        type="radio"
                        name="wallet"
                        value={wallet.id}
                        checked={selectedWallet === wallet.id}
                        onChange={() => setSelectedWallet(wallet.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="wallet-actions">
                <button 
                  className="connect-btn"
                  onClick={handleConnect}
                  disabled={!selectedWallet || connecting}
                >
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
            </>
          ) : (
            <div className="wallet-connected">
              <div className="success-icon">✅</div>
              <h4>Wallet Connected Successfully!</h4>
              <div className="wallet-details">
                <div className="detail-item">
                  <span className="label">Wallet:</span>
                  <span className="value">{wallets.find(w => w.id === selectedWallet)?.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Address:</span>
                  <span className="value address">{walletAddress.substring(0, 10)}...{walletAddress.substring(-10)}</span>
                </div>
              </div>
              <button className="disconnect-btn" onClick={handleDisconnect}>
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>

        <div className="wallet-footer">
          <p className="security-note">
            🔒 Your wallet connection is secure and private. We never store your private keys.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnection;
