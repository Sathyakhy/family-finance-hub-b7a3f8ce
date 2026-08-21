-- Create income categories table
CREATE TABLE public.income_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    icon text,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.income_categories TO authenticated;
GRANT ALL ON public.income_categories TO service_role;

ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own income categories"
ON public.income_categories
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create income entries table
CREATE TABLE public.income_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id uuid REFERENCES public.income_categories(id) ON DELETE SET NULL,
    amount numeric NOT NULL CHECK (amount >= 0),
    date date NOT NULL DEFAULT current_date,
    description text,
    is_recurring boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.income_entries TO authenticated;
GRANT ALL ON public.income_entries TO service_role;

ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own income entries"
ON public.income_entries
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create recurring incomes table
CREATE TABLE public.recurring_incomes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id uuid REFERENCES public.income_categories(id) ON DELETE SET NULL,
    amount numeric NOT NULL CHECK (amount >= 0),
    start_date date NOT NULL DEFAULT current_date,
    end_date date,
    frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    description text,
    created_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_incomes TO authenticated;
GRANT ALL ON public.recurring_incomes TO service_role;

ALTER TABLE public.recurring_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recurring incomes"
ON public.recurring_incomes
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
