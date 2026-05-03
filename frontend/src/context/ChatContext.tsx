import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
}

interface OnlineUser {
  id: string;
  username: string;
}

interface ChatContextType {
  messages: Message[];
  onlineUsers: OnlineUser[];
  sendMessage: (content: string) => void;
  isConnected: boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user || !token) return;

    const newSocket = io('http://localhost:3000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('chat:join', {
        userId: user.id?.toString() || 'guest',
        username: user.username || 'Гость'
      });
    });

    newSocket.on('chat:newMessage', (message: Message) => {
      setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
    });

    newSocket.on('chat:userList', (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    newSocket.on('chat:userJoined', ({ username }: { username: string }) => {
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`,
        userId: 'system',
        username: 'Система',
        content: `${username} присоединился к чату`,
        timestamp: new Date()
      }]);
    });

    newSocket.on('chat:userLeft', ({ username }: { username: string }) => {
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`,
        userId: 'system',
        username: 'Система',
        content: `${username} покинул чат`,
        timestamp: new Date()
      }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  const sendMessage = (content: string) => {
    if (socket && content.trim()) {
      socket.emit('chat:message', { content: content.trim() });
    }
  };

  return (
    <ChatContext.Provider value={{ messages, onlineUsers, sendMessage, isConnected }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat должен использоваться внутри ChatProvider');
  return context;
}