import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserSelection from './components/UserSelection';
import ChatDashboard from './components/ChatDashboard';
import './App.css';

function App() {
  // Check if user has selected a mocked user
  const hasSelectedUser = () => {
    return localStorage.getItem('selectedMockedUser') !== null;
  };

  console.log({user: localStorage.getItem('selectedMockedUser')})

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/select-user" element={hasSelectedUser() ? <Navigate to="/dashboard" /> : <UserSelection />} />
          <Route 
            path="/dashboard" 
            element={hasSelectedUser() ? <ChatDashboard /> : <Navigate to="/select-user" />} 
          />
          <Route path="/" element={<Navigate to={hasSelectedUser() ? "/dashboard" : "/select-user"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
