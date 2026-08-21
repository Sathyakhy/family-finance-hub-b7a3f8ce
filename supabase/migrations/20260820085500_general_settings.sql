CREATE TABLE public.general_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_start_day INTEGER NOT NULL DEFAULT 1 CHECK (month_start_day >= 1 AND month_start_day <= 31),
    currency_toggle TEXT NOT NULL DEFAULT 'USD' CHECK (currency_toggle IN ('USD', 'KHR')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.general_settings TO authenticated;
GRANT ALL ON public.general_settings TO service_role;

ALTER TABLE public.general_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
    ON public.general_settings
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
