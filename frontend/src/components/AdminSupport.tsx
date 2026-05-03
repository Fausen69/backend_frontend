import { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import '../App.css';

interface Message {
  id: string;
  fromUserId: string;
  content: string;
  timestamp: Date;
  isAdmin: boolean;
}

interface Chat {
  userId: string;
  username: string;
  lastMessage?: string;
  timestamp?: Date;
  unread?: boolean;
}

interface User {
  id?: number | string;
  username?: string;
  role?: string;
}

export default function AdminSupport() {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user || !token) return;

    const newSocket = io('http://localhost:3000', { auth: { token } });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('support:join', {
        userId: (user as User)?.id?.toString() || 'admin',
        username: (user as User)?.username || 'Админ',
        isAdmin: true
      });
    });

    newSocket.on('support:chatList', (chatList: Chat[]) => {
      setChats(chatList);
    });

    newSocket.on('support:newChat', (chat: Chat) => {
      setChats(prev => [...prev, chat]);
    });

    newSocket.on('support:newMessage', (message: Message) => {
      if (!message.isAdmin) {
        setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
        setChats(prev => prev.map(c => 
          c.userId === message.fromUserId 
            ? { ...c, lastMessage: message.content, timestamp: new Date(message.timestamp), unread: true }
            : c
        ));
      }
    });

    newSocket.on('support:messageUpdate', (update: { userId: string; lastMessage: string; timestamp: Date }) => {
      setChats(prev => prev.map(c => 
        c.userId === update.userId 
          ? { ...c, lastMessage: update.lastMessage, timestamp: new Date(update.timestamp) }
          : c
      ));
    });

    newSocket.on('support:userOffline', ({ userId }: { userId: string }) => {
      setChats(prev => prev.filter(c => c.userId !== userId));
    });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [user, token]);

  useEffect(scrollToBottom, [messages]);

  const selectChat = (userId: string) => {
    setSelectedChat(userId);
    setChats(prev => prev.map(c => 
      c.userId === userId ? { ...c, unread: false } : c
    ));
    setMessages([]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !input.trim() || !selectedChat) return;

    socket.emit('support:message', {
      fromUserId: selectedChat,
      content: input.trim(),
      isAdmin: true
    });
    setInput('');
  };

  const closeChat = (userId: string) => {
    if (socket) {
      socket.emit('support:closeChat', { userId });
      setChats(prev => prev.filter(c => c.userId !== userId));
      if (selectedChat === userId) {
        setSelectedChat(null);
        setMessages([]);
      }
    }
  };

  if ((user as User)?.role !== 'ADMIN') {
    return <div>Доступ запрещён</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
      <div style={{ width: '300px', background: 'white', borderRight: '1px solid #e2e8f0' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0 }}>Поддержка</h2>
          <div style={{ fontSize: '0.85rem', color: isConnected ? '#10b981' : '#ef4444' }}>
            {isConnected ? '🟢 Онлайн' : '🔴 Подключение...'}
          </div>
        </div>
        <div style={{ overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
          {chats.map(chat => (
            <div
              key={chat.userId}
              onClick={() => selectChat(chat.userId)}
              style={{
                padding: '1rem',
                borderBottom: '1px solid #e2e8f0',
                cursor: 'pointer',
                background: selectedChat === chat.userId ? '#f1f5f9' : 'white',
                position: 'relative'
              }}
            >
              {chat.unread && (
                <span style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '8px',
                  height: '8px',
                  background: '#ef4444',
                  borderRadius: '50%'
                }} />
              )}
              <strong>{chat.username}</strong>
              {chat.lastMessage && (
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {chat.lastMessage}
                </div>
              )}
              {chat.timestamp && (
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  {new Date(chat.timestamp).toLocaleString()}
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); closeChat(chat.userId); }}
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  right: '1rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                Закрыть
              </button>
            </div>
          ))}
        </div>
      </div>
      {selectedChat ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '1rem',
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0 }}>
              {chats.find(c => c.userId === selectedChat)?.username}
            </h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>
                Нет сообщений
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={{
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: msg.isAdmin ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: '0.5rem'
              }}>
                <div style={{
                  background: msg.isAdmin ? '#3b82f6' : '#f1f5f9',
                  color: msg.isAdmin ? 'white' : 'black',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  maxWidth: '70%'
                }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{
            display: 'flex',
            padding: '1rem',
            background: 'white',
            borderTop: '1px solid #e2e8f0',
            gap: '0.5rem'
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Введите сообщение..."
              disabled={!isConnected}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
            <button
              type="submit"
              disabled={!isConnected || !input.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Отправить
            </button>
          </form>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          Выберите чат для начала общения
        </div>
      )}
    </div>
  );
}
