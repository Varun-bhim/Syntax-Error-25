import walletManager from './walletManager';
import axios from 'axios';

class PaymentService {
  constructor() {
    this.apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    this.supportedCurrencies = ['WAL'];
    this.transactionFees = {
      WAL: 0.01   // 0.01 WAL fee
    };
  }

  // Process payment for dataset purchase
  async processPayment(datasetId, amount, currency) {
    try {
      // Validate inputs
      if (!datasetId || !amount || !currency) {
        throw new Error('Missing required payment parameters');
      }

      if (!this.supportedCurrencies.includes(currency)) {
        throw new Error(`Unsupported currency: ${currency}`);
      }

      // Get current wallet status
      const walletStatus = walletManager.getConnectionStatus();
      if (!walletStatus.isConnected) {
        throw new Error('No wallet connected');
      }

      // Fetch dataset information to get seller details
      const datasetResponse = await axios.get(`${this.apiBaseUrl}/api/datasets/${datasetId}`);
      const dataset = datasetResponse.data;
      
      if (!dataset) {
        throw new Error('Dataset not found');
      }

      // Calculate total amount including fees
      const fee = this.transactionFees[currency] || 0;
      const totalAmount = parseFloat(amount) + fee;

      // Only WAL currency supported
      const chain = 'walrus';
      
      if (walletStatus.chain !== chain) {
        throw new Error(`Please connect a WALRUS wallet for ${currency} payments`);
      }

      // Send payment to platform (mock implementation)
      const paymentResult = await walletManager.sendTokens(
        '0xPlatformWallet', // Platform wallet address
        totalAmount.toString(),
        null
      );

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      // Update buyer's wallet balance after successful payment
      const balanceUpdated = walletManager.updateBalance(totalAmount, true);
      if (!balanceUpdated) {
        throw new Error('Insufficient balance for payment');
      }

      // Credit seller's wallet (amount minus platform fee)
      const sellerAmount = parseFloat(amount); // Seller gets the full amount, platform fee is separate
      const sellerUserId = dataset.provider?._id;
      
      if (sellerUserId) {
        const sellerChain = 'walrus';
        const sellerCredited = walletManager.creditBalanceByUserId(sellerUserId, sellerAmount, sellerChain);
        
        if (!sellerCredited) {
          console.warn('Failed to credit seller wallet, but payment was successful');
        } else {
          console.log(`Successfully credited ${sellerAmount} ${currency} to seller ${sellerUserId}`);
        }
      } else {
        console.warn('No seller user ID found for dataset');
      }

      // Record transaction in backend
      const transactionRecord = await this.recordTransaction({
        datasetId,
        amount: parseFloat(amount),
        currency,
        fee,
        totalAmount,
        sellerAmount: sellerAmount,
        sellerUserId: sellerUserId,
        transactionHash: paymentResult.transactionHash || paymentResult.transactionDigest,
        chain,
        status: 'completed'
      });

      return {
        success: true,
        transactionHash: paymentResult.transactionHash || paymentResult.transactionDigest,
        amount: parseFloat(amount),
        currency,
        fee,
        totalAmount,
        transactionId: transactionRecord.id,
        message: 'Payment processed successfully'
      };

    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Record transaction in backend
  async recordTransaction(transactionData) {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/transactions`, {
        ...transactionData,
        timestamp: new Date().toISOString()
      });

      return response.data;
    } catch (error) {
      console.error('Error recording transaction:', error);
      // Return a mock transaction record for development
      return {
        id: 'txn_' + Date.now(),
        ...transactionData,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get transaction status
  async getTransactionStatus(transactionHash, chain) {
    try {
      if (chain === 'sui') {
        // For Sui, we can query the blockchain directly
        // Implementation would depend on Sui SDK capabilities
        return {
          success: true,
          status: 'confirmed',
          confirmations: 1
        };
      } else if (chain === 'walrus') {
        // For Walrus, we'd query the Walrus blockchain
        return {
          success: true,
          status: 'confirmed',
          confirmations: 1
        };
      }

      throw new Error(`Unsupported chain: ${chain}`);
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payment history
  async getPaymentHistory(limit = 10) {
    try {
      const walletStatus = walletManager.getConnectionStatus();
      if (!walletStatus.isConnected) {
        throw new Error('No wallet connected');
      }

      // Get transactions from blockchain
      const blockchainTxs = await walletManager.getTransactionHistory(limit);
      
      // Get transactions from backend
      const backendTxs = await this.getBackendTransactions(limit);

      // Merge and deduplicate transactions
      const allTransactions = [...(blockchainTxs.transactions || []), ...(backendTxs || [])];
      const uniqueTransactions = this.deduplicateTransactions(allTransactions);

      return {
        success: true,
        transactions: uniqueTransactions.slice(0, limit)
      };
    } catch (error) {
      console.error('Error getting payment history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get transactions from backend
  async getBackendTransactions(limit = 10) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/transactions`, {
        params: { limit }
      });
      return response.data.transactions || [];
    } catch (error) {
      console.error('Error getting backend transactions:', error);
      return [];
    }
  }

  // Deduplicate transactions
  deduplicateTransactions(transactions) {
    const seen = new Set();
    return transactions.filter(tx => {
      const key = tx.hash || tx.transactionHash || tx.id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Calculate fees
  calculateFees(amount, currency) {
    const fee = this.transactionFees[currency] || 0;
    const total = parseFloat(amount) + fee;
    
    return {
      amount: parseFloat(amount),
      fee,
      total,
      currency
    };
  }

  // Validate payment amount
  validatePaymentAmount(amount, currency) {
    try {
      const numAmount = parseFloat(amount);
      
      if (isNaN(numAmount) || numAmount <= 0) {
        return { valid: false, error: 'Invalid amount' };
      }

      const minAmounts = {
        SUI: 0.001,
        WAL: 0.01
      };

      if (numAmount < (minAmounts[currency] || 0)) {
        return { 
          valid: false, 
          error: `Minimum amount is ${minAmounts[currency]} ${currency}` 
        };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid amount format' };
    }
  }

  // Get supported currencies
  getSupportedCurrencies() {
    return this.supportedCurrencies;
  }

  // Get transaction fees
  getTransactionFees() {
    return this.transactionFees;
  }

  // Estimate gas fees (for Sui)
  async estimateGasFees(transaction) {
    try {
      const walletStatus = walletManager.getConnectionStatus();
      if (walletStatus.chain !== 'sui') {
        return { success: false, error: 'Gas estimation only available for Sui' };
      }

      // This would use Sui SDK to estimate gas
      // For now, return a mock estimate
      return {
        success: true,
        gasEstimate: '1000',
        gasPrice: '0.000001',
        totalGas: '0.001'
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      return { success: false, error: error.message };
    }
  }

  // Create payment link (for sharing)
  createPaymentLink(datasetId, amount, currency) {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      dataset: datasetId,
      amount,
      currency
    });
    
    return `${baseUrl}/payment?${params.toString()}`;
  }

  // Parse payment link
  parsePaymentLink(url) {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      return {
        datasetId: params.get('dataset'),
        amount: params.get('amount'),
        currency: params.get('currency')
      };
    } catch (error) {
      console.error('Error parsing payment link:', error);
      return null;
    }
  }
}

// Create singleton instance
const paymentService = new PaymentService();
export default paymentService;
