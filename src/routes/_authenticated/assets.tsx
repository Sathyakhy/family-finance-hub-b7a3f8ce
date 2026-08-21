import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAssets, 
  getAssetTypes, 
  createAsset,
  getAccounts
} from "@/lib/finance.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Landmark, Briefcase, Home, Car, Upload, Pencil, Trash2 } from "lucide-react";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { updateAsset, deleteAsset, getExchangeRates } from "@/lib/finance.functions";

export const Route = createFileRoute("/_authenticated/assets")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["assets"],
        queryFn: () => getAssets(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["asset-types"],
        queryFn: () => getAssetTypes(),
      }),
    ]);
  },
  component: AssetsPage,
});

function AssetsPage() {
  const queryClient = useQueryClient();
  const { data: assets } = useSuspenseQuery({
    queryKey: ["assets"],
    queryFn: () => getAssets(),
  });
  const { data: assetTypes } = useSuspenseQuery({
    queryKey: ["asset-types"],
    queryFn: () => getAssetTypes(),
  });
  const { data: accounts } = useSuspenseQuery({
    queryKey: ["accounts"],
    queryFn: () => getAccounts(),
  });

  const [editingAsset, setEditingAsset] = useState<any>(null);

  const createAssetMutation = useMutation({
    mutationFn: (variables: { data: any }) => createAsset({ data: variables.data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset added successfully");
      setIsAdding(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateAssetMutation = useMutation({
    mutationFn: (variables: { data: any }) => updateAsset({ data: variables.data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset updated successfully");
      setEditingAsset(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (variables: { data: { id: string } }) => deleteAsset({ data: variables.data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset deleted successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [initialValue, setInitialValue] = useState("");

  const [currency, setCurrency] = useState("USD");

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    createAssetMutation.mutate({
      data: {
        name,
        asset_type_id: typeId || undefined,
        account_id: accountId || undefined,
        current_value: parseFloat(currentValue),
        initial_value: parseFloat(initialValue || currentValue),
        currency
      }
    });
  };

  const { data: exchangeRates } = useSuspenseQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => getExchangeRates(),
  });

  const rate = exchangeRates?.[0]?.rate || 4000;
  const toUSD = (amount: number, currency: string) => currency === 'KHR' ? amount / rate : amount;
  
  const totalAssetsValue = assets.reduce((acc: number, asset: any) => acc + toUSD(asset.current_value, asset.currency || 'USD'), 0);

  const getAssetIcon = (typeName: string) => {
    switch (typeName.toLowerCase()) {
      case 'savings': return <Landmark className="h-5 w-5" />;
      case 'investment': return <Briefcase className="h-5 w-5" />;
      case 'real estate': return <Home className="h-5 w-5" />;
      case 'automobile': return <Car className="h-5 w-5" />;
      default: return <Landmark className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-foreground">Assets</h2>
        <div className="flex gap-2">
          <ExcelImportDialog kind="assets" />
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Asset
          </Button>
        </div>
      </div>

      <Card className="bg-signal text-primary-foreground border-none">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Total Assets Value</p>
            <p className="text-4xl font-bold text-mint tabular-nums">
              {currency === "USD" ? `$${totalAssetsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `៛${(totalAssetsValue * rate).toLocaleString()}`}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrency(prev => prev === "USD" ? "KHR" : "USD")}
            className="text-[10px] h-7 uppercase font-bold tracking-wider text-white border-white/20 hover:bg-white/10"
          >
            View in: {currency === "USD" ? "KHR" : "USD"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset: any) => (
          <Card key={asset.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>{asset.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingAsset(asset);
                      setName(asset.name);
                      setTypeId(asset.asset_type_id || "");
                      setAccountId(asset.account_id || "");
                      setCurrentValue(String(asset.current_value));
                      setInitialValue(String(asset.initial_value || ""));
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (confirm(`Delete asset "${asset.name}"?`)) {
                        deleteAssetMutation.mutate({ data: { id: asset.id } });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70">{asset.asset_types?.name || "Other Asset"}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-mint">{asset.currency === 'KHR' ? '៛' : '$'}{asset.current_value.toLocaleString()}</p>
              <div className="mt-2 text-xs flex justify-between text-muted-foreground">
                <span>Initial: {asset.currency === 'KHR' ? '៛' : '$'}{asset.initial_value.toLocaleString()}</span>
                <span className={asset.current_value >= asset.initial_value ? "text-signal" : "text-ember"}>
                  {((asset.current_value - asset.initial_value) / asset.initial_value * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAsset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={typeId} onValueChange={setTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Linked Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {accounts.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
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
                <Label>Current Value</Label>
                <Input type="number" value={currentValue} onChange={e => setCurrentValue(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Initial Value</Label>
              <Input type="number" value={initialValue} onChange={e => setInitialValue(e.target.value)} placeholder="Same as current" />
            </div>
            <Button type="submit" className="w-full" disabled={createAssetMutation.isPending}>
              {createAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Asset
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            updateAssetMutation.mutate({
              data: {
                id: editingAsset.id,
                name,
                asset_type_id: typeId || null,
                account_id: accountId === "none" ? null : (accountId || null),
                current_value: parseFloat(currentValue),
                initial_value: initialValue ? parseFloat(initialValue) : null,
                currency: currency
              }
            });
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Asset Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={typeId} onValueChange={setTypeId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Linked Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {accounts.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
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
                <Label>Current Value</Label>
                <Input type="number" value={currentValue} onChange={e => setCurrentValue(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Initial Value</Label>
              <Input type="number" value={initialValue} onChange={e => setInitialValue(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={updateAssetMutation.isPending}>
              {updateAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
