# Plan - Salary Date and Business Day Logic for Recurring Income

I will implement the ability to set a specific day of the month for recurring income, including logic to handle weekends (moving to Friday) and months with fewer days (moving to the last day of the month).

## Proposed Changes

### Database Schema
- Create a migration to add `day_of_month` (integer) and `auto_log_enabled` (boolean) to the `recurring_incomes` table.
- I'll assume `auto_log_enabled` is for future background processing, but for now, I'll focus on the UI/UX and calculation logic as requested.

### Backend Functions
- Update `src/lib/finance.functions.ts`:
    - Modify `setRecurringIncome` and `updateRecurringIncome` to handle the new fields.
    - Implement a utility function `calculateNextSalaryDate(day: number, month: number, year: number)` that:
        - Checks if the day exists in the month (e.g., handles 31st in February).
        - Checks if the date falls on a weekend and moves it to the preceding Friday.
    - *Note*: While the user mentioned auto-logging, full background automation would require a cron job or similar. I will implement the logic and ensure the data model supports it.

### UI Enhancements
- Update `src/routes/_authenticated/income.tsx`:
    - Add a "Specific Day of Month" input when "monthly" frequency is selected.
    - Add an "Auto-log on this day" checkbox.
    - Update the "Recurring Income" tab and edit dialog to include these new fields.
    - Display the "Effective Salary Date" (calculated using the business day logic) in the recurring schedule preview.

## Technical Details
- **Business Day Logic**:
    - Use `date-fns` (if available) or standard `Date` object to check `getDay()`.
    - `0` (Sunday) -> move back 2 days.
    - `6` (Saturday) -> move back 1 day.
    - Check month length: `new Date(year, month, 0).getDate()` to get the last day of the month.
- **Validation**:
    - Ensure `day_of_month` is between 1 and 31.

## User Review Required
> [!IMPORTANT]
> The "Auto-log" feature requires a server-side process (like a cron job) to actually insert entries into `income_entries` on the specified dates. This plan covers the schema and UI to *set* these preferences, but the background runner itself may need separate configuration if not already present in the platform's standard background tasks.
