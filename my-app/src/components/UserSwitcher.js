import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserSwitcher.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function UserSwitcher({ onUserSelect }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/users`);
        setUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserSelect = (user) => {
    onUserSelect(user);
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="user-switcher-container">
      <h2>Select a User</h2>
      <div className="users-grid">
        {users.map((user) => (
          <div 
            key={user.id} 
            className="user-card" 
            onClick={() => handleUserSelect(user)}
          >
            <div className="user-avatar">{user.displayName.charAt(0)}</div>
            <h3>{user.displayName}</h3>
            <p>@{user.username}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserSwitcher; 