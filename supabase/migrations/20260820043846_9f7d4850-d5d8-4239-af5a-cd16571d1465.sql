-- Add day_of_month and auto_log_enabled to recurring_incomes
ALTER TABLE public.recurring_incomes 
ADD COLUMN day_of_month integer CHECK (day_of_month >= 1 AND day_of_month <= 31),
ADD COLUMN auto_log_enabled boolean DEFAULT false NOT NULL;
