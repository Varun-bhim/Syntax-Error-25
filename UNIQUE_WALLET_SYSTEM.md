# Unique Wallet System

## Overview
Each user ID now has a unique wallet address that persists across sessions. When transactions occur, the seller receives money while the buyer's money is deducted from their respective unique wallets.

## Key Features

### 1. Unique Wallet Mapping
- Each user ID maps to a unique wallet address
- Wallet addresses persist across sessions
- Same user always gets the same wallet address

### 2. Transaction Flow
- **Buyer**: Money deducted from their unique wallet
- **Seller**: Money credited to their unique wallet
- **Platform**: Collects transaction fees

### 3. Balance Management
- Each wallet has persistent balance
- New users start with initial balance (1000 WAL, 100 SUI)
- Balances update only on transactions

## Technical Implementation

### Wallet Services
```javascript
// User-to-wallet mapping
this.userToWalletMap = new Map(); // userId -> walletAddress
this.userBalances = new Map(); // walletAddress -> balance

// Connect with user ID
async connectWallet(walletId, userId = null) {
  if (userId && this.userToWalletMap.has(userId)) {
    // Reconnect to existing wallet
    walletAddress = this.userToWalletMap.get(userId);
  } else {
    // Create new wallet for user
    walletAddress = generateNewAddress();
    this.userToWalletMap.set(userId, walletAddress);
  }
}

// Credit by user ID
creditBalanceByUserId(userId, amount) {
  const walletAddress = this.getWalletAddressByUserId(userId);
  return this.creditBalance(walletAddress, amount);
}
```

### Payment Service
```javascript
// Deduct from buyer (connected wallet)
const balanceUpdated = walletManager.updateBalance(totalAmount, true);

// Credit to seller (by user ID)
const sellerCredited = walletManager.creditBalanceByUserId(sellerUserId, sellerAmount, sellerChain);
```

## User Experience

### First Time User
1. User logs in with ID "user123"
2. Connects to Sui wallet
3. System creates unique wallet: "0xSuiUser123abc"
4. Balance initialized: 100 SUI
5. Wallet persists for future sessions

### Returning User
1. User "user123" logs in again
2. Connects to Sui wallet
3. System reconnects to existing wallet: "0xSuiUser123abc"
4. Balance shows previous amount (e.g., 85 SUI)

### Transaction Example
```
User A (seller): user123 -> 0xSuiUser123abc (100 SUI)
User B (buyer): user456 -> 0xSuiUser456def (100 SUI)

Transaction: User B buys dataset from User A (15 SUI)

After:
User A: 0xSuiUser123abc (115 SUI) - received payment
User B: 0xSuiUser456def (85 SUI) - paid 15 SUI + 0.001 fee
```

## Benefits

### For Users
- Consistent wallet addresses
- Persistent balances
- Clear transaction history
- No confusion about wallet ownership

### For Platform
- Proper user identification
- Accurate transaction tracking
- Reliable payment processing
- Better user experience

### For Developers
- Predictable wallet behavior
- Easier testing and debugging
- Clear user-wallet relationships
- Simplified transaction logic

## Testing Scenarios

### Scenario 1: New User
1. Login as new user
2. Connect wallet
3. Verify unique wallet created
4. Check initial balance (1000 WAL, 100 SUI)

### Scenario 2: Returning User
1. Login as existing user
2. Connect wallet
3. Verify same wallet address
4. Check previous balance maintained

### Scenario 3: Transaction
1. User A uploads dataset
2. User B purchases dataset
3. Verify User A receives payment
4. Verify User B balance deducted
5. Check both users' balances updated

### Scenario 4: Cross-Chain
1. User connects Sui wallet (gets SUI address)
2. User connects Walrus wallet (gets WAL address)
3. Verify different addresses for different chains
4. Test transactions on both chains

## Console Logs
```
Mock Sui: New wallet created for user user123: 0xSuiUser123abc
Mock Sui: User user123 reconnecting to existing wallet: 0xSuiUser123abc
Mock Sui: Balance updated. Debited 15.001 SUI. New balance: 84.999 SUI
Mock Sui: Credited 15 SUI to 0xSuiUser456def. New balance: 115 SUI
Successfully credited 15 SUI to seller user456
```

## Database Schema
```javascript
// Transaction record includes seller user ID
{
  buyer: "user123",
  seller: "user456", 
  sellerUserId: "user456",
  amount: 15,
  currency: "SUI",
  sellerAmount: 15,
  // ... other fields
}
```

## Security Considerations
- User IDs are mapped to wallet addresses
- Wallet addresses are unique per user
- Balances are tracked per wallet address
- Transactions are recorded with user IDs
- No wallet address conflicts between users

## Future Enhancements
- Wallet address persistence in database
- Multi-signature wallet support
- Hardware wallet integration
- Cross-chain transaction support
- Advanced transaction history
