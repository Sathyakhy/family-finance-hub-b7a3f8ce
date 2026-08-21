import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Users, Activity, Wallet, Calendar, TrendingDown, Landmark, X, Filter, ChevronLeft, ChevronRight, History, Clock } from "lucide-react";
import { format, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays } from "date-fns";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";

import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getIncomeEntries, getRecurringIncomes, getExpenseEntries, getAssets, getExchangeRates, getAccounts } from "@/lib/finance.functions";
import { SankeyFlow } from "@/components/SankeyFlow";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Family Finance" },
      { name: "description", content: "Family finance overview with key stats and income summaries." },
      { property: "og:title", content: "Dashboard — Family Finance" },
      { property: "og:description", content: "Family finance overview with key stats and income summaries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useSuspenseQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("id", user.id)
        .maybeSingle();
      return { email: user.email ?? "", username: data?.username ?? "", createdAt: user.created_at };
    },
    staleTime: Infinity,
  });

  const { data: dashboardData } = useSuspenseQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const [entries, recurring, expenses, assets] = await Promise.all([
        getIncomeEntries(),
        getRecurringIncomes(),
        getExpenseEntries(),
        getAssets(),
      ]);
      return { entries, recurring, expenses, assets };
    },
  });

  const { entries, recurring, expenses, assets } = dashboardData;
  const { data: exchangeRates } = useSuspenseQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => getExchangeRates(),
  });

  const { data: accounts } = useSuspenseQuery({
    queryKey: ["accounts"],
    queryFn: () => getAccounts(),
  });


  const rate = exchangeRates?.[0]?.rate || 4000;

  const toUSD = (amount: number, currency: string) => currency === 'KHR' ? amount / rate : amount;
  const toKHR = (amount: number, currency: string) => currency === 'USD' ? amount * rate : amount;

  const [viewCurrency, setViewCurrency] = useState<"USD" | "KHR">("USD");


  const [dateFilter, setDateFilter] = useState<{ start: string; end: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem('dashboard-date-filter');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [showCustomDates, setShowCustomDates] = useState(false);

  const [aggregation, setAggregation] = useState<"daily" | "weekly" | "monthly" | "yearly" | "all-time">(() => {
    if (typeof window === 'undefined') return "daily";
    try {
      const saved = sessionStorage.getItem('dashboard-aggregation');
      return (saved as any) || "daily";
    } catch (e) {
      return "daily";
    }
  });

  useMemo(() => {
    if (typeof window === 'undefined') return;
    if (dateFilter) {
      sessionStorage.setItem('dashboard-date-filter', JSON.stringify(dateFilter));
    } else {
      sessionStorage.removeItem('dashboard-date-filter');
    }
  }, [dateFilter]);

  useMemo(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('dashboard-aggregation', aggregation);
  }, [aggregation]);

  const filteredEntries = useMemo(() => {
    if (!dateFilter) return entries;
    return entries.filter(e => e.date >= dateFilter.start && e.date <= dateFilter.end);
  }, [entries, dateFilter]);

  const filteredExpenses = useMemo(() => {
    if (!dateFilter) return expenses;
    return expenses.filter(e => e.date >= dateFilter.start && e.date <= dateFilter.end);
  }, [expenses, dateFilter]);

  const stats = useMemo(() => {
    const incUSD = filteredEntries.reduce((acc, entry) => acc + toUSD(entry.amount, entry.currency || 'USD'), 0);
    const incKHR = filteredEntries.reduce((acc, entry) => acc + toKHR(entry.amount, entry.currency || 'USD'), 0);
    const expUSD = filteredExpenses.reduce((acc, entry) => acc + toUSD(entry.amount, entry.currency || 'USD'), 0);
    const expKHR = filteredExpenses.reduce((acc, entry) => acc + toKHR(entry.amount, entry.currency || 'USD'), 0);
    const nwUSD = assets.reduce((acc, asset) => acc + toUSD(asset.current_value, asset.currency || 'USD'), 0);
    const nwKHR = assets.reduce((acc, asset) => acc + toKHR(asset.current_value, asset.currency || 'USD'), 0);

    return [
      { label: "Total Income", usd: incUSD, khr: incKHR, icon: Wallet },
      { label: "Total Expenses", usd: expUSD, khr: expKHR, icon: TrendingDown },
      { label: "Net Worth", usd: nwUSD, khr: nwKHR, icon: Landmark },
    ];
  }, [filteredEntries, filteredExpenses, assets, viewCurrency, rate]);

  const sankeyData = useMemo(() => {
    // Apply aggregation logic to the dates
    const getAggregatedDate = (dateStr: string) => {
      const date = new Date(dateStr);
      if (aggregation === 'weekly') return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      if (aggregation === 'monthly') return format(startOfMonth(date), 'yyyy-MM-dd');
      return dateStr; // daily
    };

    const aggregatedEntries = filteredEntries.map(e => ({ ...e, date: getAggregatedDate(e.date) }));
    const aggregatedExpenses = filteredExpenses.map(e => ({ ...e, date: getAggregatedDate(e.date) }));

    const incomeCats = Array.from(new Set(aggregatedEntries.map(e => e.income_categories?.name || 'Uncategorized')));
    const expenseCats = Array.from(new Set(aggregatedExpenses.map(e => e.expense_categories?.name || 'Uncategorized')));
    
    // Get distinct accounts used in income/expenses
    const incomeAccs = Array.from(new Set(aggregatedEntries.map(e => accounts.find(a => a.id === e.account_id)?.name || 'Other Account')));
    const expenseAccs = Array.from(new Set(aggregatedExpenses.map(e => accounts.find(a => a.id === e.account_id)?.name || 'Other Account')));
    const allAccs = Array.from(new Set([...incomeAccs, ...expenseAccs]));

    const nodes = [
      ...incomeCats.map((name, i) => ({ 
        name, 
        color: `hsl(${(i * 137.5) % 360}, 70%, 60%)` 
      })),
      ...allAccs.map((name, i) => ({
        name,
        color: `hsl(${(i * 90 + 200) % 360}, 60%, 50%)`
      })),
      ...expenseCats.map((name, i) => ({ 
        name, 
        color: `hsl(${(i * 137.5 + 180) % 360}, 70%, 50%)` 
      })),
      { name: 'Savings', color: 'var(--signal)' }
    ];

    const links: { source: number; target: number; value: number }[] = [];
    const accStartIdx = incomeCats.length;
    const expStartIdx = accStartIdx + allAccs.length;
    const savingsIdx = nodes.length - 1;

    // Map: Category -> Account -> Value
    const incomeMap: Record<string, Record<string, number>> = {};
    aggregatedEntries.forEach(e => {
      const cat = e.income_categories?.name || 'Uncategorized';
      const acc = accounts.find(a => a.id === e.account_id)?.name || 'Other Account';
      if (!incomeMap[cat]) incomeMap[cat] = {};
      incomeMap[cat][acc] = (incomeMap[cat][acc] || 0) + toUSD(e.amount, e.currency || 'USD');
    });

    // Map: Account -> Category -> Value
    const expenseMap: Record<string, Record<string, number>> = {};
    aggregatedExpenses.forEach(e => {
      const acc = accounts.find(a => a.id === e.account_id)?.name || 'Other Account';
      const cat = e.expense_categories?.name || 'Uncategorized';
      if (!expenseMap[acc]) expenseMap[acc] = {};
      expenseMap[acc][cat] = (expenseMap[acc][cat] || 0) + toUSD(e.amount, e.currency || 'USD');
    });

    // Income Category -> Account links
    Object.entries(incomeMap).forEach(([cat, accs]) => {
      const catIdx = incomeCats.indexOf(cat);
      Object.entries(accs).forEach(([acc, val]) => {
        const accIdx = accStartIdx + allAccs.indexOf(acc);
        links.push({ source: catIdx, target: accIdx, value: val });
      });
    });

    // Account -> Expense Category links
    Object.entries(expenseMap).forEach(([acc, cats]) => {
      const accIdx = accStartIdx + allAccs.indexOf(acc);
      Object.entries(cats).forEach(([cat, val]) => {
        const catIdx = expStartIdx + expenseCats.indexOf(cat);
        links.push({ source: accIdx, target: catIdx, value: val });
      });
    });

    // Account -> Savings links (if total income in account > total expense in account)
    allAccs.forEach(acc => {
      const accIdx = accStartIdx + allAccs.indexOf(acc);
      const accIncome = Object.values(incomeMap).reduce((sum, accs) => sum + (accs[acc] || 0), 0);
      const accExpense = expenseMap[acc] ? Object.values(expenseMap[acc]).reduce((sum, v) => sum + v, 0) : 0;
      const accSavings = Math.max(0, accIncome - accExpense);
      if (accSavings > 0) {
        links.push({ source: accIdx, target: savingsIdx, value: accSavings });
      }
    });

    return { nodes, links };
  }, [filteredEntries, filteredExpenses, accounts, toUSD, aggregation]);




  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    if (!selectedNode) return [];
    
    // Check if the selected node is an account
    const isAccount = accounts.some(a => a.name === selectedNode);
    const isSavings = selectedNode === 'Savings';

    if (isAccount) {
      const account = accounts.find(a => a.name === selectedNode);
      const inc = entries.filter(e => e.account_id === account?.id).map(e => ({ ...e, type: 'income' as const }));
      const exp = expenses.filter(e => e.account_id === account?.id).map(e => ({ ...e, type: 'expense' as const }));
      return [...inc, ...exp].sort((a, b) => b.date.localeCompare(a.date));
    }

    if (isSavings) {
      return entries.map(e => ({ ...e, type: 'income' as const }));
    }

    const filteredIncome = entries.filter(e => (e.income_categories?.name || 'Uncategorized') === selectedNode);
    const filteredExpenses = expenses.filter(e => (e.expense_categories?.name || 'Uncategorized') === selectedNode);
    return [
      ...filteredIncome.map(e => ({ ...e, type: 'income' as const })),
      ...filteredExpenses.map(e => ({ ...e, type: 'expense' as const }))
    ].sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedNode, entries, expenses, accounts]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-foreground">
            Dashboard
          </h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{profile?.email}</p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setViewCurrency(prev => prev === "USD" ? "KHR" : "USD")}
          className="text-[10px] h-7 uppercase font-bold tracking-wider"
        >
          View in: {viewCurrency === "USD" ? "KHR" : "USD"}
        </Button>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border/50 shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5 p-1 bg-muted/30 rounded-lg shrink-0">
            {(['daily', 'weekly', 'monthly', 'yearly', 'all-time'] as const).map((a) => (
              <Button
                key={a}
                variant={aggregation === a && !showCustomDates ? "secondary" : "ghost"}
                size="sm"
                className={`text-[10px] uppercase font-bold px-4 h-8 rounded-md transition-all ${
                  aggregation === a && !showCustomDates ? "shadow-sm" : "hover:bg-muted/50"
                }`}
                onClick={() => {
                  setAggregation(a as any);
                  setShowCustomDates(false);
                  const now = new Date();
                  if (a === 'daily') setDateFilter({ start: format(startOfToday(), 'yyyy-MM-dd'), end: format(endOfToday(), 'yyyy-MM-dd') });
                  if (a === 'weekly') setDateFilter({ start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd') });
                  if (a === 'monthly') setDateFilter({ start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') });
                  if (a === 'yearly') setDateFilter({ start: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'), end: format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd') });
                  if (a === 'all-time') setDateFilter(null);
                }}
              >
                {a.replace('-', ' ')}
              </Button>
            ))}
            <Button 
              variant={showCustomDates ? "secondary" : "ghost"}
              size="sm" 
              className={`text-[10px] uppercase font-bold px-4 h-8 rounded-md transition-all ${
                showCustomDates ? "shadow-sm" : "hover:bg-muted/50"
              }`}
              onClick={() => setShowCustomDates(!showCustomDates)}
            >
              Custom
            </Button>
          </div>
          
          {(dateFilter || showCustomDates) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => {
                setDateFilter(null);
                setShowCustomDates(false);
                setAggregation('daily');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showCustomDates && (
          <div className="flex flex-col sm:flex-row gap-3 items-end border-t border-border/50 pt-3 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid gap-1.5 w-full sm:flex-1">
              <Label htmlFor="start-date" className="text-[9px] uppercase font-black text-muted-foreground/70 tracking-tighter">Start Range</Label>
              <Input 
                id="start-date" 
                type="date" 
                className="h-9 text-xs px-3 bg-muted/20 border-border/40 focus:border-primary/50 transition-colors"
                value={dateFilter?.start || ''}
                onChange={(e) => setDateFilter(prev => ({ start: e.target.value, end: prev?.end || '' }))}
              />
            </div>
            <div className="grid gap-1.5 w-full sm:flex-1">
              <Label htmlFor="end-date" className="text-[9px] uppercase font-black text-muted-foreground/70 tracking-tighter">End Range</Label>
              <Input 
                id="end-date" 
                type="date" 
                className="h-9 text-xs px-3 bg-muted/20 border-border/40 focus:border-primary/50 transition-colors"
                value={dateFilter?.end || ''}
                onChange={(e) => setDateFilter(prev => ({ end: e.target.value, start: prev?.start || '' }))}
              />
            </div>
          </div>
        )}
      </div>




      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.label.includes('Income') ? 'text-signal' : stat.label.includes('Expense') ? 'text-ember' : 'text-mint'}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold tabular-nums ${stat.label.includes('Income') ? 'text-signal' : stat.label.includes('Expense') ? 'text-ember' : 'text-mint'}`}>
                {viewCurrency === "USD" ? `$${stat.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `៛${stat.khr.toLocaleString()}`}
              </p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Available Funds</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-primary">
              {viewCurrency === "USD" 
                ? `$${accounts.reduce((sum: number, acc: any) => {
                    const accountIncome = entries?.filter((e: any) => e.account_id === acc.id)
                      .reduce((s: number, e: any) => s + (e.currency === 'USD' ? e.amount : e.amount / rate), 0) || 0;
                    const accountExpense = expenses?.filter((e: any) => e.account_id === acc.id)
                      .reduce((s: number, e: any) => s + (e.currency === 'USD' ? e.amount : e.amount / rate), 0) || 0;
                    const balance = (Number(acc.initial_balance) || 0) + accountIncome - accountExpense;
                    return sum + (acc.currency === 'USD' ? balance : balance / rate);
                  }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : `៛${accounts.reduce((sum: number, acc: any) => {
                    const accountIncome = entries?.filter((e: any) => e.account_id === acc.id)
                      .reduce((s: number, e: any) => s + (e.currency === 'KHR' ? e.amount : e.amount * rate), 0) || 0;
                    const accountExpense = expenses?.filter((e: any) => e.account_id === acc.id)
                      .reduce((s: number, e: any) => s + (e.currency === 'KHR' ? e.amount : e.amount * rate), 0) || 0;
                    const balance = (Number(acc.initial_balance) || 0) + accountIncome - accountExpense;
                    return sum + (acc.currency === 'KHR' ? balance : balance * rate);
                  }, 0).toLocaleString()}`}
            </p>
          </CardContent>
        </Card>
      </div>


      <Card className="w-full">
        <Tabs defaultValue="recent" className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex flex-col space-y-1.5">
              <CardTitle className="text-sm font-black uppercase tracking-tighter">Finance Schedules</CardTitle>
            </div>
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="recent" className="text-[10px] uppercase font-black">
                <History className="h-3 w-3 mr-1.5" />
                Recent Income
              </TabsTrigger>
              <TabsTrigger value="recurring" className="text-[10px] uppercase font-black">
                <Clock className="h-3 w-3 mr-1.5" />
                Recurring
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="recent" className="mt-0">
              <div className="space-y-3">
                {entries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="font-bold text-xs uppercase tracking-tight truncate">
                        {entry.income_categories?.name || "Uncategorized"}
                        {entry.income_sub_categories?.name && (
                          <span className="text-[10px] text-muted-foreground ml-2 normal-case font-normal">
                            — {entry.income_sub_categories.name}
                          </span>
                        )}
                      </p>
                      <p className="text-[9px] text-muted-foreground uppercase font-mono">{entry.date}</p>
                    </div>
                    <p className="font-mono text-xs font-black text-signal">
                      +{entry.currency === 'KHR' ? '៛' : '$'}{entry.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
                {entries.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground uppercase py-8 font-bold">No recent entries</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="recurring" className="mt-0">
              <div className="space-y-3">
                {recurring.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="font-bold text-xs uppercase tracking-tight truncate">
                        {item.income_categories?.name || "Uncategorized"}
                        {item.income_sub_categories?.name && (
                          <span className="text-[10px] text-muted-foreground ml-2 normal-case font-normal">
                            — {item.income_sub_categories.name}
                          </span>
                        )}
                      </p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold italic">{item.frequency}</p>
                    </div>
                    <p className="font-mono text-xs font-black text-signal">
                      {item.currency === 'KHR' ? '៛' : '$'}{item.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
                {recurring.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground uppercase py-8 font-bold">No recurring schedules</p>
                )}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-tighter">Cash Flow</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 overflow-x-auto">
            <div className="min-w-[600px] sm:min-w-0">
              <SankeyFlow 
                data={sankeyData} 
                onNodeClick={(node) => setSelectedNode(node.name)} 
                selectedNode={selectedNode}
                currency={viewCurrency}
                exchangeRate={rate}
              />
            </div>
          </CardContent>
        </Card>

      </div>

      {selectedNode && (
        <Drawer open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
          <DrawerContent className="max-h-[85dvh]">
            <div className="flex flex-col h-full overflow-hidden">
              <DrawerHeader className="border-b">
                <DrawerTitle className="text-xl font-black uppercase tracking-tighter">
                  Transactions: {selectedNode}
                </DrawerTitle>
                <DrawerDescription className="text-[10px] uppercase font-bold tracking-widest">Detailed history for this node</DrawerDescription>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredTransactions.map((tx: any, idx) => (
                  <div key={`${tx.id}-${idx}`} className="flex items-center justify-between border-b border-border/50 pb-2">
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="font-bold text-xs uppercase tracking-tight truncate">
                        {tx.description || (tx.type === 'income' ? tx.income_categories?.name : tx.expense_categories?.name)}
                      </p>
                      <p className="text-[9px] text-muted-foreground uppercase font-mono">{tx.date}</p>
                    </div>
                    <p className={`font-mono text-xs font-black ${tx.type === 'income' ? 'text-signal' : 'text-ember'}`}>
                      {tx.type === 'income' ? '+' : '-'}{tx.currency === 'KHR' ? '៛' : '$'}{tx.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
                {filteredTransactions.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground uppercase py-8 font-bold">No transactions found</p>
                )}
              </div>
              <DrawerFooter className="pb-safe">
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full text-xs font-bold uppercase">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
