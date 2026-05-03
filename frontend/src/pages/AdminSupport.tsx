import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../App.css';

interface ChatUser {
  userId: string;
  username: string;
  lastMessage?: string;
  timestamp?: Date;
  unread?: boolean;
  isOnline?: boolean;
}

interface Message {
  id: string;
  fromUserId: string;
  content: string;
  timestamp: Date;
  isAdmin: boolean;
}

export default function AdminSupport() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN' || !token) {
      navigate('/products');
      return;
    }

    const newSocket = io('http://localhost:3000', { auth: { token } });

    newSocket.on('connect', () => {
      newSocket.emit('support:join', {
        userId: user.id?.toString(),
        username: user.username,
        isAdmin: true
      });
    });

    newSocket.on('support:chatList', (chats: ChatUser[]) => {
      setChatUsers(chats.map(c => ({ ...c, isOnline: true })));
    });

    newSocket.on('support:newChat', (newChat: ChatUser) => {
      setChatUsers(prev => {
        if (prev.find(c => c.userId === newChat.userId)) return prev;
        return [...prev, { ...newChat, isOnline: true }];
      });
    });

    newSocket.on('support:newMessage', (message: Message) => {
      if (selectedUser?.userId === message.fromUserId) {
        setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
      }
      setChatUsers(prev => prev.map(c => 
        c.userId === message.fromUserId 
          ? { ...c, lastMessage: message.content, timestamp: new Date(message.timestamp), unread: !message.isAdmin }
          : c
      ));
    });

    newSocket.on('support:messageUpdate', ({ userId, lastMessage, timestamp, unread }: any) => {
      setChatUsers(prev => prev.map(c => 
        c.userId === userId 
          ? { ...c, lastMessage, timestamp: new Date(timestamp), unread }
          : c
      ));
    });

    newSocket.on('support:userOffline', ({ userId }: { userId: string }) => {
      setChatUsers(prev => prev.map(c => c.userId === userId ? { ...c, isOnline: false } : c));
    });

    newSocket.on('support:chatClosed', ({ userId }: { userId: string }) => {
      setChatUsers(prev => prev.filter(c => c.userId !== userId));
      if (selectedUser?.userId === userId) {
        setSelectedUser(null);
        setMessages([]);
      }
    });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [user, token, navigate, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChat = (chatUser: ChatUser) => {
    setSelectedUser(chatUser);
    setMessages([]);
    setChatUsers(prev => prev.map(c => 
      c.userId === chatUser.userId ? { ...c, unread: false } : c
    ));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !input.trim() || !selectedUser) return;

    socket.emit('support:message', {
      fromUserId: selectedUser.userId,
      content: input.trim(),
      isAdmin: true
    });
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (socket && selectedUser) {
      socket.emit('support:typing', { 
        userId: selectedUser.userId, 
        isTyping: true 
      });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('support:typing', { 
          userId: selectedUser.userId, 
          isTyping: false 
        });
      }, 1000);
    }
  };

  const handleCloseChat = (userId: string) => {
    if (socket) {
      socket.emit('support:closeChat', { userId });
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return <div className="container"><p>Доступ только для администраторов</p></div>;
  }

  return (
    <div className="container fade-in" style={{ display: 'flex', gap: '1.5rem', minHeight: 'calc(100vh - 100px)' }}>
      {/* Список чатов */}
      <div className="card" style={{ width: '320px', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
        <h2 className="card-title" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
          Чаты поддержки ({chatUsers.length})
        </h2>
        
        {chatUsers.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <p style={{ color: '#718096' }}>Нет активных чатов</p>
          </div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {chatUsers.map(chat => (
              <div
                key={chat.userId}
                onClick={() => handleSelectChat(chat)}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedUser?.userId === chat.userId ? '#e0e7ff' : 'transparent',
                  borderLeft: chat.unread ? '3px solid #667eea' : '3px solid transparent',
                  transition: 'background 0.2s',
                  marginBottom: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#2d3748' }}>{chat.username}</strong>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: chat.isOnline ? '#48bb78' : '#a0aec0' 
                  }}>
                    {chat.isOnline ? '●' : '○'}
                  </span>
                </div>
                {chat.lastMessage && (
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: '#718096', 
                    margin: '0.25rem 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {chat.lastMessage}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0aec0' }}>
                  <span>{chat.timestamp ? new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  {chat.unread && <span style={{ background: '#667eea', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem' }}>Новое</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Окно чата */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
        {selectedUser ? (
          <>
            {/* Заголовок чата */}
            <div style={{
              padding: '1rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '16px 16px 0 0'
            }}>
              <div>
                <strong>{selectedUser.username}</strong>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', opacity: 0.9 }}>
                  {selectedUser.isOnline ? '🟢 Онлайн' : '⚪ Не в сети'}
                </span>
              </div>
              <button 
                onClick={() => handleCloseChat(selectedUser.userId)}
                className="btn btn-danger"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Закрыть чат
              </button>
            </div>

            {/* Сообщения */}
            <div style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              background: '#f8f9fa',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {messages.map(msg => {
                const isMe = msg.isAdmin;
                return (
                  <div key={msg.id} style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}>
                    {!isMe && <span style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                      {msg.isAdmin ? 'Вы' : selectedUser.username}
                    </span>}
                    <div style={{
                      background: isMe ? '#667eea' : 'white',
                      color: isMe ? 'white' : '#2d3748',
                      padding: '0.75rem 1rem',
                      borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                      maxWidth: '70%',
                      wordBreak: 'break-word',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      {msg.content}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#a0aec0', marginTop: '0.25rem' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#718096' }}>Вы печатаете...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Форма ввода */}
            <form onSubmit={handleSendMessage} style={{
              padding: '1rem',
              background: 'white',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '0.5rem',
              borderRadius: '0 0 16px 16px'
            }}>
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ответить пользователю..."
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                disabled={!input.trim()}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  opacity: input.trim() ? 1 : 0.6
                }}
              >
                ➤
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096' }}>
            <p>Выберите чат из списка слева</p>
          </div>
        )}
      </div>
    </div>
  );
}