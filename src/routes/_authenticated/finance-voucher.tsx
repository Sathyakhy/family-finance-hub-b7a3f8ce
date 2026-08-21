import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useRef, useEffect } from "react";
import { getVouchers } from "@/lib/vouchers.functions";
import { getGeneralSettings } from "@/lib/settings.functions";
import { 
  getExchangeRates, 
  getAccounts, 
  getIncomeCategories, 
  getExpenseCategories,
  logIncome,
  logExpense,
  updateIncomeEntry,
  updateExpenseEntry,
  deleteIncomeEntry,
  deleteExpenseEntry 
} from "@/lib/finance.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Wallet, TrendingDown, FileText, Search, Info, X, Plus, Loader2, Trash2 } from "lucide-react";
import { subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, format, addMonths, subMonths, addYears, subYears, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/finance-voucher")({
  loader: async ({ context }) => {
    // Prefetch common data
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["general-settings"],
        queryFn: () => getGeneralSettings(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["exchange-rates"],
        queryFn: () => getExchangeRates(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["accounts"],
        queryFn: () => getAccounts(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["income-categories"],
        queryFn: () => getIncomeCategories(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["expense-categories"],
        queryFn: () => getExpenseCategories(),
      }),
    ]);
  },
  component: TransactionVoucherPage,
});

type TabType = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

function TransactionVoucherPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('Monthly');
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: settings } = useSuspenseQuery({
    queryKey: ["general-settings"],
    queryFn: () => getGeneralSettings(),
  });

  const { data: exchangeRates } = useSuspenseQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => getExchangeRates(),
  });

  const { data: accounts } = useSuspenseQuery({
    queryKey: ["accounts"],
    queryFn: () => getAccounts(),
  });

  const { data: incomeCategories } = useSuspenseQuery({
    queryKey: ["income-categories"],
    queryFn: () => getIncomeCategories(),
  });

  const { data: expenseCategories } = useSuspenseQuery({
    queryKey: ["expense-categories"],
    queryFn: () => getExpenseCategories(),
  });

  const quickAddMutation = useMutation({
    mutationFn: async (variables: { type: 'income' | 'expense'; data: any }) => {
      if (variables.type === 'income') {
        return logIncome({ data: variables.data });
      } else {
        return logExpense({ data: variables.data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast.success("Transaction added successfully");
      setIsQuickAddOpen(false);
      resetQuickAddForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add transaction");
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: async (variables: { type: 'income' | 'expense'; data: any }) => {
      if (variables.type === 'income') {
        return updateIncomeEntry({ data: variables.data });
      } else {
        return updateExpenseEntry({ data: variables.data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast.success("Transaction updated successfully");
      setIsEditing(false);
      setSelectedVoucher(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update transaction");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (variables: { type: 'income' | 'expense'; id: string }) => {
      if (variables.type === 'income') {
        return deleteIncomeEntry({ data: { id: variables.id } });
      } else {
        return deleteExpenseEntry({ data: { id: variables.id } });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast.success("Transaction deleted successfully");
      setSelectedVoucher(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete transaction");
    }
  });

  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (selectedVoucher && isEditing) {
      setEditForm({
        amount: selectedVoucher.amount.toString(),
        currency: selectedVoucher.currency,
        category_id: (selectedVoucher.type === 'income' ? incomeCategories : expenseCategories).find((c: any) => c.name === selectedVoucher.category)?.id || "",
        sub_category_id: (selectedVoucher.type === 'income' ? incomeCategories : expenseCategories)
          .flatMap((c: any) => (selectedVoucher.type === 'income' ? c.income_sub_categories : c.expense_sub_categories) || [])
          .find((s: any) => s.name === selectedVoucher.subCategory)?.id || "none",
        account_id: accounts.find(a => a.name === selectedVoucher.account)?.id || "",
        date: selectedVoucher.date,
        description: selectedVoucher.description || ""
      });
    }
  }, [selectedVoucher, isEditing, incomeCategories, expenseCategories, accounts]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.amount) return;
    updateMutation.mutate({
      type: selectedVoucher.type,
      data: {
        id: selectedVoucher.id,
        amount: parseFloat(editForm.amount),
        category_id: editForm.category_id || null,
        sub_category_id: (editForm.sub_category_id && editForm.sub_category_id !== "none") ? editForm.sub_category_id : null,
        account_id: editForm.account_id || null,
        date: editForm.date,
        description: editForm.description,
        currency: editForm.currency
      }
    });
  };

  // Quick Add Form State
  const [qaType, setQaType] = useState<'income' | 'expense'>('expense');
  const [qaAmount, setQaAmount] = useState("");
  const [qaCurrency, setQaCurrency] = useState("USD");
  const [qaCategoryId, setQaCategoryId] = useState("");
  const [qaSubCategoryId, setQaSubCategoryId] = useState("");
  const [qaAccountId, setQaAccountId] = useState("");
  const [qaDate, setQaDate] = useState(new Date().toISOString().split("T")[0]);
  const [qaDescription, setQaDescription] = useState("");

  const resetQuickAddForm = () => {
    setQaAmount("");
    setQaCategoryId("");
    setQaSubCategoryId("");
    setQaDescription("");
    setQaDate(new Date().toISOString().split("T")[0]);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaAmount) {
      toast.error("Amount is required");
      return;
    }
    
    quickAddMutation.mutate({
      type: qaType,
      data: {
        amount: parseFloat(qaAmount),
        category_id: qaCategoryId || undefined,
        sub_category_id: (qaSubCategoryId && qaSubCategoryId !== "none") ? qaSubCategoryId : undefined,
        account_id: qaAccountId || undefined,
        date: qaDate,
        description: qaDescription,
        currency: qaCurrency
      }
    });
  };

  const rate = exchangeRates?.[0]?.rate || 4000;
  const startDay = settings?.month_start_day || 1;

  const dateRange = useMemo(() => {
    let start: Date;
    let end: Date;

    if (activeTab === 'Daily') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else if (activeTab === 'Weekly') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else if (activeTab === 'Monthly') {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), startDay);
      if (currentDate.getDate() < startDay) {
        start = subMonths(start, 1);
      }
      end = subDays(addMonths(start, 1), 1);
    } else {
      start = startOfYear(currentDate);
      end = endOfYear(currentDate);
    }

    return { 
      start: format(start, 'yyyy-MM-dd'), 
      end: format(end, 'yyyy-MM-dd'),
      display: `${format(start, 'dd-MMM')} ~ ${format(end, 'dd-MMM yyyy')}`
    };
  }, [currentDate, activeTab, startDay]);

  const { data: vouchers, isLoading, error } = useSuspenseQuery({
    queryKey: ["vouchers", dateRange.start, dateRange.end],
    queryFn: () => getVouchers({ data: { startDate: dateRange.start, endDate: dateRange.end } }),
  });

  const groupedVouchers = useMemo(() => {
    if (!vouchers) return [];
    
    // Filter first
    const filtered = vouchers.filter(v => {
      const matchesSearch = !searchQuery || 
        v.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.subCategory?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAccount = filterAccount === 'all' || v.account === filterAccount;
      const matchesCategory = filterCategory === 'all' || (v.category || 'uncategorized') === filterCategory;
      
      return matchesSearch && matchesAccount && matchesCategory;
    });

    // Group by date
    const groups: { [key: string]: { date: Date, income: number, expense: number, items: any[] } } = {};
    
    filtered.forEach(v => {
      const dateKey = v.date;
      if (!groups[dateKey]) {
        groups[dateKey] = { date: new Date(v.date), income: 0, expense: 0, items: [] };
      }
      
      const amtUSD = v.currency === 'KHR' ? v.amount / rate : v.amount;
      if (v.type === 'income') groups[dateKey].income += amtUSD;
      else groups[dateKey].expense += amtUSD;
      
      groups[dateKey].items.push(v);
    });

    return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [vouchers, searchQuery, filterAccount, filterCategory, rate]);

  const uniqueCategories = useMemo(() => {
    if (!vouchers) return [];
    const cats = new Set(vouchers.map(v => v.category || 'uncategorized'));
    return Array.from(cats).sort() as string[];
  }, [vouchers]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    groupedVouchers.forEach(group => {
      income += group.income;
      expense += group.expense;
    });
    return { income, expense, total: income - expense };
  }, [groupedVouchers]);

  const handlePrev = () => {
    if (activeTab === 'Monthly') setCurrentDate(subMonths(currentDate, 1));
    else if (activeTab === 'Yearly') setCurrentDate(subYears(currentDate, 1));
    else if (activeTab === 'Daily') setCurrentDate(subMonths(currentDate, 1));
    else if (activeTab === 'Weekly') setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNext = () => {
    if (activeTab === 'Monthly') setCurrentDate(addMonths(currentDate, 1));
    else if (activeTab === 'Yearly') setCurrentDate(addYears(currentDate, 1));
    else if (activeTab === 'Daily') setCurrentDate(addMonths(currentDate, 1));
    else if (activeTab === 'Weekly') setCurrentDate(addWeeks(currentDate, 1));
  };

  const frozenRef = useRef<HTMLDivElement>(null);
  const [frozenHeight, setFrozenHeight] = useState(0);

  useEffect(() => {
    const el = frozenRef.current;
    if (!el) return;
    const update = () => {
      const stickyOffset = window.innerWidth >= 1024 ? 32 : 16;
      setFrozenHeight(Math.max(0, Math.round(el.getBoundingClientRect().height) - stickyOffset));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // Persist / restore scroll position of the page scroll container
  const scrollRestored = useRef(false);
  useEffect(() => {
    const el = frozenRef.current?.closest('main') as HTMLElement | null;
    if (!el) return;

    if (!scrollRestored.current) {
      scrollRestored.current = true;
      const saved = sessionStorage.getItem('voucher-scroll');
      if (saved) {
        const y = Number(saved);
        if (!Number.isNaN(y)) {
          requestAnimationFrame(() => requestAnimationFrame(() => { el.scrollTop = y; }));
        }
      }
    }

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => sessionStorage.setItem('voucher-scroll', String(el.scrollTop)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', onScroll);
    };
  }, [isLoading]);


  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <X className="h-10 w-10 text-destructive mb-4" />
        <h3 className="text-lg font-black uppercase italic tracking-tighter">Failed to load data</h3>
        <p className="text-xs text-muted-foreground mt-2 max-w-[250px] mx-auto uppercase font-bold tracking-tight">
          There was an error connecting to the database. Please try refreshing.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div
        ref={frozenRef}
        className="sticky -top-4 z-30 bg-background/95 backdrop-blur-md space-y-1.5 -mx-4 -mt-4 px-4 pt-4 pb-2 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8 lg:-top-8"
      >
        {/* Date Range + Tabs wrapper */}
        <div className="space-y-1.5 p-1 bg-muted/20 rounded-lg">
          {/* Date Range Selector */}
          <div className="flex items-center justify-between px-1 py-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-[11px] font-black uppercase tracking-widest italic">
              {dateRange.display}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* View Tabs */}
          <div className="grid grid-cols-4 gap-1">
            {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-1 text-[9px] font-black uppercase tracking-widest rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-3 gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="SEARCH" 
              className="pl-7 pr-1 text-[9px] font-black uppercase tracking-tight h-8 placeholder:text-muted-foreground/30 bg-muted/20 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="h-8 text-[9px] font-black uppercase tracking-tighter bg-muted/20 border-none">
              <SelectValue placeholder="ALL ACCOUNTS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL ACCOUNTS</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.name}>{acc.name.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 text-[9px] font-black uppercase tracking-tighter bg-muted/20 border-none">
              <SelectValue placeholder="ALL CATEGORIES" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL CATEGORIES</SelectItem>
              {uniqueCategories.map(cat => (
                <SelectItem key={cat || 'uncategorized'} value={cat || 'uncategorized'}>{(cat || 'UNCATEGORIZED').toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/40">
          <div className="text-center">
            <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest leading-tight">Income</p>
            <p className="text-xs font-black text-signal tabular-nums leading-tight">${totals.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-center border-x border-border/40">
            <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest leading-tight">Expense</p>
            <p className="text-xs font-black text-ember tabular-nums leading-tight">${totals.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest leading-tight">Total</p>
            <p className="text-xs font-black text-foreground tabular-nums leading-tight">${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        {isLoading ? (
          <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-2 border rounded-md space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
          </div>
        ) : groupedVouchers.length > 0 ? (
          groupedVouchers.map((group) => (
            <div key={group.date.toISOString()} className="border-t-4 border-muted/40 first:border-t-0">
              <div
                className="sticky z-20 flex items-center justify-between bg-group px-1 py-1 border-b border-border"
                style={{ top: frozenHeight }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black italic tracking-tighter tabular-nums leading-none">{format(group.date, 'dd')}</span>
                  <span className="text-[7px] font-black uppercase tracking-widest bg-muted-foreground/20 px-1 rounded-sm leading-tight">{format(group.date, 'eee')}</span>
                  <span className="text-[8px] font-bold text-muted-foreground/60 leading-tight">{format(group.date, 'MM/yyyy')}</span>
                </div>
                <div className="flex gap-3 text-[10px] font-bold tracking-tight">
                  <span className="text-signal tabular-nums">$ {group.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  <span className="text-ember tabular-nums">$ {group.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div>
                {group.items.map((voucher: any) => (
                  <div 
                    key={voucher.id} 
                    className="flex items-center justify-between px-1 py-1.5 active:bg-accent/50 transition-colors cursor-pointer border-b border-muted/30 last:border-0"
                    onClick={() => setSelectedVoucher(voucher)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <div className="flex flex-col min-w-[60px]">
                        <span className="text-[9px] font-black uppercase tracking-tight truncate">{voucher.category || 'Other'}</span>
                        <span className="text-[7px] text-muted-foreground font-bold uppercase tracking-tighter truncate">
                          {voucher.subCategory || (voucher.type === 'income' ? 'Income' : 'Expense')}
                        </span>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[10px] font-bold tracking-tight break-words">
                          {voucher.description || voucher.account || 'Transaction'}
                        </span>
                        {voucher.description && voucher.account && (
                          <span className="text-[7px] text-muted-foreground font-bold uppercase tracking-tighter truncate">
                            {voucher.account}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-[11px] font-black tabular-nums ${
                        voucher.type === 'income' ? 'text-signal' : 'text-ember'
                      }`}>
                        {voucher.currency === 'KHR' ? 
                          `${voucher.amount.toLocaleString()}៛` : 
                          `$ ${voucher.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
            <p className="text-muted-foreground uppercase text-[9px] font-black tracking-widest">
              {searchQuery || filterAccount !== 'all' || filterCategory !== 'all' ? 'No matching results' : 'No transactions for this period'}
            </p>
          </div>
        )}
      </div>

      {/* Transaction Details Drawer */}
      <Drawer open={!!selectedVoucher} onOpenChange={(open) => {
        if (!open) {
          setSelectedVoucher(null);
          setIsEditing(false);
        }
      }}>
        <DrawerContent className="px-6 pb-12 max-w-lg mx-auto max-h-[90dvh] overflow-y-auto">
          <DrawerHeader className="px-0 text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                  selectedVoucher?.type === 'income' ? 'bg-signal/10 text-signal' : 'bg-ember/10 text-ember'
                }`}>
                  {selectedVoucher?.type === 'income' ? <Wallet className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </div>
                <DrawerTitle className="text-xl font-black uppercase italic tracking-tighter">
                  {isEditing ? 'Edit Transaction' : 'Transaction Detail'}
                </DrawerTitle>
              </div>
              <div className="flex gap-2">
                {!isEditing && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setIsEditing(true)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm("Delete this transaction?")) {
                          deleteMutation.mutate({ type: selectedVoucher.type, id: selectedVoucher.id });
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </>
                )}
                {isEditing && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <DrawerDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Voucher ID: {selectedVoucher?.id?.split('-')[0]}
            </DrawerDescription>
          </DrawerHeader>

          {!isEditing ? (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Amount</p>
                  <p className={`text-2xl font-black tabular-nums ${
                    selectedVoucher?.type === 'income' ? 'text-signal' : 'text-ember'
                  }`}>
                    {selectedVoucher?.type === 'income' ? '+' : '-'}{selectedVoucher?.currency === 'KHR' ? '៛' : '$'}{selectedVoucher?.amount.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Date</p>
                  <p className="text-lg font-bold uppercase tracking-tight">
                    {selectedVoucher && format(new Date(selectedVoucher.date), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Category</p>
                  <p className="text-sm font-bold uppercase tracking-tight">
                    {selectedVoucher?.category || 'Uncategorized'}
                    {selectedVoucher?.subCategory && <span className="text-muted-foreground font-medium"> / {selectedVoucher.subCategory}</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Account</p>
                  <p className="text-sm font-bold uppercase tracking-tight">{selectedVoucher?.account || '-'}</p>
                </div>
              </div>

              {selectedVoucher?.description && (
                <div className="space-y-1 bg-muted/30 p-3 rounded-lg border border-dashed">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    <Info className="h-3 w-3" /> Notes
                  </p>
                  <p className="text-xs italic font-medium leading-relaxed">{selectedVoucher.description}</p>
                </div>
              )}

              <DrawerClose asChild>
                <Button className="w-full font-black uppercase tracking-widest italic h-12">Close</Button>
              </DrawerClose>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</Label>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <Select value={editForm.currency} onValueChange={(v) => setEditForm({...editForm, currency: v})}>
                    <SelectTrigger className="h-9 text-[10px] font-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="KHR">KHR</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-9 text-sm font-bold w-full"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                  <Select 
                    value={editForm.category_id} 
                    onValueChange={(val) => setEditForm({...editForm, category_id: val, sub_category_id: "none"})}
                  >
                    <SelectTrigger className="h-9 text-[10px] font-black">
                      <SelectValue placeholder="SELECT" />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedVoucher.type === 'income' ? incomeCategories : expenseCategories).map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sub-cat</Label>
                  <Select 
                    value={editForm.sub_category_id} 
                    onValueChange={(val) => setEditForm({...editForm, sub_category_id: val})}
                    disabled={!editForm.category_id}
                  >
                    <SelectTrigger className="h-9 text-[10px] font-black">
                      <SelectValue placeholder="NONE" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">NONE</SelectItem>
                      {(() => {
                        const cat: any = (selectedVoucher.type === 'income' ? incomeCategories : expenseCategories)
                          .find((c: any) => c.id === editForm.category_id);
                        const subKey = selectedVoucher.type === 'income' ? 'income_sub_categories' : 'expense_sub_categories';
                        return cat?.[subKey]?.map((sub: any) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name.toUpperCase()}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account</Label>
                  <Select value={editForm.account_id} onValueChange={(val) => setEditForm({...editForm, account_id: val})}>
                    <SelectTrigger className="h-9 text-[10px] font-black">
                      <SelectValue placeholder="SELECT" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</Label>
                  <Input
                    type="date"
                    className="h-9 text-[10px] font-black"
                    value={editForm.date}
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                <Input
                  placeholder="OPTIONAL DESCRIPTION"
                  className="h-9 text-[10px] font-black uppercase"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 font-black uppercase tracking-widest"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 font-black uppercase italic tracking-widest" 
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            </form>
          )}
        </DrawerContent>
      </Drawer>
      
      <FloatingActionButton onClick={() => setIsQuickAddOpen(true)} />

      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">Add Transaction</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              QUICK LOG INCOME OR EXPENSE
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickAdd} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2 bg-muted/30 p-1 rounded-md border mb-4">
              <button
                type="button"
                onClick={() => setQaType('expense')}
                className={`py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-all ${
                  qaType === 'expense' ? 'bg-ember text-white shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setQaType('income')}
                className={`py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-all ${
                  qaType === 'income' ? 'bg-signal text-white shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Income
              </button>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="qa-amount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</Label>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <Select value={qaCurrency} onValueChange={setQaCurrency}>
                    <SelectTrigger className="h-9 text-[10px] font-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="KHR">KHR</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="qa-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="h-9 text-sm font-bold w-full"
                    value={qaAmount}
                    onChange={(e) => setQaAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qa-category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                  <Select value={qaCategoryId} onValueChange={(val) => { setQaCategoryId(val); setQaSubCategoryId(""); }}>
                    <SelectTrigger className="h-9 text-[10px] font-black">
                      <SelectValue placeholder="SELECT" />
                    </SelectTrigger>
                    <SelectContent>
                      {(qaType === 'income' ? incomeCategories : expenseCategories).map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qa-sub-category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sub-cat</Label>
                  <Select value={qaSubCategoryId} onValueChange={setQaSubCategoryId} disabled={!qaCategoryId}>
                    <SelectTrigger className="h-9 text-[10px] font-black">
                      <SelectValue placeholder="NONE" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">NONE</SelectItem>
                      {qaType === 'income' ? (
                        (incomeCategories as any[]).find(c => c.id === qaCategoryId)
                          ?.income_sub_categories?.map((sub: any) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.name.toUpperCase()}
                            </SelectItem>
                          ))
                      ) : (
                        (expenseCategories as any[]).find(c => c.id === qaCategoryId)
                          ?.expense_sub_categories?.map((sub: any) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.name.toUpperCase()}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qa-account" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account</Label>
                  <Select value={qaAccountId} onValueChange={setQaAccountId}>
                    <SelectTrigger id="qa-account" className="h-9 text-[10px] font-black">
                      <SelectValue placeholder="SELECT" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qa-date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</Label>
                  <Input
                    id="qa-date"
                    type="date"
                    className="h-9 text-[10px] font-black"
                    value={qaDate}
                    onChange={(e) => setQaDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qa-description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                <Input
                  id="qa-description"
                  placeholder="OPTIONAL DESCRIPTION"
                  className="h-9 text-[10px] font-black uppercase"
                  value={qaDescription}
                  onChange={(e) => setQaDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full font-black uppercase italic tracking-widest" disabled={quickAddMutation.isPending}>
                {quickAddMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Confirm Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

