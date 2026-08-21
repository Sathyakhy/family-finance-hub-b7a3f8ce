-- 1. Create income_sub_categories table
CREATE TABLE public.income_sub_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid REFERENCES public.income_categories(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 2. Grant access to authenticated and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income_sub_categories TO authenticated;
GRANT ALL ON public.income_sub_categories TO service_role;

-- 3. Enable RLS
ALTER TABLE public.income_sub_categories ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can manage their own income sub-categories"
ON public.income_sub_categories
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Add sub_category_id to income_entries and recurring_incomes
ALTER TABLE public.income_entries ADD COLUMN sub_category_id uuid REFERENCES public.income_sub_categories(id) ON DELETE SET NULL;
ALTER TABLE public.recurring_incomes ADD COLUMN sub_category_id uuid REFERENCES public.income_sub_categories(id) ON DELETE SET NULL;
