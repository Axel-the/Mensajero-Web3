'use client'

import { useState, useEffect } from 'react'
import { WalletState, walletService } from '@/lib/web3/wallet'

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>(walletService.getState())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = walletService.subscribe(setWalletState)
    return unsubscribe
  }, [])

  const connect = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await walletService.connect()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await walletService.disconnect()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet')
    } finally {
      setIsLoading(false)
    }
  }

  const sendTransaction = async (to: string, amount: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const txHash = await walletService.sendTransaction(to, amount)
      return txHash
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send transaction')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    ...walletState,
    isLoading,
    error,
    connect,
    disconnect,
    sendTransaction
  }
}