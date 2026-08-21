# Plan: Financial Accounts Management

Add a new "Accounts" section (Bank, Cash, etc.) in Settings and link income entries to these accounts.

## User Review Required
- Should we provide default accounts (e.g., "Cash", "Main Bank") for new users?
- Do you want to track account balances (e.g., initial balance)?

## Proposed Changes

### Database & Schema
- Create `accounts` table: `id`, `user_id`, `name` (e.g., "Bank A", "Wallet"), `type` (bank, cash), `initial_balance`.
- Add `account_id` foreign key to `income_entries` and `recurring_incomes`.
- Migration will include `GRANT` statements for `authenticated` and `service_role`.

### Server Functions (`src/lib/finance.functions.ts`)
- Add `getAccounts`, `createAccount`, `updateAccount`, `deleteAccount`.
- Update `logIncome`, `updateIncomeEntry`, `setRecurringIncome`, `updateRecurringIncome` to handle `account_id`.

### UI Updates
#### Settings (`src/routes/_authenticated/settings.tsx`)
- Add an "Accounts" tab to manage bank accounts and cash.
- Implementation for adding/editing/deleting accounts with optimistic UI.

#### Income Management (`src/routes/_authenticated/income.tsx`)
- Add "Account" selection dropdown to manual and recurring income forms.
- Display the linked account in history cards.
- Update mutations and state management to handle the new `account_id` field.

## Technical Details
- Use Zod for validation in server functions.
- TanStack Query invalidation for `accounts` and dependent `income` queries.
- SQL migration for the new table and columns.
