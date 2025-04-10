import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import Login from './components/Login';
import Register from './components/Register';
import ChannelList from './components/ChannelList';
import ChatRoom from './components/ChatRoom';
import NewChannel from './components/NewChannel';
import './App.css';

// Configure Amplify with Cognito
Amplify.configure({
  Auth: {
    // Nest configuration under Cognito for v6
    Cognito: { 
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1', // Use env var or default
      userPoolId: process.env.REACT_APP_USER_POOL_ID,
      // Use userPoolClientId instead of userPoolWebClientId
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID, 
    }
  }
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(''); // Add state for username

  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      setLoading(true); // Start loading
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        // Extract username - use userData.username directly
        setUsername(userData.username || 'User'); 
      } catch (error) {
        console.log('No authenticated user');
        setUser(null);
        setUsername('');
      }
      setLoading(false); // Finish loading
    };
    
    checkUser();
  }, []);

  // Function to update user state and username upon login/register
  const handleSetUser = (newUser) => {
    setUser(newUser);
    setUsername(newUser?.username || 'User');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setUsername(''); // Clear username on logout
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app-container">
        {user && (
          <header className="app-header">
            <h1>Real-Time Chat</h1>
            <div className="user-info">
              <span>Welcome, {username}</span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </header>
        )}
        
        <Routes>
          <Route path="/login" element={!user ? <Login setUser={handleSetUser} /> : <Navigate to="/channels" />} />
          <Route path="/register" element={!user ? <Register setUser={handleSetUser} /> : <Navigate to="/channels" />} />
          <Route path="/channels" element={user ? <ChannelList user={user} username={username} /> : <Navigate to="/login" />} />
          <Route path="/channels/new" element={user ? <NewChannel user={user} username={username} /> : <Navigate to="/login" />} />
          <Route path="/channels/:channelId" element={user ? <ChatRoom user={user} username={username} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={user ? "/channels" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
