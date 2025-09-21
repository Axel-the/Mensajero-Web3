import CryptoJS from 'crypto-js'

export interface EncryptionKeyPair {
  publicKey: string
  privateKey: string
}

export class EncryptionService {
  private static instance: EncryptionService
  private keyPairs: Map<string, EncryptionKeyPair> = new Map()

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  // Generate a new key pair for a user
  generateKeyPair(): EncryptionKeyPair {
    const privateKey = CryptoJS.lib.WordArray.random(32)
    const publicKey = CryptoJS.lib.WordArray.random(32)
    
    return {
      publicKey: publicKey.toString(),
      privateKey: privateKey.toString()
    }
  }

  // Store key pair for a user
  storeKeyPair(userAddress: string, keyPair: EncryptionKeyPair): void {
    this.keyPairs.set(userAddress.toLowerCase(), keyPair)
  }

  // Get key pair for a user
  getKeyPair(userAddress: string): EncryptionKeyPair | null {
    return this.keyPairs.get(userAddress.toLowerCase()) || null
  }

  // Encrypt message for recipient
  encryptMessage(message: string, recipientPublicKey: string, senderPrivateKey: string): string {
    try {
      // Combine sender's private key and recipient's public key to create shared secret
      const sharedSecret = this.deriveSharedSecret(senderPrivateKey, recipientPublicKey)
      
      // Encrypt the message using AES
      const encrypted = CryptoJS.AES.encrypt(message, sharedSecret).toString()
      
      return encrypted
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt message')
    }
  }

  // Decrypt message from sender
  decryptMessage(encryptedMessage: string, senderPublicKey: string, recipientPrivateKey: string): string {
    try {
      // Combine recipient's private key and sender's public key to create shared secret
      const sharedSecret = this.deriveSharedSecret(recipientPrivateKey, senderPublicKey)
      
      // Decrypt the message using AES
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, sharedSecret)
      const decryptedMessage = decrypted.toString(CryptoJS.enc.Utf8)
      
      if (!decryptedMessage) {
        throw new Error('Failed to decrypt message - invalid key or corrupted data')
      }
      
      return decryptedMessage
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt message')
    }
  }

  // Derive shared secret from private and public keys
  private deriveSharedSecret(privateKey: string, publicKey: string): string {
    // In a real implementation, you would use ECDH (Elliptic Curve Diffie-Hellman)
    // For this demo, we'll use a simpler approach with HMAC
    const combined = privateKey + publicKey
    return CryptoJS.HmacSHA256(combined, 'web3-messenger-secret').toString()
  }

  // Generate a signature for message verification
  signMessage(message: string, privateKey: string): string {
    try {
      const signature = CryptoJS.HmacSHA256(message, privateKey).toString()
      return signature
    } catch (error) {
      console.error('Signature error:', error)
      throw new Error('Failed to sign message')
    }
  }

  // Verify message signature
  verifySignature(message: string, signature: string, publicKey: string): boolean {
    try {
      const expectedSignature = CryptoJS.HmacSHA256(message, publicKey).toString()
      return signature === expectedSignature
    } catch (error) {
      console.error('Verification error:', error)
      return false
    }
  }

  // Hash sensitive data
  hashData(data: string): string {
    return CryptoJS.SHA256(data).toString()
  }

  // Generate secure random token
  generateSecureToken(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString()
  }

  // Export key pair as JSON
  exportKeyPair(userAddress: string): string | null {
    const keyPair = this.getKeyPair(userAddress)
    if (!keyPair) return null
    
    return JSON.stringify({
      userAddress,
      keyPair,
      timestamp: new Date().toISOString(),
      version: '1.0'
    })
  }

  // Import key pair from JSON
  importKeyPair(exportedData: string): boolean {
    try {
      const data = JSON.parse(exportedData)
      if (!data.userAddress || !data.keyPair) {
        throw new Error('Invalid export format')
      }
      
      this.storeKeyPair(data.userAddress, data.keyPair)
      return true
    } catch (error) {
      console.error('Import error:', error)
      return false
    }
  }
}

export const encryptionService = EncryptionService.getInstance()