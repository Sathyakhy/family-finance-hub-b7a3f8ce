# Family Finance Management System - Module 1: Income

Convert the existing admin dashboard into a family finance management system, starting with the Income module. This includes manual income logging, recurring income schedules, and category management.

## User Review Required

> [!IMPORTANT]
> - Should recurring income automatically generate transaction logs on the due date, or just serve as a reminder?
> - Do you want a dashboard overview showing total income for the month?

## Proposed Changes

### Database Schema (Supabase)

- **income_categories**: Table to manage user-defined income categories (e.g., Salary, Gift, Investment).
- **income_entries**: Table to store individual income transactions (manual or generated).
- **recurring_incomes**: Table to store recurring income rules (amount, category, start date, end date, frequency).

### Backend (Server Functions)

- Create functions to manage income categories (CRUD).
- Create functions to log manual income.
- Create functions to set and manage recurring income rules.

### Frontend (UI/UX)

- **Navigation**: Update the dashboard sidebar/tabs to include "Income" and "Settings".
- **Income View**: 
  - List of recent income entries.
  - Form to log manual income.
  - Section to manage recurring income rules.
- **Settings View**:
  - Sub-setting tab for "Income Categories" to add/edit/delete categories.
- **Loading States**: Maintain the spinner pattern for all data submissions.

## Technical Details

- **Database**:
  - `income_categories`: `id (uuid)`, `user_id (uuid)`, `name (text)`, `icon (text)`, `created_at`.
  - `income_entries`: `id`, `user_id`, `category_id (fk)`, `amount (numeric)`, `date (date)`, `description (text)`, `is_recurring (bool)`.
  - `recurring_incomes`: `id`, `user_id`, `category_id (fk)`, `amount`, `start_date`, `end_date`, `frequency (text - monthly, weekly, etc.)`, `description`.
- **TanStack Router**: New routes for `/_authenticated/income` and `/_authenticated/settings`.
- **State Management**: Use TanStack Query for caching and invalidating finance data.
