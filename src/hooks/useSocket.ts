'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useWallet } from './useWallet'

interface UseSocketOptions {
  autoConnect?: boolean
}

interface SocketMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  conversationId: string
  encrypted: boolean
  timestamp: Date
  isRealTime?: boolean
}

interface SocketPayment {
  id: string
  sender: string
  receiver: string
  amount: number
  currency: string
  txHash: string
  timestamp: Date
  isRealTime?: boolean
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true } = options
  const { address, isConnected: walletConnected } = useWallet()
  const [isConnected, setIsConnected] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [socketError, setSocketError] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  
  const socketRef = useRef<Socket | null>(null)
  const messageCallbacksRef = useRef<Set<(message: SocketMessage) => void>>(new Set())
  const paymentCallbacksRef = useRef<Set<(payment: SocketPayment) => void>>(new Set())
  const typingCallbacksRef = useRef<Set<(data: { userId: string; isTyping: boolean }) => void>>(new Set())
  const statusCallbacksRef = useRef<Set<(data: { userId: string; status: string }) => void>>(new Set())

  // Initialize socket connection
  useEffect(() => {
    if (autoConnect && walletConnected && address) {
      initializeSocket()
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [walletConnected, address, autoConnect])

  const initializeSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    // Create socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    const socket = socketRef.current

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      setIsConnected(true)
      setSocketError(null)
      
      // Authenticate with wallet address
      if (address) {
        authenticate()
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setIsConnected(false)
      setIsAuthenticated(false)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setSocketError(error.message)
      setIsConnected(false)
    })

    // Authentication events
    socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data)
      setIsAuthenticated(true)
      setSocketError(null)
    })

    // Message events
    socket.on('new_message', (message: SocketMessage) => {
      console.log('New message received:', message)
      messageCallbacksRef.current.forEach(callback => callback(message))
    })

    socket.on('message_sent', (message: SocketMessage) => {
      console.log('Message sent confirmation:', message)
      messageCallbacksRef.current.forEach(callback => callback(message))
    })

    socket.on('message_error', (error) => {
      console.error('Message error:', error)
      setSocketError(error.error || 'Failed to send message')
    })

    // Payment events
    socket.on('payment_received', (payment: SocketPayment) => {
      console.log('Payment received:', payment)
      paymentCallbacksRef.current.forEach(callback => callback(payment))
    })

    socket.on('payment_sent_confirmed', (payment: SocketPayment) => {
      console.log('Payment confirmed:', payment)
      paymentCallbacksRef.current.forEach(callback => callback(payment))
    })

    socket.on('payment_error', (error) => {
      console.error('Payment error:', error)
      setSocketError(error.error || 'Failed to process payment')
    })

    // Typing events
    socket.on('user_typing', (data: { userId: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        if (data.isTyping) {
          newSet.add(data.userId)
        } else {
          newSet.delete(data.userId)
        }
        return newSet
      })
      typingCallbacksRef.current.forEach(callback => callback(data))
    })

    // Status events
    socket.on('user_status_changed', (data: { userId: string; status: string }) => {
      if (data.status === 'online') {
        setOnlineUsers(prev => new Set(prev).add(data.userId))
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      }
      statusCallbacksRef.current.forEach(callback => callback(data))
    })

    // Welcome message
    socket.on('welcome', (data) => {
      console.log('Socket welcome message:', data)
    })

  }, [address])

  const authenticate = useCallback(() => {
    if (socketRef.current && address) {
      socketRef.current.emit('authenticate', {
        userId: address,
        walletAddress: address
      })
    }
  }, [address])

  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current && isAuthenticated) {
      socketRef.current.emit('join_conversation', conversationId)
    }
  }, [isAuthenticated])

  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_conversation', conversationId)
    }
  }, [])

  const sendMessage = useCallback((messageData: Omit<SocketMessage, 'timestamp'>) => {
    if (socketRef.current && isAuthenticated) {
      socketRef.current.emit('send_message', messageData)
    }
  }, [isAuthenticated])

  const sendPayment = useCallback((paymentData: Omit<SocketPayment, 'timestamp'>) => {
    if (socketRef.current && isAuthenticated) {
      socketRef.current.emit('payment_sent', paymentData)
    }
  }, [isAuthenticated])

  const startTyping = useCallback((conversationId: string, userId: string) => {
    if (socketRef.current && isAuthenticated) {
      socketRef.current.emit('typing_start', { conversationId, userId })
    }
  }, [isAuthenticated])

  const stopTyping = useCallback((conversationId: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_stop', { conversationId, userId })
    }
  }, [])

  const markAsRead = useCallback((messageId: string, conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('mark_as_read', { messageId, conversationId })
    }
  }, [])

  const updateStatus = useCallback((status: 'online' | 'away' | 'offline') => {
    if (socketRef.current && isAuthenticated) {
      socketRef.current.emit('update_status', { status })
    }
  }, [isAuthenticated])

  // Event subscription methods
  const onMessage = useCallback((callback: (message: SocketMessage) => void) => {
    messageCallbacksRef.current.add(callback)
    return () => {
      messageCallbacksRef.current.delete(callback)
    }
  }, [])

  const onPayment = useCallback((callback: (payment: SocketPayment) => void) => {
    paymentCallbacksRef.current.add(callback)
    return () => {
      paymentCallbacksRef.current.delete(callback)
    }
  }, [])

  const onTyping = useCallback((callback: (data: { userId: string; isTyping: boolean }) => void) => {
    typingCallbacksRef.current.add(callback)
    return () => {
      typingCallbacksRef.current.delete(callback)
    }
  }, [])

  const onStatusChange = useCallback((callback: (data: { userId: string; status: string }) => void) => {
    statusCallbacksRef.current.add(callback)
    return () => {
      statusCallbacksRef.current.delete(callback)
    }
  }, [])

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    initializeSocket()
  }, [initializeSocket])

  return {
    isConnected,
    isAuthenticated,
    socketError,
    typingUsers,
    onlineUsers,
    authenticate,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendPayment,
    startTyping,
    stopTyping,
    markAsRead,
    updateStatus,
    onMessage,
    onPayment,
    onTyping,
    onStatusChange,
    reconnect
  }
}