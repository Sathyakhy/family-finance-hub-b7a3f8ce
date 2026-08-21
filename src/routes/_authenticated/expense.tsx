import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getExpenseCategories, 
  getExpenseEntries, 
  getRecurringExpenses, 
  logExpense, 
  setRecurringExpense,
  updateExpenseEntry,
  deleteExpenseEntry,
  updateRecurringExpense,
  deleteRecurringExpense,
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

export const Route = createFileRoute("/_authenticated/expense")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["expense-categories"],
        queryFn: () => getExpenseCategories(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["expense-entries"],
        queryFn: () => getExpenseEntries(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["recurring-expenses"],
        queryFn: () => getRecurringExpenses(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["accounts"],
        queryFn: () => getAccounts(),
      }),
    ]);
  },
  component: ExpensePage,
});

function ExpensePage() {
  const queryClient = useQueryClient();
  const { data: categories } = useSuspenseQuery({
    queryKey: ["expense-categories"],
    queryFn: () => getExpenseCategories(),
    refetchOnWindowFocus: true,
  });
  const { data: entries } = useSuspenseQuery({
    queryKey: ["expense-entries"],
    queryFn: () => getExpenseEntries(),
    refetchOnWindowFocus: true,
  });
  const { data: recurring } = useSuspenseQuery({
    queryKey: ["recurring-expenses"],
    queryFn: () => getRecurringExpenses(),
    refetchOnWindowFocus: true,
  });
  const { data: accounts } = useSuspenseQuery({
    queryKey: ["accounts"],
    queryFn: () => getAccounts(),
    refetchOnWindowFocus: true,
  });

  const logExpenseMutation = useMutation({
    mutationFn: (variables: { data: any }) => logExpense(variables),
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: ["expense-entries"] });
      const previousEntries = queryClient.getQueryData(["expense-entries"]);
      queryClient.setQueryData(["expense-entries"], (old: any) => [
        { 
          id: 'temp-' + Date.now(), 
          ...newEntry.data,
          expense_categories: categories?.find((c: any) => c.id === newEntry.data.category_id),
          expense_sub_categories: categories?.find((c: any) => c.id === newEntry.data.category_id)?.expense_sub_categories?.find((s: any) => s.id === newEntry.data.sub_category_id),
          accounts: accounts?.find((a: any) => a.id === newEntry.data.account_id)
        },
        ...(old || [])
      ]);
      return { previousEntries };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["expense-entries"], (context as any)?.previousEntries);
      toast.error(err.message || "Failed to log expense");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Expense logged successfully");
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: (variables: { data: any }) => updateExpenseEntry({ data: variables.data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast.success("Expense updated successfully");
      setEditingEntry(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update expense");
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (variables: { id: string }) => deleteExpenseEntry({ data: variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast.success("Expense deleted successfully");
    },
  });

  const setRecurringMutation = useMutation({
    mutationFn: (variables: { data: any }) => setRecurringExpense(variables),
    onMutate: async (newRecurring) => {
      await queryClient.cancelQueries({ queryKey: ["recurring-expenses"] });
      const previousRecurring = queryClient.getQueryData(["recurring-expenses"]);
      queryClient.setQueryData(["recurring-expenses"], (old: any) => [
        { 
          id: 'temp-' + Date.now(), 
          ...newRecurring.data,
          currency: newRecurring.data.currency || 'USD',
          expense_categories: categories?.find((c: any) => c.id === newRecurring.data.category_id),
          expense_sub_categories: categories?.find((c: any) => c.id === newRecurring.data.category_id)?.expense_sub_categories?.find((s: any) => s.id === newRecurring.data.sub_category_id),
          accounts: accounts?.find((a: any) => a.id === newRecurring.data.account_id)
        },
        ...(old || [])
      ]);
      return { previousRecurring };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["recurring-expenses"], (context as any)?.previousRecurring);
      toast.error(err.message || "Failed to set recurring expense");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Recurring expense set successfully");
    },
  });

  const updateRecurringMutation = useMutation({
    mutationFn: (variables: { data: any }) => updateRecurringExpense({ data: variables.data }),
    onMutate: async (updatedRecurring) => {
      await queryClient.cancelQueries({ queryKey: ["recurring-expenses"] });
      const previousRecurring = queryClient.getQueryData(["recurring-expenses"]);
      queryClient.setQueryData(["recurring-expenses"], (old: any) => 
        old?.map((r: any) => r.id === updatedRecurring.data.id ? { ...r, ...updatedRecurring.data } : r)
      );
      return { previousRecurring };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["recurring-expenses"], (context as any)?.previousRecurring);
      toast.error(err.message || "Failed to update recurring expense");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Recurring schedule updated");
      setEditingRecurring(null);
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: (variables: { data: { id: string } }) => deleteRecurringExpense({ data: variables.data }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["recurring-expenses"] });
      const previousRecurring = queryClient.getQueryData(["recurring-expenses"]);
      queryClient.setQueryData(["recurring-expenses"], (old: any) => 
        old?.filter((r: any) => r.id !== variables.data.id)
      );
      return { previousRecurring };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["recurring-expenses"], (context as any)?.previousRecurring);
      toast.error(err.message || "Failed to delete recurring expense");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Recurring schedule deleted");
    },
  });

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editingRecurring, setEditingRecurring] = useState<any>(null);

  const [recAmount, setRecAmount] = useState("");
  const [recCategoryId, setRecCategoryId] = useState("");
  const [recSubCategoryId, setRecSubCategoryId] = useState("");
  const [recAccountId, setRecAccountId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [dayOfMonth, setDayOfMonth] = useState<string>("");
  const [autoLogEnabled, setAutoLogEnabled] = useState(false);
  const [recCurrency, setRecCurrency] = useState("USD");

  const [currency, setCurrency] = useState("USD");

  const handleLogExpense = async (e: React.FormEvent) => {
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
      await logExpenseMutation.mutateAsync({
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
    } catch (err) {}
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
    } catch (err) {}
  };


  const prefetchData = (key: string) => {
    const fnMap: Record<string, any> = {
      "expense-categories": getExpenseCategories,
      "expense-entries": getExpenseEntries,
      "recurring-expenses": getRecurringExpenses,
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
        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-foreground">Expense</h2>
        <ExcelImportDialog kind="expense" />
      </div>

      <Tabs defaultValue="log" className="space-y-4">
        <TabsList>
          <TabsTrigger value="log" onMouseEnter={() => {
            prefetchData("expense-categories");
            prefetchData("accounts");
          }}>
            Log Manual
          </TabsTrigger>
          <TabsTrigger value="recurring" onMouseEnter={() => {
            prefetchData("expense-categories");
            prefetchData("recurring-expenses");
            prefetchData("accounts");
          }}>
            Recurring Expense
          </TabsTrigger>
          <TabsTrigger value="history" onMouseEnter={() => prefetchData("expense-entries")}>
            History
          </TabsTrigger>
        </TabsList>


        <TabsContent value="log">
          <Card>
            <CardHeader>
              <CardTitle>Log Manual Expense</CardTitle>
              <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70">Enter expense spent manually.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogExpense} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="flex gap-2">
                      <Select value={currency} onValueChange={setCurrency}>
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
                        {categories.map((cat: any) => (
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
                        {categories.find((c: any) => c.id === categoryId)?.expense_sub_categories?.map((sub: any) => (
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
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Lunch at..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={logExpenseMutation.isPending}>
                  {logExpenseMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Log Expense
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle>Set Recurring Expense</CardTitle>
              <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70">Configure automatic recurring spending.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetRecurring} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rec-amount">Amount</Label>
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
                    <Label htmlFor="rec-category">Category</Label>
                    <Select value={recCategoryId} onValueChange={setRecCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat: any) => (
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
                        {categories.find((c: any) => c.id === recCategoryId)?.expense_sub_categories?.map((sub: any) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rec-account">Account / Cash</Label>
                    <Select value={recAccountId} onValueChange={setRecAccountId}>
                      <SelectTrigger>
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
                        <SelectValue placeholder="Select frequency" />
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
                    <div className="space-y-2">
                      <Label htmlFor="day-of-month">Day of Month</Label>
                      <Input
                        id="day-of-month"
                        type="number"
                        min="1"
                        max="31"
                        placeholder="e.g. 28"
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="flex items-center space-x-2 sm:col-span-2 pt-2">
                    <Checkbox 
                      id="auto-log" 
                      checked={autoLogEnabled}
                      onCheckedChange={(checked) => setAutoLogEnabled(checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="auto-log"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Auto-log on due date
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Automatically create an expense entry when the date is reached.
                      </p>
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={setRecurringMutation.isPending}>
                  {setRecurringMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Calendar className="mr-2 h-4 w-4" />
                  )}
                  Set Recurring Expense
                </Button>
              </form>

              <div className="mt-8 space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest">Active Schedules</h3>
                {recurring.map((item: any) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-ember/10 flex items-center justify-center text-ember">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{item.expense_categories?.name || "Uncategorized"}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-tighter">
                            {item.frequency} • Next: {item.day_of_month ? `Day ${item.day_of_month}` : item.start_date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-ember">-{item.currency === 'KHR' ? '៛' : '$'}{item.amount.toLocaleString()}</p>
                        <div className="flex gap-1 mt-2 justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Delete this recurring schedule?")) {
                                deleteRecurringMutation.mutate({ data: { id: item.id } });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {recurring.length === 0 && <p className="text-sm text-muted-foreground text-center py-4 italic">No recurring schedules set.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">

          <Card>
            <CardHeader>
              <CardTitle>Expense History</CardTitle>
              <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70">Your recent spending.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entries.map((entry: any) => (
                  <Card key={entry.id} className="overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-ember/10 flex items-center justify-center text-ember">
                           {entry.expense_categories?.icon || <Plus className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-semibold">{entry.expense_categories?.name || "Uncategorized"}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {entry.expense_sub_categories?.name && <span>{entry.expense_sub_categories.name}</span>}
                            {entry.accounts?.name && <span>• {entry.accounts.name}</span>}
                            <span>• {entry.date}</span>
                          </div>
                          {entry.description && <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-ember">-{entry.currency === 'KHR' ? '៛' : '$'}{entry.amount.toLocaleString()}</p>
                        <div className="flex gap-1 mt-2 justify-end">
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
                              if (confirm("Are you sure you want to delete this entry?")) {
                                deleteEntryMutation.mutate(entry.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {entries.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    No expense history found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
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
                  defaultValue={editingEntry.category_id}
                  onValueChange={(val) => setEditingEntry({ ...editingEntry, category_id: val, sub_category_id: null })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
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
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Sub-category</SelectItem>
                    {categories.find((c: any) => c.id === editingEntry.category_id)?.expense_sub_categories?.map((sub: any) => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-account">Account</Label>
                <Select 
                  defaultValue={editingEntry.account_id}
                  onValueChange={(val) => setEditingEntry({ ...editingEntry, account_id: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
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
    </div>
  );
}
