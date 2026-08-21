# Plan: Family Finance Tracker - Module Expansion & Aesthetic Refinement

Expanding the finance tracker to include Expenses, Savings, and Assets, while moving toward the "Money Manager" (Realbyte) aesthetic and organization.

## 1. Database Schema Expansion
Add tables and relationships for the full financial suite.
- **Expenses**: `expense_categories`, `expense_sub_categories`, `expense_entries`, `recurring_expenses`.
- **Savings & Assets**: `assets` (including savings accounts, investments, etc.) and `asset_history`.
- **Vouchers**: `financial_vouchers` (for specific tracking/reconciliation).
- **Accounts**: Ensure all entries link to `accounts` (Bank, Cash, etc.).

## 2. Backend Functions (`src/lib/finance.functions.ts`)
Implement CRUD for the new modules.
- Expense management (similar to Income logic).
- Asset and Savings tracking.
- Voucher creation and management.

## 3. UI Refactoring (Authenticated Layout)
Adjust navigation to match a professional finance app structure.
- **Sidebar/Bottom Nav**: Dashboard (Stats), Trans. (Income/Expense), Accounts (Assets/Savings), Settings.
- **Tabs**: Clean, high-contrast tab systems for switching between Income and Expense within the "Transactions" view.

## 4. Feature Implementation
- **Expense Module**: Log manual and recurring expenses.
- **Assets & Savings**: View net worth, manage different account balances.
- **Vouchers**: System for categorizing specific financial events.

## Technical Details
- **Supabase**: New migrations for `expenses`, `assets`, and `vouchers` tables with RLS and `GRANT` statements.
- **TanStack Start**: Server functions for all new CRUD operations.
- **Optimistic UI**: Applying existing patterns to new modules for instant feedback.
- **Theming**: Ensuring the UI remains clean and respects the dark/light mode preference while aligning with the mobile-first "Money Manager" style.
