# Implementation Plan - Edit/Delete Actions and Performance Optimization

This plan adds editing and deletion capabilities for manual income entries and recurring schedules, while optimizing tab navigation performance by prefetching data.

## User Review Required

> [!IMPORTANT]
> - Deleting a recurring schedule will stop all future occurrences from being automatically calculated.
> - Editing a recurring schedule will update the template for all future instances.

## Proposed Changes

### Backend Logic (Server Functions)
- Add `updateIncomeEntry` and `deleteIncomeEntry` functions to `src/lib/finance.functions.ts`.
- Add `updateRecurringIncome` and `deleteRecurringIncome` functions to `src/lib/finance.functions.ts`.
- Ensure all functions use proper validation and user authorization.

### Frontend UI (Income Module)
- Modify `src/routes/_authenticated/income.tsx` to:
    - Add Edit and Delete buttons to the "History" tab for manual entries.
    - Add a "Schedules" list to the "Recurring Income" tab with Edit/Delete actions.
    - Implement an "Edit Mode" for the forms to handle updates.
    - Use `queryClient.prefetchQuery` to pre-load data for other tabs when a user hovers over a tab trigger, reducing perceived latency.

### Performance Optimization
- Implement a `loader` in `src/routes/_authenticated/income.tsx` to fetch all necessary data in parallel during route transition.
- Use TanStack Router's `preload` features to ensure data is ready before the user clicks.

## Technical Details

### Server Function Updates
```typescript
export const deleteIncomeEntry = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    // ... Supabase delete logic
  });
// Similar for update and recurring incomes
```

### UI Enhancements
- Integration of `Dialog` or inline form switching for editing.
- Confirmation prompts for deletion to prevent accidental data loss.
- `onMouseEnter` prefetching for `TabsTrigger` components.
