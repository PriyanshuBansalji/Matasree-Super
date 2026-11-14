# Requirements Document

## Introduction

This document defines requirements for a complete redesign of the Admin Product Management module for the Matasree Store e-commerce platform. The goal is to replace the current basic product form with a production-ready, professional admin dashboard inspired by Shopify, WooCommerce, and Amazon Seller Central. The system must handle multi-variant products (e.g., Chaat Masala in 50g, 100g, 200g, 500g, 1kg), rich media management, inventory tracking, SEO, shipping, and bulk operations — all within a mobile-responsive, accessible UI built on the existing React + TypeScript + Tailwind CSS frontend and Node.js + Express + MongoDB backend.

---

## Glossary

- **Admin_Dashboard**: The admin-facing web application section, accessible to users with role `admin`.
- **Product_Form**: The multi-section UI form used to create or edit a single product.
- **Product_List**: The paginated, filterable table view of all products in the Admin_Dashboard.
- **Variant**: A specific weight/size configuration of a product (e.g., "100g"), each having its own SKU, pricing, stock, and optional image.
- **SKU**: Stock Keeping Unit — a unique alphanumeric identifier for a variant.
- **MRP**: Maximum Retail Price — the original/base price before any discount.
- **Selling_Price**: The actual price charged to customers after applying a discount.
- **Discount_Percent**: The percentage reduction from MRP to derive the Selling_Price.
- **Slug**: A URL-safe, hyphen-separated string derived from the product name, used in the product URL.
- **Inventory**: The stock tracking system per variant, including current, reserved, and available quantities.
- **Low_Stock_Threshold**: The minimum stock quantity below which a low-stock warning is displayed.
- **Rich_Text_Editor**: A WYSIWYG editor component for entering formatted HTML content.
- **SEO_Section**: The portion of the Product_Form dedicated to search engine optimisation fields.
- **Bulk_Operation**: An action applied simultaneously to multiple selected products from the Product_List.
- **CSV_Import**: Uploading a comma-separated values file to create or update multiple products at once.
- **Draft**: A product visibility state where the product is saved but not publicly visible.
- **Featured_Product**: A product marked to appear in curated homepage or category highlights.
- **Product_Attribute**: A dynamic, reusable key-value metadata field (e.g., Flavor: Tangy, Spice Level: Medium).
- **Related_Product**: A product linked to another for cross-sell, upsell, or frequently-bought-together purposes.
- **HSN_Code**: Harmonised System of Nomenclature code used for GST classification in India.
- **Cloudinary**: The third-party image hosting and transformation service already integrated in the backend.
- **Toast_Notification**: A transient, non-blocking UI feedback message displayed to the admin.
- **Autosave**: Automatic periodic saving of form state as a Draft without explicit admin action.

---

## Requirements

### Requirement 1: Product Data Model Extension

**User Story:** As an admin, I want each product to carry rich structured data including brand, subcategory, multiple flags, SEO fields, shipping details, and custom attributes, so that I can manage a complete, production-quality product catalogue.

#### Acceptance Criteria

1. THE Product_Model SHALL store the following core fields: name, slug (unique, URL-safe), brand (string), category (ObjectId ref), subcategory (string), shortDescription (plain text, max 300 characters), fullDescription (HTML rich text), status (`active` | `inactive` | `draft` | `scheduled` | `hidden` | `archived`), scheduledPublishAt (Date, nullable), isFeatured (boolean), isBestseller (boolean), isNewArrival (boolean), featuredImage (URL string), images (array of URL strings), tags (array of strings), searchKeywords (array of strings), seo (embedded object), shipping (embedded object), attributes (array of key-value pairs), relatedProducts (array of ObjectId refs).
2. THE Product_Model SHALL store a `seo` sub-document containing: seoTitle (string), seoDescription (string), metaKeywords (array of strings), canonicalUrl (string), ogImage (URL string).
3. THE Product_Model SHALL store a `shipping` sub-document containing: weightGrams (number), lengthCm (number), widthCm (number), heightCm (number), hsnCode (string), gstPercent (number), countryOfOrigin (string), shippingClass (string).
4. WHEN a product's name is created or changed, THE Product_Model SHALL auto-generate a unique slug by converting the name to lowercase, replacing spaces with hyphens, and appending a short unique suffix if a collision exists.
5. THE Product_Model SHALL maintain backward compatibility with existing `price`, `originalPrice`, `stock`, `weight`, and `variants` fields already used by the storefront and order system.

---

