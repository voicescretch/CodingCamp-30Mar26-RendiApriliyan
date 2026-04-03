# Design Document: Expense & Budget Visualizer

## Overview

A single-page, zero-dependency (beyond Chart.js CDN) web app that lets users record spending transactions, view a running total balance, browse a scrollable transaction history, and see a live pie chart of spending by category. All state lives in an in-memory array that is kept in sync with `localStorage`. There is no build step, no backend, and no framework — just `index.html`, `css/style.css`, and `js/app.js`.

Key design goals:
- Instant UI feedback on every mutation (add, delete, sort, theme toggle)
- Single source of truth: the in-memory `state` object, always mirrored to `localStorage`
- CSS custom properties drive theming so a single class toggle on `<body>` switches the entire palette
- Chart.js instance is created once and updated in-place to avoid canvas teardown/recreation

---

## Architecture

```
index.html          ← single entry point, loads CDN Chart.js, css/style.css, js/app.js
css/
  style.css         ← all styles; CSS custom properties for light/dark theming
js/
  app.js            ← all logic; module-pattern IIFE, no globals except Chart
```

### Runtime data flow

```
User action
    │
    ▼
Event handler (in app.js)
    │  mutates
    ▼
state object (in-memory)
    │  synced by
    ▼
localStorage (persistence)
    │  read by
    ▼
render functions → DOM + Chart.js instance
```

All render functions are pure projections of `state` onto the DOM — they read `state`, never write it.

---

## Components and Interfaces

### HTML Structure

```
<body class="light">                        ← "light" | "dark" toggled here
  <header>
    <h1>Expense & Budget Visualizer</h1>
    <button id="theme-toggle">🌙</button>
  </header>

  <main>
    <section id="balance-section">
      <p id="balance-display">Total: $0.00</p>
    </section>

    <section id="form-section">
      <form id="transaction-form">
        <input  id="item-name"   type="text"   placeholder="Item name" />
        <input  id="item-amount" type="number" placeholder="Amount"    min="0.01" step="0.01" />
        <select id="category-select">
          <option>Food</option>
          <option>Transport</option>
          <option>Fun</option>
          <!-- custom categories appended here -->
        </select>
        <button type="submit">Add</button>
      </form>

      <!-- Custom category sub-form -->
      <div id="custom-category-form">
        <input  id="custom-cat-input"  type="text" placeholder="New category" />
        <button id="custom-cat-btn">Add Category</button>
        <span   id="custom-cat-error" aria-live="polite"></span>
      </div>

      <span id="form-error" aria-live="polite"></span>
    </section>

    <section id="list-section">
      <div id="sort-controls">
        <label for="sort-select">Sort by</label>
        <select id="sort-select">
          <option value="default">Default (newest first)</option>
          <option value="amount-asc">Amount ↑</option>
          <option value="amount-desc">Amount ↓</option>
          <option value="category-asc">Category A→Z</option>
        </select>
      </div>
      <ul id="transaction-list" role="list">
        <!-- <li> items rendered by JS -->
      </ul>
      <p id="empty-list-msg">No transactions yet.</p>
    </section>

    <section id="chart-section">
      <canvas id="spending-chart" aria-label="Spending by category pie chart" role="img"></canvas>
      <p id="empty-chart-msg">No spending data to visualize.</p>
    </section>
  </main>
</body>
```

### JavaScript Modules (all in `js/app.js`)

The file is structured as a self-executing function with clearly separated concerns:

| Section | Responsibility |
|---|---|
| `CONSTANTS` | Storage keys, default categories |
| `state` | Single in-memory object |
| `storage` | `load()` / `save()` wrappers around `localStorage` |
| `validation` | `validateTransaction()`, `validateCategory()` |
| `render` | `renderBalance()`, `renderList()`, `renderChart()`, `renderCategories()` |
| `chart` | Chart.js instance lifecycle (`initChart()`, `updateChart()`) |
| `handlers` | DOM event handlers wired in `init()` |
| `init` | Bootstrap: load state, wire events, initial render |

---

## Data Models

### Transaction object

```js
{
  id:       string,   // crypto.randomUUID() or Date.now().toString()
  name:     string,   // item name, trimmed, non-empty
  amount:   number,   // positive float, stored as number
  category: string,   // one of the current category list
  createdAt: number   // Date.now() timestamp for default sort order
}
```

### State object (in-memory)

