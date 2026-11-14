# Implementation Plan: Admin Product Management

## Overview

This plan replaces the inline `AdminProducts.tsx` form with a Shopify-inspired product management system. The implementation follows the existing codebase patterns: Joi validation, `ApiResponse` utility, `invalidateCachePattern('products:*')` on writes, `verifyToken + verifyAdmin` middleware, `cron` for background jobs, `multer → imageOptimizer → uploadToCloudinary` for images, and `shadcn/ui + Tailwind CSS` on the frontend.

Implementation phases:
1. **Backend foundation** — extend Product schema, create InventoryHistory model and Joi validators
2. **Backend API** — adminProductController, adminRoutes wiring, scheduled publish job
3. **Frontend store and API client** — Zustand store, apiClient extensions
4. **Frontend AdminProductList** — replaces current list view in AdminProducts.tsx
5. **Frontend shared admin components** — VariantEditor, ImageGallery, SerpPreview, BulkActionBar, ImportExportPanel
6. **Frontend AdminProductForm** — multi-section accordion form page
7. **Testing** — PBT properties, integration tests

---

## Tasks

- [x] 1. Extend Product model and create backend foundation files

  - [x] 1.1 Extend `matasree-backend/src/models/Product.ts` with new fields and interfaces
    - Add `IProductVariantExtended`, `IProductSeo`, `IProductShipping`, `IProductAttribute`, `IRelatedProduct`, `ProductStatus` TypeScript interfaces/types
    - Replace `productVariantSchema` with extended variant schema adding `sku`, `barcode`, `mrp`, `sellingPrice`, `discountPercent`, `discountAmount`, `reservedStock`, `lowStockThreshold`, `isAvailable`, `variantImage` — keep legacy `weight`, `price`, `originalPrice`, `stock` fields intact
    - Add optional fields to `productSchema` with defaults: `slug`, `brand`, `subcategory`, `shortDescription`, `fullDescription`, `status`, `scheduledPublishAt`, `isFeatured`, `isNewArrival`, `featuredImage`, `searchKeywords`, `seo`, `shipping`, `attributes`, `relatedProducts`
    - Add pre-save hook for auto-generating unique slugs (lowercase, hyphenated, suffix on collision)
    - Add new indexes: `slug` (unique, sparse), `brand`, `status`, `isFeatured`, `isNewArrival`, `price`, `createdAt desc`, `sold desc` — preserve all existing indexes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 15.1, 15.2, 16.1, 16.2_

  - [ ]* 1.2 Write property test for slug uniqueness (Property 3)
    - **Property 3: Slug Uniqueness — Auto-Suffix Prevents Collisions**
    - **Validates: Requirement 1.4**
    - Create `matasree-backend/src/controllers/__tests__/adminProduct.pbt.test.ts`
    - Use `fast-check` `fc.asyncProperty` to generate N products with identical names, assert all generated slugs are distinct
    - _Requirements: 1.4_

  - [x] 1.3 Create `matasree-backend/src/models/InventoryHistory.ts`
    - Define `IInventoryHistory` interface with fields: `productId` (ref Product), `variantId`, `variantWeight`, `deltaQuantity`, `previousStock`, `newStock`, `reason`, `performedBy` (ref User), `note`, timestamps
    - Define and export `inventoryHistorySchema` and default model
    - Add indexes: `{ productId: 1, createdAt: -1 }`
    - _Requirements: 4.6_

  - [x] 1.4 Create `matasree-backend/src/validators/productValidator.ts`
    - Implement `variantExtendedSchema` with custom validator rejecting `sellingPrice > mrp`
    - Implement `seoSchema`, `shippingSchema`, `attributeSchema`, `relatedProductSchema`
    - Implement and export `adminProductSchema` covering all required and optional product fields (see design)
    - Implement and export `bulkOperationSchema` and `stockAdjustmentSchema`
    - _Requirements: 2.4, 7.2, 7.3, 14.5_

  - [ ]* 1.5 Write property tests for discount calculation and selling price constraint (Properties 1 and 2)
    - **Property 1: Discount Calculation Round-Trip**
    - **Validates: Requirements 2.2, 2.3**
    - **Property 2: Selling Price Never Exceeds MRP**
    - **Validates: Requirement 2.4**
    - Add to `adminProduct.pbt.test.ts`
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 1.6 Update `matasree-backend/src/controllers/productController.ts` — add default `status: 'active'` filter
    - In `getProducts`, add `if (!query.status) { query.status = 'active'; }` after the query object is built but before the `Product.find()` call
    - Do not modify or remove any existing query parameters — this is additive only
    - _Requirements: 15.4, 16.4_

  - [ ]* 1.7 Write property test for available stock invariant (Property 9)
    - **Property 9: Available Stock Invariant**
    - **Validates: Requirement 4.1**
    - Add to `adminProduct.pbt.test.ts`; implement `computeAvailableStock(currentStock, reservedStock)` helper inline
    - _Requirements: 4.1_

