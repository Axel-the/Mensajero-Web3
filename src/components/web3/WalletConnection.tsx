"use client"

import { useState, useEffect } from 'react'
import { Wallet, Settings, Copy, ExternalLink, Loader2, ChevronDown, AlertCircle, CheckCircle, Smartphone, QrCode } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useWallet } from '@/hooks/useWallet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'

interface WalletConnectionProps {
  isConnected?: boolean
  walletAddress?: string
  onConnect?: () => void
  onDisconnect?: () => void
}

interface NetworkInfo {
  chainId: number
  name: string
  symbol: string
  isTestnet: boolean
}

const NETWORKS: Record<number, NetworkInfo> = {
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    isTestnet: false
  },
  5: {
    chainId: 5,
    name: 'Goerli Testnet',
    symbol: 'ETH',
    isTestnet: true
  },
  11155111: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    symbol: 'ETH',
    isTestnet: true
  },
  137: {
    chainId: 137,
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    isTestnet: false
  },
  80001: {
    chainId: 80001,
    name: 'Mumbai Testnet',
    symbol: 'MATIC',
    isTestnet: true
  },
  56: {
    chainId: 56,
    name: 'BSC Mainnet',
    symbol: 'BNB',
    isTestnet: false
  },
  97: {
    chainId: 97,
    name: 'BSC Testnet',
    symbol: 'BNB',
    isTestnet: true
  }
}

export function WalletConnection({ 
  isConnected: propIsConnected,
  walletAddress: propWalletAddress,
  onConnect: propOnConnect,
  onDisconnect: propOnDisconnect
}: WalletConnectionProps) {
  const { toast } = useToast()
  const {
    isConnected: hookIsConnected,
    address: hookAddress,
    balance,
    chainId,
    isLoading,
    error,
    connect: hookConnect,
    disconnect: hookDisconnect
  } = useWallet()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  // Use hook values if available, otherwise fall back to props
  const isConnected = hookIsConnected || propIsConnected || false
  const walletAddress = hookAddress || propWalletAddress || ''
  const connect = propOnConnect || hookConnect
  const disconnect = propOnDisconnect || hookDisconnect

  const networkInfo = NETWORKS[chainId] || {
    chainId,
    name: `Chain ID: ${chainId}`,
    symbol: 'ETH',
    isTestnet: false
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setIsCopied(true)
      toast({
        title: "Dirección Copiada",
        description: "¡La dirección de la billetera ha sido copiada al portapapeles!",
      })
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Copia Fallida",
        description: "No se pudo copiar la dirección de la billetera.",
        variant: "destructive",
      })
    }
  }

  const viewOnExplorer = () => {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io',
      5: 'https://goerli.etherscan.io',
      11155111: 'https://sepolia.etherscan.io',
      137: 'https://polygonscan.com',
      80001: 'https://mumbai.polygonscan.com',
      56: 'https://bscscan.com',
      97: 'https://testnet.bscscan.com'
    }
    
    const explorer = explorers[chainId] || 'https://etherscan.io'
    window.open(`${explorer}/address/${walletAddress}`, '_blank')
  }

  const formatBalance = (balance: string) => {
    try {
      const balanceNum = parseFloat(balance)
      return balanceNum.toFixed(4)
    } catch {
      return balance
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getNetworkColor = (chainId: number) => {
    const colors: Record<number, string> = {
      1: 'text-blue-400',
      137: 'text-purple-400',
      56: 'text-yellow-400',
      5: 'text-green-400',
      11155111: 'text-indigo-400'
    }
    return colors[chainId] || 'text-gray-400'
  }

  const getNetworkBadgeColor = (chainId: number) => {
    const colors: Record<number, string> = {
      1: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      137: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      56: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      5: 'bg-green-500/20 text-green-400 border-green-500/50',
      11155111: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50'
    }
    return colors[chainId] || 'bg-gray-500/20 text-gray-400 border-gray-500/50'
  }

  if (isLoading) {
    return (
      <Button disabled className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Conectando...
      </Button>
    )
  }

  if (isConnected && walletAddress) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
          >
            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {formatAddress(walletAddress)}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getNetworkBadgeColor(chainId)}`}
                      >
                        {networkInfo.symbol}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatBalance(balance)} {networkInfo.symbol}
                    </p>
                  </div>
                  
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </DialogTrigger>
        
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-purple-400" />
              Detalles de la Billetera
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6">
              {/* Wallet Overview */}
              <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Billetera Conectada</h3>
                      <p className="text-sm text-gray-400">MetaMask</p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400">Dirección de la Billetera</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-gray-800/50 px-3 py-2 rounded text-sm flex-1 font-mono">
                          {walletAddress}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyAddress}
                          className="border-gray-600"
                        >
                          {isCopied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={viewOnExplorer}
                          className="border-gray-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400">Saldo</label>
                        <div className="bg-gray-800/50 px-3 py-2 rounded">
                          <span className="text-lg font-semibold">{formatBalance(balance)}</span>
                          <span className="text-sm text-gray-400 ml-1">{networkInfo.symbol}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-400">Red</label>
                        <Badge 
                          variant="outline" 
                          className={`w-full justify-start ${getNetworkBadgeColor(chainId)}`}
                        >
                          {networkInfo.name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network Information */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Información de la Red
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Nombre de la Red</span>
                    <span className={`text-sm font-medium ${getNetworkColor(chainId)}`}>
                      {networkInfo.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">ID de la Cadena</span>
                    <span className="text-sm font-mono">{chainId}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Moneda</span>
                    <span className="text-sm font-medium">{networkInfo.symbol}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Tipo de Red</span>
                    <Badge 
                      variant="outline" 
                      className={networkInfo.isTestnet 
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' 
                        : 'bg-green-500/20 text-green-400 border-green-500/50'
                      }
                    >
                      {networkInfo.isTestnet ? 'Red de Pruebas' : 'Red Principal'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-gray-600"
                    onClick={() => setShowQR(!showQR)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    {showQR ? 'Ocultar Código QR' : 'Mostrar Código QR'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-gray-600"
                    onClick={viewOnExplorer}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver en Explorador
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-gray-600"
                    onClick={copyAddress}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Dirección
                  </Button>
                </CardContent>
              </Card>

              {/* QR Code (conditionally shown) */}
              <AnimatePresence>
                {showQR && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-4 text-center">
                        <div className="bg-white p-4 rounded-lg inline-block">
                          <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                            <QrCode className="h-16 w-16 text-gray-600" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Escanea este código QR para recibir {networkInfo.symbol}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Display */}
              {error && (
                <Card className="bg-red-500/20 border-red-500/50">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Error de Conexión</p>
                        <p className="text-xs text-red-300">{error}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Disconnect Button */}
              <Button 
                variant="destructive" 
                onClick={() => {
                  disconnect()
                  setIsDialogOpen(false)
                }}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Desconectar Billetera
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button 
        onClick={connect} 
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
        disabled={isLoading}
      >
        <Wallet className="h-4 w-4 mr-2" />
        Connect Wallet
      </Button>
    </motion.div>
  )
}