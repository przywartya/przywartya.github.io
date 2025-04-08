import { useState } from "react";
import logo from './logo.svg';
import './App.css';
import CometChatManager from './components/CometChatManager';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div>
          <CometChatManager />
          <div>
            <h1>Stream</h1>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
