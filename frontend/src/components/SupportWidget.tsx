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

interface User {
  id?: number | string;
  username?: string;
  role?: string;
}

export default function SupportWidget() {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user || !token) return;

    const newSocket = io('http://localhost:3000', { auth: { token } });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('support:join', {
        userId: user.id?.toString() || 'guest',
        username: (user as User)?.username || 'Пользователь',
        isAdmin: (user as User)?.role === 'ADMIN'
      });
    });

    newSocket.on('support:newMessage', (message: Message) => {
      setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
      if (!isOpen) setHasUnread(true);
    });

    newSocket.on('support:typingStatus', ({ isTyping: adminTyping }: { isTyping: boolean }) => {
      setIsTyping(adminTyping);
    });

    newSocket.on('support:chatClosed', ({ message }: { message?: string }) => {
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`,
        fromUserId: 'system',
        content: message || 'Чат закрыт',
        timestamp: new Date(),
        isAdmin: true
      }]);
      setIsOpen(false);
    });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [user, token]);

  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !input.trim() || !user) return;

    socket.emit('support:message', {
      fromUserId: (user as User)?.id?.toString() || 'guest',
      content: input.trim(),
      isAdmin: false
    });
    setInput('');
    setHasUnread(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (socket && user) {
      socket.emit('support:typing', {
        userId: (user as User)?.id?.toString() || 'guest',
        isTyping: true
      });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('support:typing', {
          userId: (user as User)?.id?.toString() || 'guest',
          isTyping: false
        });
      }, 1000);
    }
  };

  if (!user) return null;

  return (
    <>
      <button onClick={() => { setIsOpen(!isOpen); setHasUnread(false); }}>
        {hasUnread && <span style={{ color: 'red' }}>●</span>}
        💬 Поддержка
      </button>
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '350px',
          height: '500px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            background: '#10b981',
            color: 'white',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong>Техническая поддержка</strong>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                {isConnected ? '🟢 Онлайн' : '🔴 Подключение...'}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>
                👋 Здравствуйте!<br />Опишите вашу проблему, и мы поможем.
              </div>
            )}

            {messages.map(msg => {
              const isMe = !msg.isAdmin && msg.fromUserId === (user as User)?.id?.toString();
              const isSystem = msg.fromUserId === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic', margin: '1rem 0' }}>
                    {msg.content}
                  </div>
                );
              }

              return (
                <div key={msg.id} style={{
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: '0.5rem'
                }}>
                  {!isMe && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', maxWidth: '60%' }}>
                      {msg.isAdmin ? 'Поддержка' : 'Вы'}
                    </div>
                  )}
                  <div style={{
                    background: isMe ? '#10b981' : '#f1f5f9',
                    color: isMe ? 'white' : 'black',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    maxWidth: '70%'
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>
                Поддержка печатает...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} style={{
            display: 'flex',
            padding: '1rem',
            borderTop: '1px solid #e2e8f0',
            gap: '0.5rem'
          }}>
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Опишите проблему..."
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
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}