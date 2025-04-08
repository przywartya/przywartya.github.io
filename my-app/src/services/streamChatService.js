/**
 * Stream Chat Constants
 */
export const STREAM_CHAT_CONSTANTS = {
  API_KEY: process.env.REACT_APP_STREAM_API_KEY,
  USER_1: {
    ID: "123456",
    TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzNDU2In0.ZgRBqpkchoAARYC3wy8NWu6n-5dP5_3by0kYydUMt94"
  },
  USER_2: {
    ID: "streamchat-uid-1",
    TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic3RyZWFtY2hhdC11aWQtMSJ9.lxW0BPQ_3P7c1AQUC9KDT-tQtxvcvgXjbkdV5m1GEHU"
  }
};

/**
 * Initialize Stream Chat
 */
export const initializeStreamChat = () => {
  // This is handled by the useCreateChatClient hook in the component
  return true;
};

/**
 * Setup initial channel
 */
export const setupChannel = async (client, userId) => {
  const channelSetupKey = 'channelSetupDone';
  const isChannelSetupDone = localStorage.getItem(channelSetupKey);

  if (isChannelSetupDone) {
    try {
      const existingChannelId = localStorage.getItem('currentChannelId');
      if (existingChannelId) {
        const channel = client.channel('messaging', existingChannelId);
        await channel.watch();
        return channel;
      }
    } catch (error) {
      console.error("Error reconnecting to channel:", error);
    }
    return null;
  }

  try {
    await client.upsertUser({
      id: STREAM_CHAT_CONSTANTS.USER_2.ID,
      name: "Stream Chat User UID 1",
      image: 'https://getstream.io/random_png/?name=stream',
    });

    const randomChannelId = `channel_${Math.random().toString(36).substring(2, 10)}`;
    const channel = client.channel('messaging', randomChannelId, {
      image: 'https://getstream.io/random_png/?name=react',
      name: 'Talk about React',
      members: [STREAM_CHAT_CONSTANTS.USER_1.ID, STREAM_CHAT_CONSTANTS.USER_2.ID],
    });

    await channel.watch();
    localStorage.setItem('currentChannelId', randomChannelId);
    localStorage.setItem(channelSetupKey, 'true');
    
    return channel;
  } catch (error) {
    console.error("Error setting up channel:", error);
    throw error;
  }
};

/**
 * Join a channel by ID
 */
export const joinChannel = async (client, channelId) => {
  try {
    const newChannel = client.channel('messaging', channelId);
    await newChannel.watch();
    return newChannel;
  } catch (error) {
    console.error("Error joining channel:", error);
    throw error;
  }
}; 