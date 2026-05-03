import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SupportChat {
  socketId: string;
  username: string;
  timestamp: Date;
  lastMessage?: string;
  lastMessageReadByAdmin?: boolean;
  isAdminTyping?: boolean;
  isTyping?: boolean;
}

interface SupportChatsMap extends Map<string, SupportChat> {}

const supportChats = new Map<string, SupportChat>();
const adminSockets = new Set<string>();

export function setupSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Подключён: ${socket.id}`);
    
    socket.on('support:join', ({ userId, username, isAdmin }: {
      userId: string;
      username: string;
      isAdmin: boolean
    }) => {
      if (isAdmin) {
        adminSockets.add(socket.id);
        socket.join('admin-room');

        const chatList = Array.from(supportChats.entries()).map(([userId, data]) => ({
          userId,
          username: data.username,
          lastMessage: data.lastMessage,
          timestamp: data.timestamp,
          unread: !data.lastMessageReadByAdmin
        }));
        
        socket.emit('support:chatList', chatList);
      } else {
        supportChats.set(userId, {
          socketId: socket.id,
          username,
          timestamp: new Date()
        });
        socket.join(`user-${userId}`);

        io.to('admin-room').emit('support:newChat', {
          userId,
          username,
          timestamp: new Date()
        });
      }
    });

    socket.on('support:message', async ({
      fromUserId,
      content,
      isAdmin = false
    }: {
      fromUserId: string;
      content: string;
      isAdmin?: boolean;
    }) => {
      const timestamp = new Date();
      const message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fromUserId,
        content,
        timestamp,
        isAdmin
      };

      if (isAdmin) {
        const userChat = supportChats.get(fromUserId);
        if (userChat) {
          io.to(`user-${fromUserId}`).emit('support:newMessage', message);
          supportChats.set(fromUserId, {
            ...userChat,
            lastMessage: content,
            timestamp,
            lastMessageReadByAdmin: true
          });
          io.to('admin-room').emit('support:messageUpdate', {
            userId: fromUserId,
            lastMessage: content,
            timestamp
          });
        }
      } else {
        const chat = supportChats.get(fromUserId);
        if (chat) {
          chat.lastMessage = content;
          chat.timestamp = timestamp;
          chat.lastMessageReadByAdmin = false;
          supportChats.set(fromUserId, chat);
        }

        io.to('admin-room').emit('support:newMessage', message);
        io.to('admin-room').emit('support:messageUpdate', {
          userId: fromUserId,
          lastMessage: content,
          timestamp,
          unread: true
        });
      }
    });

    socket.on('support:typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (userId) {
        const chat = supportChats.get(userId);
        if (chat) {
          chat.isAdminTyping = isTyping;
          io.to(`user-${userId}`).emit('support:typingStatus', { isTyping });
        }
      }
    });

    socket.on('support:closeChat', ({ userId }: { userId: string }) => {
      supportChats.delete(userId);
      io.to('admin-room').emit('support:chatClosed', { userId });

      const userChat = Array.from(supportChats.values()).find(c => c.socketId === userId);
      if (userChat) {
        io.to(`user-${userId}`).emit('support:chatClosed', {
          message: 'Чат закрыт администратором. Спасибо за обращение!'
        });
      }
    });

    socket.on('disconnect', () => {
      if (adminSockets.has(socket.id)) {
        adminSockets.delete(socket.id);
      }
      for (const [userId, chat] of supportChats.entries()) {
        if (chat.socketId === socket.id) {
          chat.socketId = 'offline';
          io.to('admin-room').emit('support:userOffline', { userId });
          break;
        }
      }
      console.log(`Отключён: ${socket.id}`);
    });
  });

  return io;
}