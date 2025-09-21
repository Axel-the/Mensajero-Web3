"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useWallet } from '@/hooks/useWallet'
import { useEncryption } from '@/hooks/useEncryption'
import { MessageSquare, Users, Send, Search, Plus, Shield, Zap, Sparkles, ArrowRight, Coins } from 'lucide-react'
import { ConversationList } from '@/components/web3/ConversationList'
import { ChatMessage } from '@/components/web3/ChatMessage'
import { WalletConnection } from '@/components/web3/WalletConnection'
import { CryptoPayment } from '@/components/web3/CryptoPayment'
import { UserSearch } from '@/components/web3/UserSearch'
import { UserStatus } from '@/components/web3/UserStatus'
import { EnhancedChat } from '@/components/web3/EnhancedChat'
import { RealTimeNotification } from '@/components/ui/RealTimeNotification'
import { Message, Conversation } from '@/types/web3'
import { motion, AnimatePresence } from 'framer-motion'

export default function Web3MessagingPlatform() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({})
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()
  const { address, isConnected: walletConnected } = useWallet()
  const { encryptMessage, decryptMessage, isReady: encryptionReady } = useEncryption()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Sample conversations data
  useEffect(() => {
    setConversations([
      {
        id: '1',
        name: 'Alice Crypto',
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        lastMessage: 'Hey, did you see the new DeFi protocol?',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        unread: 2,
        online: true
      },
      {
        id: '2',
        name: 'Bob Blockchain',
        address: '0x5Ea1b9A3b4C5F6D7E8F9A0B1C2D3E4F5A6B7C8D9',
        lastMessage: 'The NFT collection is launching tomorrow!',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        unread: 0,
        online: false
      },
      {
        id: '3',
        name: 'Carol Web3',
        address: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
        lastMessage: 'Thanks for the ETH transfer!',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        unread: 1,
        online: true
      }
    ])

    // Sample messages (some encrypted)
    setMessages([
      {
        id: '1',
        sender: 'Alice Crypto',
        content: 'U2FsdGVkX1+4J2v5K8L9P6R3X1mN7Q0wE5T8Y2U6I4O=',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        encrypted: true,
        paid: false
      },
      {
        id: '2',
        sender: 'You',
        content: 'Yes! The APY looks amazing. Should we invest?',
        timestamp: new Date(Date.now() - 4 * 60 * 1000),
        encrypted: false,
        paid: false
      },
      {
        id: '3',
        sender: 'Alice Crypto',
        content: 'Definitely! I\'m sending 0.5 ETH to test it out.',
        timestamp: new Date(Date.now() - 3 * 60 * 1000),
        encrypted: true,
        paid: true,
        amount: 0.5
      }
    ])
  }, [])

  // Update connection state when wallet connects
  useEffect(() => {
    if (walletConnected && address) {
      setIsConnected(true)
      setWalletAddress(address)
    } else {
      setIsConnected(false)
      setWalletAddress('')
    }
  }, [walletConnected, address])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const connectWallet = async () => {
    try {
      setIsConnected(true)
      setWalletAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')
      toast({
        title: "Billetera Conectada",
        description: "¡Tu billetera ha sido conectada exitosamente!",
      })
    } catch (error) {
      toast({
        title: "Conexión Fallida",
        description: "No se pudo conectar la billetera. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setWalletAddress('')
    toast({
      title: "Billetera Desconectada",
      description: "Tu billetera ha sido desconectada.",
    })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !encryptionReady) return

    setIsSending(true)
    try {
      let content = newMessage
      
      // Encrypt message if encryption is ready
      if (encryptionReady && activeConversation) {
        const conversation = conversations.find(c => c.id === activeConversation)
        if (conversation) {
          // In a real app, you'd get the recipient's public key from the database
          // For demo, we'll use a dummy key
          content = await encryptMessage(newMessage, 'dummy_public_key')
        }
      }

      const message: Message = {
        id: Date.now().toString(),
        sender: 'You',
        content,
        timestamp: new Date(),
        encrypted: encryptionReady,
        paid: false
      }

      setMessages(prev => [...prev, message])
      setNewMessage('')
      
      toast({
        title: "Mensaje Enviado",
        description: encryptionReady ? "¡Mensaje cifrado y enviado!" : "¡Mensaje enviado!",
      })
    } catch (error) {
      toast({
        title: "Envío Fallido",
        description: "No se pudo enviar el mensaje. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleDecrypt = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId)
      if (!message || !encryptionReady) return

      // In a real app, you'd get the sender's public key from the database
      const decryptedContent = await decryptMessage(message.content, 'dummy_public_key')
      
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

  const handleSendPayment = (amount: number, currency: string) => {
    const message: Message = {
      id: Date.now().toString(),
      sender: 'You',
      content: `Sent ${amount} ${currency}`,
      timestamp: new Date(),
      encrypted: true,
      paid: true,
      amount
    }

    setMessages([...messages, message])
  }

  const getActiveConversation = () => {
    return conversations.find(c => c.id === activeConversation)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-blue-900/30"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iIzlDOTJBQyIgZmlsbC1vcGFjaXR5PSIwLjE1Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPgo8L2c+Cjwvc3ZnPg==')] opacity-40"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-purple-400/60 rounded-full animate-float"></div>
        <div className="absolute top-40 right-32 w-3 h-3 bg-pink-400/60 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-blue-400/60 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-20 w-4 h-4 bg-cyan-400/60 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 glass-morphism-strong backdrop-blur-md">
        <div className="flex items-center justify-between p-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg animate-glow">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="h-5 w-5 text-yellow-400" />
              </motion.div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Mensajero Web3
              </h1>
              <p className="text-xs text-gray-300">Descentralizado. Cifrado. Seguro.</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-4"
          >
            {walletAddress && (
              <UserStatus 
                userId={walletAddress}
                walletAddress={walletAddress}
                name="You"
                onStatusChange={(status) => {
                  console.log('Status changed to:', status)
                }}
              />
            )}
            <WalletConnection
              isConnected={isConnected}
              walletAddress={walletAddress}
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
            />
          </motion.div>
        </div>
      </header>

      <div className="relative flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-80 glass-morphism-strong border-r border-white/10 flex flex-col relative"
        >
          {/* Sidebar Glass Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent"></div>
          
          <div className="relative p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-morphism border-white/20 text-white placeholder-gray-300 focus:border-purple-400/50 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <ScrollArea className="h-full custom-scrollbar">
              <div className="p-2">
                <ConversationList
                  conversations={conversations}
                  activeConversation={activeConversation}
                  onConversationSelect={setActiveConversation}
                  searchQuery={searchQuery}
                />
              </div>
            </ScrollArea>
          </div>

          <div className="relative p-4 border-t border-white/10">
            <UserSearch 
              onStartConversation={(userAddress) => {
                const existingConversation = conversations.find(c => c.address === userAddress)
                if (existingConversation) {
                  setActiveConversation(existingConversation.id)
                } else {
                  toast({
                    title: "Nueva Conversación",
                    description: `Iniciando conversación con ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`,
                  })
                }
              }}
            />
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-3">
              <Button className="w-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-700/40 hover:to-pink-700/40 border border-purple-500/40 hover:border-purple-500/60 transition-all duration-300 shadow-lg backdrop-blur-sm glass-morphism">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Conversación
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Chat Area */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex-1 flex flex-col"
        >
          {activeConversation ? (
            <EnhancedChat
              conversation={getActiveConversation()!}
              messages={messages}
              onSendMessage={(content) => {
                const message: Message = {
                  id: Date.now().toString(),
                  sender: 'You',
                  content,
                  timestamp: new Date(),
                  encrypted: encryptionReady,
                  paid: false
                }
                setMessages(prev => [...prev, message])
              }}
              onSendPayment={handleSendPayment}
              currentUserAddress={walletAddress}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-md"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <MessageSquare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Bienvenido al Mensajero Web3
                </h3>
                <p className="text-gray-400 mb-6">Selecciona una conversación o inicia una nueva para comenzar a mensajear</p>
                
                <Card className="bg-gray-800/50 border-gray-700 p-6 mb-6">
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Shield className="h-4 w-4 text-green-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-green-400">Cifrado de extremo a extremo</p>
                        <p className="text-gray-400 text-xs">Todos los mensajes están cifrados y son seguros</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Coins className="h-4 w-4 text-yellow-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-yellow-400">Crypto payments</p>
                        <p className="text-gray-400 text-xs">Send and receive cryptocurrency</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Zap className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-blue-400">Decentralized</p>
                        <p className="text-gray-400 text-xs">No central authority, fully peer-to-peer</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Real-time Notifications */}
      <RealTimeNotification />
    </div>
  )
}