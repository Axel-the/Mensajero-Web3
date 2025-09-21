"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins, Send, AlertTriangle, Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useWallet } from '@/hooks/useWallet'

interface CryptoPaymentProps {
  receiverAddress: string
  onSendPayment?: (amount: number, currency: string) => void
}

export function CryptoPayment({ receiverAddress, onSendPayment }: CryptoPaymentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('ETH')
  const [isProcessing, setIsProcessing] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const { toast } = useToast()
  const { sendTransaction, isConnected } = useWallet()

  const handleSendPayment = async () => {
    if (!isConnected) {
      toast({
        title: "Billetera No Conectada",
        description: "Por favor conecta tu billetera primero.",
        variant: "destructive",
      })
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Monto Inválido",
        description: "Por favor ingresa un monto válido mayor a 0.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setTxHash(null)
    
    try {
      // Send real transaction
      const hash = await sendTransaction(receiverAddress, amount)
      setTxHash(hash)
      
      toast({
        title: "Pago Enviado",
        description: `Se envió exitosamente ${amount} ${currency} a ${receiverAddress.slice(0, 6)}...${receiverAddress.slice(-4)}`,
      })
      
      if (onSendPayment) {
        onSendPayment(parseFloat(amount), currency)
      }
      
      // Reset form after successful transaction
      setTimeout(() => {
        setIsOpen(false)
        setAmount('')
        setTxHash(null)
      }, 3000)
      
    } catch (error) {
      toast({
        title: "Pago Fallido",
        description: error instanceof Error ? error.message : "No se pudo enviar el pago. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const viewTransaction = () => {
    if (txHash) {
      window.open(`https://etherscan.io/tx/${txHash}`, '_blank')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-gray-700">
          <Coins className="h-4 w-4 mr-1" />
          Enviar Cripto
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-400" />
            Enviar Criptomoneda
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Destinatario</Label>
            <div className="bg-gray-800 px-3 py-2 rounded text-sm">
              {receiverAddress}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.001"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                disabled={isProcessing || txHash !== null}
              />
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white px-3 rounded"
                disabled={isProcessing || txHash !== null}
              >
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
          </div>
          
          {txHash ? (
            <Card className="bg-green-500/20 border-green-500/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <div className="text-sm">
                    <p className="font-medium text-green-400">¡Transacción Exitosa!</p>
                    <p className="text-gray-300 text-xs">
                      Hash de transacción: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </p>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={viewTransaction}
                      className="text-green-400 p-0 h-auto text-xs"
                    >
                      Ver en Etherscan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-yellow-500/10 border-yellow-500/50">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-400">Importante</p>
                    <p className="text-gray-300">
                      Esta transacción será procesada en la blockchain y no puede ser revertida. 
                      Por favor verifica cuidadosamente la dirección del destinatario y el monto.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1 border-gray-700"
              disabled={isProcessing}
            >
              {txHash ? 'Cerrar' : 'Cancelar'}
            </Button>
            <Button 
              onClick={handleSendPayment}
              disabled={isProcessing || !amount || txHash !== null}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Pago
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}