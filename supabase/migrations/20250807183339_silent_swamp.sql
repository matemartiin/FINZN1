/*
  # Budget Management System

  1. New Tables
    - `budgets` - User budget configurations with AI insights
    - `budget_insights` - AI-generated insights and recommendations
    - `budget_alerts` - Smart alerts and notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
*/

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  amount decimal(10,2) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'active', -- 'active', 'paused', 'completed'
  ai_recommended boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Budget Insights table (AI-generated recommendations and analysis)
CREATE TABLE IF NOT EXISTS budget_insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  insight_type text NOT NULL, -- 'recommendation', 'pattern', 'prediction', 'alert'
  title text NOT NULL,
  description text NOT NULL,
  data jsonb DEFAULT '{}',
  confidence_score decimal(3,2), -- 0.00 to 1.00
  status text DEFAULT 'active', -- 'active', 'dismissed', 'applied'
  created_at timestamptz DEFAULT now()
);

-- Budget Alerts table
CREATE TABLE IF NOT EXISTS budget_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL, -- 'threshold', 'overspend', 'pattern', 'prediction'
  severity text NOT NULL, -- 'info', 'warning', 'critical'
  title text NOT NULL,
  message text NOT NULL,
  threshold_percentage decimal(5,2),
  current_amount decimal(10,2),
  status text DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for budgets
CREATE POLICY "Users can manage their own budgets"
  ON budgets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for budget_insights
CREATE POLICY "Users can manage their own budget insights"
  ON budget_insights
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for budget_alerts
CREATE POLICY "Users can manage their own budget alerts"
  ON budget_alerts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_status ON budgets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_budgets_user_dates ON budgets(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_budget_insights_user_type ON budget_insights(user_id, insight_type, status);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_status ON budget_alerts(user_id, status, created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();