### Requirement 2: Product Variant System

**User Story:** As an admin, I want to define multiple weight/size variants for a single product, each with independent pricing, stock, and SKU, so that customers can choose the size they need.

#### Acceptance Criteria

1. THE Variant SHALL contain: weight (string, e.g. "100g"), sku (string, unique within the product), barcode (string, optional), mrp (number ≥ 0), sellingPrice (number ≥ 0), discountPercent (number 0–100), discountAmount (number ≥ 0), stock (number ≥ 0), lowStockThreshold (number ≥ 0, default 10), isAvailable (boolean), variantImage (URL string, optional).
2. WHEN an admin enters a discountPercent value for a variant, THE Product_Form SHALL automatically calculate and display the corresponding sellingPrice as `sellingPrice = mrp × (1 − discountPercent / 100)`, rounded to two decimal places.
3. WHEN an admin enters a sellingPrice for a variant, THE Product_Form SHALL automatically calculate and display the corresponding discountPercent as `discountPercent = ((mrp − sellingPrice) / mrp) × 100`, rounded to two decimal places.
4. WHEN an admin enters a sellingPrice greater than the mrp, THE Product_Form SHALL display a validation error stating "Selling price cannot exceed MRP".
5. THE Product_Form SHALL allow an admin to add a new blank variant row with default values.
6. THE Product_Form SHALL allow an admin to duplicate an existing variant, creating a new row with the same values and a blank SKU.
7. THE Product_Form SHALL allow an admin to remove any variant, provided at least one variant remains.
8. THE Product_Form SHALL allow an admin to inline-edit all fields of any variant row.
9. WHEN saving a product, THE Admin_Dashboard SHALL validate that all variant SKUs within the product are unique; IF a duplicate SKU is detected, THEN THE Admin_Dashboard SHALL return an error identifying the conflicting SKU.
10. WHEN saving a product with at least one variant, THE Product_Model SHALL set the top-level `price` field to the sellingPrice of the first available variant, for storefront backward compatibility.

---

### Requirement 3: Product Image Management

**User Story:** As an admin, I want to upload multiple product images, reorder them via drag-and-drop, designate a featured image, and preview them before saving, so that customers see high-quality visuals.

#### Acceptance Criteria

1. THE Product_Form SHALL accept image uploads in JPEG, PNG, and WebP formats with a maximum file size of 5 MB per image.
2. THE Product_Form SHALL support uploading up to 10 images per product.
3. WHEN an admin uploads an image, THE Admin_Dashboard SHALL display an upload progress indicator immediately when the upload starts, before file validation completes.
4. WHEN an image upload completes, THE Product_Form SHALL show a thumbnail preview of the uploaded image.
5. IF an uploaded file exceeds 5 MB or is not JPEG, PNG, or WebP, THEN THE Product_Form SHALL display an error message and reject the file without uploading.
6. THE Product_Form SHALL allow an admin to reorder images using drag-and-drop; THE Product_Model SHALL persist the reordered image array.
7. THE Product_Form SHALL allow an admin to designate one image as the featuredImage; this image SHALL be displayed first in the gallery.
8. THE Product_Form SHALL allow an admin to delete any image from the gallery.
9. WHEN an image is uploaded, THE Backend SHALL compress and optimise the image using the existing imageOptimizer middleware before storing it in Cloudinary.
10. WHERE Cloudinary is not configured, THE Backend SHALL fall back to local storage as per the existing upload logic.

---

### Requirement 4: Inventory Management

**User Story:** As an admin, I want to track stock levels per variant, see reserved and available quantities, receive low-stock warnings, and view inventory history, so that I can prevent stockouts and overselling.

#### Acceptance Criteria

1. THE Inventory_System SHALL maintain per-variant fields: currentStock, reservedStock, availableStock (computed as `currentStock − reservedStock`), and lowStockThreshold.
2. WHILE a variant's availableStock is at or below its lowStockThreshold, THE Admin_Dashboard SHALL display a low-stock warning indicator next to that variant.
3. WHILE a variant's availableStock equals zero, THE Admin_Dashboard SHALL display an "Out of Stock" badge next to that variant.
4. THE Admin_Dashboard SHALL display inventory summary statistics for a product: total stock across all variants, total reserved stock, and total available stock.
5. THE Backend SHALL provide an endpoint `GET /api/admin/products/:id/inventory` that returns current, reserved, and available stock per variant along with the last-updated timestamp.
6. THE Backend SHALL provide an endpoint `PUT /api/admin/products/:id/variants/:variantId/stock` that accepts a `quantity` and `reason` field to perform a stock adjustment, and records the change in an InventoryHistory collection.
7. THE Admin_Dashboard low-stock products panel SHALL use the per-variant lowStockThreshold rather than a global threshold.

