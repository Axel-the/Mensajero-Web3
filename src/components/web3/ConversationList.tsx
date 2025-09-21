"use client"

import { Conversation } from '@/types/web3'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Shield } from 'lucide-react'

interface ConversationListProps {
  conversations: Conversation[]
  activeConversation: string | null
  onConversationSelect: (id: string) => void
  searchQuery: string
}

export function ConversationList({ 
  conversations, 
  activeConversation, 
  onConversationSelect, 
  searchQuery 
}: ConversationListProps) {
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-2">
      {filteredConversations.map((conversation) => (
        <Card
          key={conversation.id}
          className={`cursor-pointer transition-all hover:bg-gray-800/50 ${
            activeConversation === conversation.id 
              ? 'bg-gray-800/70 border-purple-500/50' 
              : 'bg-gray-900/50 border-gray-800'
          }`}
          onClick={() => onConversationSelect(conversation.id)}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${conversation.name}`} 
                  />
                  <AvatarFallback>
                    {conversation.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {conversation.online && (
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{conversation.name}</h3>
                  <span className="text-xs text-gray-400">
                    {conversation.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {conversation.lastMessage}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/50"
                  >
                    <Shield className="h-2 w-2 mr-1" />
                    Cifrado Extremo a Extremo
                  </Badge>
                  {conversation.unread > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {conversation.unread}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}