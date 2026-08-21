import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type VoucherType = 'income' | 'expense' | 'transfer';

export const getVouchers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { startDate: string; endDate: string }) => {
    return z.object({
      startDate: z.string(),
      endDate: z.string(),
    }).parse(data);
  })

  .handler(async ({ data, context }) => {
    const fetch = async () => {
      return await Promise.all([
        context.supabase
          .from("income_entries")
          .select("*, income_categories(name), income_sub_categories(name), accounts(name)")
          .gte("date", data.startDate)
          .lte("date", data.endDate)
          .order("date", { ascending: false }),
        context.supabase
          .from("expense_entries")
          .select("*, expense_categories(name), expense_sub_categories(name), accounts(name)")
          .gte("date", data.startDate)
          .lte("date", data.endDate)
          .order("date", { ascending: false })
      ]);
    };

    let [incomeRes, expenseRes] = await fetch();

    if ((incomeRes.error?.message?.includes("JWT issued at future")) || (expenseRes.error?.message?.includes("JWT issued at future"))) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const retry = await fetch();
      incomeRes = retry[0];
      expenseRes = retry[1];
    }

    if (incomeRes.error) throw new Error(incomeRes.error.message);
    if (expenseRes.error) throw new Error(expenseRes.error.message);

    const incomeVouchers = (incomeRes.data || []).map(item => ({
      id: item.id,
      date: item.date,
      title: item.income_categories?.name || 'Income',
      type: 'income' as VoucherType,
      amount: item.amount,
      currency: item.currency || 'USD',
      category: item.income_categories?.name,
      subCategory: item.income_sub_categories?.name,
      account: item.accounts?.name,
      description: item.description
    }));

    const expenseVouchers = (expenseRes.data || []).map(item => ({
      id: item.id,
      date: item.date,
      title: item.expense_categories?.name || 'Expense',
      type: 'expense' as VoucherType,
      amount: item.amount,
      currency: item.currency || 'USD',
      category: item.expense_categories?.name,
      subCategory: item.expense_sub_categories?.name,
      account: item.accounts?.name,
      description: item.description
    }));

    return [...incomeVouchers, ...expenseVouchers].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });
