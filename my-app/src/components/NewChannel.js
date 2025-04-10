import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './NewChannel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function NewChannel({ user, username }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name.trim()) {
      setError('Channel name is required');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/channels`, {
        name: name.trim(),
        description: description.trim(),
        createdBy: username
      });
      
      // Navigate to the newly created channel
      navigate(`/channels/${response.data.channelId}`);
    } catch (error) {
      console.error('Error creating channel:', error);
      setError('Failed to create channel. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="new-channel-container">
      <div className="new-channel-card">
        <h2>Create New Channel</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Channel Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength="50"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength="200"
              rows="3"
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => navigate('/channels')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="create-button" 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewChannel; 