---

### Requirement 5: Search Keywords and Discoverability

**User Story:** As an admin, I want to attach unlimited search keywords to each product and have the search engine support partial, misspelled, and case-insensitive queries, so that customers can find products easily.

#### Acceptance Criteria

1. THE Product_Form SHALL provide a tag-input control for searchKeywords that accepts individual keywords on Enter or comma press, with no maximum count.
2. WHEN a customer searches, THE Search_Engine SHALL match against the product name, description, tags, and searchKeywords fields in a case-insensitive manner.
3. WHEN a customer search query partially matches a keyword (e.g., "caat" matching "chaat"), THE Search_Engine SHALL return the product in results using fuzzy/regex matching; IF fuzzy or regex matching does not produce a match, THEN THE Search_Engine SHALL return no results for the partial query.
4. THE Search_Engine SHALL support queries containing multiple space-separated keywords, returning products that match any of the provided terms.
5. THE Product_Model SHALL persist all searchKeywords in the existing `tags` array field to maintain backward compatibility with the current MongoDB text index.

---

### Requirement 6: SEO Management

**User Story:** As an admin, I want to fill in SEO metadata for each product — including title, description, meta keywords, canonical URL, and Open Graph image — so that products rank well in search engines and share correctly on social media.

#### Acceptance Criteria

1. THE Product_Form SHALL render a dedicated SEO section containing: seoTitle (input, max 60 characters), seoDescription (textarea, max 160 characters), metaKeywords (tag input), canonicalUrl (URL input), ogImage (image URL or upload control).
2. WHEN the seoTitle field is empty, THE Product_Form SHALL prefill it with the product name as a placeholder suggestion, regardless of whether the product name exceeds 60 characters.
3. WHEN the seoDescription field is empty, THE Product_Form SHALL prefill it with the shortDescription as a placeholder suggestion, regardless of whether the shortDescription exceeds 160 characters.
4. THE Product_Form SHALL display a live character count for seoTitle and seoDescription, highlighting in red when the limit is exceeded.
5. THE Product_Form SHALL display a Google SERP preview snippet that updates in real time as seoTitle and seoDescription are edited.
6. THE Product_Form SHALL display the computed product URL as `/{slug}` to confirm the URL slug.

---

### Requirement 7: Shipping Details

**User Story:** As an admin, I want to record shipping-related information per product — including weight, dimensions, HSN code, and GST percentage — so that shipping costs can be calculated and tax compliance is maintained.

#### Acceptance Criteria

1. THE Product_Form SHALL provide a Shipping section containing: weightGrams (numeric input), lengthCm, widthCm, heightCm (numeric inputs), hsnCode (text input, max 8 digits), gstPercent (numeric input, values: 0, 5, 12, 18, 28), countryOfOrigin (text input, default "India"), shippingClass (select: Standard, Express, Heavy).
2. THE Product_Form SHALL validate that hsnCode contains only digits and is between 4 and 8 characters when provided.
3. THE Product_Form SHALL validate that gstPercent is one of the permitted values: 0, 5, 12, 18, or 28.
4. THE Backend SHALL store all shipping fields in the `shipping` sub-document of the Product_Model.

---

### Requirement 8: Product Attributes

**User Story:** As an admin, I want to attach dynamic key-value attributes to products — such as Color, Flavor, Spice Level, and Shelf Life — so that customers have detailed product information and filtering can be extended.

#### Acceptance Criteria

1. THE Product_Form SHALL provide an Attributes section where an admin can add unlimited key-value pairs.
2. THE Product_Form SHALL offer a predefined attribute name suggestion list including: Color, Flavor, Pack Size, Spice Level, Shelf Life, Ingredients, Storage Instructions, Manufacturer, FSSAI Number.
3. THE Product_Form SHALL allow an admin to type a custom attribute name not in the suggestion list.
4. THE Product_Form SHALL allow an admin to remove any attribute row.
5. THE Product_Model SHALL store attributes as an array of `{ key: string, value: string }` objects.

---

### Requirement 9: Related Products

**User Story:** As an admin, I want to link related products to a product — categorised as Frequently Bought Together, Recommended, Cross Sell, and Upsell — so that the storefront can surface relevant recommendations.

