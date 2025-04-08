import React, { useState, useEffect } from 'react';
import { 
  initializeCometChat, 
  createNewChannel, 
  joinChannelById, 
  handleUserLogin, 
  getUserDetails,
  ALLOWED_USER_IDS,
  CometChatComponents
} from '../services/cometChatService';

function CometChatManager() {
  const [selectedUser, setSelectedUser] = useState(undefined);
  const [selectedGroup, setSelectedGroup] = useState(undefined);
  const [currentUserId, setCurrentUserId] = useState(undefined);
  const [groups, setGroups] = useState([]);
  const [channelInput, setChannelInput] = useState('');

  useEffect(() => {
    initializeCometChat();
  }, []);

  const handleCreateNewChannel = async () => {
    try {
      const createdGroup = await createNewChannel();
      setGroups(prevGroups => [...prevGroups, createdGroup]);
      setSelectedGroup(createdGroup);
    } catch (error) {
      console.error("Error in handleCreateNewChannel:", error);
    }
  };

  const handleJoinChannelById = async (e) => {
    e.preventDefault();
    if (!channelInput.trim()) return;

    try {
      const group = await joinChannelById(channelInput);
      setSelectedGroup(group);
      
      setGroups(prevGroups => {
        const exists = prevGroups.some(g => g.guid === group.guid);
        if (!exists) {
          return [...prevGroups, group];
        }
        return prevGroups;
      });
      
      setChannelInput('');
    } catch (error) {
      console.error("Error in handleJoinChannelById:", error);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;

    const handleUserAuth = async () => {
      try {
        const user = await handleUserLogin(currentUserId);
        if (user) {
          const userDetails = await getUserDetails(currentUserId);
          setSelectedUser(userDetails);
        }
      } catch (error) {
        console.error("Error in handleUserAuth:", error);
      }
    };

    handleUserAuth();

    if (groups.length > 0) {
      const mostRecentGroup = groups[groups.length - 1];
      setSelectedGroup(mostRecentGroup);
    }
  }, [currentUserId, groups]);

  const handleUserIdChange = (userId) => {
    setCurrentUserId(userId);
  };

  return (
    <div className="comet-chat-container">
      <h1>CometChat</h1>
      <div className="user-selector">
        <h3>Select User:</h3>
        <div className="user-buttons">
          {ALLOWED_USER_IDS.map((userId) => (
            <button
              key={userId}
              onClick={() => handleUserIdChange(userId)}
              className={currentUserId === userId ? 'active' : ''}
            >
              {userId}
            </button>
          ))}
        </div>
      </div>
      <div className="channel-controls">
        <button onClick={handleCreateNewChannel} className="create-channel-btn">
          Create New Channel
        </button>
        <form onSubmit={handleJoinChannelById} className="join-channel-form">
          <input
            type="text"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            placeholder="Enter Channel ID"
            className="channel-input"
          />
          <button type="submit" className="join-channel-btn">
            Join Channel
          </button>
        </form>
      </div>
      <h3>Current user: {selectedUser?.getUid()}</h3>
      <h3>Current channel ID: {selectedGroup?.guid || 'No channel selected'}</h3>
      {selectedUser && selectedGroup ? (
        <div className="messages-wrapper">
          <CometChatComponents.MessageHeader group={selectedGroup} />
          <CometChatComponents.MessageList group={selectedGroup} />
          <CometChatComponents.MessageComposer group={selectedGroup} />
        </div>
      ) : (
        <div className="empty-conversation">Please select a user and channel.</div>
      )}
    </div>
  );
}

export default CometChatManager; 