- [ ] 2. Implement backend admin product controller and routes

  - [ ] 2.1 Create `matasree-backend/src/controllers/adminProductController.ts` — CRUD and utility endpoints
    - Implement `listProducts`: paginated `GET /api/admin/products` supporting `page`, `limit`, `sort`, `search`, `category`, `brand`, `status`, `inStock`, `isFeatured`, `dateFrom`, `dateTo` query params; no default status filter (admin sees all)
    - Implement `getProduct`: full product with populated category and relatedProducts
    - Implement `createProduct`: Joi validate with `adminProductSchema`, `findOrCreateCategory`, sync legacy variant fields (`variant.price = variant.sellingPrice`, `variant.originalPrice = variant.mrp`), compute top-level `price = min(sellingPrice of available variants)`, create `InventoryHistory` initial entries, invalidate cache; validate SKU uniqueness before save
    - Implement `updateProduct`: same as create but `findByIdAndUpdate`; on stock changes create InventoryHistory entries
    - Implement `deleteProduct`: hard delete, invalidate cache
    - Implement `updateProductStatus`: `PATCH /:id/status`, accepts `{ status: string }`, validates against ProductStatus enum
    - Implement `duplicateProduct`: copy doc, prefix name with "Copy of ", generate new slug, set `status: 'draft'`, clear `scheduledPublishAt`
    - Export `computeTopLevelPrice` and `syncLegacyVariantFields` as named exports for unit testing
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.8, 14.9, 16.2, 16.3_

  - [ ]* 2.2 Write property tests for top-level price sync and SKU uniqueness (Properties 4 and 5)
    - **Property 4: Top-Level Price Sync**
    - **Validates: Requirements 16.3, 2.10**
    - **Property 5: SKU Uniqueness Within a Product**
    - **Validates: Requirement 2.9**
    - Add to `adminProduct.pbt.test.ts`; import `computeTopLevelPrice` and `validateSkuUniqueness` from controller
    - _Requirements: 2.9, 2.10, 16.3_

  - [ ] 2.3 Add inventory and bulk endpoints to `adminProductController.ts`
    - Implement `getInventory`: `GET /:id/inventory` — per-variant current/reserved/available stock with last-updated timestamp
    - Implement `adjustVariantStock`: `PUT /:id/variants/:variantId/stock` — validate with `stockAdjustmentSchema`, update variant stock, create `InventoryHistory` record, invalidate cache
    - Implement `getInventoryHistory`: `GET /:id/inventory/history` — paginated history for product
    - Implement `bulkOperation`: `POST /bulk` — validate with `bulkOperationSchema`; handle `delete`, `status`, `category`, `discount`, `price`, `inventory` actions; use `Product.updateMany` for simple field updates, per-product loop for inventory/delete; return `{ matched, modified, failed, errors[] }`; invalidate cache
    - _Requirements: 4.5, 4.6, 12.4_

  - [ ]* 2.4 Write property test for bulk operation atomicity (Property 6)
    - **Property 6: Bulk Operation Atomicity**
    - **Validates: Requirement 12.4**
    - Add to `adminProduct.pbt.test.ts`; mock DB layer to test all matched products receive new status
    - _Requirements: 12.4_

  - [ ] 2.5 Add export/import and search-picker endpoints to `adminProductController.ts`
    - Implement `exportProducts`: `GET /export` — query all products, generate CSV using `fast-csv` with columns defined in design doc, set `Content-Disposition: attachment; filename=products.csv`, stream response
    - Implement `importProducts`: `POST /import` (accepts `upload.single('file')`) — parse CSV with `csv-parse` or XLSX with `xlsx`; group rows by name/productId; for each group: validate with `adminProductSchema`, check SKU uniqueness, upsert or create; collect per-row errors; return `{ created, updated, failed, errors[] }`; invalidate cache after successful rows
    - Implement `searchPickerProducts`: `GET /search-picker` — lightweight search by name/id returning `{ _id, name, image, price }` (max 20 results)
    - _Requirements: 12.5, 12.6, 12.7, 12.8, 11.5_

  - [ ]* 2.6 Write property test for CSV export/import round-trip (Property 7)
    - **Property 7: CSV Export → Import Round-Trip**
    - **Validates: Requirements 12.5, 12.7**
    - Add to `adminProduct.pbt.test.ts`; use `fast-check` to generate random product data, export to CSV string, parse back, assert core fields preserved
    - _Requirements: 12.5, 12.7_

  - [ ] 2.7 Register all new admin product routes in `matasree-backend/src/routes/adminRoutes.ts`
    - Import `adminProductController` and `upload` middleware
    - Define `invalidateProductsCache` helper inside the file (matching pattern in `productRoutes.ts`)
    - Register all 14 routes as specified in the design doc's Route Registration section, placed inside the `router.use(verifyToken, verifyAdmin)` guard block (already present in file)
    - Ensure parameterised routes (`/:id`, `/:id/status`, etc.) are registered AFTER fixed-path routes (`/export`, `/search-picker`, `/bulk`) to prevent route shadowing
    - _Requirements: 14.1–14.9, 4.5, 4.6, 12.4–12.8_

  - [ ] 2.8 Create `matasree-backend/src/jobs/scheduledPublishJob.ts`
    - Follow exact same structure as `cartAbandonmentJob.ts`
    - Implement `runScheduledPublishJob`: `Product.updateMany({ status: 'scheduled', scheduledPublishAt: { $lte: now } }, { $set: { status: 'active', scheduledPublishAt: null } })`, log modifiedCount, call `invalidateCachePattern('products:*')` when `modifiedCount > 0`
    - Implement `initScheduledPublishJob`: `cron.schedule('* * * * *', ...)` (every 1 minute)
    - Register `initScheduledPublishJob()` in `matasree-backend/src/server.ts` alongside `initCartAbandonmentJob()`
    - _Requirements: 18.1, 18.2, 18.3_

  - [ ]* 2.9 Write property test for scheduled publish logic (Property 8)
    - **Property 8: Scheduled Publish Only Triggers on Due Products**
    - **Validates: Requirements 18.2, 18.5**
    - Add to `adminProduct.pbt.test.ts`; implement `simulateScheduledPublish` helper that applies the same `updateMany` filter logic against an in-memory object; assert correct status transitions
    - _Requirements: 18.2, 18.5_

