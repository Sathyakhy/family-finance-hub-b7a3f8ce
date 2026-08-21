# Plan: Dashboard Enhancements and Mobile Optimization

Implement drill-down functionality for the Sankey flow, persistent filters, aggregation toggles, and mobile responsiveness.

## User Review Required

> [!IMPORTANT]
> The drill-down panel will appear as a side-sheet (Drawer) on mobile and a sheet or inline section on desktop, showing the detailed transactions for the selected account or category.

## Proposed Changes

### Dashboard Enhancements
- **Drill-down Panel**: Update `Dashboard` component to show a detailed transaction list when a Sankey node (Account or Category) is clicked.
- **Persistent Filters**: Use `localStorage` or `sessionStorage` to persist the selected quick filter and manual date range across refreshes and page changes.
- **Aggregation Toggle**: Add a new control to switch the Sankey flow data aggregation between Daily, Weekly, and Monthly views within the selected date range.
- **Sankey Interaction**: Enhance `SankeyFlow` to pass back the clicked node metadata for the drill-down panel.

### Mobile Optimization
- **Responsive Layout**: Audit and adjust the dashboard grid, filter bar, and chart containers to ensure they fit correctly on small screens.
- **Filter Bar**: Refactor the filter section to be more compact on mobile, potentially using a collapsible or scrollable horizontal layout.
- **Typography**: Ensure all labels and values remain readable but compact on mobile devices.

## Technical Details
- Use `useEffect` to load/save filter state to `localStorage`.
- Update `sankeyData` memo to handle different aggregation granularities if needed, or simply filter the input data based on the selection.
- Implement a `Drawer` or `Sheet` component from the UI library for the drill-down view.
- Refactor `Dashboard`'s `useMemo` hooks to depend on the aggregation toggle.

