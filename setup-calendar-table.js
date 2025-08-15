import { supabase } from './src/config/supabase.js';

async function setupCalendarTable() {
  console.log('🔧 Setting up calendar_events table...');
  
  try {
    // First check if table exists by trying to query it
    const { data: existingData, error: checkError } = await supabase
      .from('calendar_events')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ calendar_events table already exists');
      return;
    }
    
    console.log('❌ calendar_events table does not exist, creating...');
    
    // Execute the migration SQL
    const migrationSQL = `
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
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (createError) {
      console.error('❌ Error creating table:', createError);
      
      // Try alternative approach: create table step by step
      console.log('🔄 Trying alternative approach...');
      
      const { error: altError } = await supabase
        .from('_migrations')
        .insert([{
          id: '20250809022413_crystal_tooth',
          sql: migrationSQL,
          applied_at: new Date().toISOString()
        }]);
        
      if (altError) {
        console.error('❌ Alternative approach failed:', altError);
        console.log('⚠️ Please manually execute the migration in Supabase dashboard');
        console.log('📋 SQL to execute:');
        console.log(migrationSQL);
      }
    } else {
      console.log('✅ calendar_events table created successfully');
    }
    
    // Verify the table was created
    const { data: verifyData, error: verifyError } = await supabase
      .from('calendar_events')
      .select('id')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Table verification failed:', verifyError);
    } else {
      console.log('✅ Table verification successful');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('⚠️ Manual setup required in Supabase dashboard');
  }
}

// Run the setup
setupCalendarTable().then(() => {
  console.log('🏁 Setup complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
});