- [ ] 3. Checkpoint — Backend foundation complete
  - Ensure all backend TypeScript compiles without errors (`cd matasree-backend && npx tsc --noEmit`)
  - Ensure all new backend tests pass (`cd matasree-backend && npx jest --testPathPattern=adminProduct`)
  - Ask the user if any backend adjustments are needed before proceeding to frontend work

- [ ] 4. Implement frontend Zustand store and apiClient extensions

  - [ ] 4.1 Create `matasree-superstore-main/src/store/productAdminStore.ts`
    - Define `ProductListFilters` and `ImportResult` TypeScript interfaces
    - Implement Zustand `useProductAdminStore` with state: `selectedProductIds`, `listFilters`, `isImporting`, `importResult`
    - Implement actions: `setSelectedIds`, `toggleSelected`, `clearSelection`, `setListFilters`, `setImportResult`
    - _Requirements: 12.1, 12.2_

  - [ ] 4.2 Add admin product API methods to `matasree-superstore-main/src/services/api.ts`
    - Add typed methods to the existing `ApiClient` class: `adminListProducts`, `adminGetProduct`, `adminCreateProduct`, `adminUpdateProduct`, `adminDeleteProduct`, `adminUpdateProductStatus`, `adminDuplicateProduct`, `adminBulkOperation`, `adminExportProducts` (responseType blob), `adminImportProducts` (multipart), `adminGetInventory`, `adminAdjustVariantStock`, `adminGetInventoryHistory`, `adminSearchPicker`
    - Match existing method style in the file (no default exports, class methods, `this.client.*`)
    - _Requirements: 14.1–14.9, 12.4–12.8_

