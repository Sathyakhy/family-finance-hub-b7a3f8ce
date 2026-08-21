-- Create accounts table
CREATE TABLE public.accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('bank', 'cash', 'other')),
    initial_balance numeric(15, 2) DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own accounts"
ON public.accounts
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Add account_id to income_entries
ALTER TABLE public.income_entries
ADD COLUMN account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Add account_id to recurring_incomes
ALTER TABLE public.recurring_incomes
ADD COLUMN account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;
