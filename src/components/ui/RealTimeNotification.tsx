"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useSocket } from '@/hooks/useSocket'
import { MessageCircle, Coins, User, Eye, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string
  type: 'message' | 'payment' | 'user_status'
  title: string
  message: string
  sender?: {
    name: string
    address: string
    avatar?: string
  }
  timestamp: Date
  data?: any
  read: boolean
}

export function RealTimeNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const { toast } = useToast()
  const { onMessage, onPayment, onStatusChange } = useSocket()

  useEffect(() => {
    // Listen for new messages
    const unsubscribeMessage = onMessage((message) => {
      if (message.isRealTime) {
        const notification: Notification = {
          id: `msg-${message.id}-${Date.now()}`,
          type: 'message',
          title: 'New Message',
          message: message.content.length > 50 
            ? `${message.content.substring(0, 50)}...` 
            : message.content,
          sender: {
            name: message.senderId,
            address: message.senderId
          },
          timestamp: new Date(message.timestamp),
          data: message,
          read: false
        }
        
        addNotification(notification)
        
        // Show toast notification
        toast({
          title: "New Message",
          description: `Message from ${message.senderId.slice(0, 6)}...${message.senderId.slice(-4)}`,
        })
      }
    })

    // Listen for payments
    const unsubscribePayment = onPayment((payment) => {
      if (payment.isRealTime) {
        const notification: Notification = {
          id: `pay-${payment.id}-${Date.now()}`,
          type: 'payment',
          title: 'Payment Received',
          message: `Received ${payment.amount} ${payment.currency}`,
          sender: {
            name: payment.sender,
            address: payment.sender
          },
          timestamp: new Date(payment.timestamp),
          data: payment,
          read: false
        }
        
        addNotification(notification)
        
        // Show toast notification
        toast({
          title: "Payment Received",
          description: `${payment.amount} ${payment.currency} from ${payment.sender.slice(0, 6)}...${payment.sender.slice(-4)}`,
        })
      }
    })

    // Listen for status changes
    const unsubscribeStatus = onStatusChange((data) => {
      if (data.status === 'online') {
        const notification: Notification = {
          id: `status-${data.userId}-${Date.now()}`,
          type: 'user_status',
          title: 'User Online',
          message: `${data.userId.slice(0, 6)}...${data.userId.slice(-4)} is now online`,
          sender: {
            name: data.userId,
            address: data.userId
          },
          timestamp: new Date(),
          data,
          read: false
        }
        
        addNotification(notification)
      }
    })

    return () => {
      unsubscribeMessage()
      unsubscribePayment()
      unsubscribeStatus()
    }
  }, [onMessage, onPayment, onStatusChange, toast])

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev])
    setIsVisible(true)
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      markAsRead(notification.id)
    }, 5000)
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
    
    // Hide if all notifications are read
    const hasUnread = notifications.some(n => !n.read && n.id !== id)
    if (!hasUnread) {
      setTimeout(() => setIsVisible(false), 1000)
    }
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
    setTimeout(() => setIsVisible(false), 500)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
    
    if (notifications.length === 1) {
      setIsVisible(false)
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-4 w-4 text-blue-400" />
      case 'payment':
        return <Coins className="h-4 w-4 text-yellow-400" />
      case 'user_status':
        return <User className="h-4 w-4 text-green-400" />
      default:
        return <Eye className="h-4 w-4 text-gray-400" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return 'bg-blue-500/20 border-blue-500/50'
      case 'payment':
        return 'bg-yellow-500/20 border-yellow-500/50'
      case 'user_status':
        return 'bg-green-500/20 border-green-500/50'
      default:
        return 'bg-gray-500/20 border-gray-500/50'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isVisible || notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-80 max-h-96">
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-lg shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs h-6 px-2"
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`m-2 ${getNotificationColor(notification.type)} ${
                    notification.read ? 'opacity-60' : ''
                  } transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {notification.sender ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={notification.sender.avatar} />
                            <AvatarFallback>
                              {notification.sender.name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeNotification(notification.id)
                              }}
                              className="h-4 w-4 p-0 opacity-0 hover:opacity-100 transition-opacity"
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-300 mb-1">
                          {notification.message}
                        </p>
                        
                        {notification.sender && (
                          <p className="text-xs text-gray-500 font-mono">
                            {notification.sender.address.slice(0, 6)}...{notification.sender.address.slice(-4)}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t border-gray-800 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-xs w-full"
            >
              Close Notifications
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}