- [ ] 5. Implement shared admin UI components

  - [ ] 5.1 Create `matasree-superstore-main/src/components/admin/VariantEditor.tsx`
    - Inline-editable shadcn `Table` with one row per variant
    - Fields per row: weight, SKU, barcode, MRP, Selling Price, Discount %, Stock, Low Stock Threshold, Available toggle, Variant Image URL, delete button
    - Bidirectional discount calculator: changing `discountPercent` recalculates `sellingPrice`; changing `sellingPrice` recalculates `discountPercent`; both round to 2 decimal places
    - Show inline error if `sellingPrice > mrp`
    - "Add Variant" button adds a blank row; "Duplicate" copies selected row with blank SKU; guard: minimum 1 variant
    - Client-side SKU uniqueness check on blur
    - _Requirements: 2.1–2.9_

  - [ ] 5.2 Create `matasree-superstore-main/src/components/admin/ImageGallery.tsx`
    - Use `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop image reorder (check `package.json` first; install if missing)
    - Multi-file `<input multiple>` accepting JPEG, PNG, WebP; validate mime type and size (≤ 5 MB) client-side before upload; reject invalid files with inline error
    - Show per-file indeterminate upload spinner immediately on selection
    - Sequential uploads via `apiClient.uploadImage`; append returned URL to images array
    - Each image card: thumbnail, alt-text input, "Set as Featured" button, delete (×) button
    - Max 10 images enforced client-side
    - _Requirements: 3.1–3.8, 17.1–17.6_

  - [ ] 5.3 Create `matasree-superstore-main/src/components/admin/SerpPreview.tsx`
    - Accept `seoTitle`, `seoDescription`, `slug`, `siteDomain` props
    - Render Google SERP snippet: URL line (green), title line (blue, truncated at 60 chars), description (grey, truncated at 160 chars)
    - Update in real time as props change
    - Export `CharCount` helper component: green when within limit, red when exceeded
    - _Requirements: 6.4, 6.5, 6.6_

  - [ ] 5.4 Create `matasree-superstore-main/src/components/admin/BulkActionBar.tsx`
    - Sticky banner rendered at bottom of viewport when `selectedIds.length > 0`
    - Action dropdown: Delete, Change Status, Change Category, Apply Discount %, Update Price, Update Inventory, Export Selected
    - Delete triggers shadcn `AlertDialog` showing count; cancelling prevents operation
    - Other actions show an inline options panel for value input before calling `apiClient.adminBulkOperation`
    - On success: `toast.success`, call `clearSelection()`, trigger `onRefetch` callback prop
    - _Requirements: 12.1–12.4_

  - [ ] 5.5 Create `matasree-superstore-main/src/components/admin/ImportExportPanel.tsx`
    - Export button: calls `apiClient.adminExportProducts()`, triggers browser download via blob URL
    - Import file picker: accepts CSV and XLSX files; on selection calls `apiClient.adminImportProducts(formData)`
    - Show loading state during upload
    - Display result summary in a shadcn `Sheet`: Created / Updated / Failed counts, per-row error table if errors exist
    - On successful import trigger `onRefetch` callback prop
    - _Requirements: 12.5–12.8_

- [ ] 6. Implement AdminProductList page (replaces existing AdminProducts.tsx)

  - [ ] 6.1 Replace `matasree-superstore-main/src/pages/AdminProducts.tsx` with new AdminProductList implementation
    - Replace entire file content (do not create a new file — update the existing route)
    - Server-side pagination via `apiClient.adminListProducts(listFilters)` using `listFilters` from `useProductAdminStore`
    - Render shadcn `Table` with columns: Thumbnail, Product Name, Category, Variants (count), Stock, MRP, Selling Price, Status badge, Featured toggle, Date Created, Actions
    - Status badges colour-coded: Active (green), Draft (grey), Scheduled (blue), Hidden (yellow), Archived (red)
    - Show skeleton rows while loading; set `aria-busy="true"` on table region
    - Actions column: View (new tab), Edit (navigate to `/admin/products/:id/edit`), Duplicate, Delete (confirmation dialog), Archive, Quick Update popover (inline status/price)
    - Confirmation dialog for Delete: if dialog cannot appear, still allow delete to proceed (Req 11.7)
    - Filter controls sidebar/popover: Category, Brand, Status, Price Range, Stock Level, Featured, Date Range
    - Search bar (min 2 chars) using `listFilters.search` — debounced 300 ms
    - Page size selector: 10, 25, 50, 100
    - Row checkboxes + select-all header checkbox; selected IDs stored in `useProductAdminStore`
    - Renders `BulkActionBar` (appears when selections > 0) and `ImportExportPanel`
    - "Add Product" button navigates to `/admin/products/new`
    - _Requirements: 11.1–11.8, 12.1, 12.2, 18.4, 19.2, 19.5_

  - [ ] 6.2 Add routes for AdminProductForm in `matasree-superstore-main/src/App.tsx`
    - Add two new protected admin routes: `/admin/products/new` and `/admin/products/:id/edit` both rendering `<AdminProductForm />`
    - Keep existing `/admin/products` route pointing to the updated `AdminProducts` component
    - Import `AdminProductForm` lazily (`React.lazy`) to avoid increasing initial bundle size
    - _Requirements: 13.1_

- [ ] 7. Implement AdminProductForm page

  - [ ] 7.1 Create `matasree-superstore-main/src/pages/AdminProductForm.tsx` — page shell and Basic Information accordion
    - Route params: `productId` (undefined for new, string for edit)
    - On mount with `productId`: fetch via `apiClient.adminGetProduct(productId)`, populate local form state
    - Autosave to `localStorage` every 60 s when `isDirty` using key `adminProductDraft_{productId|'new'}`
    - On mount: check localStorage for saved draft and offer restore via toast action
    - `useBeforeUnload` hook + React Router `useBlocker` for unsaved changes navigation guard
    - Ctrl+S / Cmd+S keydown handler triggers save
    - Sticky `StickyActionBar` with "Save" and "Save as Draft" buttons (always visible while scrolling)
    - Accordion layout using shadcn `Accordion` component
    - Implement "Basic Information" accordion section: name, brand, slug (read-only auto-generated, shown as `/{slug}`), category (searchable select from `useCategories`), subcategory, shortDescription (plain text, max 300), fullDescription (textarea / rich text), `isFeatured`, `isBestseller`, `isNewArrival`, `isNew` flags
    - _Requirements: 13.1–13.9_

  - [ ] 7.2 Add Variants, Inventory, and Visibility accordion sections to `AdminProductForm.tsx`
    - **Variants section**: render `<VariantEditor>` component passing variants array and onChange handler
    - **Inventory section**: display per-variant inventory table (current/reserved/available); highlight variants at or below `lowStockThreshold` with yellow warning; show "Out of Stock" badge for `availableStock === 0`; "Adjust Stock" button per row calls `apiClient.adminAdjustVariantStock` and opens a small dialog for quantity + reason
    - **Visibility section**: status selector (Active/Draft/Scheduled/Hidden/Archived); when "Scheduled" selected show `scheduledPublishAt` date-time picker (future dates only); display scheduled date/time in Status column
    - Show toast notifications for: product saved, save failed (with message), variant added, variant removed
    - _Requirements: 4.1–4.4, 10.1–10.5, 13.7_

  - [ ] 7.3 Add Images, SEO, Shipping, Search Keywords, Attributes, Related Products accordion sections to `AdminProductForm.tsx`
    - **Images section**: render `<ImageGallery>` component; passes current `images` array and `featuredImage` to gallery; receives updated array on reorder/add/delete
    - **SEO section**: seoTitle input (max 60, prefill placeholder from product name), seoDescription textarea (max 160, prefill placeholder from shortDescription), metaKeywords tag-input, canonicalUrl, ogImage URL; render `<SerpPreview>` and `<CharCount>` updating in real time; render computed product URL as `/{slug}`
    - **Shipping section**: weightGrams, lengthCm, widthCm, heightCm numeric inputs; hsnCode text input (digits only, 4–8 chars); gstPercent select (0/5/12/18/28); countryOfOrigin (default "India"); shippingClass select (Standard/Express/Heavy)
    - **Search Keywords section**: tag-input for `searchKeywords` (add on Enter or comma, no max count)
    - **Attributes section**: key-value row editor with predefined suggestions (Color, Flavor, Pack Size, Spice Level, Shelf Life, Ingredients, Storage Instructions, Manufacturer, FSSAI Number); allow custom keys; add/remove rows
    - **Related Products section**: four subsections (Frequently Bought Together, Recommended, Cross Sell, Upsell); searchable product picker using `apiClient.adminSearchPicker`; selected products shown as removable chips with thumbnail
    - _Requirements: 3.1–3.8, 5.1, 6.1–6.6, 7.1–7.4, 8.1–8.5, 9.1–9.5, 17.1–17.6_

- [ ] 8. Final checkpoint — All tests pass, integration complete
  - Ensure all backend tests pass: `cd matasree-backend && npx jest --testPathPattern=adminProduct --forceExit`
  - Ensure frontend TypeScript compiles: `cd matasree-superstore-main && npx tsc --noEmit`
  - Verify the `/admin/products` list page loads and shows products
  - Verify `/admin/products/new` form opens and the Basic Information section is functional
  - Ask the user if questions arise before marking complete

  - [ ]* 8.1 Write integration tests for admin product API endpoints
    - Create `matasree-backend/src/controllers/__tests__/adminProductController.integration.test.ts`
    - Test `POST /api/admin/products` — create product with full extended schema, assert DB document has all fields
    - Test `POST /api/admin/products/bulk` with `action: 'delete'` — seed products, bulk delete, assert all removed
    - Test `runScheduledPublishJob()` — seed a `scheduled` product with past `scheduledPublishAt`, run job, assert status is `active`
    - Follow pattern of existing integration tests in `__tests__/` directory
    - _Requirements: 14.1, 12.4, 18.2_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP delivery
- All 9 PBT properties from the design doc are covered by sub-tasks 1.2, 1.5, 1.7, 2.2, 2.4, 2.6, 2.9 (Properties 1–9)
- The existing `AdminProducts.tsx` is replaced in-place (Task 6.1) — no new file created — to avoid breaking the `/admin/products` route
- Backend dependencies to install before 2.5: `npm install csv-parse xlsx fast-csv` in `matasree-backend`
- Frontend dependency to check/install before 5.2: `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` in `matasree-superstore-main`
- Each task references specific requirements for full traceability
- Checkpoints (Tasks 3 and 8) validate incremental progress and invite feedback

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.4"] },
    { "id": 1, "tasks": ["1.2", "1.5", "1.6", "1.7"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3"] },
    { "id": 4, "tasks": ["2.4", "2.5"] },
    { "id": 5, "tasks": ["2.6", "2.7", "2.8"] },
    { "id": 6, "tasks": ["2.9", "4.1"] },
    { "id": 7, "tasks": ["4.2"] },
    { "id": 8, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5"] },
    { "id": 9, "tasks": ["6.1", "6.2"] },
    { "id": 10, "tasks": ["7.1"] },
    { "id": 11, "tasks": ["7.2", "7.3"] },
    { "id": 12, "tasks": ["8.1"] }
  ]
}
```
