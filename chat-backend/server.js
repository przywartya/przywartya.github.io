require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION,
  // In production, use IAM roles or environment variables instead of hardcoded credentials
  // AWS will automatically use the EC2 instance role when deployed
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

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

// Store active users and their socket connections
const activeUsers = {};
// Map channels to users
const channelUsers = {};

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
      const params = {
        TableName: process.env.DYNAMODB_MESSAGES_TABLE,
        IndexName: 'ChannelIdIndex',
        KeyConditionExpression: 'channelId = :channelId',
        ExpressionAttributeValues: {
          ':channelId': channelId
        },
        Limit: 50,
        ScanIndexForward: false // Get most recent messages
      };
      
      const result = await dynamoDB.query(params).promise();
      socket.emit('recentMessages', result.Items);
    } catch (error) {
      console.error('Error fetching messages:', error);
      socket.emit('error', { message: 'Failed to fetch recent messages' });
    }
  });
  
  // Handle new message
  socket.on('message', async (messageData) => {
    const { channelId, content, username } = messageData;
    const timestamp = new Date().toISOString();
    const messageId = uuidv4();
    
    const message = {
      messageId,
      channelId,
      username,
      content,
      timestamp
    };
    
    // Broadcast to channel
    io.to(channelId).emit('newMessage', message);
    
    // Store in DynamoDB
    try {
      await dynamoDB.put({
        TableName: process.env.DYNAMODB_MESSAGES_TABLE,
        Item: message
      }).promise();
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

// API Routes
// Get available channels
app.get('/channels', async (req, res) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_CHANNELS_TABLE
    };
    
    const result = await dynamoDB.scan(params).promise();
    res.json(result.Items);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// Create a new channel
app.post('/channels', async (req, res) => {
  const { name, description, createdBy } = req.body;
  const channelId = uuidv4();
  const timestamp = new Date().toISOString();
  
  try {
    const params = {
      TableName: process.env.DYNAMODB_CHANNELS_TABLE,
      Item: {
        channelId,
        name,
        description,
        createdBy,
        timestamp,
        memberCount: 0
      }
    };
    
    await dynamoDB.put(params).promise();
    res.status(201).json({ 
      channelId, 
      name, 
      description, 
      createdBy, 
      timestamp 
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// Get channel details
app.get('/channels/:channelId', async (req, res) => {
  const { channelId } = req.params;
  
  try {
    const params = {
      TableName: process.env.DYNAMODB_CHANNELS_TABLE,
      Key: {
        channelId
      }
    };
    
    const result = await dynamoDB.get(params).promise();
    
    if (!result.Item) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    res.json(result.Item);
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 