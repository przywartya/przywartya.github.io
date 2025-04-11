const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Bot credentials
const BOT_TOKEN = process.env.ROCKET_CHAT_BOT_TOKEN;
const BOT_ID = process.env.ROCKET_CHAT_BOT_ID;
const ROCKET_CHAT_URL = process.env.ROCKET_CHAT_URL;

// Create HTTP server
const server = http.createServer(app);

// Initialize socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for simplicity
  },
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000 // 25 seconds
});

// Handle socket connection
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Listen for new messages
  socket.on('newMessage', (message) => {
    // Broadcast the message to all clients in the specific room
    io.to(message.roomId).emit('message', message);
  });

  // Join a room when a channel is selected
  socket.on('joinRoom', (roomId) => {
    // Leave any previous room
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) { // Don't leave the default room
        socket.leave(room);
      }
    });
    // Join the new room
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`A user disconnected. Reason: ${reason}`);
  });
});

// Verify bot token is working
app.get('/api/verify-bot', async (req, res) => {
  try {
    const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/me`, {
      headers: {
        'X-Auth-Token': BOT_TOKEN,
        'X-User-Id': BOT_ID
      }
    });
    
    if (response.data && response.data.success) {
      res.json({
        success: true,
        botName: response.data.name || response.data.username,
        status: 'Bot is connected and authenticated'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Bot authentication failed'
      });
    }
  } catch (error) {
    console.error('Bot verification error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      message: 'Error connecting to Rocket Chat'
    });
  }
});

// Get channels
app.get('/api/channels', async (req, res) => {
  try {
    const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/channels.list`, {
      headers: {
        'X-Auth-Token': BOT_TOKEN,
        'X-User-Id': BOT_ID
      }
    });
    
    res.json({
      success: true,
      channels: response.data.channels
    });
  } catch (error) {
    console.error('Error fetching channels:', error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching channels'
    });
  }
});

// Send message as mocked user
app.post('/api/send-message', async (req, res) => {
  try {
    const { roomId, message, mockedUser } = req.body;
    
    // Use bot to send message but display as mocked user
    const response = await axios.post(`${ROCKET_CHAT_URL}/api/v1/chat.postMessage`, {
      roomId,
      text: message,
      alias: mockedUser.name, // Display name of mocked user
      avatar: mockedUser.avatar, // Avatar URL of mocked user
    }, {
      headers: {
        'X-Auth-Token': BOT_TOKEN,
        'X-User-Id': BOT_ID
      }
    });
    
    res.json({
      success: true,
      messageId: response.data.message._id
    });
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
});

// Get messages from a room
app.get('/api/messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/channels.messages?roomId=${roomId}`, {
      headers: {
        'X-Auth-Token': BOT_TOKEN,
        'X-User-Id': BOT_ID
      }
    });
    
    res.json({
      success: true,
      messages: response.data.messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
});

// Get mocked users
app.get('/api/mocked-users', (req, res) => {
  // Predefined mocked users
  const mockedUsers = [
    {
      id: 'user1',
      name: 'Alex Johnson',
      avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=random',
      color: '#FF5733'
    },
    {
      id: 'user2',
      name: 'Sam Taylor',
      avatar: 'https://ui-avatars.com/api/?name=Sam+Taylor&background=random',
      color: '#33FF57'
    },
    {
      id: 'user3',
      name: 'Jordan Smith',
      avatar: 'https://ui-avatars.com/api/?name=Jordan+Smith&background=random',
      color: '#3357FF'
    },
    {
      id: 'user4',
      name: 'Casey Williams',
      avatar: 'https://ui-avatars.com/api/?name=Casey+Williams&background=random',
      color: '#F033FF'
    },
    {
      id: 'user5',
      name: 'Riley Garcia',
      avatar: 'https://ui-avatars.com/api/?name=Riley+Garcia&background=random',
      color: '#FF9933'
    }
  ];
  
  res.json({
    success: true,
    users: mockedUsers
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
