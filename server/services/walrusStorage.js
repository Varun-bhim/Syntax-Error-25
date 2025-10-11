const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const fs = require('fs');
const path = require('path');

class WalrusStorageService {
  constructor() {
    // Initialize Sui client - using testnet for development
    this.client = new SuiClient({ url: getFullnodeUrl('testnet') });
    
    // For development, we'll use a mock keypair
    // In production, you'd get this from user's wallet connection
    this.keypair = this.generateMockKeypair();
    
    // Walrus storage configuration
    this.walrusConfig = {
      packageId: '0xwalrus_package_id', // Replace with actual Walrus package ID
      storageModule: 'storage',
      blobModule: 'blob'
    };
    
    // In-memory storage for development (replace with actual Walrus in production)
    this.mockBlobs = new Map();
  }

  generateMockKeypair() {
    // Generate a mock keypair for development using a valid mnemonic
    // In production, this would come from user's wallet
    const validMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const keypair = Ed25519Keypair.deriveKeypair(validMnemonic);
    return keypair;
  }

  async uploadFile(fileBuffer, fileName, metadata = {}) {
    try {
      console.log(`Uploading file to Walrus: ${fileName}`);
      
      // Generate unique blob ID
      const mockBlobId = `blob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the actual file content in memory (replace with Walrus in production)
      this.mockBlobs.set(mockBlobId, {
        content: Buffer.from(fileBuffer), // Ensure we store the actual buffer
        fileName: fileName,
        size: fileBuffer.length,
        contentType: metadata.contentType || 'application/octet-stream',
        uploadedAt: new Date(),
        checksum: this.calculateChecksum(fileBuffer),
        metadata: metadata
      });
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const blobInfo = {
        blobId: mockBlobId,
        fileName: fileName,
        size: fileBuffer.length,
        contentType: metadata.contentType || 'application/octet-stream',
        uploadedAt: new Date(),
        checksum: this.calculateChecksum(fileBuffer),
        walrusUrl: `https://walrus.testnet.sui.io/blob/${mockBlobId}` // Mock URL
      };

      console.log(`File uploaded successfully: ${mockBlobId} (${fileBuffer.length} bytes)`);
      return blobInfo;
      
    } catch (error) {
      console.error('Error uploading file to Walrus:', error);
      throw new Error(`Failed to upload file to Walrus: ${error.message}`);
    }
  }

  async downloadFile(blobId) {
    try {
      console.log(`Downloading file from Walrus: ${blobId}`);
      
      // Check if blob exists in our mock storage
      if (!this.mockBlobs.has(blobId)) {
        throw new Error(`Blob ${blobId} not found`);
      }
      
      const blobData = this.mockBlobs.get(blobId);
      
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return the actual stored content
      console.log(`File downloaded successfully: ${blobId} (${blobData.content.length} bytes)`);
      return blobData.content;
      
    } catch (error) {
      console.error('Error downloading file from Walrus:', error);
      throw new Error(`Failed to download file from Walrus: ${error.message}`);
    }
  }

  async getBlobMetadata(blobId) {
    try {
      console.log(`Getting metadata for blob: ${blobId}`);
      
      // Check if blob exists in our mock storage
      if (!this.mockBlobs.has(blobId)) {
        throw new Error(`Blob ${blobId} not found`);
      }
      
      const blobData = this.mockBlobs.get(blobId);
      
      // Return actual metadata
      const metadata = {
        blobId: blobId,
        fileName: blobData.fileName,
        size: blobData.size,
        contentType: blobData.contentType,
        uploadedAt: blobData.uploadedAt,
        checksum: blobData.checksum,
        walrusUrl: `https://walrus.testnet.sui.io/blob/${blobId}`
      };

      return metadata;
      
    } catch (error) {
      console.error('Error getting blob metadata:', error);
      throw new Error(`Failed to get blob metadata: ${error.message}`);
    }
  }

  calculateChecksum(buffer) {
    // Simple checksum calculation for development
    let hash = 0;
    for (let i = 0; i < buffer.length; i++) {
      hash = ((hash << 5) - hash + buffer[i]) & 0xffffffff;
    }
    return hash.toString(16);
  }

  async createDatasetBlob(datasetFiles) {
    try {
      console.log(`Creating dataset blob with ${datasetFiles.length} files`);
      
      const blobInfos = [];
      
      for (const file of datasetFiles) {
        const blobInfo = await this.uploadFile(file.buffer, file.originalname, {
          contentType: file.mimetype
        });
        blobInfos.push(blobInfo);
      }
      
      return blobInfos;
      
    } catch (error) {
      console.error('Error creating dataset blob:', error);
      throw new Error(`Failed to create dataset blob: ${error.message}`);
    }
  }

  async verifyAccess(blobId, userAddress) {
    try {
      console.log(`Verifying access for user ${userAddress} to blob ${blobId}`);
      
      // In a real implementation, you would check:
      // 1. If the user has purchased access to this dataset
      // 2. If the access is still valid (not expired)
      // 3. If the user hasn't exceeded download limits
      
      // For now, we'll simulate access verification
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        hasAccess: true,
        downloadCount: 0,
        maxDownloads: 5,
        accessExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };
      
    } catch (error) {
      console.error('Error verifying access:', error);
      throw new Error(`Failed to verify access: ${error.message}`);
    }
  }
}

module.exports = WalrusStorageService;
