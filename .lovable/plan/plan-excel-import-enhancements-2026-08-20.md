# Plan: Excel Import Enhancements

Enhance the Excel import process with multi-currency support, optional sub-categories, a preview step, and a detailed summary of auto-created entities.

## Proposed Changes

### Database & Types
- Update `src/lib/import-schemas.ts` to ensure all fields are optional where appropriate.
- Update `src/lib/finance-import.server.ts` to track and return auto-created categories, sub-categories, and accounts.

### Server Functions
- Modify `importEntries` and `importAssetRows` in `src/lib/finance-import.server.ts` to:
    - Handle optional sub-categories safely.
    - Track new entities (names of categories, sub-categories, accounts) created during the process.
    - Return a detailed summary object including counts and lists of created names.

### UI Components
- **ExcelImportDialog.tsx**:
    - Update `TEMPLATES` to include "Currency" column for Assets (already exists for others).
    - Implement a `PreviewStep` state to display parsed rows before submission.
    - Implement a `SummaryStep` state to show the results of the import (inserted, failed, and auto-created items).
    - Add logic to identify which items *will* be auto-created during the preview phase.

## Technical Details
- The preview step will use local parsing (XLSX) to show the first few rows.
- The backend will return a summary object: `{ inserted: number, skipped: number, errors: string[], created: { categories: string[], subCategories: string[], accounts: string[] } }`.
- Multi-currency support is already present in fields; this will ensure it's properly handled in the UI preview and summary.

## Constraints & Rules
- Do not make any visual modifications beyond what is required for the new import flow logic.
- Ensure tabular figures and consistent typography are maintained in the new summary/preview sections.
