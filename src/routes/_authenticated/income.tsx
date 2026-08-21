import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getIncomeCategories, 
  getIncomeEntries, 
  getRecurringIncomes, 
  logIncome, 
  setRecurringIncome,
  updateIncomeEntry,
  deleteIncomeEntry,
  updateRecurringIncome,
  deleteRecurringIncome,
  getIncomeSubCategories,
  getAccounts
} from "@/lib/finance.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Calendar, Pencil, Trash2, Info, Upload } from "lucide-react";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export const Route = createFileRoute("/_authenticated/income")({
  loader: async ({ context }) => {
    const categoriesFn = getIncomeCategories;
    const entriesFn = getIncomeEntries;
    const recurringFn = getRecurringIncomes;
    const accountsFn = getAccounts;
    
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["income-categories"],
        queryFn: () => categoriesFn(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["income-entries"],
        queryFn: () => entriesFn(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["recurring-incomes"],
        queryFn: () => recurringFn(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["accounts"],
        queryFn: () => accountsFn(),
      }),
    ]);
  },
  component: IncomePage,
});

function IncomePage() {
  const queryClient = useQueryClient();
  const { data: categories } = useSuspenseQuery({
    queryKey: ["income-categories"],
    queryFn: () => getIncomeCategories(),
    refetchOnWindowFocus: true,
  });
  const { data: entries } = useSuspenseQuery({
    queryKey: ["income-entries"],
    queryFn: () => getIncomeEntries(),
    refetchOnWindowFocus: true,
  });
  const { data: recurring } = useSuspenseQuery({
    queryKey: ["recurring-incomes"],
    queryFn: () => getRecurringIncomes(),
    refetchOnWindowFocus: true,
  });
  const { data: accounts } = useSuspenseQuery({
    queryKey: ["accounts"],
    queryFn: () => getAccounts(),
    refetchOnWindowFocus: true,
  });

  const logIncomeMutation = useMutation({
    mutationFn: (variables: { data: any }) => logIncome(variables),
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: ["income-entries"] });
      const previousEntries = queryClient.getQueryData(["income-entries"]);
      queryClient.setQueryData(["income-entries"], (old: any) => [
        { 
          id: 'temp-' + Date.now(), 
          ...newEntry.data,
          income_categories: categories?.find((c: any) => c.id === newEntry.data.category_id),
          income_sub_categories: categories?.find((c: any) => c.id === newEntry.data.category_id)?.income_sub_categories?.find((s: any) => s.id === newEntry.data.sub_category_id),
          accounts: accounts?.find((a: any) => a.id === newEntry.data.account_id)
        },
        ...(old || [])
      ]);
      return { previousEntries };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["income-entries"], (context as any)?.previousEntries);
      toast.error(err.message || "Failed to log income");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Income logged successfully");
    },
  });

  const setRecurringMutation = useMutation({
    mutationFn: (variables: { data: any }) => setRecurringIncome(variables),
    onMutate: async (newRecurring) => {
      await queryClient.cancelQueries({ queryKey: ["recurring-incomes"] });
      const previousRecurring = queryClient.getQueryData(["recurring-incomes"]);
      queryClient.setQueryData(["recurring-incomes"], (old: any) => [
        { 
          id: 'temp-' + Date.now(), 
          ...newRecurring.data,
          currency: newRecurring.data.currency || 'USD',
          income_categories: categories?.find((c: any) => c.id === newRecurring.data.category_id),
          income_sub_categories: categories?.find((c: any) => c.id === newRecurring.data.category_id)?.income_sub_categories?.find((s: any) => s.id === newRecurring.data.sub_category_id),
          accounts: accounts?.find((a: any) => a.id === newRecurring.data.account_id)
        },
        ...(old || [])
      ]);
      return { previousRecurring };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["recurring-incomes"], (context as any)?.previousRecurring);
      toast.error(err.message || "Failed to set recurring income");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-incomes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Recurring income set successfully");
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: (variables: { data: any }) => updateIncomeEntry({ data: variables.data }),
    onMutate: async (updatedEntry) => {
      await queryClient.cancelQueries({ queryKey: ["income-entries"] });
      const previousEntries = queryClient.getQueryData(["income-entries"]);
      queryClient.setQueryData(["income-entries"], (old: any) => 
        old?.map((e: any) => e.id === updatedEntry.data.id ? { ...e, ...updatedEntry.data } : e)
      );
      return { previousEntries };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["income-entries"], (context as any)?.previousEntries);
      toast.error(err.message || "Failed to update entry");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Entry updated");
      setEditingEntry(null);
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (variables: { data: { id: string } }) => deleteIncomeEntry({ data: variables.data }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["income-entries"] });
      const previousEntries = queryClient.getQueryData(["income-entries"]);
      queryClient.setQueryData(["income-entries"], (old: any) => 
        old?.filter((e: any) => e.id !== variables.data.id)
      );
      return { previousEntries };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["income-entries"], (context as any)?.previousEntries);
      toast.error(err.message || "Failed to delete entry");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Entry deleted");
    },
  });

  const updateRecurringMutation = useMutation({
    mutationFn: (variables: { data: any }) => updateRecurringIncome({ data: variables.data }),
    onMutate: async (updatedRecurring) => {
      await queryClient.cancelQueries({ queryKey: ["recurring-incomes"] });
      const previousRecurring = queryClient.getQueryData(["recurring-incomes"]);
      queryClient.setQueryData(["recurring-incomes"], (old: any) => 
        old?.map((r: any) => r.id === updatedRecurring.data.id ? { ...r, ...updatedRecurring.data } : r)
      );
      return { previousRecurring };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["recurring-incomes"], (context as any)?.previousRecurring);
      toast.error(err.message || "Failed to update recurring income");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-incomes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Recurring schedule updated");
      setEditingRecurring(null);
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: (variables: { data: { id: string } }) => deleteRecurringIncome({ data: variables.data }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["recurring-incomes"] });
      const previousRecurring = queryClient.getQueryData(["recurring-incomes"]);
      queryClient.setQueryData(["recurring-incomes"], (old: any) => 
        old?.filter((r: any) => r.id !== variables.data.id)
      );
      return { previousRecurring };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["recurring-incomes"], (context as any)?.previousRecurring);
      toast.error(err.message || "Failed to delete recurring income");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-incomes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Recurring schedule deleted");
    },
  });

  const [currency, setCurrency] = useState("USD");
  const [recCurrency, setRecCurrency] = useState("USD");
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editingRecurring, setEditingRecurring] = useState<any>(null);

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  const [recAmount, setRecAmount] = useState("");
  const [recCategoryId, setRecCategoryId] = useState("");
  const [recSubCategoryId, setRecSubCategoryId] = useState("");
  const [recAccountId, setRecAccountId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [dayOfMonth, setDayOfMonth] = useState<string>("");
  const [autoLogEnabled, setAutoLogEnabled] = useState(false);
  

  const calculateEffectiveDate = (day: number) => {
    if (!day) return null;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0).getDate();
    let effectiveDay = Math.min(day, lastDay);
    
    let date = new Date(year, month, effectiveDay);
    
    // Move to Friday if weekend
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0) {
      date.setDate(date.getDate() - 2);
    } else if (dayOfWeek === 6) {
      date.setDate(date.getDate() - 1);
    }
    
    return date.toISOString().split('T')[0];
  };


  const handleLogIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      toast.error("Amount is required");
      return;
    }
    if (!date) {
      toast.error("Date is required");
      return;
    }
    try {
      await logIncomeMutation.mutateAsync({
        data: {
          amount: parseFloat(amount),
          category_id: categoryId || undefined,
          sub_category_id: (subCategoryId && subCategoryId !== "none") ? subCategoryId : undefined,
          account_id: accountId || undefined,
          date,
          description,
          currency
        },
      });
      setAmount("");
      setDescription("");
    } catch (err) {
      // Error handled by mutation onError
    }
  };

  const handleSetRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recAmount) {
      toast.error("Amount is required");
      return;
    }
    if (!startDate) {
      toast.error("Start date is required");
      return;
    }
    try {
      await setRecurringMutation.mutateAsync({
        data: {
          amount: parseFloat(recAmount),
          category_id: recCategoryId || undefined,
          sub_category_id: (recSubCategoryId && recSubCategoryId !== "none") ? recSubCategoryId : undefined,
          account_id: recAccountId || undefined,
          start_date: startDate,
          end_date: endDate || null,
          frequency: frequency as any,
          description,
          day_of_month: frequency === "monthly" && dayOfMonth ? parseInt(dayOfMonth) : null,
          auto_log_enabled: autoLogEnabled,
          currency: recCurrency
        },
      });
      setRecAmount("");
      setDayOfMonth("");
      setAutoLogEnabled(false);
    } catch (err) {
      // Error handled by mutation onError
    }
  };

  const prefetchData = (key: string) => {
    const fnMap: Record<string, any> = {
      "income-categories": getIncomeCategories,
      "income-entries": getIncomeEntries,
      "recurring-incomes": getRecurringIncomes,
      "accounts": getAccounts,
    };
    queryClient.invalidateQueries({ queryKey: [key] });
    queryClient.prefetchQuery({
      queryKey: [key],
      queryFn: () => fnMap[key](),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-foreground">Income</h2>
        <ExcelImportDialog kind="income" />
      </div>

      <Tabs defaultValue="log" className="space-y-4">
        <TabsList>
          <TabsTrigger value="log" onMouseEnter={() => {
            prefetchData("income-categories");
            prefetchData("accounts");
          }}>
            Log Manual
          </TabsTrigger>
          <TabsTrigger value="recurring" onMouseEnter={() => {
            prefetchData("income-categories");
            prefetchData("recurring-incomes");
            prefetchData("accounts");
          }}>
            Recurring Income
          </TabsTrigger>
          <TabsTrigger value="history" onMouseEnter={() => prefetchData("income-entries")}>
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <Card>
            <CardHeader>
              <CardTitle>Log Manual Income</CardTitle>
              <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70">Enter income received manually.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogIncome} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="flex gap-2">
                      <Select value={recCurrency} onValueChange={setRecCurrency}>
                        <SelectTrigger className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="KHR">KHR</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="flex-1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub-category">Sub-category</Label>
                    <Select value={subCategoryId} onValueChange={setSubCategoryId} disabled={!categoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub-category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Sub-category</SelectItem>
                        {categories.find(c => c.id === categoryId)?.income_sub_categories?.map((sub: any) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account">Account / Cash</Label>
                    <Select value={accountId} onValueChange={setAccountId}>
                      <SelectTrigger id="account">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc: any) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name} ({acc.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={logIncomeMutation.isPending}>
                  {logIncomeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Log Income
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle>Set Recurring Income</CardTitle>
              <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70">Setup automated income schedules.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetRecurring} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rec-amount">Amount</Label>
                    <div className="flex gap-2">
                      <Select value={recCurrency} onValueChange={setRecCurrency}>
                        <SelectTrigger className="w-[80px]">
                          <SelectValue defaultValue={recCurrency} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="KHR">KHR</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="rec-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="flex-1"
                        value={recAmount}
                        onChange={(e) => setRecAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rec-account">Account / Cash</Label>
                    <Select value={recAccountId} onValueChange={setRecAccountId}>
                      <SelectTrigger id="rec-account">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc: any) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name} ({acc.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rec-category">Category</Label>
                    <Select value={recCategoryId} onValueChange={setRecCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rec-sub-category">Sub-category</Label>
                    <Select value={recSubCategoryId} onValueChange={setRecSubCategoryId} disabled={!recCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub-category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Sub-category</SelectItem>
                        {categories.find(c => c.id === recCategoryId)?.income_sub_categories?.map((sub: any) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date (Optional)</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {frequency === "monthly" && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="day-of-month">Day of Month</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-xs">
                                  If the day falls on a weekend, it will move to the preceding Friday. 
                                  If the month is shorter (e.g., Feb 30th), it moves to the last day of the month.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          id="day-of-month"
                          type="number"
                          min="1"
                          max="31"
                          placeholder="e.g. 28"
                          value={dayOfMonth}
                          onChange={(e) => setDayOfMonth(e.target.value)}
                        />
                        {dayOfMonth && (
                          <p className="text-xs text-muted-foreground">
                            Effective date this month: {calculateEffectiveDate(parseInt(dayOfMonth))}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 pt-8">
                        <Checkbox 
                          id="auto-log" 
                          checked={autoLogEnabled} 
                          onCheckedChange={(checked) => setAutoLogEnabled(checked as boolean)}
                        />
                        <Label htmlFor="auto-log" className="text-sm font-medium leading-none cursor-pointer">
                          Auto-log on this day
                        </Label>
                      </div>
                    </>
                  )}
                </div>
                <Button type="submit" disabled={setRecurringMutation.isPending}>
                  {setRecurringMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
                  Set Schedule
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 mb-4">Active Schedules</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {recurring.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        {item.income_categories?.name || "Uncategorized"}
                        {item.income_sub_categories?.name && (
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            ({item.income_sub_categories.name})
                          </span>
                        )}
                      </CardTitle>
                      <div className="text-xs text-muted-foreground">
                        {item.accounts?.name || "No Account"}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingRecurring(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Stop this schedule?")) {
                              deleteRecurringMutation.mutate({ data: { id: item.id } });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70 capitalize">{item.frequency}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-baseline">
                      <p className="text-2xl font-bold text-signal">{item.currency === 'KHR' ? '៛' : '$'}{item.amount.toLocaleString()}</p>
                      {item.day_of_month && (
                        <div className="text-right">
                          <p className="text-sm font-medium">Day {item.day_of_month} of month</p>
                          <p className="text-[10px] text-muted-foreground">
                            Effective: {calculateEffectiveDate(item.day_of_month)}
                          </p>
                          {item.auto_log_enabled && (
                            <span className="inline-flex items-center rounded-full bg-signal/10 px-2 py-0.5 text-[10px] font-medium text-signal">
                              Auto-log active
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Starts: {item.start_date}
                      {item.end_date && ` • Ends: ${item.end_date}`}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {recurring.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-8">No active recurring schedules.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Income History</CardTitle>
              <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70">Manage and review your recorded income.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between border-b pb-3 pt-1">
                    <div className="flex-1">
                      <p className="font-medium">
                        {entry.income_categories?.name || "Uncategorized"}
                        {entry.income_sub_categories?.name && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({entry.income_sub_categories.name})
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.date} • {entry.accounts?.name || "No Account"}
                      </p>
                      {entry.description && <p className="text-xs text-muted-foreground italic">{entry.description}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-signal">+{entry.currency === 'KHR' ? '៛' : '$'}{entry.amount.toLocaleString()}</p>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setEditingEntry(entry)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Delete this entry?")) {
                              deleteEntryMutation.mutate({ data: { id: entry.id } });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {entries.length === 0 && <p className="text-center text-muted-foreground py-8">No income entries found.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Edit Income Entry</DialogTitle>
            <DialogDescription className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70">Update the details of this income record.</DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Amount</Label>
                <div className="flex gap-2">
                  <Select 
                    defaultValue={editingEntry.currency || "USD"}
                    onValueChange={(val) => setEditingEntry({ ...editingEntry, currency: val })}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="KHR">KHR</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    className="flex-1"
                    defaultValue={editingEntry.amount}
                    onChange={(e) => setEditingEntry({ ...editingEntry, amount: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select 
                  defaultValue={editingEntry.category_id || "none"}
                  onValueChange={(val) => setEditingEntry({ ...editingEntry, category_id: val === "none" ? null : val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sub-category">Sub-category</Label>
                <Select 
                  defaultValue={editingEntry.sub_category_id || "none"}
                  onValueChange={(val) => setEditingEntry({ ...editingEntry, sub_category_id: val === "none" ? null : val })}
                  disabled={!editingEntry.category_id}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Sub-category</SelectItem>
                    {categories.find(c => c.id === editingEntry.category_id)?.income_sub_categories?.map((sub: any) => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-account">Account / Cash</Label>
                <Select 
                  defaultValue={editingEntry.account_id || "none"}
                  onValueChange={(val) => setEditingEntry({ ...editingEntry, account_id: val === "none" ? null : val })}
                >
                  <SelectTrigger id="edit-account">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Account</SelectItem>
                    {accounts.map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  defaultValue={editingEntry.date}
                  onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Input
                  id="edit-desc"
                  defaultValue={editingEntry.description}
                  onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>Cancel</Button>
            <Button 
              onClick={() => {
                updateEntryMutation.mutate({
                  data: {
                    id: editingEntry.id,
                    amount: editingEntry.amount,
                    currency: editingEntry.currency || 'USD',
                    category_id: editingEntry.category_id,
                    sub_category_id: editingEntry.sub_category_id,
                    account_id: editingEntry.account_id,
                    date: editingEntry.date,
                    description: editingEntry.description
                  }
                });
              }}
              disabled={updateEntryMutation.isPending}
            >
              {updateEntryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Recurring Dialog */}
      <Dialog open={!!editingRecurring} onOpenChange={(open) => !open && setEditingRecurring(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Recurring Schedule</DialogTitle>
            <DialogDescription>Update the details of your automated income schedule.</DialogDescription>
          </DialogHeader>
          {editingRecurring && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-rec-amount">Amount</Label>
                <div className="flex gap-2">
                  <Select 
                    defaultValue={editingRecurring.currency || "USD"}
                    onValueChange={(val) => setEditingRecurring({ ...editingRecurring, currency: val })}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="KHR">KHR</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="edit-rec-amount"
                    type="number"
                    step="0.01"
                    className="flex-1"
                    defaultValue={editingRecurring.amount}
                    onChange={(e) => setEditingRecurring({ ...editingRecurring, amount: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-rec-frequency">Frequency</Label>
                <Select 
                  defaultValue={editingRecurring.frequency}
                  onValueChange={(val) => setEditingRecurring({ ...editingRecurring, frequency: val as any })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingRecurring.frequency === "monthly" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-day-of-month">Day of Month (1-31)</Label>
                    <Input
                      id="edit-day-of-month"
                      type="number"
                      min="1"
                      max="31"
                      defaultValue={editingRecurring.day_of_month || ""}
                      onChange={(e) => setEditingRecurring({ ...editingRecurring, day_of_month: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-auto-log" 
                      checked={editingRecurring.auto_log_enabled} 
                      onCheckedChange={(checked) => setEditingRecurring({ ...editingRecurring, auto_log_enabled: checked as boolean })}
                    />
                    <Label htmlFor="edit-auto-log">Auto-log on this day</Label>
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <Label htmlFor="edit-rec-account">Account / Cash</Label>
                <Select 
                  defaultValue={editingRecurring.account_id || "none"}
                  onValueChange={(val) => setEditingRecurring({ ...editingRecurring, account_id: val === "none" ? null : val })}
                >
                  <SelectTrigger id="edit-rec-account"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Account</SelectItem>
                    {accounts.map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-rec-category">Category</Label>
                <Select 
                  defaultValue={editingRecurring.category_id || "none"}
                  onValueChange={(val) => setEditingRecurring({ ...editingRecurring, category_id: val === "none" ? null : val, sub_category_id: null })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-rec-sub-category">Sub-category</Label>
                <Select 
                  defaultValue={editingRecurring.sub_category_id || "none"}
                  onValueChange={(val) => setEditingRecurring({ ...editingRecurring, sub_category_id: val === "none" ? null : val })}
                  disabled={!editingRecurring.category_id}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Sub-category</SelectItem>
                    {categories.find(c => c.id === editingRecurring.category_id)?.income_sub_categories?.map((sub: any) => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-rec-start">Start Date</Label>
                <Input
                  id="edit-rec-start"
                  type="date"
                  defaultValue={editingRecurring.start_date}
                  onChange={(e) => setEditingRecurring({ ...editingRecurring, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-rec-end">End Date (Optional)</Label>
                <Input
                  id="edit-rec-end"
                  type="date"
                  defaultValue={editingRecurring.end_date || ""}
                  onChange={(e) => setEditingRecurring({ ...editingRecurring, end_date: e.target.value || null })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecurring(null)}>Cancel</Button>
            <Button 
              onClick={() => {
                updateRecurringMutation.mutate({
                  data: {
                    id: editingRecurring.id,
                    amount: editingRecurring.amount,
                    currency: editingRecurring.currency || 'USD',
                    category_id: editingRecurring.category_id,
                    sub_category_id: editingRecurring.sub_category_id,
                    frequency: editingRecurring.frequency,
                    start_date: editingRecurring.start_date,
                    end_date: editingRecurring.end_date,
                    account_id: editingRecurring.account_id,
                    day_of_month: editingRecurring.day_of_month,
                    auto_log_enabled: editingRecurring.auto_log_enabled
                  }
                });
              }}
              disabled={updateRecurringMutation.isPending}
            >
              {updateRecurringMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
