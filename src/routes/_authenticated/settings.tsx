import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getIncomeCategories, 
  createIncomeCategory, 
  deleteIncomeCategory,
  createIncomeSubCategory,
  deleteIncomeSubCategory,
  getIncomeEntries,
  logIncome,
  getExpenseCategories,
  createExpenseCategory,
  deleteExpenseCategory,
  createExpenseSubCategory,
  deleteExpenseSubCategory,
  getExpenseEntries,
  logExpense,

  getAccounts,
  createAccount,
  deleteAccount,

  updateAccount,
  getAssetTypes,
  createAssetType,
  deleteAssetType,
  getExchangeRates,
  updateExchangeRate,
  reconcileAccountBalances,
} from "@/lib/finance.functions";
import { getGeneralSettings, updateGeneralSettings } from "@/lib/settings.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, Pencil, TrendingDown, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editAccountName, setEditAccountName] = useState("");
  const [editAccountType, setEditAccountType] = useState("bank");
  const [editAccountBalance, setEditAccountBalance] = useState("0");
  const [editAccountCurrency, setEditAccountCurrency] = useState("USD");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "KHR">("USD");
  const [isManualAdjustmentOpen, setIsManualAdjustmentOpen] = useState(false);
  const [manualAdjustmentType, setManualAdjustmentType] = useState<"income" | "expense">("income");
  const [manualAdjustmentAccount, setManualAdjustmentAccount] = useState<any>(null);
  const [manualAdjustmentAmount, setManualAdjustmentAmount] = useState("");
  const [manualAdjustmentDescription, setManualAdjustmentDescription] = useState("");


  const queryClient = useQueryClient();
  const { data: generalSettings } = useSuspenseQuery({
    queryKey: ["general-settings"],
    queryFn: () => getGeneralSettings(),
  });
  const updateGeneralSettingsMutation = useMutation({
    mutationFn: (variables: { data: any }) => updateGeneralSettings(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["general-settings"] });
      toast.success("General settings updated");
    },
    onError: (err: any) => toast.error(err.message),
  });


  const { data: categories } = useSuspenseQuery({
    queryKey: ["income-categories"],
    queryFn: () => getIncomeCategories(),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  
  const { data: expenseCategories } = useSuspenseQuery({
    queryKey: ["expense-categories"],
    queryFn: () => getExpenseCategories(),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: accounts } = useSuspenseQuery({
    queryKey: ["accounts"],
    queryFn: () => getAccounts(),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const { data: entries } = useSuspenseQuery({
    queryKey: ["income-entries"],
    queryFn: () => getIncomeEntries(),
  });
  const { data: expenses } = useSuspenseQuery({
    queryKey: ["expense-entries"],
    queryFn: () => getExpenseEntries(),
  });
  const { data: assetTypes } = useSuspenseQuery({
    queryKey: ["asset-types"],
    queryFn: () => getAssetTypes(),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });


  const { data: exchangeRates } = useSuspenseQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => getExchangeRates(),
  });


  const reconcileMutation = useMutation({
    mutationFn: () => reconcileAccountBalances(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast.success("Balances reconciled");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createMutation = useMutation({
    mutationFn: (variables: { data: { name: string } }) => createIncomeCategory(variables),
    onMutate: async (newCat) => {
      await queryClient.cancelQueries({ queryKey: ["income-categories"] });
      const previousCategories = queryClient.getQueryData(["income-categories"]);
      queryClient.setQueryData(["income-categories"], (old: any) => [
        ...(old || []),
        { id: 'temp-' + Date.now(), name: newCat.data.name, income_sub_categories: [] }
      ]);
      return { previousCategories };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["income-categories"], (context as any)?.previousCategories);
      toast.error(err.message || "Failed to create category");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["income-categories"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Category created");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (variables: { data: { id: string } }) => deleteIncomeCategory(variables),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["income-categories"] });
      const previousCategories = queryClient.getQueryData(["income-categories"]);
      queryClient.setQueryData(["income-categories"], (old: any) => 
        old?.filter((c: any) => c.id !== variables.data.id)
      );
      return { previousCategories };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["income-categories"], (context as any)?.previousCategories);
      toast.error(err.message || "Failed to delete category");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["income-categories"] });
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-incomes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Category deleted");
    },
  });

  const createSubMutation = useMutation({
    mutationFn: (variables: { data: { category_id: string; name: string } }) => createIncomeSubCategory(variables),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["income-categories"] });
      const previousCategories = queryClient.getQueryData(["income-categories"]);
      queryClient.setQueryData(["income-categories"], (old: any) => 
        old?.map((c: any) => c.id === variables.data.category_id ? {
          ...c,
          income_sub_categories: [...(c.income_sub_categories || []), { id: 'temp-' + Date.now(), name: variables.data.name }]
        } : c)
      );
      return { previousCategories };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["income-categories"], (context as any)?.previousCategories);
      toast.error(err.message || "Failed to create sub-category");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["income-categories"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Sub-category created");
    },
  });

  const deleteSubMutation = useMutation({
    mutationFn: (variables: { data: { id: string } }) => deleteIncomeSubCategory(variables),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["income-categories"] });
      const previousCategories = queryClient.getQueryData(["income-categories"]);
      queryClient.setQueryData(["income-categories"], (old: any) => 
        old?.map((c: any) => ({
          ...c,
          income_sub_categories: c.income_sub_categories?.filter((s: any) => s.id !== variables.data.id)
        }))
      );
      return { previousCategories };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["income-categories"], (context as any)?.previousCategories);
      toast.error(err.message || "Failed to delete sub-category");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["income-categories"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onSuccess: () => {
      toast.success("Sub-category deleted");
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: (variables: { data: { name: string; type: string; initial_balance: number; currency?: string; account_number?: string } }) => createAccount(variables),
    onMutate: async (newAccount) => {
      await queryClient.cancelQueries({ queryKey: ["accounts"] });
      const previousAccounts = queryClient.getQueryData(["accounts"]);
      queryClient.setQueryData(["accounts"], (old: any) => [
        ...(old || []),
        { id: 'temp-' + Date.now(), ...newAccount.data }
      ]);
      return { previousAccounts };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["accounts"], (context as any)?.previousAccounts);
      toast.error(err.message || "Failed to create account");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onSuccess: () => {
      toast.success("Account created");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (variables: { data: { id: string } }) => deleteAccount(variables),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["accounts"] });
      const previousAccounts = queryClient.getQueryData(["accounts"]);
      queryClient.setQueryData(["accounts"], (old: any) => 
        old?.filter((a: any) => a.id !== variables.data.id)
      );
      return { previousAccounts };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["accounts"], (context as any)?.previousAccounts);
      toast.error(err.message || "Failed to delete account");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-incomes"] });
    },
    onSuccess: () => {
      toast.success("Account deleted");
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: (variables: { data: any }) => updateAccount(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account updated");
      setEditingAccount(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createAssetTypeMutation = useMutation({
    mutationFn: (variables: { data: { name: string } }) => createAssetType(variables),
    onMutate: async (newType) => {
      await queryClient.cancelQueries({ queryKey: ["asset-types"] });
      const previousTypes = queryClient.getQueryData(["asset-types"]);
      queryClient.setQueryData(["asset-types"], (old: any) => [
        ...(old || []),
        { id: 'temp-' + Date.now(), name: newType.data.name }
      ]);
      return { previousTypes };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["asset-types"], (context as any)?.previousTypes);
      toast.error(err.message || "Failed to create asset type");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-types"] });
    },
    onSuccess: () => {
      toast.success("Asset type created");
    },
  });

  const deleteAssetTypeMutation = useMutation({
    mutationFn: (variables: { data: { id: string } }) => deleteAssetType(variables),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["asset-types"] });
      const previousTypes = queryClient.getQueryData(["asset-types"]);
      queryClient.setQueryData(["asset-types"], (old: any) => 
        old?.filter((t: any) => t.id !== variables.data.id)
      );
      return { previousTypes };
    },
    onError: (err: any, variables: any, context: any) => {
      queryClient.setQueryData(["asset-types"], (context as any)?.previousTypes);
      toast.error(err.message || "Failed to delete asset type");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-types"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onSuccess: () => {
      toast.success("Asset type deleted");
    },
  });

  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState<{ [key: string]: string }>({});
  
  const [newAssetType, setNewAssetType] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("bank");
  const [initialBalance, setInitialBalance] = useState("0");
  const [accountCurrency, setAccountCurrency] = useState("USD");
  const [accountNumber, setAccountNumber] = useState("");

  const updateExchangeRateMutation = useMutation({
    mutationFn: (variables: { data: { from_currency: string; to_currency: string; rate: number } }) => updateExchangeRate(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange-rates"] });
      toast.success("Exchange rate updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      await createMutation.mutateAsync({ data: { name: newCategory.trim() } });
      setNewCategory("");
    } catch (err) {
      // Error handled by mutation onError
    }
  };

  const handleCreateSub = async (categoryId: string) => {
    const name = newSubCategory[categoryId];
    if (!name?.trim()) {
      toast.error("Sub-category name is required");
      return;
    }
    try {
      await createSubMutation.mutateAsync({ data: { category_id: categoryId, name: name.trim() } });
      setNewSubCategory(prev => ({ ...prev, [categoryId]: "" }));
    } catch (err) {
      // Error handled by mutation onError
    }
  };

  const handleCreateAssetType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetType.trim()) {
      toast.error("Asset type name is required");
      return;
    }
    try {
      await createAssetTypeMutation.mutateAsync({ data: { name: newAssetType.trim() } });
      setNewAssetType("");
    } catch (err) {
      // Error handled by mutation onError
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      toast.error("Account name is required");
      return;
    }
    try {
      const accountData: any = {
        name: accountName.trim(),
        type: accountType,
        initial_balance: parseFloat(initialBalance) || 0,
        currency: accountCurrency,
      };
      if (accountType === 'bank' && accountNumber) {
        accountData.account_number = accountNumber;
      }
      await createAccountMutation.mutateAsync({ data: accountData });
      setAccountName("");
      setInitialBalance("0");
    } catch (err) {
      // Error handled by mutation onError
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-foreground">Settings</h2>
        <p className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70">Manage your preferences and categories.</p>
      </div>

      <Tabs defaultValue="income-categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="income-categories">Income Categories</TabsTrigger>
          <TabsTrigger value="expense-categories">Expense Categories</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="asset-types">Asset Types</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="income-categories">
          <Card>
            <CardHeader>
              <CardTitle>Income Categories</CardTitle>
              <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70">Add or remove categories for your income sources.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCreate} className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="category-name" className="sr-only">Category Name</Label>
                  <Input
                    id="category-name"
                    placeholder="New category name (e.g. Salary, Side Hustle)"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add
                </Button>
              </form>

              <div className="rounded-md border">
                <div className="divide-y">
                  {categories.map((category) => (
                    <div key={category.id} className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{category.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Delete category "${category.name}" and all its sub-categories?`)) {
                              deleteMutation.mutate({ data: { id: category.id } });
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="pl-4 space-y-2 border-l-2 ml-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="New sub-category..."
                            className="h-8 text-sm"
                            value={newSubCategory[category.id] || ""}
                            onChange={(e) => setNewSubCategory(prev => ({ ...prev, [category.id]: e.target.value }))}
                          />
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8"
                            onClick={() => handleCreateSub(category.id)}
                            disabled={createSubMutation.isPending}
                          >
                            {createSubMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {category.income_sub_categories?.map((sub: any) => (
                            <div key={sub.id} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-xs">
                              <span>{sub.name}</span>
                              <button
                                onClick={() => deleteSubMutation.mutate({ data: { id: sub.id } })}
                                disabled={deleteSubMutation.isPending}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No categories defined yet.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense-categories">
          <ExpenseCategoriesSection 
            categories={expenseCategories} 
            queryClient={queryClient}
          />
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>Financial Accounts</CardTitle>
              <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70">Manage your bank accounts, cash wallets, and other sources.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleCreateAccount} className="space-y-4 border p-4 rounded-md">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-name">Account Name</Label>
                    <Input
                      id="account-name"
                      placeholder="Chase, Wallet, etc."
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-type">Type</Label>
                    <Select value={accountType} onValueChange={setAccountType}>
                      <SelectTrigger id="account-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">Bank</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-currency">Currency</Label>
                    <Select value={accountCurrency} onValueChange={setAccountCurrency}>
                      <SelectTrigger id="account-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="KHR">KHR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initial-balance">Initial Balance</Label>
                    <Input
                      id="initial-balance"
                      type="number"
                      step="0.01"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(e.target.value)}
                    />
                  </div>
                  {accountType === "bank" && (
                    <div className="space-y-2 lg:col-span-2">
                      <Label htmlFor="account-number">Account Number</Label>
                      <Input
                        id="account-number"
                        placeholder="Enter bank account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={createAccountMutation.isPending}>
                  {createAccountMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Account
                </Button>
              </form>

              <div className="flex justify-end mb-2 px-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => reconcileMutation.mutate()}
                  disabled={reconcileMutation.isPending}
                  className="text-[10px] h-7 uppercase font-bold tracking-wider"
                >
                  {reconcileMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                  Reconcile
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDisplayCurrency(prev => prev === "USD" ? "KHR" : "USD")}
                  className="text-[10px] h-7 uppercase font-bold tracking-wider"
                >
                  View Totals in: {displayCurrency === "USD" ? "KHR" : "USD"}
                </Button>
              </div>

              <div className="rounded-md border divide-y">
                {accounts.map((account: any) => {
                  const rate = exchangeRates?.[0]?.rate || 4000;
                  
                  // Calculate dynamic balance from income/expense entries
                  const accountIncome = entries?.filter((e: any) => e.account_id === account.id)
                    .reduce((sum: number, e: any) => {
                      const amount = e.currency === account.currency ? e.amount : (e.currency === 'USD' ? e.amount * rate : e.amount / rate);
                      return sum + amount;
                    }, 0) || 0;
                    
                  const accountExpense = expenses?.filter((e: any) => e.account_id === account.id)
                    .reduce((sum: number, e: any) => {
                      const amount = e.currency === account.currency ? e.amount : (e.currency === 'USD' ? e.amount * rate : e.amount / rate);
                      return sum + amount;
                    }, 0) || 0;
                    
                  const balance = (account.initial_balance || 0) + accountIncome - accountExpense;
                  const isAccountKHR = account.currency === 'KHR';
                  
                  let displayVal = "";
                  if (displayCurrency === 'USD') {
                    const usdVal = isAccountKHR ? balance / rate : balance;
                    displayVal = `$${usdVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  } else {
                    const khrVal = isAccountKHR ? balance : balance * rate;
                    displayVal = `៛${khrVal.toLocaleString()}`;
                  }
 
                  const originalVal = account.currency === 'KHR' 
                    ? `៛${balance.toLocaleString()}` 
                    : `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


                  return (
                    <div key={account.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{account.name} {account.account_number && <span className="text-xs font-normal opacity-70">({account.account_number})</span>}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {account.type} • {account.currency} • 
                          <span className="ml-1 font-bold text-foreground">{originalVal}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] px-2 font-bold uppercase tracking-wider bg-signal/10 hover:bg-signal/20 text-signal border-signal/20"
                          onClick={() => {
                            setManualAdjustmentType("income");
                            setManualAdjustmentAccount(account);
                            setIsManualAdjustmentOpen(true);
                            setManualAdjustmentAmount("");
                            setManualAdjustmentDescription("");
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] px-2 font-bold uppercase tracking-wider bg-ember/10 hover:bg-ember/20 text-ember border-ember/20"
                          onClick={() => {
                            setManualAdjustmentType("expense");
                            setManualAdjustmentAccount(account);
                            setIsManualAdjustmentOpen(true);
                            setManualAdjustmentAmount("");
                            setManualAdjustmentDescription("");
                          }}
                        >
                          <TrendingDown className="h-3 w-3 mr-1" /> Withdr.
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingAccount(account);
                            setEditAccountName(account.name);
                            setEditAccountType(account.type);
                            setEditAccountBalance(String(account.initial_balance || 0));
                            setEditAccountCurrency(account.currency || "USD");
                            setEditAccountNumber(account.account_number || "");
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete account "${account.name}"? This will remove the link from all entries.`)) {
                            deleteAccountMutation.mutate({ data: { id: account.id } });
                          }
                        }}
                        disabled={deleteAccountMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  );
                })}
                {accounts.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No accounts added yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asset-types">
          <Card>
            <CardHeader>
              <CardTitle>Asset Types</CardTitle>
              <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70">Define categories for your assets (e.g. Real Estate, Crypto, Stocks).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCreateAssetType} className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="asset-type-name" className="sr-only">Asset Type Name</Label>
                  <Input
                    id="asset-type-name"
                    placeholder="New asset type name"
                    value={newAssetType}
                    onChange={(e) => setNewAssetType(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={createAssetTypeMutation.isPending}>
                  {createAssetTypeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add
                </Button>
              </form>

              <div className="rounded-md border divide-y">
                {assetTypes.map((type: any) => (
                  <div key={type.id} className="p-3 flex items-center justify-between">
                    <span className="font-semibold">{type.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete asset type "${type.name}"?`)) {
                          deleteAssetTypeMutation.mutate({ data: { id: type.id } });
                        }
                      }}
                      disabled={deleteAssetTypeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {assetTypes.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No asset types defined yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Other system preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6">
                {exchangeRates.map((rate: any) => (
                  <div key={`${rate.from_currency}-${rate.to_currency}`} className="space-y-2">
                    <Label>1 {rate.from_currency} = X {rate.to_currency}</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number"
                        defaultValue={rate.rate}
                        onBlur={(e) => {
                          const newRate = parseFloat(e.target.value);
                          if (!isNaN(newRate) && newRate !== rate.rate) {
                            updateExchangeRateMutation.mutate({
                              data: {
                                from_currency: rate.from_currency,
                                to_currency: rate.to_currency,
                                rate: newRate
                              }
                            });
                          }
                        }}
                      />
                      <Button variant="outline" disabled={updateExchangeRateMutation.isPending}>
                        Update
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={!!editingAccount} onOpenChange={(open: boolean) => !open && setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const updateData: any = {
              id: editingAccount.id,
              name: editAccountName,
              type: editAccountType,
              initial_balance: parseFloat(editAccountBalance) || 0,
              currency: editAccountCurrency,
            };
            if (editAccountType === 'bank' && editAccountNumber) {
              updateData.account_number = editAccountNumber;
            } else if (editAccountType === 'bank') {
              updateData.account_number = null; // Clear if empty
            }
            updateAccountMutation.mutate({ data: updateData });
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input value={editAccountName} onChange={e => setEditAccountName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={editAccountType} onValueChange={setEditAccountType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={editAccountCurrency} onValueChange={setEditAccountCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="KHR">KHR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Balance</Label>
                <Input type="number" step="0.01" value={editAccountBalance} onChange={e => setEditAccountBalance(e.target.value)} required />
              </div>
            </div>
            {editAccountType === "bank" && (
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input 
                  value={editAccountNumber} 
                  onChange={e => setEditAccountNumber(e.target.value)} 
                  placeholder="Bank account number"
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={updateAccountMutation.isPending}>
              {updateAccountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isManualAdjustmentOpen} onOpenChange={setIsManualAdjustmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="uppercase tracking-tighter italic font-black text-xl">
              {manualAdjustmentType === "income" ? "Add Fund" : "Withdraw Fund"}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Manual balance adjustment for {manualAdjustmentAccount?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adj-amount">Amount ({manualAdjustmentAccount?.currency})</Label>
              <Input
                id="adj-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={manualAdjustmentAmount}
                onChange={(e) => setManualAdjustmentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adj-desc">Description</Label>
              <Input
                id="adj-desc"
                placeholder="Adjustment description"
                value={manualAdjustmentDescription}
                onChange={(e) => setManualAdjustmentDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button variant="ghost" className="text-[10px] uppercase font-bold" onClick={() => setIsManualAdjustmentOpen(false)}>Cancel</Button>
            <Button 
              className={`text-[10px] uppercase font-bold ${manualAdjustmentType === "income" ? "bg-signal hover:bg-signal/90" : "bg-ember hover:bg-ember/90"}`}
              onClick={async () => {
                if (!manualAdjustmentAmount) return;
                const amt = parseFloat(manualAdjustmentAmount);
                const desc = manualAdjustmentDescription || `Manual ${manualAdjustmentType} adjustment`;
                
                try {
                  if (manualAdjustmentType === "income") {
                    await logIncome({
                      data: {
                        amount: amt,
                        account_id: manualAdjustmentAccount.id,
                        date: new Date().toISOString().split('T')[0],
                        description: desc,
                        currency: manualAdjustmentAccount.currency,
                        is_adjustment: true
                      }
                    });
                  } else {
                    await logExpense({
                      data: {
                        amount: amt,
                        account_id: manualAdjustmentAccount.id,
                        date: new Date().toISOString().split('T')[0],
                        description: desc,
                        currency: manualAdjustmentAccount.currency,
                        is_adjustment: true
                      }
                    });
                  }
                  toast.success("Balance adjusted successfully");
                  setIsManualAdjustmentOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["income-entries"] });
                  queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
                  queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
                } catch (err: any) {
                  toast.error(err.message || "Failed to adjust balance");
                }
              }}
            >
              Confirm {manualAdjustmentType === "income" ? "Addition" : "Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function ExpenseCategoriesSection({ categories, queryClient }: { categories: any[], queryClient: any }) {
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState<{ [key: string]: string }>({});

  const createMutation = useMutation({
    mutationFn: (variables: { data: { name: string } }) => createExpenseCategory(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success("Expense category created");
      setNewCategory("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (variables: { data: { id: string } }) => deleteExpenseCategory(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success("Expense category deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createSubMutation = useMutation({
    mutationFn: (variables: { data: { category_id: string; name: string } }) => createExpenseSubCategory(variables),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success("Sub-category created");
      setNewSubCategory(prev => ({ ...prev, [variables.data.category_id]: "" }));
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteSubMutation = useMutation({
    mutationFn: (variables: { data: { id: string } }) => deleteExpenseSubCategory(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success("Sub-category deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Categories</CardTitle>
        <CardDescription>Add or remove categories for your spending.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ data: { name: newCategory } }); }} className="flex gap-2">
          <Input
            placeholder="New expense category (e.g. Food, Rent)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </form>

        <div className="rounded-md border divide-y">
          {categories.map((category) => (
            <div key={category.id} className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{category.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Delete category "\${category.name}" and all its sub-categories?`)) {
                      deleteMutation.mutate({ data: { id: category.id } });
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              
              <div className="pl-4 space-y-2 border-l-2 ml-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="New sub-category..."
                    className="h-8 text-sm"
                    value={newSubCategory[category.id] || ""}
                    onChange={(e) => setNewSubCategory(prev => ({ ...prev, [category.id]: e.target.value }))}
                  />
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-8"
                    onClick={() => createSubMutation.mutate({ data: { category_id: category.id, name: newSubCategory[category.id] || "" } })}
                    disabled={createSubMutation.isPending}
                  >
                    {createSubMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {category.expense_sub_categories?.map((sub: any) => (
                    <div key={sub.id} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-xs">
                      <span>{sub.name}</span>
                      <button
                        onClick={() => deleteSubMutation.mutate({ data: { id: sub.id } })}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
