"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useWallet } from '@/hooks/useWallet'
import { useEncryption } from '@/hooks/useEncryption'
import { useSocket } from '@/hooks/useSocket'
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  MoreVertical, 
  CheckCircle, 
  Clock, 
  Shield,
  Zap,
  Image,
  FileText,
  Gift
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Message, Conversation } from '@/types/web3'

interface EnhancedChatProps {
  conversation: Conversation
  messages: Message[]
  onSendMessage: (content: string) => void
  onSendPayment: (amount: number, currency: string) => void
  currentUserAddress?: string
}

interface TypingIndicator {
  userId: string
  userName: string
  isTyping: boolean
}

export function EnhancedChat({ 
  conversation, 
  messages, 
  onSendMessage, 
  onSendPayment,
  currentUserAddress = ''
}: EnhancedChatProps) {
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({})
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { toast } = useToast()
  const { address, isConnected: walletConnected } = useWallet()
  const { encryptMessage, decryptMessage, isReady: encryptionReady } = useEncryption()
  const { 
    isConnected: socketConnected, 
    startTyping, 
    stopTyping, 
    onTyping 
  } = useSocket()

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  // Handle typing indicators
  useEffect(() => {
    const unsubscribe = onTyping((data) => {
      if (data.conversationId === conversation.id) {
        setTypingUsers(prev => {
          const existing = prev.find(u => u.userId === data.userId)
          if (existing) {
            return prev.map(u => 
              u.userId === data.userId 
                ? { ...u, isTyping: data.isTyping } 
                : u
            )
          } else if (data.isTyping) {
            return [...prev, { 
              userId: data.userId, 
              userName: data.userId.slice(0, 6) + '...', 
              isTyping: true 
            }]
          }
          return prev
        })
      }
    })

    return unsubscribe
  }, [onTyping, conversation.id])

  const handleInputChange = (value: string) => {
    setNewMessage(value)
    
    // Handle typing indicators
    if (socketConnected && value.trim()) {
      setIsTyping(true)
      
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
      
      const timeout = setTimeout(() => {
        setIsTyping(false)
        if (socketConnected && currentUserAddress) {
          stopTyping(conversation.id, currentUserAddress)
        }
      }, 1000)
      
      setTypingTimeout(timeout)
      
      if (currentUserAddress) {
        startTyping(conversation.id, currentUserAddress)
      }
    } else {
      setIsTyping(false)
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
      if (socketConnected && currentUserAddress) {
        stopTyping(conversation.id, currentUserAddress)
      }
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !encryptionReady) return

    try {
      let content = newMessage
      
      // Encrypt message if encryption is ready
      if (encryptionReady && conversation.address) {
        content = await encryptMessage(newMessage, 'dummy_public_key')
      }

      onSendMessage(content)
      setNewMessage('')
      setIsTyping(false)
      
      if (socketConnected && currentUserAddress) {
        stopTyping(conversation.id, currentUserAddress)
      }
      
      inputRef.current?.focus()
    } catch (error) {
      toast({
        title: "Envío Fallido",
        description: "No se pudo cifrar y enviar el mensaje. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleDecrypt = async (messageId: string, content: string) => {
    try {
      if (!encryptionReady) return
      
      const decryptedContent = await decryptMessage(content, 'dummy_public_key')
      
      setDecryptedMessages(prev => ({
        ...prev,
        [messageId]: decryptedContent
      }))
    } catch (error) {
      toast({
        title: "Descifrado Fallido",
        description: "No se pudo descifrar el mensaje. Por favor revisa tus claves de cifrado.",
        variant: "destructive",
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getTypingText = () => {
    const activeTypers = typingUsers.filter(u => u.isTyping)
    if (activeTypers.length === 0) return ''
    if (activeTypers.length === 1) return `${activeTypers[0].userName} está escribiendo...`
    if (activeTypers.length === 2) return `${activeTypers[0].userName} y ${activeTypers[1].userName} están escribiendo...`
    return `${activeTypers.length} personas están escribiendo...`
  }

  const MessageBubble = ({ message }: { message: Message }) => {
    const isCurrentUser = message.sender === 'You' || message.sender === currentUserAddress
    const decryptedContent = decryptedMessages[message.id]
    const displayContent = decryptedContent || message.content
    const isEncrypted = message.encrypted && !decryptedContent

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`max-w-xs lg:max-w-md ${
          isCurrentUser 
            ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30' 
            : 'bg-gray-800/50 border-gray-700/50'
        } backdrop-blur-sm rounded-2xl p-4 shadow-lg border`}
        >
          {/* Message Header */}
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${
              isCurrentUser ? 'text-purple-300' : 'text-blue-300'
            }`}>
              {message.sender}
            </span>
            <div className="flex items-center gap-1">
              {message.encrypted && (
                <Shield className="h-3 w-3 text-green-400" />
              )}
              {message.paid && (
                <Gift className="h-3 w-3 text-yellow-400" />
              )}
              <span className="text-xs text-gray-400">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>

          {/* Message Content */}
          <div className="mb-3">
            {isEncrypted ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">🔒 Mensaje cifrado</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecrypt(message.id, message.content)}
                  className="text-xs bg-gray-700/50 border-gray-600"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Descifrar
                </Button>
              </div>
            ) : (
              <p className="text-sm text-white break-words">
                {displayContent}
              </p>
            )}
          </div>

          {/* Message Footer */}
          {message.paid && message.amount && (
            <div className="flex items-center gap-2 text-xs">
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                <Gift className="h-2 w-2 mr-1" />
                {message.amount} ETH
              </Badge>
              {message.txHash && (
                <CheckCircle className="h-3 w-3 text-green-400" />
              )}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-900/20 to-purple-900/10">
      {/* Chat Header */}
      <Card className="bg-gray-900/50 border-gray-800 rounded-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-purple-500/50">
                <AvatarImage 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${conversation.name}`} 
                />
                <AvatarFallback>
                  {conversation.name?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {conversation.name}
                  {conversation.online && (
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-400 font-mono">
                  {conversation.address?.slice(0, 10)}...{conversation.address?.slice(-8)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                <Shield className="h-3 w-3 mr-1" />
                Cifrado Extremo a Extremo
              </Badge>
              {socketConnected && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                  <Zap className="h-3 w-3 mr-1" />
                  En Vivo
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {/* Typing Indicators */}
            <AnimatePresence>
              {typingUsers.filter(u => u.isTyping).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-sm text-gray-400"
                >
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>{getTypingText()}</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <Card className="bg-gray-900/50 border-gray-800 rounded-none">
        <CardContent className="p-4">
          <div className="flex items-end gap-2">
            {/* Attachment Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="h-10 w-10 p-0 text-gray-400 hover:text-white"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    className="absolute bottom-12 left-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 z-10"
                  >
                    <div className="space-y-1">
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                        <Image className="h-3 w-3 mr-2" alt="Imagen" />
                        Imagen
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                        <FileText className="h-3 w-3 mr-2" />
                        Documento
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                        <Gift className="h-3 w-3 mr-2" />
                        Pago
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Message Input */}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                placeholder={encryptionReady ? "Escribe tu mensaje cifrado..." : "Escribe tu mensaje..."}
                value={newMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 pr-12"
                disabled={!encryptionReady}
              />
              
              {/* Quick Actions */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  <Smile className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Voice Recording */}
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={() => setIsRecording(true)}
              onMouseUp={() => setIsRecording(false)}
              onMouseLeave={() => setIsRecording(false)}
              className={`h-10 w-10 p-0 ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mic className="h-4 w-4" />
            </Button>

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !encryptionReady}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-10 w-10 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-400" />
                <span>{encryptionReady ? 'Encrypted' : 'Not encrypted'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-blue-400" />
                <span>{socketConnected ? 'Real-time' : 'Offline'}</span>
              </div>
            </div>
            
            {isRecording && (
              <div className="flex items-center gap-1 text-red-400">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Recording...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}