import { useState } from "react";
import logo from './logo.svg';
import './App.css';
import CometChatManager from './components/CometChatManager';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div>
          <div>
            <h1>Stream</h1>
          </div>
          <CometChatManager />
        </div>
      </header>
    </div>
  );
}

export default App;
