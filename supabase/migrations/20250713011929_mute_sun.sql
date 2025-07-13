-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for user profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🏷️',
  color TEXT DEFAULT '#B7A6FF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  installment INTEGER DEFAULT 1,
  total_installments INTEGER DEFAULT 1,
  original_id UUID,
  original_amount DECIMAL(10,2),
  recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expenses" ON public.expenses
  FOR ALL USING (auth.uid() = user_id);

-- Create income table
CREATE TABLE IF NOT EXISTS public.income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  fixed_amount DECIMAL(10,2) DEFAULT 0,
  extra_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own income" ON public.income
  FOR ALL USING (auth.uid() = user_id);

-- Create extra incomes table
CREATE TABLE IF NOT EXISTS public.extra_incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.extra_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own extra incomes" ON public.extra_incomes
  FOR ALL USING (auth.uid() = user_id);

-- Create goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id);

-- Create spending limits table
CREATE TABLE IF NOT EXISTS public.spending_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  warning_percentage INTEGER DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

ALTER TABLE public.spending_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own spending limits" ON public.spending_limits
  FOR ALL USING (auth.uid() = user_id);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own achievements" ON public.achievements
  FOR ALL USING (auth.uid() = user_id);

-- Create monthly savings table
CREATE TABLE IF NOT EXISTS public.monthly_savings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

ALTER TABLE public.monthly_savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own monthly savings" ON public.monthly_savings
  FOR ALL USING (auth.uid() = user_id);

-- Insert default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, color) VALUES
    (NEW.id, 'Comida', '🍔', '#ef4444'),
    (NEW.id, 'Transporte', '🚗', '#3b82f6'),
    (NEW.id, 'Salud', '💊', '#8b5cf6'),
    (NEW.id, 'Ocio', '🎉', '#f59e0b'),
    (NEW.id, 'Supermercado', '🛒', '#10b981'),
    (NEW.id, 'Servicios', '📱', '#6b7280'),
    (NEW.id, 'Otros', '📦', '#9ca3af');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to add default categories for new users
CREATE OR REPLACE TRIGGER create_default_categories_trigger
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_categories();