#### Acceptance Criteria

1. THE Product_Form SHALL provide a Related Products section with four subsections: Frequently Bought Together, Recommended, Cross Sell, Upsell.
2. THE Product_Form SHALL provide a searchable product picker control in each subsection, allowing the admin to search products by name and select them.
3. THE Product_Form SHALL display the selected related products as removable chips with product name and thumbnail.
4. THE Product_Model SHALL store relatedProducts as an array of `{ productId: ObjectId, relationType: 'frequently_bought' | 'recommended' | 'cross_sell' | 'upsell' }` objects.
5. THE Backend SHALL populate relatedProducts with product name, image, and price when returning a product via `GET /api/products/:id`.

---

### Requirement 10: Product Visibility and Status

**User Story:** As an admin, I want to control the visibility of each product — including scheduling future publication — so that I can manage product launches and hide outdated items without deleting them.

#### Acceptance Criteria

1. THE Product_Form SHALL provide a Visibility panel with the following status options: Active (publicly visible), Draft (saved, not visible), Scheduled (published at a future date/time), Hidden (not publicly visible, accessible by direct URL), Archived (removed from listings, data retained).
2. WHEN an admin selects "Scheduled", THE Product_Form SHALL display a date-time picker for scheduledPublishAt that only accepts future dates.
3. WHEN scheduledPublishAt is reached, THE Backend SHALL automatically set the product status to `active`.
4. THE Product_List SHALL visually distinguish product status with colour-coded badges: Active (green), Draft (grey), Scheduled (blue), Hidden (yellow), Archived (red).
5. THE Backend SHALL exclude products with status `draft`, `hidden`, or `archived` from all public-facing product listing and search endpoints; products with status `scheduled` SHALL be included in public listings regardless of whether scheduledPublishAt has been reached.

---

### Requirement 11: Product List Page

**User Story:** As an admin, I want a professional, paginated product table with powerful filtering, sorting, and quick-action capabilities, so that I can manage a large catalogue efficiently.

#### Acceptance Criteria

1. THE Product_List SHALL display a table with the following columns: Thumbnail, Product Name, Category, Variants (count), Stock, MRP, Selling Price, Status, Featured, Date Created, Actions.
2. THE Product_List SHALL support server-side pagination with configurable page size (10, 25, 50, 100 items per page).
3. THE Product_List SHALL support server-side sorting by Product Name, Price, Stock, Date Created, and Status.
4. THE Product_List SHALL provide filter controls for: Category, Brand, Status, Price Range, Stock Level (In Stock / Low Stock / Out of Stock), Featured toggle, Date Range.
5. THE Product_List SHALL provide a search bar that performs a server-side full-text search across product name, SKU, and tags with a minimum query length of 2 characters.
6. THE Actions column SHALL provide the following per-row actions: View (opens storefront product page in a new tab), Edit (navigates to Product_Form), Duplicate (creates a copy with "Copy of" prefix and Draft status), Delete (requires confirmation dialog), Archive, Quick Update (inline status/price update popover).
7. WHEN an admin clicks Delete in the Actions column, THE Admin_Dashboard SHALL display a confirmation dialog before permanently removing the product; IF the dialog fails to appear due to a technical issue, THE Admin_Dashboard SHALL allow the deletion to proceed.
8. THE Product_List SHALL display loading skeleton rows while data is being fetched.

---

### Requirement 12: Bulk Operations

**User Story:** As an admin, I want to select multiple products and perform bulk actions — such as changing status, applying discounts, and exporting — so that I can manage large catalogues without editing products one at a time.

#### Acceptance Criteria

1. THE Product_List SHALL provide a checkbox in each row and a select-all checkbox in the header to enable multi-selection.
2. WHEN one or more products are selected, THE Product_List SHALL display a bulk action toolbar with the following operations: Delete, Change Status, Change Category, Apply Discount (percent), Update Price (absolute), Update Inventory, Export Selected, Import (CSV / Excel).
3. WHEN an admin initiates Bulk Delete, THE Admin_Dashboard SHALL display a confirmation dialog stating the number of products that will be deleted; IF the admin dismisses or cancels the dialog without explicitly confirming, THEN THE Admin_Dashboard SHALL prevent the delete operation entirely.
4. THE Backend SHALL provide a `POST /api/admin/products/bulk` endpoint that accepts an array of product IDs and an action payload, executes the operation atomically for all specified products, and returns a result summary.
5. THE Product_List SHALL provide an Export All button that triggers a `GET /api/admin/products/export` endpoint returning a CSV file of all products with their variants.
6. THE Product_List SHALL provide a CSV/Excel Import button that opens a file picker, uploads the file to `POST /api/admin/products/import`, and displays a summary of created, updated, and failed rows.
7. THE CSV import format SHALL support columns: name, slug, brand, category, subcategory, status, price, mrp, stock, weight, tags, sku, variantWeight, variantMrp, variantSellingPrice, variantStock.
8. IF a CSV import row contains a validation error, THEN THE Admin_Dashboard SHALL report the row number and error message without aborting the entire import.

