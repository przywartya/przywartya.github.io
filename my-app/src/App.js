import React from "react";
import './App.css';
import CometChatManager from './components/CometChatManager';
import StreamChatManager from './components/StreamChatManager';
import TalkChatManager from './components/TalkChatManager';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div>
          <TalkChatManager />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <StreamChatManager />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <CometChatManager />
        </div>
      </header>
    </div>
  );
}

export default App;
