import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './ChatRoom.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function ChatRoom({ user, username }) {
  const { channelId } = useParams();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [channelInfo, setChannelInfo] = useState(null);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Initialize socket connection and fetch channel info
  useEffect(() => {
    const socket = io(API_URL);
    socketRef.current = socket;
    
    // Connect to socket
    socket.on('connect', () => {
      console.log('Socket connected');
      
      // Join with user info
      socket.emit('join', {
        userId: user.userId,
        username: username
      });
      
      // Once joined successfully
      socket.on('joined', () => {
        // Join the specific channel
        socket.emit('joinChannel', { 
          channelId, 
          username: username
        });
      });
    });
    
    // Handle connection errors
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to chat server');
      setLoading(false);
    });
    
    // Cleanup function to disconnect socket when component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [channelId, user, username]);
  
  // Set up socket event listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    
    // Channel info and recent messages
    socket.on('recentMessages', (recentMessages) => {
      setMessages(recentMessages.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      ));
      setLoading(false);
    });
    
    // New messages
    socket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    // Users in channel
    socket.on('userJoined', ({ user, users }) => {
      setUsers(users);
    });
    
    socket.on('userLeft', ({ user, users }) => {
      setUsers(users);
    });
    
    // Typing indicators
    socket.on('userTyping', ({ username, isTyping }) => {
      if (isTyping) {
        setTypingUsers(prev => {
          if (!prev.includes(username)) {
            return [...prev, username];
          }
          return prev;
        });
      } else {
        setTypingUsers(prev => prev.filter(user => user !== username));
      }
    });
    
    // Error handling
    socket.on('error', (err) => {
      console.error('Socket error:', err);
      setError(err.message || 'An error occurred');
    });
    
  }, []);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Fetch channel info
  useEffect(() => {
    const fetchChannelInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/channels/${channelId}`);
        if (!response.ok) {
          throw new Error('Channel not found');
        }
        const data = await response.json();
        setChannelInfo(data);
      } catch (error) {
        console.error('Error fetching channel:', error);
        setError('Channel not found or no longer exists');
      }
    };
    
    fetchChannelInfo();
  }, [channelId]);
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    const messageData = {
      channelId,
      content: newMessage.trim(),
      username: username
    };
    
    socketRef.current.emit('message', messageData);
    setNewMessage('');
    
    // Also stop typing indicator
    socketRef.current.emit('typing', {
      channelId,
      username: username,
      isTyping: false
    });
  };
  
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    socketRef.current.emit('typing', {
      channelId,
      username: username,
      isTyping: true
    });
    
    // Set timeout to stop "typing" after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing', {
        channelId,
        username: username,
        isTyping: false
      });
    }, 2000);
  };
  
  const handleLeaveChannel = () => {
    navigate('/channels');
  };
  
  if (loading) {
    return <div className="loading">Loading chat room...</div>;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/channels')}>
          Back to Channels
        </button>
      </div>
    );
  }

  return (
    <div className="chat-room-container">
      <div className="chat-sidebar">
        <div className="channel-info">
          <h2>{channelInfo?.name || 'Channel'}</h2>
          <p>{channelInfo?.description}</p>
        </div>
        <div className="channel-users">
          <h3>Members ({users.length})</h3>
          <ul>
            {users.map((uname) => (
              <li key={uname} className={uname === username ? 'current-user' : ''}>
                {uname}
                {uname === username && ' (you)'}
              </li>
            ))}
          </ul>
        </div>
        <button className="leave-button" onClick={handleLeaveChannel}>
          Leave Channel
        </button>
      </div>
      
      <div className="chat-main">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="no-messages">
              <p>No messages yet. Be the first to say hello!</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message) => (
                <div 
                  key={message.messageId} 
                  className={`message ${message.username === username ? 'own-message' : ''}`}
                >
                  <div className="message-header">
                    <span className="message-username">
                      {message.username === username ? 'You' : message.username}
                    </span>
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
          
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              {typingUsers.filter(name => name !== username).join(', ')}
              {typingUsers.filter(name => name !== username).length === 1 ? ' is typing...' : ' are typing...'}
            </div>
          )}
        </div>
        
        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="message-input"
          />
          <button type="submit" className="send-button" disabled={!newMessage.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom; 