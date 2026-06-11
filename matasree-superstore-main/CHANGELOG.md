# Changelog

All notable changes to the Matasree Superstore frontend are documented here.

---

## [Unreleased]

### Removed — Task 4.2: Dead code cleanup (Requirements 35.1–35.4)

The following files were audited for active imports across the entire codebase and found to be completely unreferenced. They have been deleted.

**Static data files**

| File | Reason for removal |
|------|-------------------|
| `src/data/products.ts` | Not imported by any active component, page, or service |
| `src/data/companyData.ts` | Not imported by any active component, page, or service |

**Dead UI components**

| File | Reason for removal |
|------|-------------------|
| `src/components/TeamSection.tsx` | Not rendered in any page or component tree |
| `src/components/TraditionalElements.tsx` | Not rendered in any page or component tree |

**Verification**

`tsc --noEmit` was run against the project (with `noUnusedLocals: true` already set in `tsconfig.app.json`) after deletion and reported zero errors, confirming no remaining code references the deleted files.
