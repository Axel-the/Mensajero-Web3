"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { useSocket } from '@/hooks/useSocket'
import { 
  Circle, 
  Wifi, 
  WifiOff, 
  Clock, 
  Moon, 
  Zap, 
  MoreVertical,
  Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type UserStatus = 'online' | 'away' | 'offline' | 'invisible'

interface UserStatusProps {
  userId: string
  walletAddress: string
  name?: string
  profileImage?: string
  showDropdown?: boolean
  onStatusChange?: (status: UserStatus) => void
}

export function UserStatus({ 
  userId, 
  walletAddress, 
  name, 
  profileImage, 
  showDropdown = true,
  onStatusChange 
}: UserStatusProps) {
  const [currentStatus, setCurrentStatus] = useState<UserStatus>('online')
  const [lastActivity, setLastActivity] = useState<Date>(new Date())
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  const { updateStatus, onStatusChange: onSocketStatusChange } = useSocket()

  // Simulate user activity
  useEffect(() => {
    const activityInterval = setInterval(() => {
      setLastActivity(new Date())
    }, 30000) // Update activity every 30 seconds

    // Auto-away after 5 minutes of inactivity
    const awayInterval = setInterval(() => {
      const now = new Date()
      const timeSinceActivity = now.getTime() - lastActivity.getTime()
      
      if (timeSinceActivity > 5 * 60 * 1000 && currentStatus === 'online') {
        handleStatusChange('away')
      }
    }, 60000) // Check every minute

    return () => {
      clearInterval(activityInterval)
      clearInterval(awayInterval)
    }
  }, [lastActivity, currentStatus])

  // Listen for status changes from socket
  useEffect(() => {
    const unsubscribe = onSocketStatusChange((data) => {
      if (data.userId === userId) {
        setCurrentStatus(data.status as UserStatus)
      }
    })

    return unsubscribe
  }, [onSocketStatusChange, userId])

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (newStatus === currentStatus) return

    setIsUpdating(true)
    
    try {
      // Update via socket
      await updateStatus(newStatus)
      
      setCurrentStatus(newStatus)
      
      // Show toast notification
      const statusMessages = {
        online: 'Ahora estás en línea',
        away: 'Ahora estás ausente',
        offline: 'Ahora estás desconectado',
        invisible: 'Ahora estás invisible'
      }
      
      toast({
        title: "Estado Actualizado",
        description: statusMessages[newStatus],
      })
      
      // Call parent callback
      if (onStatusChange) {
        onStatusChange(newStatus)
      }
      
      // Update user activity
      setLastActivity(new Date())
      
    } catch (error) {
      toast({
        title: "Error al Actualizar Estado",
        description: "No se pudo actualizar tu estado. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusIcon = (status: UserStatus) => {
    switch (status) {
      case 'online':
        return <Circle className="h-2 w-2 fill-green-500 text-green-500" />
      case 'away':
        return <Clock className="h-2 w-2 text-yellow-500" />
      case 'offline':
        return <WifiOff className="h-2 w-2 text-gray-500" />
      case 'invisible':
        return <Circle className="h-2 w-2 fill-gray-500 text-gray-500" />
      default:
        return <Circle className="h-2 w-2 fill-gray-500 text-gray-500" />
    }
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'online':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'away':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'offline':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      case 'invisible':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'online':
        return 'En Línea'
      case 'away':
        return 'Ausente'
      case 'offline':
        return 'Desconectado'
      case 'invisible':
        return 'Invisible'
      default:
        return 'Desconocido'
    }
  }

  const getStatusDescription = (status: UserStatus) => {
    switch (status) {
      case 'online':
        return 'Estás visible y disponible para chatear'
      case 'away':
        return 'Estás ausente pero recibirás notificaciones'
      case 'offline':
        return 'Estás desconectado y no recibirás notificaciones'
      case 'invisible':
        return 'Apareces desconectado pero aún puedes usar la aplicación'
      default:
        return 'Estado desconocido'
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const StatusDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <MoreVertical className="h-3 w-3" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="bg-gray-900 border-gray-800 text-white w-48"
        align="end"
      >
        <DropdownMenuItem 
          onClick={() => handleStatusChange('online')}
          className="flex items-center gap-2"
        >
          <Circle className="h-3 w-3 fill-green-500 text-green-500" />
          <span>En Línea</span>
          {currentStatus === 'online' && <Check className="h-3 w-3 ml-auto" />}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleStatusChange('away')}
          className="flex items-center gap-2"
        >
          <Clock className="h-3 w-3 text-yellow-500" />
          <span>Ausente</span>
          {currentStatus === 'away' && <Check className="h-3 w-3 ml-auto" />}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleStatusChange('offline')}
          className="flex items-center gap-2"
        >
          <WifiOff className="h-3 w-3 text-gray-500" />
          <span>Desconectado</span>
          {currentStatus === 'offline' && <Check className="h-3 w-3 ml-auto" />}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleStatusChange('invisible')}
          className="flex items-center gap-2"
        >
          <Circle className="h-3 w-3 fill-gray-500 text-gray-500" />
          <span>Invisible</span>
          {currentStatus === 'invisible' && <Check className="h-3 w-3 ml-auto" />}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="text-xs text-gray-400">
          {getStatusDescription(currentStatus)}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex items-center gap-2">
      {/* Status Badge */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Badge 
          variant="outline" 
          className={`${getStatusColor(currentStatus)} transition-all duration-300`}
        >
          <div className="flex items-center gap-1">
            {getStatusIcon(currentStatus)}
            <span className="text-xs">{getStatusText(currentStatus)}</span>
          </div>
        </Badge>
      </motion.div>

      {/* User Avatar with Status Indicator */}
      <div className="relative">
        <Avatar className="h-8 w-8 ring-2 ring-gray-800">
          <AvatarImage src={profileImage} />
          <AvatarFallback>
            {name?.slice(0, 2) || walletAddress.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        
        {/* Status Indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            delay: 0.1, 
            type: "spring", 
            stiffness: 500, 
            damping: 20 
          }}
          className="absolute -bottom-1 -right-1"
        >
          <div className={`h-3 w-3 rounded-full border-2 border-gray-900 ${
            currentStatus === 'online' ? 'bg-green-500' :
            currentStatus === 'away' ? 'bg-yellow-500' :
            currentStatus === 'offline' ? 'bg-gray-500' : 'bg-gray-500'
          }`} />
        </motion.div>
      </div>

      {/* Status Dropdown */}
      {showDropdown && <StatusDropdown />}

      {/* Activity Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Wifi className="h-3 w-3" />
          <span>{formatAddress(walletAddress)}</span>
        </div>
      </motion.div>
    </div>
  )
}

// Component for displaying other users' status
interface OtherUserStatusProps {
  userId: string
  walletAddress: string
  name?: string
  profileImage?: string
  status?: UserStatus
  lastSeen?: Date
}

export function OtherUserStatus({ 
  userId, 
  walletAddress, 
  name, 
  profileImage, 
  status = 'offline',
  lastSeen 
}: OtherUserStatusProps) {
  const getStatusIcon = (userStatus: UserStatus) => {
    switch (userStatus) {
      case 'online':
        return <Circle className="h-2 w-2 fill-green-500 text-green-500" />
      case 'away':
        return <Clock className="h-2 w-2 text-yellow-500" />
      case 'offline':
        return <WifiOff className="h-2 w-2 text-gray-500" />
      case 'invisible':
        return <Circle className="h-2 w-2 fill-gray-500 text-gray-500" />
      default:
        return <Circle className="h-2 w-2 fill-gray-500 text-gray-500" />
    }
  }

  const getStatusColor = (userStatus: UserStatus) => {
    switch (userStatus) {
      case 'online':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'away':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'offline':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      case 'invisible':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={profileImage} />
        <AvatarFallback>
          {name?.slice(0, 2) || walletAddress.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{name || 'Anónimo'}</span>
          <Badge 
            variant="outline" 
            className={`${getStatusColor(status)} text-xs`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon(status)}
              <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-mono">{formatAddress(walletAddress)}</span>
          {lastSeen && status !== 'online' && (
            <span>• {getTimeAgo(lastSeen)}</span>
          )}
        </div>
      </div>
    </div>
  )
}