import React, { useState } from 'react';
import apiClient from '../api/axiosConfig';

function ChatBox({ articleId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiClient.post(`/api/chat/${articleId}`, { message: input });
      const aiMessage = { sender: 'ai', text: response.data.response };
      setMessages(prev => [...prev, userMessage, aiMessage]);
    } catch (error) {
      const errorMessage = { sender: 'ai', text: "Sorry, I couldn't get a response." };
      setMessages(prev => [...prev, userMessage, errorMessage]);
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="chat-box">
      <h4>Ask AI About This Article</h4>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <p>{msg.text}</p>
          </div>
        ))}
        {isLoading && <div className="message ai"><p><i>Thinking...</i></p></div>}
      </div>
      <form onSubmit={handleSend} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}

export default ChatBox;