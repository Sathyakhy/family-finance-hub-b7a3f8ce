type Sb = any;

export type EntryRow = {
  date: string;
  amount: number;
  category?: string | null | undefined;
  sub_category?: string | null | undefined;
  account?: string | null | undefined;
  account_number?: string | null | undefined;
  account_currency?: string | null | undefined;
  description?: string | null | undefined;
  currency?: string | null | undefined;
};

export type AssetRow = {
  name: string;
  asset_type?: string | null | undefined;
  account?: string | null | undefined;
  current_value: number;
  initial_value?: number | null | undefined;
  currency?: string | null | undefined;
};

const norm = (v?: string | null) => (v ?? "").trim().toLowerCase();

async function loadMap(supabase: Sb, table: string, filter?: { col: string; val: string }) {
  let q = supabase.from(table).select("id, name");
  if (filter) q = q.eq(filter.col, filter.val);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const map = new Map<string, string>();
  (data ?? []).forEach((r: any) => map.set(norm(r.name), r.id));
  return map;
}

async function ensure(
  supabase: Sb,
  table: string,
  map: Map<string, string>,
  name: string,
  extra: Record<string, unknown>,
  createdList: string[],
) {
  const key = norm(name);
  const existing = map.get(key);
  if (existing) return existing;
  const { data, error } = await supabase
    .from(table)
    .insert({ name: name.trim(), ...extra })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  map.set(key, data.id);
  createdList.push(name.trim());
  return data.id as string;
}

export async function importEntries(
  supabase: Sb,
  userId: string,
  kind: "income" | "expense",
  rows: EntryRow[],
) {
  const catTable = kind === "income" ? "income_categories" : "expense_categories";
  const subTable = kind === "income" ? "income_sub_categories" : "expense_sub_categories";
  const entryTable = kind === "income" ? "income_entries" : "expense_entries";

  const accounts = await loadMap(supabase, "accounts");
  const categories = await loadMap(supabase, catTable);
  const subCache = new Map<string, Map<string, string>>();

  const payload: any[] = [];
  const errors: string[] = [];
  const created = { categories: [] as string[], subCategories: [] as string[], accounts: [] as string[] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const line = i + 2;
    if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
      errors.push(`Row ${line}: invalid date (expected YYYY-MM-DD)`);
      continue;
    }
    if (!Number.isFinite(row.amount) || row.amount <= 0) {
      errors.push(`Row ${line}: invalid amount`);
      continue;
    }

    let categoryId: string | null = null;
    let subCategoryId: string | null = null;
    let accountId: string | null = null;

    if (row.category?.trim()) {
      categoryId = await ensure(supabase, catTable, categories, row.category, { user_id: userId }, created.categories);
      if (row.sub_category?.trim()) {
        if (!subCache.has(categoryId)) {
          subCache.set(
            categoryId,
            await loadMap(supabase, subTable, { col: "category_id", val: categoryId }),
          );
        }
        subCategoryId = await ensure(supabase, subTable, subCache.get(categoryId)!, row.sub_category, {
          user_id: userId,
          category_id: categoryId,
        }, created.subCategories);
      }
    }

    if (row.account?.trim()) {
      accountId = await ensure(supabase, "accounts", accounts, row.account, {
        user_id: userId,
        type: "bank",
        initial_balance: 0,
        account_number: row.account_number?.trim() || null,
        currency: row.account_currency?.trim() || 'USD',
      }, created.accounts);
    }

    payload.push({
      user_id: userId,
      date: row.date,
      amount: row.amount,
      category_id: categoryId,
      sub_category_id: subCategoryId,
      account_id: accountId,
      description: row.description?.trim() || null,
      currency: row.currency?.trim() || 'USD',
    });
  }

  if (payload.length) {
    const { error } = await supabase.from(entryTable).insert(payload);
    if (error) throw new Error(error.message);
  }

  return { inserted: payload.length, skipped: errors.length, errors: errors.slice(0, 20), created };
}

export async function importAssetRows(supabase: Sb, userId: string, rows: AssetRow[]) {
  const accounts = await loadMap(supabase, "accounts");
  const types = await loadMap(supabase, "asset_types");

  const payload: any[] = [];
  const errors: string[] = [];
  const created = { assetTypes: [] as string[], accounts: [] as string[] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const line = i + 2;
    if (!row.name?.trim()) {
      errors.push(`Row ${line}: name is required`);
      continue;
    }
    if (!Number.isFinite(row.current_value)) {
      errors.push(`Row ${line}: invalid current value`);
      continue;
    }

    const typeId = row.asset_type?.trim()
      ? await ensure(supabase, "asset_types", types, row.asset_type, { user_id: userId }, created.assetTypes)
      : null;
    const accountId = row.account?.trim()
      ? await ensure(supabase, "accounts", accounts, row.account, {
          user_id: userId,
          type: "bank",
          initial_balance: 0,
        }, created.accounts)
      : null;

    payload.push({
      user_id: userId,
      name: row.name.trim(),
      asset_type_id: typeId,
      account_id: accountId,
      current_value: row.current_value,
      initial_value: Number.isFinite(row.initial_value as number)
        ? row.initial_value
        : row.current_value,
      currency: row.currency?.trim() || 'USD',
    });
  }

  if (payload.length) {
    const { error } = await supabase.from("assets").insert(payload);
    if (error) throw new Error(error.message);
  }

  return { inserted: payload.length, skipped: errors.length, errors: errors.slice(0, 20), created };
}