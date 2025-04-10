import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChannelList from './components/ChannelList';
import ChatRoom from './components/ChatRoom';
import NewChannel from './components/NewChannel';
import UserSwitcher from './components/UserSwitcher';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  
  // Handle user selection
  const handleUserSelect = (selectedUser) => {
    setUser(selectedUser);
  };

  // Handle user logout
  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="app-container">
        {user && (
          <header className="app-header">
            <h1>Real-Time Chat</h1>
            <div className="user-info">
              <span>Welcome, {user.displayName}</span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </header>
        )}
        
        <Routes>
          <Route path="/login" element={!user ? <UserSwitcher onUserSelect={handleUserSelect} /> : <Navigate to="/channels" />} />
          <Route path="/channels" element={user ? <ChannelList user={user} /> : <Navigate to="/login" />} />
          <Route path="/channels/new" element={user ? <NewChannel user={user} username={user.username} /> : <Navigate to="/login" />} />
          <Route path="/channels/:channelId" element={user ? <ChatRoom user={user} username={user.username} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={user ? "/channels" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
