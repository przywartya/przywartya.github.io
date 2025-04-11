import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserSelection = () => {
  const [mockedUsers, setMockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifyingBot, setVerifyingBot] = useState(true);
  const [botStatus, setBotStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify bot connection first
    const verifyBot = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/verify-bot');
        setBotStatus({
          success: response.data.success,
          name: response.data.botName,
          status: response.data.status
        });
        setVerifyingBot(false);
        
        // If bot is connected, fetch mocked users
        if (response.data.success) {
          fetchMockedUsers();
        }
      } catch (error) {
        setVerifyingBot(false);
        setBotStatus({
          success: false,
          status: 'Failed to connect to the Rocket Chat server'
        });
        setError('Cannot connect to the server. Please check your bot configuration.');
      }
    };
    
    verifyBot();
  }, []);

  const fetchMockedUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/mocked-users');
      setMockedUsers(response.data.users);
      setLoading(false);
    } catch (error) {
      setError('Error loading mocked users');
      setLoading(false);
    }
  };

  const selectUser = (user) => {
    // Store the selected user in localStorage
    localStorage.setItem('selectedMockedUser', JSON.stringify(user));
    navigate('/dashboard');
  };

  // Show bot status while verifying
  if (verifyingBot) {
    return (
      <div className="user-selection-container">
        <h2>Rocket Chat Integration</h2>
        <div className="loading-message">
          <p>Connecting to Rocket Chat server...</p>
        </div>
      </div>
    );
  }

  // Show error if bot is not connected
  if (botStatus && !botStatus.success) {
    return (
      <div className="user-selection-container">
        <h2>Rocket Chat Integration</h2>
        <div className="error-container">
          <p className="error-message">⚠️ {botStatus.status}</p>
          <p>Please check your bot configuration and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-selection-container">
      <h2>Rocket Chat Integration</h2>
      
      {botStatus && botStatus.success && (
        <div className="bot-status-container">
          <p className="bot-status">✓ Connected as bot: <strong>{botStatus.name}</strong></p>
        </div>
      )}
      
      <h3>Select a User to Begin</h3>
      
      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="user-grid">
          {mockedUsers.map(user => (
            <div 
              key={user.id} 
              className="user-card"
              onClick={() => selectUser(user)}
              style={{ borderColor: user.color }}
            >
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="user-avatar" 
              />
              <p className="user-name">{user.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSelection;
