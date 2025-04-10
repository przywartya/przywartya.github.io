const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

async function createChannelsTable() {
  const params = {
    TableName: 'ChatChannels',
    KeySchema: [
      { AttributeName: 'channelId', KeyType: 'HASH' } // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'channelId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    const result = await dynamodb.createTable(params).promise();
    console.log('ChatChannels table created:', result);
    return result;
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ChatChannels table already exists');
      return;
    }
    console.error('Error creating ChatChannels table:', error);
    throw error;
  }
}

async function createMessagesTable() {
  const params = {
    TableName: 'ChatMessages',
    KeySchema: [
      { AttributeName: 'messageId', KeyType: 'HASH' } // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'messageId', AttributeType: 'S' },
      { AttributeName: 'channelId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ChannelIdIndex',
        KeySchema: [
          { AttributeName: 'channelId', KeyType: 'HASH' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    const result = await dynamodb.createTable(params).promise();
    console.log('ChatMessages table created:', result);
    return result;
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ChatMessages table already exists');
      return;
    }
    console.error('Error creating ChatMessages table:', error);
    throw error;
  }
}

async function setupTables() {
  try {
    console.log('Setting up DynamoDB tables...');
    await createChannelsTable();
    await createMessagesTable();
    console.log('DynamoDB tables setup complete!');
  } catch (error) {
    console.error('Error setting up tables:', error);
  }
}

setupTables(); 