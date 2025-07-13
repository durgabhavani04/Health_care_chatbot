import React, { useState, useEffect, useRef } from 'react';
import './ChatbotPage.css';

const ChatbotPage = ({ user, token, onLogout, onLoginClick }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/chat/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const formatAsPoints = (text) => {
    const lines = text.split(/\n|\r|\d+\./).filter((line) => line.trim().length > 0);
    return lines.slice(0, 6); // limit to 6 points
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);
    setError('');

    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantPoints = formatAsPoints(data.response);
        const assistantMessage = {
          role: 'assistant',
          content: assistantPoints,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearChatHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/chat/history', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-left">
          <h1>Healthcare AI Assistant</h1>
          <p>Welcome, {user?.username}!</p>
        </div>
        <div className="header-right">
          <button className="clear-btn" onClick={clearChatHistory}>
            Clear Chat
          </button>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
          <button className="login-btn" onClick={onLoginClick}>
            Login
          </button>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <div className="welcome-content">
                <h3>👋 Hello! I'm your Healthcare AI Assistant</h3>
                <p>I'm here to help you with health-related questions and concerns.</p>
                <p>You can ask me about:</p>
                <ul>
                  <li>Symptoms and conditions</li>
                  <li>Medications and treatments</li>
                  <li>General health and wellness</li>
                  <li>Nutrition and fitness</li>
                  <li>Mental health support</li>
                </ul>
                <p><strong>Note:</strong> I can only assist with healthcare-related topics.</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-content">
                  <div className="message-text">
                    {Array.isArray(message.content) ? (
                      <ul className="bullet-points">
                        {message.content.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    ) : (
                      message.content
                    )}
                  </div>
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="message assistant-message">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me about your health concerns..."
              className="message-input"
              disabled={loading}
            />
            <button type="submit" className="send-btn" disabled={loading || !inputMessage.trim()}>
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
