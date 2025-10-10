import React, { useState } from 'react';
import WalletConnection from './WalletConnection';
import './PaymentModal.css';

const PaymentModal = ({ dataset, onClose, onPayment }) => {
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [walletAddress, setWalletAddress] = useState('');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Payment method, 2: Confirmation, 3: Processing
  const [showWalletConnection, setShowWalletConnection] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  const handlePayment = async () => {
    if (step === 1) {
      if (paymentMethod === 'wallet' && !walletConnected) {
        setShowWalletConnection(true);
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      setProcessing(true);
      
      const paymentData = {
        paymentMethod,
        walletAddress: paymentMethod === 'wallet' ? walletAddress : null,
        amount: dataset.price,
        currency: dataset.currency
      };
      
      console.log('Sending payment data:', paymentData);
      console.log('Dataset ID:', dataset._id);
      
      try {
        await onPayment(paymentData);
      } catch (error) {
        console.error('Payment error:', error);
        setStep(1);
        setProcessing(false);
      }
    }
  };

  const handleWalletConnected = (walletData) => {
    setWalletConnected(walletData.connected);
    setWalletAddress(walletData.address);
    setShowWalletConnection(false);
  };

  const formatPrice = (price, currency) => {
    return `${price} ${currency}`;
  };

  const calculateTotal = () => {
    const platformFee = dataset.price * 0.05; // 5% platform fee
    return {
      subtotal: dataset.price,
      platformFee,
      total: dataset.price + platformFee
    };
  };

  const totals = calculateTotal();

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-header">
          <h3>Purchase Dataset</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="payment-content">
          {step === 1 && (
            <div className="payment-step">
              <div className="dataset-summary">
                <h4>{dataset.title}</h4>
                <p className="dataset-description">{dataset.description.substring(0, 100)}...</p>
                <div className="dataset-details">
                  <span>Category: {dataset.category}</span>
                  <span>Files: {dataset.metadata?.fileCount || 0}</span>
                  <span>Size: {dataset.metadata?.totalSize || 0} bytes</span>
                </div>
              </div>

              <div className="payment-methods">
                <h4>Select Payment Method</h4>
                
                <div className="payment-option">
                  <input
                    type="radio"
                    id="wallet"
                    name="paymentMethod"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label htmlFor="wallet">
                    <div className="payment-option-content">
                      <div className="payment-icon">👛</div>
                      <div>
                        <div className="payment-title">Crypto Wallet</div>
                        <div className="payment-description">Pay with WAL or SUI tokens</div>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="payment-option">
                  <input
                    type="radio"
                    id="credit"
                    name="paymentMethod"
                    value="credit"
                    checked={paymentMethod === 'credit'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label htmlFor="credit">
                    <div className="payment-option-content">
                      <div className="payment-icon">💳</div>
                      <div>
                        <div className="payment-title">Credit Card</div>
                        <div className="payment-description">Pay with traditional payment methods</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {paymentMethod === 'wallet' && (
                <div className="wallet-section">
                  {walletConnected ? (
                    <div className="wallet-connected-info">
                      <div className="wallet-status">
                        <span className="status-icon">✅</span>
                        <span>Wallet Connected</span>
                      </div>
                      <div className="wallet-address-display">
                        {walletAddress.substring(0, 10)}...{walletAddress.substring(-10)}
                      </div>
                      <button 
                        className="change-wallet-btn"
                        onClick={() => setShowWalletConnection(true)}
                      >
                        Change Wallet
                      </button>
                    </div>
                  ) : (
                    <div className="wallet-connect-prompt">
                      <p>Connect your wallet to proceed with crypto payment</p>
                      <button 
                        className="connect-wallet-btn"
                        onClick={() => setShowWalletConnection(true)}
                      >
                        Connect Wallet
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="payment-summary">
                <div className="summary-row">
                  <span>Dataset Price:</span>
                  <span>{formatPrice(totals.subtotal, dataset.currency)}</span>
                </div>
                <div className="summary-row">
                  <span>Platform Fee (5%):</span>
                  <span>{formatPrice(totals.platformFee, dataset.currency)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>{formatPrice(totals.total, dataset.currency)}</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="payment-step">
              <div className="confirmation-step">
                <div className="confirmation-icon">🔒</div>
                <h4>Confirm Purchase</h4>
                <p>Please review your purchase details before proceeding.</p>

                <div className="confirmation-details">
                  <div className="detail-row">
                    <span>Dataset:</span>
                    <span>{dataset.title}</span>
                  </div>
                  <div className="detail-row">
                    <span>Payment Method:</span>
                    <span>{paymentMethod === 'wallet' ? 'Crypto Wallet' : 'Credit Card'}</span>
                  </div>
                  {paymentMethod === 'wallet' && walletAddress && (
                    <div className="detail-row">
                      <span>Wallet Address:</span>
                      <span className="wallet-address">{walletAddress.substring(0, 10)}...{walletAddress.substring(-10)}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span>Total Amount:</span>
                    <span className="total-amount">{formatPrice(totals.total, dataset.currency)}</span>
                  </div>
                </div>

                <div className="terms-agreement">
                  <input type="checkbox" id="terms" required />
                  <label htmlFor="terms">
                    I agree to the <a href="#" className="terms-link">Terms of Service</a> and <a href="#" className="terms-link">Privacy Policy</a>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="payment-step">
              <div className="processing-step">
                <div className="processing-spinner"></div>
                <h4>Processing Payment</h4>
                <p>Please wait while we process your payment...</p>
                <div className="processing-steps">
                  <div className="processing-step-item active">
                    <span className="step-number">1</span>
                    <span>Validating payment</span>
                  </div>
                  <div className="processing-step-item">
                    <span className="step-number">2</span>
                    <span>Processing transaction</span>
                  </div>
                  <div className="processing-step-item">
                    <span className="step-number">3</span>
                    <span>Granting access</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="payment-actions">
          {step < 3 && (
            <>
              <button className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button
                className="continue-btn"
                onClick={handlePayment}
                disabled={processing || (paymentMethod === 'wallet' && !walletConnected)}
              >
                {step === 1 ? 'Continue' : 'Confirm Purchase'}
              </button>
            </>
          )}
        </div>
      </div>

      {showWalletConnection && (
        <WalletConnection
          onWalletConnected={handleWalletConnected}
          onClose={() => setShowWalletConnection(false)}
        />
      )}
    </div>
  );
};

export default PaymentModal;
