# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly web application that helps users track daily spending. It displays a running total balance, a scrollable transaction history list, and a pie chart visualizing spending broken down by category. The app runs entirely in the browser using HTML, CSS, and vanilla JavaScript, with all data persisted via the browser's Local Storage API. Chart.js is loaded via CDN for chart rendering. No backend or build tooling is required. All styles live in a single `css/` file and all logic in a single `js/` file.

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single spending record consisting of an item name, amount, and category.
- **Balance**: The running total calculated as the sum of all Transaction amounts.
- **Category**: A label assigned to a Transaction. Built-in categories are Food, Transport, and Fun. Users may also define Custom_Categories.
- **Custom_Category**: A user-defined category label added at runtime and stored alongside built-in categories.
- **Transaction_List**: The scrollable UI component that displays all recorded Transactions.
- **Chart**: The Chart.js pie chart component that displays spending distribution by Category.
- **Storage**: The browser's Local Storage API used to persist Transaction and Custom_Category data.
- **Form**: The UI component through which the user enters new Transaction data.
- **Sort_Control**: The UI control that determines the order in which Transactions are displayed.
- **Theme**: The active color scheme of the App, either light or dark.

---

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to fill in a form with an item name, amount, and category and submit it to record a new transaction, so that I can track my spending.

#### Acceptance Criteria

1. THE Form SHALL include a text field for item name, a numeric field for amount, and a category selector containing at minimum Food, Transport, and Fun.
2. WHEN the user submits the Form with all required fields filled and a positive numeric amount, THE App SHALL add the Transaction to Storage and update the Transaction_List, Balance, and Chart immediately without reloading the page.
3. IF the user submits the Form with any required field empty, THEN THE Form SHALL display an inline validation message identifying the missing field.
4. IF the user enters a non-positive or non-numeric value in the amount field, THEN THE Form SHALL display an inline validation message indicating the amount must be a positive number.
5. WHEN a Transaction is successfully saved, THE Form SHALL reset all fields to their default empty state.

---

### Requirement 2: Display Total Balance

**User Story:** As a user, I want to see my current total balance prominently at the top of the page, so that I always know how much I have spent in total.

#### Acceptance Criteria

1. THE App SHALL display the current Balance at the top of the page.
2. WHEN a Transaction is added or deleted, THE App SHALL recalculate and re-render the Balance immediately.

---

### Requirement 3: View Transaction List

**User Story:** As a user, I want to see a scrollable list of all my transactions showing the name, amount, and category, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL be scrollable and display each Transaction's item name, amount, and category.
2. WHEN no Transactions exist, THE Transaction_List SHALL display a message indicating no transactions have been recorded.
3. WHEN a Transaction is added or deleted, THE Transaction_List SHALL update immediately without a page reload.

---

### Requirement 4: Delete a Transaction

**User Story:** As a user, I want to delete a transaction from the list, so that I can remove incorrect or unwanted entries.

#### Acceptance Criteria

1. THE Transaction_List SHALL render a delete control for each Transaction entry.
2. WHEN the user activates the delete control for a Transaction, THE App SHALL remove that Transaction from Storage and re-render the Transaction_List, Balance, and Chart immediately.

---

### Requirement 5: Visualize Spending by Category

**User Story:** As a user, I want to see a pie chart of my spending broken down by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL be rendered using Chart.js loaded via CDN and SHALL display total spending per Category as a pie chart.
2. WHEN a Transaction is added or deleted, THE Chart SHALL update immediately to reflect the current data.
3. WHEN no Transactions exist, THE Chart SHALL display a message indicating there is no spending data to visualize.

---

### Requirement 6: Persist Data Across Sessions

**User Story:** As a user, I want my transaction data and custom categories to be saved between browser sessions, so that I do not lose my history when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a Transaction is added or deleted, THE Storage SHALL serialize and save the full transaction dataset to Local Storage.
2. WHEN a Custom_Category is added, THE Storage SHALL serialize and save the current category list to Local Storage.
3. WHEN the App initializes, THE App SHALL deserialize and load all previously saved Transactions and Custom_Categories from Local Storage.
4. IF no data exists in Local Storage on initialization, THEN THE App SHALL initialize with an empty transaction dataset and the default categories (Food, Transport, Fun).
5. FOR ALL valid transaction datasets, serializing then deserializing SHALL produce a dataset equivalent to the original (round-trip property).

---

### Requirement 7: Responsive Mobile-Friendly Layout

**User Story:** As a user, I want the app to work well on my phone, so that I can track expenses on the go.

#### Acceptance Criteria

1. THE App SHALL render a usable layout on viewport widths from 320px to 2560px.
2. THE App SHALL use a single-column layout on viewport widths below 600px.
3. THE App SHALL not require horizontal scrolling on any supported viewport width.
4. THE App SHALL meet a minimum touch target size of 44x44 CSS pixels for all interactive controls.

---

### Requirement 8: Add Custom Categories

**User Story:** As a user, I want to add my own custom categories, so that I can organize transactions beyond the default options.

#### Acceptance Criteria

1. THE Form SHALL include a control that allows the user to enter and submit a new Custom_Category name.
2. WHEN the user submits a valid Custom_Category name, THE App SHALL add it to the category selector in the Form and persist it to Storage.
3. IF the user submits an empty or duplicate Custom_Category name, THEN THE App SHALL display an inline validation message and SHALL NOT add the duplicate.
4. WHEN the App initializes, THE App SHALL load all previously saved Custom_Categories and include them in the category selector alongside the default categories.

---

### Requirement 9: Sort Transactions

**User Story:** As a user, I want to sort my transaction list by amount or category, so that I can quickly find and compare entries.

#### Acceptance Criteria

1. THE App SHALL provide a Sort_Control with options to sort Transactions by amount (ascending and descending) and by category (alphabetical).
2. WHEN the user selects a sort option, THE Transaction_List SHALL re-render immediately in the selected order.
3. WHEN a Transaction is added or deleted, THE Transaction_List SHALL maintain the currently selected sort order.

---

### Requirement 10: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light mode, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a toggle control to switch the Theme between light and dark.
2. WHEN the user activates the toggle, THE App SHALL apply the selected Theme to all UI components immediately without a page reload.
3. THE App SHALL persist the user's Theme preference to Storage and restore it on initialization.
4. WHILE the dark Theme is active, THE App SHALL apply a dark color scheme to all UI components including the Chart.
