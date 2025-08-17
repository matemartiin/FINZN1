-- Google Calendar Sync Fix Migration
-- Adds necessary fields for proper Google Calendar synchronization

-- Add Google Calendar sync fields to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS google_event_id text,
ADD COLUMN IF NOT EXISTS google_calendar_id text DEFAULT 'primary',
ADD COLUMN IF NOT EXISTS sync_source text DEFAULT 'finzn',
ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS sync_version integer DEFAULT 1;

-- Create unique constraint to prevent duplicate Google events
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_events_google_unique 
ON calendar_events(user_id, google_event_id) 
WHERE google_event_id IS NOT NULL;

-- Add index for sync queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_sync_source 
ON calendar_events(user_id, sync_source, last_synced_at);

-- Add index for Google event ID lookups
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_id 
ON calendar_events(google_event_id) 
WHERE google_event_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN calendar_events.google_event_id IS 'Google Calendar event ID for bidirectional sync';
COMMENT ON COLUMN calendar_events.google_calendar_id IS 'Google Calendar ID (default: primary)';
COMMENT ON COLUMN calendar_events.sync_source IS 'Source of event: finzn, google, or bidirectional';
COMMENT ON COLUMN calendar_events.last_synced_at IS 'Last time this event was synced with Google Calendar';
COMMENT ON COLUMN calendar_events.sync_version IS 'Version number for conflict resolution';