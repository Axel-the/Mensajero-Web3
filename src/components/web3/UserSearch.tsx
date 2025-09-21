"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Search, UserPlus, Check, AlertCircle, Loader2, Wallet, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchResult {
  id: string
  walletAddress: string
  name?: string
  profileImage?: string
  isOnline: boolean
  lastSeen?: Date
}

interface UserSearchProps {
  onUserSelect?: (user: SearchResult) => void
  onStartConversation?: (userAddress: string) => void
}

export function UserSearch({ onUserSelect, onStartConversation }: UserSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()

  // Sample users for demo
  const sampleUsers: SearchResult[] = [
    {
      id: '1',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      name: 'Alice Crypto',
      isOnline: true,
      lastSeen: new Date()
    },
    {
      id: '2',
      walletAddress: '0x5Ea1b9A3b4C5F6D7E8F9A0B1C2D3E4F5A6B7C8D9',
      name: 'Bob Blockchain',
      isOnline: false,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: '3',
      walletAddress: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
      name: 'Carol Web3',
      isOnline: true,
      lastSeen: new Date()
    },
    {
      id: '4',
      walletAddress: '0x9B8C7D6E5F4A3B2C1D0E9F8A7B6C5D4E3F2A1B0',
      name: 'David DeFi',
      isOnline: false,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ]

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Filter sample users based on search query
      const filtered = sampleUsers.filter(user => 
        user.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      setSearchResults(filtered)
      
      if (filtered.length === 0) {
        toast({
          title: "Sin Resultados",
          description: "No se encontraron usuarios que coincidan con tu búsqueda.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Búsqueda Fallida",
        description: "No se pudo buscar usuarios. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddUser = async (user: SearchResult) => {
    setIsAdding(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast({
        title: "Usuario Agregado",
        description: `${user.name || user.walletAddress} ha sido agregado a tus contactos.`,
      })
      
      if (onUserSelect) {
        onUserSelect(user)
      }
      
      setIsOpen(false)
      setSearchQuery('')
      setSearchResults([])
    } catch (error) {
      toast({
        title: "Error al Agregar Usuario",
        description: "No se pudo agregar el usuario a los contactos. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleStartConversation = (userAddress: string) => {
    if (onStartConversation) {
      onStartConversation(userAddress)
      setIsOpen(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch()
    }
  }

  const isValidWalletAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Ahora mismo'
    if (diffMins < 60) return `hace ${diffMins}m`
    if (diffHours < 24) return `hace ${diffHours}h`
    return `hace ${diffDays}d`
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gray-700">
          <Search className="h-4 w-4 mr-2" />
          Buscar Usuarios
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-purple-400" />
            Buscar Usuarios
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar por dirección de billetera o nombre</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="0x... o nombre de usuario"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {searchQuery && !isValidWalletAddress(searchQuery) && (
              <p className="text-xs text-yellow-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Ingresa una dirección de billetera Ethereum válida (0x...)
              </p>
            )}
          </div>

          {/* Search Results */}
          <div className="space-y-2">
            <Label>Resultados de Búsqueda</Label>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Buscando...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <AnimatePresence>
                    {searchResults.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.profileImage} />
                                    <AvatarFallback>
                                      {user.name?.slice(0, 2) || user.walletAddress.slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {user.isOnline && (
                                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                                  )}
                                </div>
                                
                                <div>
                                  <h3 className="font-medium">
                                    {user.name || 'Usuario Anónimo'}
                                  </h3>
                                  <p className="text-sm text-gray-400 font-mono">
                                    {formatAddress(user.walletAddress)}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        user.isOnline 
                                          ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                                          : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                                      }`}
                                    >
                                      {user.isOnline ? 'En Línea' : 'Desconectado'}
                                    </Badge>
                                    {user.lastSeen && !user.isOnline && (
                                      <span className="text-xs text-gray-500">
                                        {getTimeAgo(user.lastSeen)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartConversation(user.walletAddress)}
                                  className="border-gray-600"
                                >
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  Mensaje
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAddUser(user)}
                                  className="bg-purple-600 hover:bg-purple-700"
                                  disabled={isAdding}
                                >
                                  {isAdding ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <UserPlus className="h-3 w-3 mr-1" />
                                  )}
                                  Agregar
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : searchQuery && !isSearching ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No se encontraron usuarios</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Intenta buscar con una dirección de billetera o nombre de usuario diferente
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Busca usuarios por dirección de billetera</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Ingresa una dirección de billetera Ethereum para encontrar y conectar con otros usuarios
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Quick Tips */}
          <Card className="bg-blue-500/10 border-blue-500/50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-400">Consejos Profesionales</p>
                  <ul className="text-gray-300 text-xs mt-1 space-y-1">
                    <li>• Puedes buscar por dirección completa de billetera o nombre de usuario</li>
                    <li>• Todas las direcciones de billetera comienzan con "0x" y tienen 42 caracteres de longitud</li>
                    <li>• Los usuarios pueden estar tanto en línea como desconectados</li>
                    <li>• Puedes iniciar conversaciones directamente desde los resultados de búsqueda</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}