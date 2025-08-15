-- SQL para ejecutar manualmente en Supabase Dashboard
-- Ve a: https://supabase.com/dashboard > Tu proyecto > SQL Editor
-- Pega este código y ejecuta:

-- Calendar Events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type text NOT NULL,
  date date NOT NULL,
  time text,
  amount numeric(10,2),
  description text,
  recurring boolean DEFAULT false,
  frequency text,
  parent_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar_events
CREATE POLICY "Users can manage their own calendar events"
  ON calendar_events
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON calendar_events(user_id, date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_created ON calendar_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_parent ON calendar_events(parent_id);