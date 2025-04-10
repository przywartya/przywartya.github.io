-- Create table for Socket.IO PostgreSQL adapter
CREATE TABLE IF NOT EXISTS socket_io_attachments (
    id bigserial PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    payload json
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS socket_io_attachments_created_at_idx ON socket_io_attachments(created_at);

-- Optional: Set up cleanup job to remove old messages
-- This prevents the table from growing indefinitely
CREATE OR REPLACE FUNCTION cleanup_old_socket_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM socket_io_attachments 
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql; 