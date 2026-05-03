import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import '../App.css';

export default function ChatWidget() {
  const { messages, onlineUsers, sendMessage, isConnected } = useChat();
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>
        💬 Чат
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
            background: '#3b82f6',
            color: 'white',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong>Чат</strong>
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
          {onlineUsers.length > 0 && (
            <div style={{
              padding: '0.5rem 1rem',
              background: '#f8fafc',
              fontSize: '0.85rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              Онлайн: {onlineUsers.map(u => u.username).join(', ')}
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                marginBottom: '1rem',
                ...(msg.userId === 'system' ? { textAlign: 'center', color: '#6b7280', fontStyle: 'italic' } : {})
              }}>
                {msg.userId === 'system' ? (
                  <span>{msg.content}</span>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong>{msg.username}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{
                      background: '#f1f5f9',
                      padding: '0.75rem',
                      borderRadius: '8px'
                    }}>
                      {msg.content}
                    </div>
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            padding: '1rem',
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
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}