import React, { useState } from 'react';
import TalkUserSwitcher from './TalkUserSwitcher';
import TalkChat from './TalkChat';

function TalkChatManager() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleUserSelect = (user) => {
    setCurrentUser(user);
  };

  return (
    <div className="talk-chat-container">
        <h1>TalkJS Chat</h1>
      <TalkUserSwitcher onUserSelect={handleUserSelect} />
      <TalkChat currentUser={currentUser} />
    </div>
  );
}

export default TalkChatManager; 