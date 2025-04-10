import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ChannelList.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function ChannelList({ user }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await axios.get(`${API_URL}/channels`);
      setChannels(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching channels:', error);
      setError('Failed to load channels. Please try again later.');
      setLoading(false);
    }
  };

  const handleJoinChannel = (channelId) => {
    navigate(`/channels/${channelId}`);
  };

  if (loading) {
    return <div className="loading">Loading channels...</div>;
  }

  return (
    <div className="channel-list-container">
      <div className="channel-list-header">
        <h2>Available Channels</h2>
        <Link to="/channels/new" className="new-channel-button">
          Create Channel
        </Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {channels.length === 0 ? (
        <div className="no-channels">
          <p>No channels available. Create a new one to get started!</p>
        </div>
      ) : (
        <div className="channels-grid">
          {channels.map((channel) => (
            <div 
              key={channel.channelId} 
              className="channel-card" 
              onClick={() => handleJoinChannel(channel.channelId)}
            >
              <h3>{channel.name}</h3>
              <p className="channel-description">{channel.description}</p>
              <div className="channel-meta">
                <span>Created by: {channel.createdBy}</span>
                <span>Members: {channel.memberCount || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChannelList; 