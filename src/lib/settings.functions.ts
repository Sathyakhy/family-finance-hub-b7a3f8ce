import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getGeneralSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      let { data, error } = await (context.supabase as any)
        .from("general_settings")
        .select("*")
        .maybeSingle();
      
      if (error?.message?.includes("JWT issued at future")) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retry = await (context.supabase as any)
          .from("general_settings")
          .select("*")
          .maybeSingle();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error("Error fetching settings:", error);
        return {
          month_start_day: 1,
          currency_toggle: 'USD'
        };
      }
      
      return data || {
        month_start_day: 1,
        currency_toggle: 'USD'
      };
    } catch (e) {
      return {
        month_start_day: 1,
        currency_toggle: 'USD'
      };
    }
  });

export const updateGeneralSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    month_start_day: z.number().min(1).max(31).optional(),
    currency_toggle: z.enum(['USD', 'KHR']).optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: existing } = await (context.supabase as any)
      .from("general_settings")
      .select("id")
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await (context.supabase as any)
        .from("general_settings")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return updated;
    } else {
      const { data: inserted, error } = await (context.supabase as any)
        .from("general_settings")
        .insert({ ...data, user_id: context.userId })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return inserted;
    }
  });
