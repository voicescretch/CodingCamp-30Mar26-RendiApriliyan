# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a single-page expense tracker using HTML, CSS, and vanilla JavaScript. All logic lives in `js/app.js`, all styles in `css/style.css`, and the entry point is `index.html`. Chart.js is loaded via CDN. State is persisted to `localStorage`.

## Tasks

- [x] 1. Scaffold project structure
  - Create `index.html` with semantic HTML skeleton: `<header>`, `<main>`, all sections (`#balance-section`, `#form-section`, `#list-section`, `#chart-section`), and all element IDs matching the design
  - Add Chart.js CDN `<script>` tag before `js/app.js` (which uses `defer`)
  - Create `css/style.css` as an empty file linked from `index.html`
  - Create `js/app.js` as an IIFE skeleton with clearly labeled section comments: `CONSTANTS`, `state`, `storage`, `validation`, `render`, `chart`, `handlers`, `init`
  - _Requirements: 1.1, 3.1, 5.1_

- [x] 2. Implement data model, state, and localStorage layer
  - [x] 2.1 Define `STORAGE_KEYS`, `DEFAULT_CATEGORIES`, and the `state` object in `js/app.js`
    - `state` must include `transactions`, `categories`, `sortOrder`, and `theme` fields
    - _Requirements: 6.3, 6.4_
  - [x] 2.2 Implement `storage.save(state)` and `storage.load()` with `try/catch` fallback to defaults
    - `save` serializes `transactions`, `categories`, and `theme` separately under their storage keys
    - `load` deserializes each key; on parse failure falls back to defaults without crashing
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ]* 2.3 Write property test for serialization round-trip
    - **Property 7: Serialization round-trip**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

- [x] 3. Implement validation functions
  - [x] 3.1 Implement `validateTransaction(name, amount)` — returns an error string or `null`
    - Rejects empty/whitespace name; rejects non-positive or non-numeric amount
    - _Requirements: 1.3, 1.4_
  - [ ]* 3.2 Write property test for invalid transaction rejection
    - **Property 2: Invalid transaction rejected**
    - **Validates: Requirements 1.3, 1.4**
  - [x] 3.3 Implement `validateCategory(name, existingCategories)` — returns an error string or `null`
    - Rejects empty/whitespace name and names already present in the list (case-insensitive)
    - _Requirements: 8.3_
  - [ ]* 3.4 Write property test for category validation
    - **Property 8: Category validation rejects empty and duplicates**
    - **Validates: Requirements 8.3**

- [x] 4. Implement balance computation and render
  - [x] 4.1 Implement `computeBalance(transactions)` — returns the sum of all `amount` fields
    - _Requirements: 2.1, 2.2_
  - [x] 4.2 Implement `renderBalance(state)` — updates `#balance-display` text with formatted currency
    - _Requirements: 2.1, 2.2_
  - [ ]* 4.3 Write property test for balance equals sum of amounts
    - **Property 3: Balance equals sum of amounts**
    - **Validates: Requirements 2.2**

- [x] 5. Implement transaction form and add handler
  - [x] 5.1 Implement `renderCategories(state)` — populates `#category-select` options from `state.categories`
    - _Requirements: 1.1, 8.4_
  - [x] 5.2 Wire `#transaction-form` submit handler: validate → create transaction object with `crypto.randomUUID()` id and `Date.now()` timestamp → push to `state.transactions` → `storage.save` → call render functions → reset form
    - Show inline error in `#form-error` on validation failure; clear error on next successful submit or on `input` event
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  - [ ]* 5.3 Write property test for transaction add round-trip
    - **Property 1: Transaction add round-trip**
    - **Validates: Requirements 1.2, 3.3**

- [x] 6. Implement transaction list render and delete
  - [x] 6.1 Implement `getSortedTransactions(transactions, sortOrder)` — returns a new sorted array without mutating state
    - Support `default` (descending `createdAt`), `amount-asc`, `amount-desc`, `category-asc`
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 6.2 Implement `renderList(state)` — renders `<li>` items into `#transaction-list` showing name, amount, category, and a delete button per item; shows `#empty-list-msg` when list is empty
    - Apply current `state.sortOrder` via `getSortedTransactions`
    - _Requirements: 3.1, 3.2, 3.3, 4.1_
  - [x] 6.3 Wire delete button click handler (event delegation on `#transaction-list`): remove transaction by id from `state.transactions` → `storage.save` → re-render balance, list, and chart
    - _Requirements: 4.2_
  - [ ]* 6.4 Write property test for delete removes transaction
    - **Property 5: Delete removes transaction**
    - **Validates: Requirements 4.2**
  - [ ]* 6.5 Write property test for transaction list renders all fields
    - **Property 4: Transaction list renders all fields**
    - **Validates: Requirements 3.1, 4.1**
  - [ ]* 6.6 Write property test for sort order correctness
    - **Property 10: Sort order correctness**
    - **Validates: Requirements 9.2, 9.3**

