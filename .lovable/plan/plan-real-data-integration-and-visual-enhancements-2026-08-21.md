# Plan - Real Data Integration and Visual Enhancements

Connect the Sankey flow to actual finance data, add interactivity for filtering, and implement an expense breakdown chart on the dashboard.

## User Review Required

> [!IMPORTANT]
> The interactivity requirement involves filtering "transactions shown below". On the current dashboard, there isn't a single unified "transactions" list, but rather "Recent Income" and "Recurring Schedules" sections. I will implement a unified transaction list (Income + Expenses) below the charts when a Sankey filter is active, or enhance the existing sections to reflect the filters.

## Proposed Changes

### Dashboard Enhancements
- Update `src/routes/_authenticated/dashboard.tsx` to:
    - Process real `entries` (Income) and `expenses` to build the Sankey diagram data.
    - Group Income by category and link to a central "Vault/Budget" node, then link that to Expense categories and Savings.
    - Add state management for `selectedNode` or `selectedLink` from the Sankey chart.
    - Implement a unified "Filtered Transactions" view that appears when a Sankey element is clicked.
    - Add a new "Expense Breakdown" chart (Pie/Donut) below the Sankey flow.

### Sankey Component Updates
- Modify `src/components/SankeyFlow.tsx` to:
    - Add `onNodeClick` and `onLinkClick` callbacks.
    - Enhance visual feedback (highlighting) for selected elements.
    - Use theme-consistent colors for different nodes (Income = Signal/Mint, Expenses = Ember).

### Data Visualization
- Add `ExpenseBreakdown` component (or implement directly in dashboard) using `recharts` PieChart to show spending by category.

## Technical Details

- **Sankey Data Structure**: 
    - Nodes: All unique Income Categories, All unique Expense Categories, "Total Income" (hub), "Savings".
    - Links: [Income Category -> Total Income], [Total Income -> Expense Category], [Total Income -> Savings].
- **Filtering Logic**: Clicking an Income Category node will filter the transaction list to show only entries from that category. Clicking an Expense Category node filters for those expenses.
- **State Preservation**: Filtering state will be local to the dashboard session.

## Verification Plan

### Manual Verification
- Verify Sankey node sizes match the sum of transactions in those categories.
- Click "Food" (Expense) in Sankey and confirm the list below updates to show only food expenses.
- Toggle USD/KHR and verify all charts (Sankey, Breakdown) update correctly with the exchange rate.
- Check dark/light mode contrast for the new charts.
