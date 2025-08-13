// src/components/ChatInterface.js

import React, { useState } from 'react';
import './ChatInterface.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const ChatInterface = ({ articleId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/chat/${articleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const aiResponse = { text: data.response, sender: 'ai' };
      setMessages(prevMessages => [...prevMessages, aiResponse]);

    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = { text: 'Sorry, I am unable to connect to the AI assistant right now.', sender: 'ai' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="chat-placeholder">
            Ask me anything about this article.
          </p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender}`}>
              {msg.text}
            </div>
          ))
        )}
        {isLoading && <div className="chat-message ai">...</div>}
      </div>
      <div className="chat-input-bar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isLoading ? "Waiting for response..." : "Ask a question..."}
          className="chat-input"
          disabled={isLoading}
        />
        <button onClick={handleSendMessage} className="send-button" disabled={isLoading}>
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;