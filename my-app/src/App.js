import React from "react";
import logo from './logo.svg';
import './App.css';
import CometChatManager from './components/CometChatManager';
import StreamChatManager from './components/StreamChatManager';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div>
          <StreamChatManager />
          <CometChatManager />
        </div>
      </header>
    </div>
  );
}

export default App;
