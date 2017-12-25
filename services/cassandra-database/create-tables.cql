CREATE KEYSPACE IF NOT EXISTS messages WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 };
CREATE TABLE IF NOT EXISTS messages.message_tracker (id ascii, status ascii, tags list<ascii>, receivers list<text>, title text, content text, action text, reference_id ascii, created_at timestamp, delivered_at timestamp, PRIMARY KEY (id, reference_id));
CREATE INDEX IF NOT EXISTS idx_status ON messages.message_tracker (status);
CREATE INDEX IF NOT EXISTS idx_tags ON messages.message_tracker (tags);
CREATE INDEX IF NOT EXISTS idx_destinations ON messages.message_tracker (receivers);