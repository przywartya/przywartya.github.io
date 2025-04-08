import React, { useState } from 'react';
import { STREAM_CHAT_CONSTANTS } from '../services/streamChatService';
import ChatClient from './ChatClient';

function UserSwitcher() {
  const [currentUser, setCurrentUser] = useState(null);

  const switchUser = (newUserId, newToken) => {
    setCurrentUser({ id: newUserId, token: newToken });
  };

  return (
    <div className="stream-chat-container">
      <h1>Stream Chat</h1>
      <div className="user-switcher">
        <h3>Select User:</h3>
        <button 
          onClick={() => switchUser(STREAM_CHAT_CONSTANTS.USER_1.ID, STREAM_CHAT_CONSTANTS.USER_1.TOKEN)}
          className={currentUser?.id === STREAM_CHAT_CONSTANTS.USER_1.ID ? 'active' : ''}
        >
          User 1 (123456)
        </button>
        <button 
          onClick={() => switchUser(STREAM_CHAT_CONSTANTS.USER_2.ID, STREAM_CHAT_CONSTANTS.USER_2.TOKEN)}
          className={currentUser?.id === STREAM_CHAT_CONSTANTS.USER_2.ID ? 'active' : ''}
        >
          User 2 (streamchat-uid-1)
        </button>
        {currentUser && <p>Current user: {currentUser.id}</p>}
      </div>
      {currentUser && <ChatClient currentUser={currentUser} />}
    </div>
  );
}

export default UserSwitcher; 