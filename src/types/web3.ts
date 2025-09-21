export interface Message {
  id: string
  sender: string
  content: string
  timestamp: Date
  encrypted: boolean
  paid: boolean
  amount?: number
}

export interface Conversation {
  id: string
  name: string
  address: string
  lastMessage: string
  timestamp: Date
  unread: number
  online: boolean
}

export interface WalletInfo {
  address: string
  balance: number
  chainId: number
  isConnected: boolean
}

export interface CryptoPayment {
  id: string
  sender: string
  receiver: string
  amount: number
  currency: string
  timestamp: Date
  status: 'pending' | 'completed' | 'failed'
  txHash?: string
}