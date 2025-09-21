'use client'

import { useState, useEffect } from 'react'
import { encryptionService, EncryptionKeyPair } from '@/lib/crypto/encryption'
import { useWallet } from './useWallet'

export function useEncryption() {
  const { address, isConnected } = useWallet()
  const [keyPair, setKeyPair] = useState<EncryptionKeyPair | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate or load key pair when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadOrGenerateKeyPair()
    } else {
      setKeyPair(null)
    }
  }, [isConnected, address])

  const loadOrGenerateKeyPair = async () => {
    if (!address) return

    setIsGenerating(true)
    setError(null)

    try {
      // Try to get existing key pair
      let existingKeyPair = encryptionService.getKeyPair(address)

      if (!existingKeyPair) {
        // Generate new key pair
        existingKeyPair = encryptionService.generateKeyPair()
        encryptionService.storeKeyPair(address, existingKeyPair)
        
        // Save to database (you would implement this)
        await saveKeyPairToDatabase(address, existingKeyPair)
      }

      setKeyPair(existingKeyPair)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize encryption')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveKeyPairToDatabase = async (userAddress: string, keyPair: EncryptionKeyPair) => {
    try {
      const response = await fetch('/api/users/encryption-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          publicKey: keyPair.publicKey,
          // Note: Never store private key in database - keep it only in memory/local storage
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save encryption keys')
      }
    } catch (error) {
      console.error('Error saving key pair to database:', error)
      // Don't throw here - we can still use the keys locally
    }
  }

  const encryptMessage = async (message: string, recipientPublicKey: string): Promise<string> => {
    if (!keyPair || !keyPair.privateKey) {
      throw new Error('No encryption key pair available')
    }

    try {
      return encryptionService.encryptMessage(message, recipientPublicKey, keyPair.privateKey)
    } catch (error) {
      setError('Failed to encrypt message')
      throw error
    }
  }

  const decryptMessage = async (encryptedMessage: string, senderPublicKey: string): Promise<string> => {
    if (!keyPair || !keyPair.privateKey) {
      throw new Error('No encryption key pair available')
    }

    try {
      return encryptionService.decryptMessage(encryptedMessage, senderPublicKey, keyPair.privateKey)
    } catch (error) {
      setError('Failed to decrypt message')
      throw error
    }
  }

  const signMessage = async (message: string): Promise<string> => {
    if (!keyPair || !keyPair.privateKey) {
      throw new Error('No encryption key pair available')
    }

    try {
      return encryptionService.signMessage(message, keyPair.privateKey)
    } catch (error) {
      setError('Failed to sign message')
      throw error
    }
  }

  const verifySignature = async (message: string, signature: string, publicKey: string): Promise<boolean> => {
    try {
      return encryptionService.verifySignature(message, signature, publicKey)
    } catch (error) {
      setError('Failed to verify signature')
      return false
    }
  }

  const exportKeys = (): string | null => {
    if (!address) return null
    return encryptionService.exportKeyPair(address)
  }

  const importKeys = (exportedData: string): boolean => {
    return encryptionService.importKeyPair(exportedData)
  }

  const regenerateKeys = async () => {
    if (!address) return

    setIsGenerating(true)
    setError(null)

    try {
      const newKeyPair = encryptionService.generateKeyPair()
      encryptionService.storeKeyPair(address, newKeyPair)
      await saveKeyPairToDatabase(address, newKeyPair)
      setKeyPair(newKeyPair)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate keys')
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    keyPair,
    isGenerating,
    error,
    encryptMessage,
    decryptMessage,
    signMessage,
    verifySignature,
    exportKeys,
    importKeys,
    regenerateKeys,
    isReady: !!keyPair && !!address
  }
}