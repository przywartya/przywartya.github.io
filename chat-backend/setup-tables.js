const { Pool } = require('pg');
require('dotenv').config();

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

async function setupTables() {
  try {
    // Create channels table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS channels (
        channel_id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        member_count INTEGER DEFAULT 0
      );
    `);

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        message_id UUID PRIMARY KEY,
        channel_id UUID REFERENCES channels(channel_id),
        username VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for faster message retrieval by channel
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_channel_id 
      ON messages(channel_id, created_at DESC);
    `);

    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error setting up tables:', error);
  } finally {
    await pool.end();
  }
}

setupTables(); 