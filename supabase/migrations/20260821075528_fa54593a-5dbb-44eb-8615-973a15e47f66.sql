ALTER TABLE public.income_entries ADD COLUMN IF NOT EXISTS is_adjustment boolean DEFAULT false;
ALTER TABLE public.expense_entries ADD COLUMN IF NOT EXISTS is_adjustment boolean DEFAULT false;

-- Grant permissions again to ensure the API can see the new columns
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income_entries TO authenticated;
GRANT ALL ON public.income_entries TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_entries TO authenticated;
GRANT ALL ON public.expense_entries TO service_role;