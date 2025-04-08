import React, { useState, useEffect } from 'react';
import {
  Chat,
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  useCreateChatClient,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import { joinChannel, setupChannel } from '../services/streamChatService';

function ChatClient({ currentUser }) {
  const [channel, setChannel] = useState();
  const [channelIdInput, setChannelIdInput] = useState('');

  const client = useCreateChatClient({
    apiKey: "649vh63myv5u",
    tokenOrProvider: currentUser.token,
    userData: { id: currentUser.id },
  });

  useEffect(() => {
    if (!client) return;

    const setupStreamChat = async () => {
      try {
        const channel = await setupChannel(client, currentUser.id);
        setChannel(channel);
      } catch (error) {
        console.error("Error setting up Stream Chat:", error);
      }
    };

    setupStreamChat();
  }, [client, currentUser.id]);

  const handleJoinChannel = async (channelId) => {
    try {
      const newChannel = await joinChannel(client, channelId);
      setChannel(newChannel);
      localStorage.setItem('currentChannelId', channelId);
    } catch (error) {
      console.error("Error joining channel:", error);
      alert("Failed to join channel. Please check the channel ID and try again.");
    }
  };

  if (!client) return <div>Loading chat client...</div>;

  return (
    <div className="stream-chat-container">
      <div className="channel-controls">
        <div className="current-channel">
          <strong>Current Channel ID:</strong> {channel?.id || 'None'}
        </div>
        <div className="join-channel">
          <input
            type="text"
            value={channelIdInput}
            onChange={(e) => setChannelIdInput(e.target.value)}
            placeholder="Enter channel ID to join"
          />
          <button onClick={() => handleJoinChannel(channelIdInput)}>Join Channel</button>
        </div>
      </div>
      <Chat client={client}>
        {channel ? (
          <Channel channel={channel}>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput />
            </Window>
            <Thread />
          </Channel>
        ) : (
          <div>Loading channel...</div>
        )}
      </Chat>
    </div>
  );
}

export default ChatClient; 