- [x] 7. Checkpoint — wire sort control and verify list behavior
  - Wire `#sort-select` change handler: update `state.sortOrder` → call `renderList(state)`
  - Verify that adding and deleting transactions preserves the selected sort order
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 8. Implement Chart.js pie chart
  - [x] 8.1 Implement `aggregateByCategory(transactions)` — returns `{ [category]: totalAmount }` map
    - _Requirements: 5.1, 5.2_
  - [x] 8.2 Implement `initChart()` — creates a single Chart.js `Pie` instance on `#spending-chart`; guard with `typeof Chart !== 'undefined'` check; hide canvas and show `#empty-chart-msg` when no data
    - Use deterministic hash-to-hue function for stable category colors across sessions
    - _Requirements: 5.1, 5.3_
  - [x] 8.3 Implement `updateChart(chartInstance, state)` — updates `chartInstance.data` in-place and calls `chartInstance.update()` without teardown; applies dark/light label colors based on `state.theme`
    - _Requirements: 5.2, 10.4_
  - [ ]* 8.4 Write property test for category aggregation correctness
    - **Property 6: Category aggregation correctness**
    - **Validates: Requirements 5.1, 5.2**

- [x] 9. Implement custom categories
  - [x] 9.1 Wire `#custom-cat-btn` click handler: validate via `validateCategory` → push to `state.categories` → `storage.save` → `renderCategories(state)` → clear input
    - Show inline error in `#custom-cat-error` on failure; clear on next successful add or on `input` event
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ]* 9.2 Write property test for category add round-trip
    - **Property 9: Category add round-trip**
    - **Validates: Requirements 8.2**

- [x] 10. Implement dark/light mode toggle
  - [x] 10.1 Implement theme toggle: wire `#theme-toggle` click handler → flip `state.theme` between `'light'` and `'dark'` → toggle `body.dark` class → update button icon → `storage.save` → call `updateChart` to refresh chart label colors
    - _Requirements: 10.1, 10.2, 10.4_
  - [x] 10.2 Restore theme on `init()`: read `state.theme` from loaded storage and apply `body.dark` class and button icon before first render
    - _Requirements: 10.3_
  - [ ]* 10.3 Write property test for theme toggle round-trip
    - **Property 11: Theme toggle round-trip**
    - **Validates: Requirements 10.2, 10.3, 10.4**

- [x] 11. Implement CSS styles
  - [x] 11.1 Define CSS custom properties on `:root` (light) and `body.dark` (dark) for `--bg`, `--surface`, `--text`, `--accent`, `--danger`, `--border`, `--shadow`
    - _Requirements: 10.2, 10.4_
  - [x] 11.2 Implement page-level CSS Grid layout and section Flexbox layout; apply `var()` tokens to all color, background, and border declarations
    - _Requirements: 7.1_
  - [x] 11.3 Add `@media (max-width: 599px)` breakpoint to collapse to single-column layout; ensure no horizontal scroll at 320px
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 11.4 Set `min-width: 44px; min-height: 44px` on all interactive controls (buttons, selects, inputs)
    - _Requirements: 7.4_

- [x] 12. Implement `init()` and wire everything together
  - Call `storage.load()` → populate `state` → apply theme → `renderCategories` → `renderBalance` → `renderList` → `initChart` → `updateChart`
  - Ensure all event handlers are registered in `init()`
  - _Requirements: 6.3, 6.4, 8.4_

- [x] 13. Final checkpoint — Ensure all tests pass
  - Verify the app loads with no localStorage data and shows defaults
  - Verify add, delete, sort, custom category, and theme toggle all work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests reference design document properties (P1–P11) and require a minimum of 100 iterations each
- All property test files must include the comment tag: `// Feature: expense-budget-visualizer, Property N: <property_text>`
