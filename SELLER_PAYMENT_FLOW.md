# Seller Payment Flow

## Overview
When user B purchases a dataset from user A, both users' wallet balances are updated correctly.

## Flow

### 1. Initial State
- **User A (Seller)**: 1000 WAL, 100 SUI
- **User B (Buyer)**: 1000 WAL, 100 SUI

### 2. Purchase Transaction
- **Dataset**: "E-commerce Sales Data 2024" (25.99 WAL)
- **Buyer**: User B
- **Seller**: User A

### 3. Payment Processing
```
1. User B initiates purchase
2. Check User B's balance: 1000 WAL ✓
3. Deduct from User B: 25.99 WAL + 0.01 WAL (fee) = 26.00 WAL
4. Credit to User A: 25.99 WAL
5. Platform keeps: 0.01 WAL (fee)
```

### 4. Final State
- **User A (Seller)**: 1025.99 WAL, 100 SUI
- **User B (Buyer)**: 974.00 WAL, 100 SUI

## Technical Implementation

### Wallet Services
- `creditBalance(walletAddress, amount)` - Credits any wallet address
- `updateBalance(amount, isDebit)` - Updates connected wallet balance

### Payment Service
- Fetches dataset information to get seller details
- Deducts from buyer's wallet
- Credits seller's wallet
- Records transaction with seller information

### Backend
- Transaction records include seller information
- Seller wallet address stored
- Seller amount tracked

## Testing

### Test Scenario 1: WAL Purchase
1. User A uploads dataset (25.99 WAL)
2. User B connects Walrus wallet (1000 WAL)
3. User B purchases dataset
4. **Result**: User A gets 25.99 WAL, User B pays 26.00 WAL

### Test Scenario 2: SUI Purchase
1. User A uploads dataset (15.50 SUI)
2. User B connects Sui wallet (100 SUI)
3. User B purchases dataset
4. **Result**: User A gets 15.50 SUI, User B pays 15.501 SUI

### Test Scenario 3: Insufficient Funds
1. User B tries to purchase 150 SUI dataset
2. User B only has 100 SUI
3. **Result**: Payment fails, no balance changes

## Console Logs
```
Mock Walrus: Balance updated. Debited 26.00 WAL. New balance: 974.00 WAL
Mock Walrus: Credited 25.99 WAL to 0xSampleProvider123456789. New balance: 1025.99 WAL
```

## Benefits
- Sellers receive payment immediately
- Transparent transaction flow
- Proper fee distribution
- Accurate balance tracking
- Complete transaction records
