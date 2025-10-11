// Mock Walrus Wallet Service for testing without real wallet extensions
class WalrusWalletService {
  constructor() {
    this.connectedWallet = null;
    this.connectedAccount = null;
    this.isConnected = false;
    this.isMockMode = true;
    this.userBalances = new Map(); // Store persistent balances per wallet address
    this.userToWalletMap = new Map(); // Map user IDs to their wallet addresses
    this.initialBalance = 1000; // Starting balance for new users
  }

  // Get available mock wallets
  async getAvailableWallets() {
    return [
      {
        id: 'walrus-wallet-mock',
        name: 'Walrus Wallet (Mock)',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iI2Y1OTM3MyIvPgo8cGF0aCBkPSJNOCAxMkgxNk0xMiA4VjE2IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K',
        version: '1.0.0',
        chain: 'walrus'
      }
    ];
  }

  // Connect to mock wallet
  async connectWallet(walletId, userId = null) {
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      let walletAddress;
      
      // If user ID provided, check if they already have a wallet
      if (userId && this.userToWalletMap.has(userId)) {
        walletAddress = this.userToWalletMap.get(userId);
        console.log(`Mock Walrus: User ${userId} reconnecting to existing wallet: ${walletAddress}`);
      } else {
        // Generate new wallet address
        walletAddress = `0xWalrusMock${Math.random().toString(36).substr(2, 9)}`;
        
        // Map user ID to wallet address if provided
        if (userId) {
          this.userToWalletMap.set(userId, walletAddress);
          console.log(`Mock Walrus: New wallet created for user ${userId}: ${walletAddress}`);
        }
      }

      const mockAccount = {
        address: walletAddress,
        chain: 'walrus',
        walletName: 'Walrus Wallet (Mock)',
        userId: userId
      };

      this.connectedWallet = { id: walletId, name: mockAccount.walletName };
      this.connectedAccount = mockAccount;
      this.isConnected = true;

      console.log('Mock Walrus: Wallet connected successfully', mockAccount);

      return {
        success: true,
        account: mockAccount,
        wallet: mockAccount.walletName
      };
    } catch (error) {
      console.error('Mock Walrus: Error connecting wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Disconnect mock wallet
  async disconnectWallet() {
    try {
      // Simulate disconnection delay
      await new Promise(resolve => setTimeout(resolve, 600));

      this.connectedWallet = null;
      this.connectedAccount = null;
      this.isConnected = false;

      console.log('Mock Walrus: Wallet disconnected successfully');

      return { success: true };
    } catch (error) {
      console.error('Mock Walrus: Error disconnecting wallet:', error);
      return { success: false, error: error.message };
    }
  }

  // Get mock balance
  async getBalance(coinType = 'WAL') {
    try {
      if (!this.connectedAccount) {
        throw new Error('No account connected');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 700));

      const accountId = this.connectedAccount.address;
      
      // Initialize balance for new users
      if (!this.userBalances.has(accountId)) {
        this.userBalances.set(accountId, this.initialBalance);
      }
      
      const balance = this.userBalances.get(accountId);

      console.log(`Mock Walrus: Balance for ${this.connectedAccount.address}: ${balance} WAL`);

      return {
        success: true,
        balance: balance,
        coinType: coinType
      };
    } catch (error) {
      console.error('Mock Walrus: Error getting balance:', error);
      return { success: false, error: error.message };
    }
  }

  // Send mock tokens
  async sendTokens(recipient, amount, coinType = 'WAL') {
    try {
      if (!this.connectedWallet || !this.connectedAccount) {
        throw new Error('No wallet connected');
      }

      // Simulate transaction processing delay
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Generate mock transaction hash
      const mockTxHash = `0xWalrusMock${Date.now()}${Math.random().toString(36).substr(2, 8)}`;

      console.log(`Mock Walrus: Sending ${amount} ${coinType} to ${recipient}`);
      console.log(`Mock Walrus: Transaction hash: ${mockTxHash}`);

      return {
        success: true,
        transactionHash: mockTxHash,
        status: 'success',
        gasUsed: '0.01',
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000
      };
    } catch (error) {
      console.error('Mock Walrus: Error sending tokens:', error);
      return { success: false, error: error.message };
    }
  }

  // Get mock transaction history
  async getTransactionHistory(limit = 10) {
    try {
      if (!this.connectedAccount) {
        throw new Error('No account connected');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 900));

      // Generate mock transaction history
      const mockTransactions = Array.from({ length: Math.min(limit, 7) }, (_, i) => ({
        hash: `0xWalrusMockTx${Date.now() - i * 1800000}${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now() - i * 1800000,
        from: this.connectedAccount.address,
        to: `0xWalrusRecipient${Math.random().toString(36).substr(2, 6)}`,
        amount: (Math.random() * 100 + 1).toFixed(2),
        currency: 'WAL',
        status: 'success',
        gasUsed: '0.01'
      }));

      console.log(`Mock Walrus: Retrieved ${mockTransactions.length} transactions`);

      return {
        success: true,
        transactions: mockTransactions
      };
    } catch (error) {
      console.error('Mock Walrus: Error getting transaction history:', error);
      return { success: false, error: error.message };
    }
  }

  // Update balance after transaction
  updateBalance(amount, isDebit = true) {
    if (!this.connectedAccount) return false;
    
    const accountId = this.connectedAccount.address;
    
    // Initialize balance for new users
    if (!this.userBalances.has(accountId)) {
      this.userBalances.set(accountId, this.initialBalance);
    }
    
    const currentBalance = this.userBalances.get(accountId);
    const newBalance = isDebit ? currentBalance - amount : currentBalance + amount;
    
    // Ensure balance doesn't go below 0
    if (newBalance < 0) {
      console.log(`Mock Walrus: Insufficient balance. Current: ${currentBalance}, Required: ${amount}`);
      return false;
    }
    
    this.userBalances.set(accountId, newBalance);
    console.log(`Mock Walrus: Balance updated. ${isDebit ? 'Debited' : 'Credited'} ${amount} WAL. New balance: ${newBalance} WAL`);
    return true;
  }

  // Get wallet address by user ID
  getWalletAddressByUserId(userId) {
    return this.userToWalletMap.get(userId);
  }

  // Credit balance to any wallet address (for seller payments)
  creditBalance(walletAddress, amount) {
    // Initialize balance for new users
    if (!this.userBalances.has(walletAddress)) {
      this.userBalances.set(walletAddress, this.initialBalance);
    }
    
    const currentBalance = this.userBalances.get(walletAddress);
    const newBalance = currentBalance + amount;
    
    this.userBalances.set(walletAddress, newBalance);
    console.log(`Mock Walrus: Credited ${amount} WAL to ${walletAddress}. New balance: ${newBalance} WAL`);
    return true;
  }

  // Credit balance to user by ID
  creditBalanceByUserId(userId, amount) {
    const walletAddress = this.getWalletAddressByUserId(userId);
    if (!walletAddress) {
      console.error(`Mock Walrus: No wallet found for user ${userId}`);
      return false;
    }
    return this.creditBalance(walletAddress, amount);
  }

  // Get current connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      wallet: this.connectedWallet?.name || null,
      account: this.connectedAccount?.address || null,
      chain: this.connectedAccount?.chain || null
    };
  }

  // Switch network (mock)
  async switchNetwork(network = 'mainnet') {
    try {
      // Simulate network switch delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      console.log(`Mock Walrus: Switched to ${network} network`);

      return {
        success: true,
        network: network,
        url: `https://walrus-${network}.example.com`
      };
    } catch (error) {
      console.error('Mock Walrus: Error switching network:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const walrusWalletService = new WalrusWalletService();
export default walrusWalletService;