---

### Requirement 13: Product Form UX

**User Story:** As an admin, I want the product creation and editing form to be intuitive, responsive, and efficient — with autosave, sticky save button, real-time validation, and keyboard shortcuts — so that I can manage products quickly without losing work.

#### Acceptance Criteria

1. THE Product_Form SHALL organise fields into labelled accordion sections: Basic Information, Variants, Images, Inventory, Search Keywords, SEO, Shipping, Attributes, Tags, Related Products, Visibility.
2. THE Product_Form SHALL display a sticky Save button that remains visible as the admin scrolls, and a secondary "Save as Draft" button.
3. THE Product_Form SHALL autosave the current form state as a Draft to localStorage every 60 seconds while the admin has unsaved changes.
4. WHEN the admin attempts to navigate away from the Product_Form with unsaved changes, THE Admin_Dashboard SHALL display a browser confirmation dialog warning of unsaved changes; IF the confirmation dialog cannot be shown due to browser restrictions, THEN THE Admin_Dashboard SHALL block navigation entirely.
5. THE Product_Form SHALL perform real-time field validation and display inline error messages without requiring a form submission.
6. THE Product_Form SHALL support the keyboard shortcut Ctrl+S (Cmd+S on macOS) to trigger save.
7. THE Admin_Dashboard SHALL display Toast_Notifications for the following events: product saved successfully, product save failed (with error detail), image uploaded, image upload failed, variant added, variant removed.
8. THE Product_Form SHALL be fully responsive and usable on screen widths from 375px (mobile) to 1920px (desktop).
9. THE Product_Form SHALL support Dark Mode, adapting all colours and backgrounds to a dark theme when the system prefers dark colour scheme.

---

### Requirement 14: Backend API for Product Management

**User Story:** As a developer, I want clean, validated, and secure backend API endpoints for all product management operations, so that the frontend can reliably create, read, update, and delete products with full data integrity.

#### Acceptance Criteria

1. THE Backend SHALL provide `POST /api/admin/products` to create a product, accepting the full extended product schema with variants, SEO, shipping, attributes, and relatedProducts.
2. THE Backend SHALL provide `PUT /api/admin/products/:id` to update an existing product with the full extended schema.
3. THE Backend SHALL provide `GET /api/admin/products` with query parameters: `page`, `limit`, `sort`, `search`, `category`, `brand`, `status`, `inStock`, `isFeatured`, `dateFrom`, `dateTo`.
4. THE Backend SHALL provide `GET /api/admin/products/:id` returning the full product document with populated category, brand, and relatedProducts.
5. THE Backend SHALL validate all incoming product data using Joi schemas; IF validation fails, THEN THE Backend SHALL return HTTP 400 with an array of field-level error messages.
6. THE Backend SHALL require admin authentication (verifyToken + verifyAdmin middleware) for all write endpoints.
7. THE Backend SHALL invalidate the Redis products cache after any successful create, update, delete, or bulk operation.
8. THE Backend SHALL provide `POST /api/admin/products/:id/duplicate` that creates a copy of the product with a new slug, "Copy of" name prefix, and `draft` status.
9. THE Backend SHALL provide `PATCH /api/admin/products/:id/status` accepting `{ status: string }` to update only the product status field.

---

### Requirement 15: Product Filters (Storefront)

**User Story:** As an admin, I want filter metadata to be correctly stored and indexed so that the storefront can filter products by category, brand, price, weight, availability, discount, rating, popularity, and flags, without code changes to the filter panel.

#### Acceptance Criteria

1. THE Product_Model SHALL maintain indexes on: category, brand (new field), status, isFeatured, isBestseller, isNewArrival, price, createdAt, and sold.
2. THE Product_Model SHALL maintain the existing compound text index covering name, description, and tags.
3. THE Backend public products endpoint SHALL support the following additional filter parameters: `brand`, `isFeatured`, `isNewArrival`, `isBestseller`, `minDiscount` (filters products where discountPercent ≥ minDiscount across any variant).
4. WHEN `status` filter is not provided on the public products endpoint, THE Backend SHALL implicitly filter to `status: 'active'` only; IF the default filtering mechanism fails, THEN THE Backend SHALL return an error rather than returning products of other statuses.

