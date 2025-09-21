"use client"

import { useState } from 'react'
import { Message } from '@/types/web3'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Coins, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ChatMessageProps {
  message: Message
  isCurrentUser: boolean
  decryptedContent?: string
  onDecrypt?: (messageId: string) => Promise<void>
  showDecrypted?: boolean
}

export function ChatMessage({ 
  message, 
  isCurrentUser, 
  decryptedContent, 
  onDecrypt, 
  showDecrypted = false 
}: ChatMessageProps) {
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleDecrypt = async () => {
    if (onDecrypt && !isDecrypting) {
      setIsDecrypting(true)
      try {
        await onDecrypt(message.id)
      } catch (error) {
        toast({
          title: "Decryption Failed",
          description: "Failed to decrypt message. Please check your encryption keys.",
          variant: "destructive",
        })
      } finally {
        setIsDecrypting(false)
      }
    }
  }

  const handleCopy = async () => {
    const content = showDecrypted && decryptedContent ? decryptedContent : message.content
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy message to clipboard",
        variant: "destructive",
      })
    }
  }

  const displayContent = showDecrypted && decryptedContent ? decryptedContent : message.content
  const isEncrypted = message.encrypted && !showDecrypted && !decryptedContent

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <Card
        className={`max-w-xs lg:max-w-md ${
          isCurrentUser
            ? 'bg-purple-600/20 border-purple-500/50'
            : 'bg-gray-800/50 border-gray-700'
        } transition-all duration-300 hover:scale-[1.02]`}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">{message.sender}</span>
              {message.encrypted && (
                <Shield className="h-3 w-3 text-green-400" />
              )}
              {message.paid && (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                >
                  <Coins className="h-2 w-2 mr-1" />
                  {message.amount} ETH
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3 text-gray-400" />
              )}
            </Button>
          </div>
          
          <div className="relative">
            <p className="text-sm break-words">
              {isEncrypted ? '🔒 Encrypted message' : displayContent}
            </p>
            
            {isEncrypted && (
              <div className="mt-2 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecrypt}
                  disabled={isDecrypting}
                  className="text-xs bg-gray-700/50 border-gray-600"
                >
                  {isDecrypting ? (
                    <>
                      <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1" />
                      Decrypting...
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Decrypt
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
            {showDecrypted && decryptedContent && (
              <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/50">
                <Eye className="h-2 w-2 mr-1" />
                Decrypted
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}