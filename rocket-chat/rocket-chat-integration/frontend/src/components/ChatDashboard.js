import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

const ChatDashboard = () => {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mockedUser, setMockedUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();
  

  // Get mocked user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('selectedMockedUser');
    if (storedUser) {
      setMockedUser(JSON.parse(storedUser));
    } else {
      // Redirect if no user is selected
      navigate('/select-user');
    }
    
    // Fetch channels
    fetchChannels();
  }, [navigate]);

  // Fetch messages when a channel is selected
  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel._id);
      // Join the room when a channel is selected
      socket.emit('joinRoom', selectedChannel._id);
    }
  }, [selectedChannel]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5001', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      if (selectedChannel) {
        newSocket.emit('joinRoom', selectedChannel._id);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Connection error. Trying to reconnect...');
    });

    setSocket(newSocket);

    // Clean up only on component unmount
    return () => {
      if (newSocket) {
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.close();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Separate useEffect for message handling
  useEffect(() => {
    if (!socket) return;

    const messageHandler = (message) => {
      console.log('Received message:', message);
      if (selectedChannel && message.roomId === selectedChannel._id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };

    socket.on('message', messageHandler);

    return () => {
      socket.off('message', messageHandler);
    };
  }, [socket, selectedChannel]); // Include both socket and selectedChannel in dependencies

  const fetchChannels = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get('http://localhost:5001/api/channels');
      if (response.data.success) {
        setChannels(response.data.channels);
      } else {
        setError('Failed to fetch channels');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while fetching channels');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`http://localhost:5001/api/messages/${roomId}`);
      if (response.data.success) {
        setMessages(response.data.messages);
      } else {
        setError('Failed to fetch messages');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while fetching messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChannel || !mockedUser) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5001/api/send-message', {
        roomId: selectedChannel._id,
        message: newMessage,
        mockedUser: mockedUser
      });
      
      if (response.data.success) {
        const newMessageObj = {
          _id: response.data.messageId,
          msg: newMessage,
          alias: mockedUser.name,
          ts: new Date().toISOString(),
          roomId: selectedChannel._id
        };
        
        setMessages(prevMessages => [...prevMessages, newMessageObj]);
        setNewMessage('');
        
        // Use socket from state
        if (socket) {
          socket.emit('newMessage', newMessageObj);
        }
      } else {
        setError('Failed to send message');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while sending the message');
    } finally {
      setLoading(false);
    }
  };

  const changeUser = () => {
    localStorage.removeItem('selectedMockedUser');
    navigate('/select-user');
  };

  // Function to determine if a message is from the current mocked user
  const isCurrentUserMessage = (message) => {
    // For messages sent through our API with the alias property
    if (message.alias && mockedUser && message.alias === mockedUser.name) {
      return true;
    }
    return false;
  };

  return (
    <div className="dashboard-container">
      <header>
        <h2>Rocket Chat Integration</h2>
        <div className="user-info">
          {mockedUser && (
            <>
              <img 
                src={mockedUser.avatar} 
                alt={mockedUser.name} 
                className="header-avatar" 
              />
              <span className="header-username">{mockedUser.name}</span>
            </>
          )}
          <button onClick={changeUser}>Change User</button>
        </div>
      </header>
      
      <div className="chat-interface">
        <div className="channels-sidebar">
          <h3>Channels</h3>
          {loading && !channels.length && <p>Loading channels...</p>}
          {error && <p className="error-message">{error}</p>}
          <ul>
            {channels.map(channel => (
              <li 
                key={channel._id}
                className={selectedChannel?._id === channel._id ? 'active' : ''}
                onClick={() => setSelectedChannel(channel)}
              >
                #{channel.name}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="messages-container">
          {selectedChannel ? (
            <>
              <div className="channel-header">
                <h3>#{selectedChannel.name}</h3>
              </div>
              
              <div className="messages-list">
                {loading && !messages.length && <p>Loading messages...</p>}
                {messages.length === 0 && !loading && (
                  <p>No messages in this channel yet.</p>
                )}
                {messages.map(message => (
                  <div 
                    key={message._id} 
                    className={`message ${isCurrentUserMessage(message) ? 'own-message' : ''}`}
                  >
                    <div className="message-header">
                      <span className="username">
                        {message.alias || (message.u && message.u.username)}
                      </span>
                      <span className="timestamp">
                        {new Date(message.ts).toLocaleString()}
                      </span>
                    </div>
                    <div className="message-content">{message.msg}</div>
                  </div>
                ))}
              </div>
              
              <form className="message-form" onSubmit={sendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message as ${mockedUser ? mockedUser.name : 'User'}...`}
                  disabled={loading}
                />
                <button type="submit" disabled={loading || !newMessage.trim()}>
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="no-channel-selected">
              <p>Select a channel to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDashboard;
