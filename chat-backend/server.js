require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const { createAdapter } = require('@socket.io/postgres-adapter');

// Configure PostgreSQL
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: {
    rejectUnauthorized: false // Required for RDS
  }
});

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // In production, restrict to your domain
    methods: ['GET', 'POST']
  }
});

// Configure PostgreSQL adapter
const pgAdapter = createAdapter(pool, {
  channel: 'socket.io',
  tableName: 'socket_io_attachments',
  errorHandler: (error) => {
    console.error('Socket.IO PostgreSQL adapter error:', error);
  }
});

io.adapter(pgAdapter);

// Add connection error handling
io.engine.on("connection_error", (err) => {
  console.error('Socket.IO connection error:', err);
});

// Add adapter error handling
io.of("/").adapter.on("error", (error) => {
  console.error('Socket.IO adapter error:', error);
});

// Mock users - in production, these would come from Neo4j
const mockUsers = [
  { id: '1', username: 'alice', displayName: 'Alice Smith' },
  { id: '2', username: 'bob', displayName: 'Bob Johnson' },
  { id: '3', username: 'charlie', displayName: 'Charlie Brown' }
];

// Store active users and their socket connections
const activeUsers = {};
// Map channels to users
const channelUsers = {};

// Add monitoring
let messageCount = 0;
let lastMinute = new Date().getMinutes();

// Monitor message throughput
io.of("/").adapter.on("create-room", (room) => {
  console.log(`Room created: ${room}`);
});

io.of("/").adapter.on("delete-room", (room) => {
  console.log(`Room deleted: ${room}`);
});

// Track message count per minute
setInterval(() => {
  const currentMinute = new Date().getMinutes();
  if (currentMinute !== lastMinute) {
    console.log(`Messages processed in last minute: ${messageCount}`);
    messageCount = 0;
    lastMinute = currentMinute;
  }
}, 1000);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle user joining with their identity
  socket.on('join', ({ userId, username }) => {
    activeUsers[socket.id] = { userId, username };
    console.log(`User ${username} connected`);
    
    // Notify the user they've connected successfully
    socket.emit('joined', { success: true, message: 'Connected to chat server' });
  });
  
  // Handle joining a channel
  socket.on('joinChannel', async ({ channelId, username }) => {
    // Check if channelId is valid
    if (!channelId || channelId === 'undefined') {
      socket.emit('error', { message: 'Invalid channel ID' });
      return;
    }

    // Leave previous channels
    Object.keys(socket.rooms).forEach(room => {
      if (room !== socket.id) socket.leave(room);
    });
    
    // Join the new channel
    socket.join(channelId);
    
    // Initialize channel in our user tracking if it doesn't exist
    if (!channelUsers[channelId]) {
      channelUsers[channelId] = [];
    }
    
    // Add user to channel if not already there
    if (!channelUsers[channelId].includes(username)) {
      channelUsers[channelId].push(username);
    }
    
    // Notify channel about new user
    io.to(channelId).emit('userJoined', { 
      user: username, 
      users: channelUsers[channelId]
    });
    
    // Fetch recent messages
    try {
      const result = await pool.query(
        'SELECT * FROM messages WHERE channel_id = $1 ORDER BY created_at DESC LIMIT 50',
        [channelId]
      );
      // Transform to camelCase
      const transformedMessages = snakeToCamel(result.rows);
      socket.emit('recentMessages', transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      socket.emit('error', { message: 'Failed to fetch recent messages' });
    }
  });
  
  // Handle new message
  socket.on('message', async (messageData) => {
    messageCount++;
    const { channelId, content, username } = messageData;
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();
    
    try {
      // Store in PostgreSQL
      await pool.query(
        'INSERT INTO messages (message_id, channel_id, username, content, created_at) VALUES ($1, $2, $3, $4, $5)',
        [messageId, channelId, username, content, timestamp]
      );
      
      const message = {
        messageId,
        channelId,
        username,
        content,
        timestamp
      };
      
      // Broadcast to channel
      io.to(channelId).emit('newMessage', message);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Failed to save message' });
    }
  });
  
  // Handle user typing indication
  socket.on('typing', ({ channelId, username, isTyping }) => {
    socket.to(channelId).emit('userTyping', { username, isTyping });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    const user = activeUsers[socket.id];
    if (user) {
      console.log(`User ${user.username} disconnected`);
      
      // Remove user from all channels
      Object.keys(channelUsers).forEach(channelId => {
        const index = channelUsers[channelId].indexOf(user.username);
        if (index !== -1) {
          channelUsers[channelId].splice(index, 1);
          io.to(channelId).emit('userLeft', { 
            user: user.username, 
            users: channelUsers[channelId]
          });
        }
      });
      
      delete activeUsers[socket.id];
    }
  });
});

// Helper function to convert snake_case to camelCase
const snakeToCamel = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamel(item));
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase());
    acc[camelKey] = snakeToCamel(obj[key]);
    return acc;
  }, {});
};

// API Routes
// Get available channels
app.get('/channels', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM channels ORDER BY created_at DESC');
    console.log('Fetched channels:', result.rows);
    // Transform to camelCase
    const transformedChannels = snakeToCamel(result.rows);
    console.log('Transformed channels:', transformedChannels);
    res.json(transformedChannels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// Create a new channel
app.post('/channels', async (req, res) => {
  const { name, description, createdBy } = req.body;
  const channelId = uuidv4();
  
  try {
    await pool.query(
      'INSERT INTO channels (channel_id, name, description, created_by) VALUES ($1, $2, $3, $4)',
      [channelId, name, description, createdBy]
    );
    
    res.status(201).json({ 
      channelId, 
      name, 
      description, 
      createdBy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// Get channel details
app.get('/channels/:channelId', async (req, res) => {
  const { channelId } = req.params;
  
  // Validate channelId
  if (!channelId || channelId === 'undefined') {
    return res.status(400).json({ error: 'Invalid channel ID' });
  }
  
  try {
    const result = await pool.query(
      'SELECT * FROM channels WHERE channel_id = $1',
      [channelId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    // Transform to camelCase
    const transformedChannel = snakeToCamel(result.rows[0]);
    
    res.json(transformedChannel);
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
});

// Get mock users
app.get('/users', (req, res) => {
  res.json(mockUsers);
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 