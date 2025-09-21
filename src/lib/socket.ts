import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

interface UserSocket {
  userId: string;
  socketId: string;
}

interface MessageData {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  conversationId: string;
  encrypted: boolean;
  timestamp: Date;
}

interface PaymentData {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  currency: string;
  txHash: string;
  timestamp: Date;
}

export class SocketService {
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private typingUsers: Map<string, Set<string>> = new Map(); // conversationId -> Set of userIds

  setupSocket(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      // Handle user authentication and connection
      socket.on('authenticate', (userData: { userId: string; walletAddress: string }) => {
        const { userId, walletAddress } = userData;
        
        // Store user connection
        this.connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        socket.walletAddress = walletAddress;
        
        // Join user to their personal room
        socket.join(`user:${userId}`);
        
        // Update user online status in database
        this.updateUserOnlineStatus(userId, true);
        
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
        
        // Notify user of successful connection
        socket.emit('authenticated', {
          success: true,
          message: 'Conectado exitosamente al Mensajero Web3',
          timestamp: new Date()
        });
      });

      // Handle joining conversations
      socket.on('join_conversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
        
        // Notify other users in conversation
        socket.to(`conversation:${conversationId}`).emit('user_joined', {
          userId: socket.userId,
          conversationId,
          timestamp: new Date()
        });
      });

      // Handle leaving conversations
      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} left conversation ${conversationId}`);
      });

      // Handle sending messages
      socket.on('send_message', async (messageData: MessageData) => {
        try {
          // Validate message data
          if (!messageData.senderId || !messageData.receiverId || !messageData.content) {
            socket.emit('message_error', { error: 'Datos de mensaje inválidos' });
            return;
          }

          // Verify sender is the authenticated user
          if (messageData.senderId !== socket.userId) {
            socket.emit('message_error', { error: 'No autorizado para enviar mensaje' });
            return;
          }

          // Add timestamp if not provided
          const messageWithTimestamp = {
            ...messageData,
            timestamp: messageData.timestamp || new Date()
          };

          // Store message in database (you would implement this)
          // await this.storeMessageInDatabase(messageWithTimestamp);

          // Send message to receiver
          const receiverSocketId = this.connectedUsers.get(messageData.receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('new_message', {
              ...messageWithTimestamp,
              isRealTime: true
            });
          }

          // Send message back to sender for confirmation
          socket.emit('message_sent', {
            ...messageWithTimestamp,
            status: 'delivered'
          });

          // Notify conversation room
          io.to(`conversation:${messageData.conversationId}`).emit('conversation_update', {
            conversationId: messageData.conversationId,
            lastMessage: messageData.content,
            lastMessageAt: messageWithTimestamp.timestamp,
            senderId: messageData.senderId
          });

          console.log(`Message sent from ${messageData.senderId} to ${messageData.receiverId}`);

        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('message_error', { error: 'Error al enviar mensaje' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data: { conversationId: string; userId: string }) => {
        const { conversationId, userId } = data;
        
        if (!this.typingUsers.has(conversationId)) {
          this.typingUsers.set(conversationId, new Set());
        }
        
        this.typingUsers.get(conversationId)?.add(userId);
        
        // Notify other users in conversation
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          userId,
          conversationId,
          isTyping: true
        });
      });

      socket.on('typing_stop', (data: { conversationId: string; userId: string }) => {
        const { conversationId, userId } = data;
        
        this.typingUsers.get(conversationId)?.delete(userId);
        
        // Notify other users in conversation
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          userId,
          conversationId,
          isTyping: false
        });
      });

      // Handle payment notifications
      socket.on('payment_sent', async (paymentData: PaymentData) => {
        try {
          // Validate payment data
          if (!paymentData.sender || !paymentData.receiver || !paymentData.amount) {
            socket.emit('payment_error', { error: 'Datos de pago inválidos' });
            return;
          }

          // Verify sender is the authenticated user
          if (paymentData.sender !== socket.walletAddress) {
            socket.emit('payment_error', { error: 'No autorizado para enviar pago' });
            return;
          }

          // Store payment in database (you would implement this)
          // await this.storePaymentInDatabase(paymentData);

          // Send payment notification to receiver
          const receiverSocketId = this.connectedUsers.get(paymentData.receiver);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('payment_received', {
              ...paymentData,
              isRealTime: true
            });
          }

          // Send confirmation back to sender
          socket.emit('payment_sent_confirmed', {
            ...paymentData,
            status: 'completed'
          });

          console.log(`Payment sent from ${paymentData.sender} to ${paymentData.receiver}`);

        } catch (error) {
          console.error('Error processing payment:', error);
          socket.emit('payment_error', { error: 'Error al procesar pago' });
        }
      });

      // Handle read receipts
      socket.on('mark_as_read', (data: { messageId: string; conversationId: string }) => {
        const { messageId, conversationId } = data;
        
        // Notify other users in conversation that message was read
        socket.to(`conversation:${conversationId}`).emit('message_read', {
          messageId,
          conversationId,
          readBy: socket.userId,
          readAt: new Date()
        });
      });

      // Handle user status updates
      socket.on('update_status', (data: { status: 'online' | 'away' | 'offline' }) => {
        const { status } = data;
        
        // Notify all connected users about status change
        socket.broadcast.emit('user_status_changed', {
          userId: socket.userId,
          status,
          timestamp: new Date()
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        if (socket.userId) {
          // Remove from connected users
          this.connectedUsers.delete(socket.userId);
          
          // Update user online status in database
          this.updateUserOnlineStatus(socket.userId, false);
          
          // Notify other users about disconnection
          socket.broadcast.emit('user_disconnected', {
            userId: socket.userId,
            timestamp: new Date()
          });
        }
      });

      // Send welcome message
      socket.emit('welcome', {
        message: '¡Bienvenido al Servicio de Mensajería en Tiempo Real de Web3 Messenger!',
        features: [
          'Mensajería cifrada de extremo a extremo',
          'Notificaciones en tiempo real',
          'Notificaciones de pago',
          'Indicadores de escritura',
          'Confirmaciones de lectura'
        ],
        timestamp: new Date()
      });
    });
  }

  private async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      // Update user status in database
      // You would implement this with your database client
      console.log(`Updating user ${userId} online status to: ${isOnline}`);
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get users in a conversation
  getUsersInConversation(conversationId: string): string[] {
    // This would be implemented to get actual users from database
    return Array.from(this.connectedUsers.keys());
  }

  // Send notification to specific user
  sendNotificationToUser(userId: string, notification: any): boolean {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      // Assuming you have access to the io instance
      // io.to(socketId).emit('notification', notification);
      return true;
    }
    return false;
  }
}

export const socketService = new SocketService();

// Legacy function for backward compatibility
export const setupSocket = (io: Server) => {
  socketService.setupSocket(io);
};