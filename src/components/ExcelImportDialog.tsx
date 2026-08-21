import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { importAssetsFromFile, importEntriesFromFile } from "@/lib/finance.functions";

type Kind = "income" | "expense" | "assets";

const TEMPLATES: Record<Kind, { headers: string[]; sample: (string | number)[][] }> = {
  income: {
    headers: ["Date (YYYY-MM-DD)", "Amount", "Currency (USD/KHR)", "Category", "Sub Category", "Account Name", "Account Number", "Account Currency (USD/KHR)", "Description"],
    sample: [["2026-01-15", 2500, "USD", "Salary", "Base Pay", "Chase Bank", "123456789", "USD", "January salary"]],
  },
  expense: {
    headers: ["Date (YYYY-MM-DD)", "Amount", "Currency (USD/KHR)", "Category", "Sub Category", "Account Name", "Account Number", "Account Currency (USD/KHR)", "Description"],
    sample: [["2026-01-16", 45.5, "USD", "Food", "Groceries", "Cash Wallet", "", "USD", "Weekly groceries"]],
  },
  assets: {
    headers: ["Name", "Asset Type", "Account", "Current Value", "Initial Value", "Currency (USD/KHR)"],
    sample: [["Family Car", "Automobile", "Bank", 18000, 22000, "USD"]],
  },
};

function toDateString(value: unknown): string {
  if (value instanceof Date) {
    const d = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`;
  }
  const raw = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
  return raw;
}

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

const str = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};

export function ExcelImportDialog({ kind }: { kind: Kind }) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [previewRows, setPreviewRows] = useState<any[] | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const template = TEMPLATES[kind];

  const reset = () => {
    setFileName("");
    setPreviewRows(null);
    setSummary(null);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([template.headers, ...template.sample]);
    ws["!cols"] = template.headers.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, kind);
    XLSX.writeFile(wb, `${kind}-import-template.xlsx`);
  };

  const importMutation = useMutation({
    mutationFn: async (rows: any[]) => {
      if (kind === "assets") return importAssetsFromFile({ data: { rows } });
      return importEntriesFromFile({ data: { kind, rows } });
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries();
      setSummary(result);
      setPreviewRows(null);
      if (result.inserted > 0) toast.success(`Imported ${result.inserted} row(s)`);
    },
    onError: (err: any) => toast.error(err?.message || "Import failed"),
  });

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) throw new Error("The file has no sheets");
      const raw = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[sheetName]!, { header: 1, blankrows: false });
      const body = raw.slice(1).filter((r) => r && r.some((c) => String(c ?? "").trim() !== ""));
      if (!body.length) throw new Error("No data rows found");

      const rows =
        kind === "assets"
          ? body.map((r) => ({
              name: String(r[0] ?? "").trim(),
              asset_type: str(r[1]),
              account: str(r[2]),
              current_value: num(r[3]),
              initial_value: Number.isFinite(num(r[4])) ? num(r[4]) : null,
              currency: str(r[5]) || 'USD',
            }))
          : body.map((r) => ({
              date: toDateString(r[0]),
              amount: num(r[1]),
              currency: str(r[2]) || 'USD',
              category: str(r[3]),
              sub_category: str(r[4]),
              account: str(r[5]),
              account_number: str(r[6]),
              account_currency: str(r[7]) || 'USD',
              description: str(r[8]),
            }));

      setPreviewRows(rows);
    } catch (err: any) {
      toast.error(err?.message || "Could not read the file");
    }
  };

  const confirmImport = () => {
    if (!previewRows) return;
    importMutation.mutate(previewRows);
  };

  return (
    <>
      <Button variant="outline" onClick={() => { setOpen(true); reset(); }}>
        <Upload className="mr-2 h-4 w-4" /> Import
      </Button>

      <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) reset(); }}>
        <DialogContent className={previewRows ? "max-w-4xl" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle>
              {summary ? "Import Summary" : previewRows ? "Preview Import" : `Import ${kind} from Excel`}
            </DialogTitle>
            <DialogDescription className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/70">
              {summary ? "Review the results of your import." : previewRows ? "Confirm the parsed data before importing." : "Download the template, fill it in, then upload the .xlsx or .csv file."}
            </DialogDescription>
          </DialogHeader>

          {summary ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums text-primary">{summary.inserted}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Successful</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums text-destructive">{summary.skipped}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Failed/Skipped</p>
                </div>
              </div>

              {summary.created && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Auto-Created Entities</h4>
                  <div className="space-y-2">
                    {Object.entries(summary.created).map(([key, items]: [string, any]) => (
                      items.length > 0 && (
                        <div key={key} className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold uppercase text-muted-foreground/60">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <div className="flex flex-wrap gap-1">
                            {items.map((item: string) => (
                              <span key={item} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                    {Object.values(summary.created).every((arr: any) => arr.length === 0) && (
                      <p className="text-[11px] text-muted-foreground italic">No new categories or accounts were created.</p>
                    )}
                  </div>
                </div>
              )}

              {summary.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-destructive/80">Errors</h4>
                  <ul className="max-h-32 overflow-y-auto space-y-1 rounded border border-destructive/20 bg-destructive/5 p-2">
                    {summary.errors.map((err: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-destructive/90 leading-tight">
                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button className="w-full" onClick={() => setOpen(false)}>Close</Button>
            </div>
          ) : previewRows ? (
            <div className="space-y-4">
              <div className="max-h-64 overflow-auto rounded border">
                <table className="w-full text-[10px]">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm border-b">
                    <tr>
                      {template.headers.map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-2 py-1.5 tabular-nums truncate max-w-[200px]">{String(val ?? "-")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewRows.length > 10 && (
                <p className="text-[10px] text-muted-foreground text-center italic">Showing first 10 rows of {previewRows.length}</p>
              )}

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 text-[11px] font-black uppercase tracking-widest" onClick={() => setPreviewRows(null)}>Back</Button>
                <Button className="flex-2 text-[11px] font-black uppercase tracking-widest" onClick={confirmImport} disabled={importMutation.isPending}>
                  {importMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Confirm & Import {previewRows.length} Rows
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="secondary" className="w-full" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" /> Download Template
              </Button>

              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />

              <Button
                className="w-full"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" /> Choose File
              </Button>

              {fileName && <p className="text-[11px] text-muted-foreground font-medium">Selected: {fileName}</p>}

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Columns: {template.headers.join(", ")}. Missing categories, sub-categories, asset types
                and accounts are created automatically. Sub-categories are optional.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}