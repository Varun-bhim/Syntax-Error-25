import React, { useState, useEffect, useCallback } from 'react';
import walletManager from '../../services/walletManager';
import paymentService from '../../services/paymentService';
import './PaymentModal.css';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  dataset, 
  onPaymentSuccess, 
  onPaymentError 
}) => {
  const [paymentData, setPaymentData] = useState({
    amount: '',
    currency: 'WAL'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletStatus, setWalletStatus] = useState(null);
  const [fees, setFees] = useState(null);
  const [validation, setValidation] = useState({ valid: true, error: '' });

  const loadWalletStatus = () => {
    const status = walletManager.getConnectionStatus();
    setWalletStatus(status);
  };

  const calculateFees = useCallback(() => {
    const fees = paymentService.calculateFees(paymentData.amount, paymentData.currency);
    setFees(fees);
  }, [paymentData.amount, paymentData.currency]);

  const validatePayment = useCallback(() => {
    const validation = paymentService.validatePaymentAmount(
      paymentData.amount, 
      paymentData.currency
    );
    setValidation(validation);
  }, [paymentData.amount, paymentData.currency]);

  useEffect(() => {
    if (isOpen && dataset) {
      loadWalletStatus();
      setPaymentData({
        amount: dataset.price?.toString() || '',
        currency: dataset.currency || 'WAL'
      });
    }
  }, [isOpen, dataset]);

  useEffect(() => {
    if (paymentData.amount && paymentData.currency) {
      calculateFees();
      validatePayment();
    }
  }, [paymentData.amount, paymentData.currency, calculateFees, validatePayment]);

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCurrencyChange = (currency) => {
    setPaymentData(prev => ({
      ...prev,
      currency
    }));
  };

  const handlePayment = async () => {
    if (!validation.valid) {
      onPaymentError && onPaymentError(validation.error);
      return;
    }

    if (!walletStatus?.isConnected) {
      onPaymentError && onPaymentError('Please connect a wallet first');
      return;
    }

    try {
      setIsProcessing(true);
      
      const result = await paymentService.processPayment(
        dataset._id,
        paymentData.amount,
        paymentData.currency
      );

      if (result.success) {
        onPaymentSuccess && onPaymentSuccess(result);
        onClose();
      } else {
        onPaymentError && onPaymentError(result.error);
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError && onPaymentError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSupportedCurrencies = () => {
    return paymentService.getSupportedCurrencies();
  };

  const formatAmount = (amount) => {
    return walletManager.formatAmount(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-header">
          <h3>Complete Payment</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="payment-content">
          {/* Dataset Info */}
          <div className="dataset-info">
            <h4>{dataset?.title}</h4>
            <p className="dataset-description">{dataset?.description}</p>
            <div className="dataset-meta">
              <span className="provider">Provider: {dataset?.provider?.username}</span>
              <span className="category">Category: {dataset?.category}</span>
            </div>
          </div>

          {/* Wallet Status */}
          <div className="wallet-status">
            {walletStatus?.isConnected ? (
              <div className="wallet-connected">
                <span className="status-icon">✅</span>
                <div className="wallet-info">
                  <div className="wallet-name">{walletStatus.wallet}</div>
                  <div className="wallet-address">
                    {walletStatus.account?.slice(0, 6)}...{walletStatus.account?.slice(-4)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="wallet-disconnected">
                <span className="status-icon">❌</span>
                <span>No wallet connected</span>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <div className="payment-form">
            <div className="form-group">
              <label>Amount</label>
              <div className="amount-input-group">
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  step="0.000001"
                  min="0"
                  disabled={isProcessing}
                />
                <input
                  type="text"
                  value="WAL"
                  disabled={true}
                  className="readonly-input"
                />
              </div>
              {!validation.valid && (
                <span className="error-message">{validation.error}</span>
              )}
            </div>

          </div>

          {/* Fee Breakdown */}
          {fees && (
            <div className="fee-breakdown">
              <h4>Payment Breakdown</h4>
              <div className="fee-item">
                <span>Amount:</span>
                <span>{formatAmount(fees.amount)} {fees.currency}</span>
              </div>
              <div className="fee-item">
                <span>Transaction Fee:</span>
                <span>{formatAmount(fees.fee)} {fees.currency}</span>
              </div>
              <div className="fee-item total">
                <span>Total:</span>
                <span>{formatAmount(fees.total)} {fees.currency}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="payment-actions">
            <button
              className="cancel-btn"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              className="pay-btn"
              onClick={handlePayment}
              disabled={!validation.valid || !walletStatus?.isConnected || isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                `Pay ${fees ? formatAmount(fees.total) : '0'} ${paymentData.currency}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