```js
const state = {
  transactions: [],   // Transaction[]
  categories:   [],   // string[] — built-ins + custom
  sortOrder:    'default',  // 'default' | 'amount-asc' | 'amount-desc' | 'category-asc'
  theme:        'light'     // 'light' | 'dark'
};
```

### localStorage keys

```js
const STORAGE_KEYS = {
  TRANSACTIONS: 'ebv_transactions',
  CATEGORIES:   'ebv_categories',
  THEME:        'ebv_theme'
};
```

Serialization: `JSON.stringify` on save, `JSON.parse` on load. Both operations are wrapped in `try/catch`; on parse failure the app falls back to defaults.

### Default categories

```js
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];
```

---

## CSS Architecture

`css/style.css` uses CSS custom properties defined on `:root` (light) and `body.dark` (dark) to drive the entire palette. A single class toggle on `<body>` switches all colors.

```css
:root {
  --bg:          #ffffff;
  --surface:     #f5f5f5;
  --text:        #1a1a1a;
  --accent:      #4f46e5;
  --danger:      #dc2626;
  --border:      #e5e7eb;
  --shadow:      rgba(0,0,0,0.08);
}

body.dark {
  --bg:          #0f172a;
  --surface:     #1e293b;
  --text:        #f1f5f9;
  --accent:      #818cf8;
  --danger:      #f87171;
  --border:      #334155;
  --shadow:      rgba(0,0,0,0.4);
}
```

Layout uses CSS Grid at the page level and Flexbox within sections. A single `@media (max-width: 599px)` breakpoint collapses the two-column desktop layout to a single column. All interactive controls have `min-width: 44px; min-height: 44px` to meet touch target requirements.

---

## Chart.js Integration

Chart.js is loaded via CDN in `index.html` before `js/app.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<script src="js/app.js" defer></script>
```

A single `Chart` instance is created in `initChart()` and stored in a module-scoped variable. On every state mutation, `updateChart(chartInstance, data)` calls `chartInstance.data.datasets[0].data = newData` and `chartInstance.update()` — no teardown/recreation.

Dark mode colors are applied by passing a `color` array to the chart's `plugins.legend.labels` and updating `chartInstance.options.plugins.legend.labels.color` before calling `update()`.

When `state.transactions` is empty, the canvas is hidden and `#empty-chart-msg` is shown instead.

Category colors are generated deterministically from the category name using a small hash-to-hue function, so colors are stable across sessions.

---

## State Management

All mutations follow the same pattern:

```
1. Validate input (return early with error message if invalid)
2. Mutate state (push/splice/assign)
3. storage.save(state)
4. render*(state)   ← one or more render calls
```

No event bus, no reactive framework. Render functions are called explicitly after each mutation. This keeps the data flow easy to trace.

### Sort logic

`getSortedTransactions(transactions, sortOrder)` returns a new sorted array without mutating `state.transactions`. The sort key mapping:

| sortOrder | comparator |
|---|---|
| `default` | descending `createdAt` |
| `amount-asc` | ascending `amount` |
| `amount-desc` | descending `amount` |
| `category-asc` | `localeCompare` on `category` |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Transaction add round-trip

*For any* valid transaction (non-empty name, positive amount, valid category), adding it to the app state and then querying the transaction list should produce a list that contains a transaction with the same name, amount, and category.

**Validates: Requirements 1.2, 3.3**

### Property 2: Invalid transaction rejected

*For any* transaction input where the name is empty or the amount is non-positive or non-numeric, `validateTransaction` should return a non-null error message and the transaction list should remain unchanged.

**Validates: Requirements 1.3, 1.4**

### Property 3: Balance equals sum of amounts

*For any* collection of transactions, the computed balance should equal the arithmetic sum of all transaction amounts.

**Validates: Requirements 2.2**

### Property 4: Transaction list renders all fields

*For any* non-empty transaction list, every transaction in state should have its name, amount, and category present in the rendered HTML output.

**Validates: Requirements 3.1, 4.1**

### Property 5: Delete removes transaction

*For any* non-empty transaction list, deleting a transaction by its id should result in a list that no longer contains that id, and the balance should equal the sum of the remaining transactions.

**Validates: Requirements 4.2**

### Property 6: Category aggregation correctness

*For any* collection of transactions, `aggregateByCategory` should return an object where each category's value equals the sum of amounts of all transactions in that category, and the sum of all category values equals the total balance.

**Validates: Requirements 5.1, 5.2**

### Property 7: Serialization round-trip

*For any* valid app state (transactions array and categories array), serializing to JSON and deserializing should produce a value deeply equal to the original.