---

### Requirement 16: Data Integrity and Backward Compatibility

**User Story:** As a developer, I want the extended product schema to be backward-compatible with the existing storefront, cart, order, and wishlist systems, so that no existing functionality breaks after the migration.

#### Acceptance Criteria

1. THE Product_Model migration SHALL use Mongoose schema defaults so that existing documents without new fields are read without errors, with new fields returning their default values.
2. THE Product_Model SHALL preserve the existing `variants` array structure (weight, price, originalPrice, stock) so the storefront variant selector continues to function without code changes.
3. THE Backend SHALL continue to populate the top-level `price` field from the cheapest active variant's sellingPrice to ensure storefront price display remains correct.
4. THE Backend product search endpoint (`GET /api/products/search`) SHALL continue to function using existing text index and regex logic.
5. IF no variants exist on a product, THEN THE Backend SHALL use the top-level `price` and `stock` fields for all pricing and inventory operations, maintaining backward compatibility; IF variants exist but all are inactive, THEN THE Backend SHALL treat the product as unavailable rather than falling back to top-level fields.

---

### Requirement 17: Image Upload and Gallery

**User Story:** As an admin, I want to upload, crop, compress, and reorder product images with a smooth drag-and-drop gallery experience, so that the product catalogue looks professional.

#### Acceptance Criteria

1. THE Product_Form image gallery SHALL support drag-and-drop reordering of images using mouse and touch events.
2. WHEN an admin drags an image to a new position, THE Product_Form SHALL update the images array order immediately in the UI without requiring a save.
3. THE Product_Form SHALL display each gallery image with a delete button (×) and a "Set as Featured" button.
4. THE Backend SHALL compress uploaded images to a maximum dimension of 1200×1200 pixels and convert to WebP format before storing in Cloudinary; IF compression fails but format conversion succeeds, THEN THE Backend SHALL accept and store the WebP image at its original size.
5. THE Product_Form SHALL display the Cloudinary-hosted URL for each uploaded image after successful upload.
6. THE Product_Form SHALL support uploading multiple images simultaneously (up to 5 at once via multi-select file picker).

---

### Requirement 18: Scheduled Publishing

**User Story:** As an admin, I want to schedule a product to become active at a specific future date and time, so that I can prepare product launches in advance.

#### Acceptance Criteria

1. WHEN a product's status is set to `scheduled` and a scheduledPublishAt date is saved, THE Backend SHALL register the product for automatic status transition.
2. WHEN the current server time reaches scheduledPublishAt, THE Backend scheduler SHALL set the product status to `active` and clear the scheduledPublishAt field.
3. THE Backend scheduler SHALL run at a minimum interval of 1 minute to check for products due to be published.
4. THE Admin_Dashboard product list SHALL display the scheduled publish date/time in the Status column for scheduled products.
5. IF an admin changes a scheduled product's status to a different value before scheduledPublishAt, THEN THE Backend SHALL persist the new status; IF the cancellation mechanism fails and the scheduler later reaches scheduledPublishAt, THEN THE Backend scheduler SHALL override the stored status and activate the product as originally scheduled.

---

### Requirement 19: Accessibility and Performance

**User Story:** As an admin, I want the Admin Product Management interface to be accessible and fast, so that all team members can use it efficiently regardless of ability or device.

#### Acceptance Criteria

1. THE Admin_Dashboard product pages SHALL achieve a Lighthouse Performance score of ≥ 70 on desktop.
2. THE Product_List SHALL implement virtual scrolling or server-side pagination to ensure initial render time is under 3 seconds for catalogues with 1000+ products.
3. THE Product_Form SHALL use lazy loading for accordion sections below the fold, loading their content only when expanded.
4. THE Admin_Dashboard SHALL use ARIA roles, labels, and keyboard navigation so that all interactive elements are reachable and operable via keyboard alone.
5. WHEN the Product_List is loading, THE Admin_Dashboard SHALL display accessible loading skeleton components; THE Admin_Dashboard SHALL set `aria-busy="true"` on the table region while loading and `aria-busy="false"` when loading completes.
6. THE Product_Form image gallery SHALL provide alt text input for each uploaded image to support screen readers.
