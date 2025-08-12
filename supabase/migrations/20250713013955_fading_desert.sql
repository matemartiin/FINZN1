/*
  # Initial FINZN Database Schema

  1. New Tables
    - `expenses` - User expenses with installment support
    - `incomes` - Monthly income tracking (fixed and extra)
    - `extra_incomes` - Detailed extra income records
    - `goals` - Savings goals
    - `categories` - Expense categories
    - `spending_limits` - Category spending limits
    - `achievements` - User achievements
    - `monthly_savings` - Monthly savings tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  category text NOT NULL,
  transaction_date date NOT NULL,
  month text NOT NULL,
  installment integer DEFAULT 1,
  total_installments integer DEFAULT 1,
  original_id uuid,
  original_amount decimal(10,2),
  recurring boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Incomes table
CREATE TABLE IF NOT EXISTS incomes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month text NOT NULL,
  fixed_amount decimal(10,2) DEFAULT 0,
  extra_amount decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Extra incomes table
CREATE TABLE IF NOT EXISTS extra_incomes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  category text NOT NULL,
  month text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  target_amount decimal(10,2) NOT NULL,
  current_amount decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  icon text DEFAULT '🏷️',
  color text DEFAULT '#B7A6FF',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Spending limits table
CREATE TABLE IF NOT EXISTS spending_limits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  amount decimal(10,2) NOT NULL,
  warning_percentage integer DEFAULT 80,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Monthly savings table
CREATE TABLE IF NOT EXISTS monthly_savings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month text NOT NULL,
  amount decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_savings ENABLE ROW LEVEL SECURITY;

-- Create policies for expenses
CREATE POLICY "Users can manage their own expenses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for incomes
CREATE POLICY "Users can manage their own incomes"
  ON incomes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for extra_incomes
CREATE POLICY "Users can manage their own extra incomes"
  ON extra_incomes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for goals
CREATE POLICY "Users can manage their own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for categories
CREATE POLICY "Users can manage their own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for spending_limits
CREATE POLICY "Users can manage their own spending limits"
  ON spending_limits
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for achievements
CREATE POLICY "Users can manage their own achievements"
  ON achievements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for monthly_savings
CREATE POLICY "Users can manage their own monthly savings"
  ON monthly_savings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_month ON expenses(user_id, month);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incomes_user_month ON incomes(user_id, month);
CREATE INDEX IF NOT EXISTS idx_extra_incomes_user_month ON extra_incomes(user_id, month);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id, name);
CREATE INDEX IF NOT EXISTS idx_spending_limits_user ON spending_limits(user_id, category);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_savings_user ON monthly_savings(user_id, month);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_incomes_updated_at BEFORE UPDATE ON incomes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spending_limits_updated_at BEFORE UPDATE ON spending_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();