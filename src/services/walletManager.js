import walrusWalletService from './walrusWalletService';
import mongoWalletService from './mongoWalletService';

class WalletManager {
  constructor() {
    this.supportedChains = ['walrus'];
    this.currentChain = 'walrus';
    this.walletServices = {
      walrus: walrusWalletService
    };
    this.mongoService = mongoWalletService;
  }

  // Get all available wallets for a specific chain
  async getAvailableWallets(chain) {
    try {
      if (chain === 'walrus') {
        return await walrusWalletService.getAvailableWallets();
      }
      return [];
    } catch (error) {
      console.error(`Error getting wallets for ${chain}:`, error);
      return [];
    }
  }

  // Connect to a specific wallet on a specific chain
  async connectWallet(chain, walletId, userId = null) {
    try {
      this.currentChain = chain;
      const service = this.walletServices[chain];
      
      if (!service) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const result = await service.connectWallet(walletId, userId);
      
      if (result.success) {
        return {
          success: true,
          chain: chain,
          wallet: result.wallet || walletId,
          account: result.account,
          isMock: result.isMock || false
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error(`Error connecting to ${chain} wallet:`, error);
      return { success: false, error: error.message };
    }
  }

  // Connect to real Walrus wallet using address
  async connectRealWalrusWallet(walletAddress, userId = null) {
    try {
      this.currentChain = 'walrus';
      const service = this.walletServices['walrus'];
      
      if (!service) {
        throw new Error('Walrus service not available');
      }

      const result = await service.connectRealWallet(walletAddress, userId);
      
      if (result.success) {
        return {
          success: true,
          chain: 'walrus',
          wallet: 'Real Walrus Wallet',
          account: walletAddress,
          isMock: false,
          isConnected: true
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error('Error connecting to real Walrus wallet:', error);
      return { success: false, error: error.message };
    }
  }

  // Disconnect current wallet
  async disconnectWallet() {
    try {
      if (!this.currentChain) {
        return { success: true };
      }

      const service = this.walletServices[this.currentChain];
      const result = await service.disconnectWallet();
      
      this.currentChain = null;
      return result;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      return { success: false, error: error.message };
    }
  }

  // Get balance for current wallet
  async getBalance(coinType = null) {
    try {
      // Use MongoDB service for balance
      const result = await this.mongoService.getBalance();
      return result;
    } catch (error) {
      console.error('Error getting balance:', error);
      return { success: false, error: error.message };
    }
  }

  // Send tokens
  async sendTokens(recipient, amount, coinType = null) {
    try {
      if (!this.currentChain) {
        throw new Error('No wallet connected');
      }

      const service = this.walletServices[this.currentChain];
      
      if (this.currentChain === 'sui') {
        return await service.sendTokens(recipient, amount, coinType);
      } else if (this.currentChain === 'walrus') {
        return await service.sendTokens(recipient, amount);
      }
      
      throw new Error(`Unsupported chain: ${this.currentChain}`);
    } catch (error) {
      console.error('Error sending tokens:', error);
      return { success: false, error: error.message };
    }
  }

  // Get transaction history
  async getTransactionHistory(limit = 10) {
    try {
      // Use MongoDB service for transaction history
      const result = await this.mongoService.getTransactionHistory(limit);
      return result;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return { success: false, error: error.message };
    }
  }

  // Switch network
  async switchNetwork(network) {
    try {
      if (!this.currentChain) {
        throw new Error('No wallet connected');
      }

      const service = this.walletServices[this.currentChain];
      
      if (this.currentChain === 'sui') {
        return await service.switchNetwork(network);
      } else if (this.currentChain === 'walrus') {
        return await service.switchNetwork(network);
      }
      
      throw new Error(`Unsupported chain: ${this.currentChain}`);
    } catch (error) {
      console.error('Error switching network:', error);
      return { success: false, error: error.message };
    }
  }

  // Update balance after transaction
  updateBalance(amount, isDebit = true) {
    if (!this.currentChain) {
      return false;
    }
    
    const service = this.walletServices[this.currentChain];
    if (service && service.updateBalance) {
      return service.updateBalance(amount, isDebit);
    }
    
    return false;
  }

  // Credit balance to any wallet address (for seller payments)
  creditBalance(walletAddress, amount, chain) {
    const service = this.walletServices[chain];
    if (service && service.creditBalance) {
      return service.creditBalance(walletAddress, amount);
    }
    
    return false;
  }

  // Credit balance to user by ID (for seller payments)
  creditBalanceByUserId(userId, amount, chain) {
    const service = this.walletServices[chain];
    if (service && service.creditBalanceByUserId) {
      return service.creditBalanceByUserId(userId, amount);
    }
    
    return false;
  }

  // Get wallet address by user ID
  getWalletAddressByUserId(userId, chain) {
    const service = this.walletServices[chain];
    if (service && service.getWalletAddressByUserId) {
      return service.getWalletAddressByUserId(userId);
    }
    
    return null;
  }

  // Get balance by user ID
  getBalanceByUserId(userId, chain) {
    const service = this.walletServices[chain];
    if (service && service.getBalanceByUserId) {
      return service.getBalanceByUserId(userId);
    }
    
    return { success: false, error: 'Service not available' };
  }

  // Get current connection status
  getConnectionStatus() {
    const service = this.walletServices['walrus'];
    const status = service.getConnectionStatus();
    
    return {
      ...status,
      chain: 'walrus'
    };
  }

  // Get supported chains
  getSupportedChains() {
    return this.supportedChains;
  }

  // Check if a chain is supported
  isChainSupported(chain) {
    return this.supportedChains.includes(chain);
  }

  // Get current chain
  getCurrentChain() {
    return this.currentChain;
  }

  // Format amount for display
  formatAmount(amount, decimals = 9) {
    try {
      const num = parseFloat(amount);
      if (isNaN(num)) return '0';
      
      return num.toFixed(decimals).replace(/\.?0+$/, '');
    } catch (error) {
      console.error('Error formatting amount:', error);
      return '0';
    }
  }

  // Convert between different units
  convertUnits(amount, fromUnit, toUnit) {
    try {
      const units = {
        wei: 1,
        gwei: 1e9,
        ether: 1e18,
        sui: 1e9,
        wal: 1e18
      };

      const fromValue = units[fromUnit] || 1;
      const toValue = units[toUnit] || 1;
      
      return (parseFloat(amount) * fromValue) / toValue;
    } catch (error) {
      console.error('Error converting units:', error);
      return 0;
    }
  }

  // Validate address format
  validateAddress(address, chain) {
    try {
      if (!address) return false;
      
      if (chain === 'sui') {
        // Sui addresses start with 0x and are 66 characters long
        return /^0x[a-fA-F0-9]{64}$/.test(address);
      } else if (chain === 'walrus') {
        // Walrus addresses start with 0x and are 42 characters long (standard Ethereum format)
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      }
      
      return false;
    } catch (error) {
      console.error('Error validating address:', error);
      return false;
    }
  }
}

// Create singleton instance
const walletManager = new WalletManager();
export default walletManager;
