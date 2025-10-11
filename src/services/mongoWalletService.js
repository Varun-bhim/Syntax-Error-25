// MongoDB-based Wallet Service
class MongoWalletService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/wallets';
  }

  // Get user's wallet
  async getUserWallet() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseURL}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get wallet');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting user wallet:', error);
      return { success: false, error: error.message };
    }
  }

  // Get wallet balance
  async getBalance() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseURL}/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get balance');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return { success: false, error: error.message };
    }
  }

  // Update wallet balance
  async updateBalance(amount, type, description, transactionId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseURL}/update-balance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          type,
          description,
          transactionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update balance');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      return { success: false, error: error.message };
    }
  }

  // Get transaction history
  async getTransactionHistory(limit = 10) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseURL}/transactions?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get transaction history');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return { success: false, error: error.message };
    }
  }

  // Transfer between wallets
  async transfer(fromAddress, toAddress, amount, description, transactionId) {
    try {
      const response = await fetch(`${this.baseURL}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromAddress,
          toAddress,
          amount,
          description,
          transactionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to transfer');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error transferring between wallets:', error);
      return { success: false, error: error.message };
    }
  }

  // Get wallet by address
  async getWalletByAddress(address) {
    try {
      const response = await fetch(`${this.baseURL}/address/${address}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get wallet by address');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting wallet by address:', error);
      return { success: false, error: error.message };
    }
  }

  // Create wallet for user
  async createWallet() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseURL}/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create wallet');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating wallet:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new MongoWalletService();
