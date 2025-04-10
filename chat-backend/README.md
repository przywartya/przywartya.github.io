# Chat Backend

This is the backend server for the real-time chat application. It uses Node.js, Express, Socket.IO, and AWS DynamoDB for data storage.

## Prerequisites

- Node.js (v14 or higher)
- AWS account with DynamoDB access
- AWS CLI configured with appropriate credentials

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3001
AWS_REGION=us-east-1
DYNAMODB_CHANNELS_TABLE=ChatChannels
DYNAMODB_MESSAGES_TABLE=ChatMessages
```

3. Set up AWS DynamoDB tables:
   - Create `ChatChannels` table with `channelId` as the partition key
   - Create `ChatMessages` table with `messageId` as the partition key and a Global Secondary Index on `channelId`

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Channels
- `GET /channels` - Get all available channels
- `POST /channels` - Create a new channel
- `GET /channels/:channelId` - Get channel details

### WebSocket Events

#### Client to Server
- `join` - Join the chat server with user identity
- `joinChannel` - Join a specific channel
- `message` - Send a new message
- `typing` - Indicate user is typing

#### Server to Client
- `joined` - Confirmation of successful connection
- `userJoined` - Notification of new user joining
- `userLeft` - Notification of user leaving
- `newMessage` - New message in channel
- `recentMessages` - Recent messages in channel
- `userTyping` - User typing status
- `error` - Error notifications

## AWS Setup

The application uses AWS DynamoDB for data storage. Make sure to:

1. Create the required DynamoDB tables
2. Configure appropriate IAM roles and permissions
3. Set up proper security groups and network access

## Development

- The server runs on port 3001 by default
- Socket.IO is configured to allow CORS from any origin (restrict in production)
- Messages are stored in DynamoDB with a 50-message limit per channel
- User presence is tracked in memory (not persisted)

## Production Considerations

1. Implement proper authentication and authorization
2. Configure CORS to only allow your frontend domain
3. Set up proper error handling and logging
4. Implement rate limiting
5. Consider using AWS Elastic Beanstalk or similar for deployment
6. Set up proper monitoring and alerting 