import React, { useState } from 'react';

const TALK_USERS = [
  {
    id: 'nina-maze',
    name: 'Nina Maze',
    email: 'ninamaze@example.com',
    photoUrl: 'https://talkjs.com/new-web/avatar-7.jpg',
    welcomeMessage: 'Hi!'
  },
  {
    id: 'alex-maze',
    name: 'Alex Maze',
    email: 'alexmaze@example.com',
    photoUrl: 'https://talkjs.com/new-web/avatar-2.jpg',
    welcomeMessage: 'Hey there!'
  },
  {
    id: 'maya-maze',
    name: 'Maya Maze',
    email: 'mayamaze@example.com',
    photoUrl: 'https://talkjs.com/new-web/avatar-3.jpg',
    welcomeMessage: 'Hello!'
  }
];

function TalkUserSwitcher({ onUserSelect }) {
  const [currentUser, setCurrentUser] = useState(null);

  const switchUser = (user) => {
    setCurrentUser(user);
    onUserSelect(user);
  };

  return (
    <div className="talk-user-switcher">
      <h3>Select User:</h3>
      <div className="user-buttons">
        {TALK_USERS.map((user) => (
          <button
            key={user.id}
            onClick={() => switchUser(user)}
            className={currentUser?.id === user.id ? 'active' : ''}
          >
            {user.name}
          </button>
        ))}
      </div>
      {currentUser && (
        <div className="current-user-info">
          <p>Current user: {currentUser.name}</p>
          <img src={currentUser.photoUrl} alt={currentUser.name} className="user-avatar" />
        </div>
      )}
    </div>
  );
}

export default TalkUserSwitcher; 