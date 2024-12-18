import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Volume2, Loader } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import '../styles/AIChat.css';

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: string;
}

export default function AIChat() {
  const { user, tokens, setTokens } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Start notification interval when component mounts
    chatInterval.current = setInterval(() => {
      if (!isOpen) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    }, 60000); // Every minute

    return () => {
      if (chatInterval.current) {
        clearInterval(chatInterval.current);
      }
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    if (!user) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Пожалуйста, войдите в систему чтобы использовать чат с ИИ',
        isAI: true,
        timestamp: formatTime(new Date()),
      }]);
      return;
    }

    if (tokens < 5) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Недостаточно токенов. Пополните баланс для продолжения общения.',
        isAI: true,
        timestamp: formatTime(new Date()),
      }]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isAI: false,
      timestamp: formatTime(new Date()),
    };

    try {
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: input })
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      // Deduct tokens and update Firestore
      const newTokens = tokens - 5;
      await updateDoc(doc(db, 'users', user.uid), {
        tokens: newTokens
      });
      setTokens(newTokens);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isAI: true,
        timestamp: formatTime(new Date()),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Извините, произошла ошибка. Попробуйте позже.',
        isAI: true,
        timestamp: formatTime(new Date()),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (text: string) => {
    if (!text) return;
    
    const button = document.querySelector('.play-audio') as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      button.classList.add('loading');
    }

    try {
      // Show loading state for the audio button
      const audioButton = document.querySelector('.playing-audio');
      if (audioButton) audioButton.classList.add('loading');

      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get audio');
      }

      const audioBuffer = await response.arrayBuffer();
      
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      await audio.play();
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (button) {
          button.disabled = false;
          button.classList.remove('loading');
        }
      };
    } catch (error) {
      console.error('Error playing audio:', error);
      // Show error message to user
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Не удалось воспроизвести аудио. Попробуйте позже.',
        isAI: true,
        timestamp: formatTime(new Date()),
      }]);
    } finally {
      if (button) {
        button.disabled = false;
        button.classList.remove('loading');
      }
    }
  };

  return (
    <>
      <div className={`ai-chat ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-content">
            <h3>ИИ-наставник</h3>
            {user && <span className="tokens-info">🪙 {tokens}</span>}
          </div>
          <button className="close-button" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="messages">
          {messages.map(message => (
            <div
              key={message.id}
              className={`message ${message.isAI ? 'ai' : 'user'}`}
            >
              <div className="message-content">
                <p>{message.text}</p>
                {message.isAI && (
                  <button
                    className="play-audio"
                    onClick={() => playAudio(message.text)}
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
              <span className="timestamp">
                {message.timestamp}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="message ai">
              <div className="loading">
                <Loader className="spin" size={20} />
                <span>ИИ печатает...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-input">
          {user ? (
            <div className="token-cost-info">
              Стоимость сообщения: 5 токенов
            </div>
          ) : (
            <div className="login-prompt">
              <a href="/login">Войдите</a> или <a href="/register">зарегистрируйтесь</a> чтобы начать общение
            </div>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Задайте вопрос..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            Отправить
          </button>
        </form>
      </div>

      {!isOpen && (
        user && tokens > 0 &&
        <button
          className={`chat-toggle ${showNotification ? 'notification' : ''}`}
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle size={24} />
        </button>
      )}
    </>
  );
}