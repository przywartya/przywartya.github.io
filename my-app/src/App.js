import { useState, useEffect } from "react";
import logo from './logo.svg';
import './App.css';
import CometChatManager from './components/CometChatManager';
import {
  Chat,
  Channel,
  ChannelList,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  useCreateChatClient,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";

const apiKey = "649vh63myv5u";
const userId = "123456";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzNDU2In0.ZgRBqpkchoAARYC3wy8NWu6n-5dP5_3by0kYydUMt94";
const userId2 = "streamchat-uid-1";
const token2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic3RyZWFtY2hhdC11aWQtMSJ9.lxW0BPQ_3P7c1AQUC9KDT-tQtxvcvgXjbkdV5m1GEHU";
// const filters = { members: { $in: [userId] }, type: "messaging" };
// const options = { presence: true, state: true };
// const sort = { last_message_at: -1 };

// ChatComponent that handles all Stream Chat related logic
function ChatComponent({ currentUser }) {
  const [channel, setChannel] = useState();
  const [channelIdInput, setChannelIdInput] = useState('');

  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: currentUser.token,
    userData: { id: currentUser.id },
  });

  const joinChannel = async (channelId) => {
    try {
      const newChannel = client.channel('messaging', channelId);
      await newChannel.watch();
      setChannel(newChannel);
      localStorage.setItem('currentChannelId', channelId);
    } catch (error) {
      console.error("Error joining channel:", error);
      alert("Failed to join channel. Please check the channel ID and try again.");
    }
  };

  useEffect(() => {
    if (!client) return;

    const channelSetupKey = 'channelSetupDone';
    const isChannelSetupDone = localStorage.getItem(channelSetupKey);

    const setupChannel = async () => {
      if (isChannelSetupDone) {
        try {
          const existingChannelId = localStorage.getItem('currentChannelId');
          if (existingChannelId) {
            const channel = client.channel('messaging', existingChannelId);
            await channel.watch();
            setChannel(channel);
          }
        } catch (error) {
          console.error("Error reconnecting to channel:", error);
        }
        return;
      }

      try {
        await client.upsertUser({
          id: "streamchat-uid-1",
          name: "Stream Chat User UID 1",
          image: 'https://getstream.io/random_png/?name=stream',
        });

        const randomChannelId = `channel_${Math.random().toString(36).substring(2, 10)}`;
        const channel = client.channel('messaging', randomChannelId, {
          image: 'https://getstream.io/random_png/?name=react',
          name: 'Talk about React',
          members: ["123456", "streamchat-uid-1"],
        });

        await channel.watch();
        setChannel(channel);
        
        localStorage.setItem('currentChannelId', randomChannelId);
        localStorage.setItem(channelSetupKey, 'true');
      } catch (error) {
        console.error("Error setting up channel:", error);
      }
    };

    setupChannel();
  }, [client]);

  if (!client) return <div>Loading chat client...</div>;

  return (
    <div>
      <h1>Stream</h1>
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
          <button onClick={() => joinChannel(channelIdInput)}>Join Channel</button>
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

// Main App component
function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const switchUser = (newUserId, newToken) => {
    setCurrentUser({ id: newUserId, token: newToken });
  };

  const renderUserSwitcher = () => (
    <div className="user-switcher">
      <h3>Select User:</h3>
      <button 
        onClick={() => switchUser(userId, token)}
        className={currentUser?.id === userId ? 'active' : ''}
      >
        User 1 (123456)
      </button>
      <button 
        onClick={() => switchUser(userId2, token2)}
        className={currentUser?.id === userId2 ? 'active' : ''}
      >
        User 2 (streamchat-uid-1)
      </button>
      {currentUser && <p>Current user: {currentUser.id}</p>}
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <div>
          {renderUserSwitcher()}
          {currentUser && <ChatComponent currentUser={currentUser} />}
          {currentUser && <CometChatManager />}
        </div>
      </header>
    </div>
  );
}

export default App;
