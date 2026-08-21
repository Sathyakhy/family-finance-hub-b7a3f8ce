-- EXPENSE SCHEMA
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    icon text,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_categories TO authenticated;
GRANT ALL ON public.expense_categories TO service_role;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their own expense categories" ON public.expense_categories
      FOR ALL TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.expense_sub_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id uuid REFERENCES public.expense_categories(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_sub_categories TO authenticated;
GRANT ALL ON public.expense_sub_categories TO service_role;
ALTER TABLE public.expense_sub_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their own expense sub-categories" ON public.expense_sub_categories
      FOR ALL TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.expense_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount numeric NOT NULL CHECK (amount >= 0),
    category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    sub_category_id uuid REFERENCES public.expense_sub_categories(id) ON DELETE SET NULL,
    account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
    date date NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_entries TO authenticated;
GRANT ALL ON public.expense_entries TO service_role;
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their own expense entries" ON public.expense_entries
      FOR ALL TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount numeric NOT NULL CHECK (amount >= 0),
    category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    sub_category_id uuid REFERENCES public.expense_sub_categories(id) ON DELETE SET NULL,
    account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
    start_date date NOT NULL,
    end_date date,
    frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    day_of_month integer CHECK (day_of_month >= 1 AND day_of_month <= 31),
    auto_log_enabled boolean DEFAULT false,
    description text,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_expenses TO authenticated;
GRANT ALL ON public.recurring_expenses TO service_role;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their own recurring expenses" ON public.recurring_expenses
      FOR ALL TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ASSETS SCHEMA
CREATE TABLE IF NOT EXISTS public.asset_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_types TO authenticated;
GRANT ALL ON public.asset_types TO service_role;
ALTER TABLE public.asset_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their own asset types" ON public.asset_types
      FOR ALL TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    asset_type_id uuid REFERENCES public.asset_types(id) ON DELETE SET NULL,
    account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
    current_value numeric NOT NULL DEFAULT 0,
    initial_value numeric NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their own assets" ON public.assets
      FOR ALL TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.asset_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
    value numeric NOT NULL,
    date date NOT NULL,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_history TO authenticated;
GRANT ALL ON public.asset_history TO service_role;
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their own asset history" ON public.asset_history
      FOR ALL TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FINANCIAL VOUCHERS SCHEMA
CREATE TABLE IF NOT EXISTS public.financial_vouchers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    amount numeric NOT NULL,
    date date NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
    description text,
    image_url text,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_vouchers TO authenticated;
GRANT ALL ON public.financial_vouchers TO service_role;
ALTER TABLE public.financial_vouchers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their own vouchers" ON public.financial_vouchers
      FOR ALL TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO public.expense_categories (user_id, name) 
SELECT id, 'Food' FROM auth.users
UNION ALL SELECT id, 'Transport' FROM auth.users
UNION ALL SELECT id, 'Utilities' FROM auth.users
UNION ALL SELECT id, 'Leisure' FROM auth.users;

INSERT INTO public.asset_types (user_id, name) 
SELECT id, 'Savings' FROM auth.users
UNION ALL SELECT id, 'Investment' FROM auth.users
UNION ALL SELECT id, 'Real Estate' FROM auth.users
UNION ALL SELECT id, 'Automobile' FROM auth.users;