**Validates: Requirements 6.1, 6.2, 6.3, 6.5**

### Property 8: Category validation rejects empty and duplicates

*For any* string that is empty (or all-whitespace) or already present in the category list, `validateCategory` should return a non-null error message and the category list should remain unchanged.

**Validates: Requirements 8.3**

### Property 9: Category add round-trip

*For any* valid new category name (non-empty, not a duplicate), adding it should result in the name appearing in the category list in state and in the serialized localStorage value.

**Validates: Requirements 8.2**

### Property 10: Sort order correctness

*For any* transaction list and any sort option (`amount-asc`, `amount-desc`, `category-asc`, `default`), `getSortedTransactions` should return a list that satisfies the ordering invariant for that option, and adding or deleting a transaction should preserve that ordering in the re-rendered list.

**Validates: Requirements 9.2, 9.3**

### Property 11: Theme toggle round-trip

*For any* initial theme value, toggling the theme should change the body class to the opposite theme, and saving then loading the theme from localStorage should restore the same theme value.

**Validates: Requirements 10.2, 10.3, 10.4**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Empty item name | Inline error in `#form-error`, focus returned to field |
| Non-positive / non-numeric amount | Inline error in `#form-error` |
| Empty custom category | Inline error in `#custom-cat-error` |
| Duplicate custom category | Inline error in `#custom-cat-error` |
| `localStorage` parse failure | `try/catch` → fall back to defaults, no crash |
| `localStorage` quota exceeded | `try/catch` → silent fail on save (data still in memory for session) |
| Chart.js not loaded (CDN failure) | `typeof Chart !== 'undefined'` guard; chart section hidden gracefully |

Validation errors are cleared on the next successful submission or when the user starts typing in the relevant field (`input` event listener).

---

## Testing Strategy

Given the constraints (no build tools, no test setup in the initial delivery), this strategy describes how tests should be structured when a harness is introduced.

### Recommended tooling

- **Unit / property tests**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript property-based testing library) with a lightweight test runner such as Vitest or Jest
- **DOM integration tests**: jsdom or a real browser via Playwright

### Unit tests

Focus on pure functions with no DOM dependency:

- `validateTransaction(name, amount)` — valid inputs, empty name, zero/negative amount, non-numeric amount
- `validateCategory(name, existing)` — empty, whitespace-only, duplicate, valid
- `getSortedTransactions(transactions, sortOrder)` — all four sort modes, ties, empty list
- `computeBalance(transactions)` — empty list, single item, multiple items
- `aggregateByCategory(transactions)` — single category, multiple categories, empty list
- `storage.load()` / `storage.save()` — round-trip, missing key, malformed JSON

### Property-based tests

Each property test must run a minimum of **100 iterations**. Each test must include a comment referencing the design property it validates using the tag format:

`// Feature: expense-budget-visualizer, Property N: <property_text>`

| Property | Generator inputs | Assertion |
|---|---|---|
| P1: Transaction add round-trip | random `{name, amount, category}` | list contains item after add |
| P2: Invalid transaction rejected | random empty/whitespace names, random non-positive amounts | `validateTransaction` returns error, list unchanged |
| P3: Balance equals sum | random `Transaction[]` | `computeBalance(txns) === txns.reduce((s,t) => s+t.amount, 0)` |
| P4: List renders all fields | random `Transaction[]` | rendered HTML contains each name, amount, category |
| P5: Delete removes transaction | random list + random index to delete | id absent after delete, balance recalculated |
| P6: Category aggregation | random `Transaction[]` | per-category sums correct, total matches balance |
| P7: Serialization round-trip | random state objects | `JSON.parse(JSON.stringify(x))` deep-equals `x` |
| P8: Category validation | random empty/whitespace/duplicate names | `validateCategory` returns error, list unchanged |
| P9: Category add round-trip | random valid category names | name present in list and in serialized storage |
| P10: Sort order correctness | random `Transaction[]` + random sort option | sorted array satisfies ordering invariant |
| P11: Theme toggle round-trip | random initial theme | toggle flips class; save→load restores value |

### Integration / smoke tests (manual or Playwright)

- App loads with no localStorage data → default categories present, empty list message shown
- Add a transaction → balance updates, list shows item, chart updates
- Delete a transaction → item removed, balance recalculates, chart updates
- Add custom category → appears in selector, persists after page reload
- Sort by each option → list reorders correctly
- Toggle theme → body class changes, preference survives reload
- Resize to 320px → no horizontal scroll, all controls reachable
