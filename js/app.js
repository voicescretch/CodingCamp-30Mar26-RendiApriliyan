(function () {
  'use strict';

  // CONSTANTS

  var STORAGE_KEYS = {
    TRANSACTIONS: 'ebv_transactions',
    CATEGORIES:   'ebv_categories',
    THEME:        'ebv_theme'
  };

  var DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

  // state

  var state = {
    transactions: [],
    categories:   DEFAULT_CATEGORIES.slice(),
    sortOrder:    'default',
    theme:        'light'
  };

  // storage

  var storage = {
    save: function (s) {
      try {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(s.transactions));
        localStorage.setItem(STORAGE_KEYS.CATEGORIES,   JSON.stringify(s.categories));
        localStorage.setItem(STORAGE_KEYS.THEME,        s.theme);
      } catch (e) {}
    },
    load: function () {
      var transactions = [];
      var categories   = DEFAULT_CATEGORIES.slice();
      var theme        = 'light';
      try {
        var t = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (t) transactions = JSON.parse(t);
      } catch (e) { transactions = []; }
      try {
        var c = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (c) categories = JSON.parse(c);
      } catch (e) { categories = DEFAULT_CATEGORIES.slice(); }
      try {
        var th = localStorage.getItem(STORAGE_KEYS.THEME);
        if (th === 'dark' || th === 'light') theme = th;
      } catch (e) { theme = 'light'; }
      return { transactions: transactions, categories: categories, theme: theme };
    }
  };

  // validation

  function validateTransaction(name, amount) {
    if (!name || !name.trim()) return 'Item name is required.';
    if (amount === '' || amount === null || amount === undefined) return 'Amount is required.';
    var num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return 'Amount must be a positive number.';
    return null;
  }

  function validateCategory(name, existingCategories) {
    if (!name || !name.trim()) return 'Category name is required.';
    var trimmed = name.trim().toLowerCase();
    if (existingCategories.some(function (c) { return c.toLowerCase() === trimmed; })) {
      return 'Category already exists.';
    }
    return null;
  }

  // render

  function computeBalance(transactions) {
    return transactions.reduce(function (sum, t) { return sum + t.amount; }, 0);
  }

  function renderBalance(s) {
    var el = document.getElementById('balance-display');
    if (el) el.textContent = 'Total: Rp ' + computeBalance(s.transactions).toFixed(2);
  }

  function renderCategories(s) {
    var sel = document.getElementById('category-select');
    if (!sel) return;
    var current = sel.value;
    sel.innerHTML = '';
    s.categories.forEach(function (cat) {
      var opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      sel.appendChild(opt);
    });
    if (s.categories.indexOf(current) !== -1) sel.value = current;
    renderCategoryList(s);
  }

  function renderCategoryList(s) {
    var ul = document.getElementById('category-list');
    if (!ul) return;
    ul.innerHTML = '';
    s.categories.forEach(function (cat, idx) {
      var li = document.createElement('li');

      var nameSpan = document.createElement('span');
      nameSpan.className = 'cat-name';
      nameSpan.textContent = cat;

      var editBtn = document.createElement('button');
      editBtn.className = 'cat-edit-btn';
      editBtn.textContent = '✏️';
      editBtn.setAttribute('aria-label', 'Edit ' + cat);

      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'cat-delete-btn';
      deleteBtn.textContent = '🗑️';
      deleteBtn.setAttribute('aria-label', 'Delete ' + cat);

      editBtn.addEventListener('click', function () {
        var input = document.createElement('input');
        input.className = 'cat-edit-input';
        input.value = cat;

        var saveBtn = document.createElement('button');
        saveBtn.className = 'cat-save-btn';
        saveBtn.textContent = '✔';
        saveBtn.setAttribute('aria-label', 'Save');

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'cat-cancel-btn';
        cancelBtn.textContent = '✖';
        cancelBtn.setAttribute('aria-label', 'Cancel');

        li.innerHTML = '';
        li.appendChild(input);
        li.appendChild(saveBtn);
        li.appendChild(cancelBtn);
        input.focus();

        saveBtn.addEventListener('click', function () {
          var newName = input.value.trim();
          if (!newName) return;
          var lower = newName.toLowerCase();
          var duplicate = s.categories.some(function (c, i) { return i !== idx && c.toLowerCase() === lower; });
          if (duplicate) return;
          // update transactions that use old category
          s.transactions.forEach(function (tx) { if (tx.category === cat) tx.category = newName; });
          s.categories[idx] = newName;
          storage.save(s);
          renderCategories(s);
          renderList(s);
          updateChart(chartInstance, s);
        });

        cancelBtn.addEventListener('click', function () {
          renderCategoryList(s);
        });
      });

      deleteBtn.addEventListener('click', function () {
        s.categories.splice(idx, 1);
        // reassign transactions using deleted category to first remaining category
        var fallback = s.categories[0] || '';
        s.transactions.forEach(function (tx) { if (tx.category === cat) tx.category = fallback; });
        storage.save(s);
        renderCategories(s);
        renderList(s);
        updateChart(chartInstance, s);
      });

      li.appendChild(nameSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      ul.appendChild(li);
    });
  }

  function getSortedTransactions(transactions, sortOrder) {
    var arr = transactions.slice();
    if (sortOrder === 'amount-asc')   return arr.sort(function (a, b) { return a.amount - b.amount; });
    if (sortOrder === 'amount-desc')  return arr.sort(function (a, b) { return b.amount - a.amount; });
    if (sortOrder === 'category-asc') return arr.sort(function (a, b) { return a.category.localeCompare(b.category); });
    return arr.sort(function (a, b) { return b.createdAt - a.createdAt; });
  }

  function renderList(s) {
    var list    = document.getElementById('transaction-list');
    var emptyEl = document.getElementById('empty-list-msg');
    if (!list) return;
    list.innerHTML = '';
    var sorted = getSortedTransactions(s.transactions, s.sortOrder);
    if (sorted.length === 0) {
      if (emptyEl) emptyEl.style.display = '';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    sorted.forEach(function (tx) {
      var li = document.createElement('li');
      li.dataset.id = tx.id;
      var nameSpan = document.createElement('span');
      nameSpan.className = 'txn-name';
      nameSpan.textContent = tx.name;
      var amtSpan = document.createElement('span');
      amtSpan.className = 'txn-amount';
      amtSpan.textContent = 'Rp ' + tx.amount.toFixed(2);
      var catSpan = document.createElement('span');
      catSpan.className = 'txn-category';
      catSpan.textContent = tx.category;
      var btn = document.createElement('button');
      btn.className = 'delete-btn';
      btn.dataset.id = tx.id;
      btn.setAttribute('aria-label', 'Delete ' + tx.name);
      btn.textContent = 'X';
      li.appendChild(nameSpan);
      li.appendChild(amtSpan);
      li.appendChild(catSpan);
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  // chart

  var chartInstance = null;

  function aggregateByCategory(transactions) {
    var map = {};
    transactions.forEach(function (tx) {
      map[tx.category] = (map[tx.category] || 0) + tx.amount;
    });
    return map;
  }

  function hashHue(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) & 0xffffffff; }
    return Math.abs(h) % 360;
  }

  function initChart() {
    var canvas = document.getElementById('spending-chart');
    var emptyMsg = document.getElementById('empty-chart-msg');
    if (typeof Chart === 'undefined' || !canvas) {
      if (canvas) canvas.style.display = 'none';
      if (emptyMsg) emptyMsg.style.display = '';
      return null;
    }
    canvas.style.display = 'none';
    if (emptyMsg) emptyMsg.style.display = '';
    chartInstance = new Chart(canvas, {
      type: 'pie',
      data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
      options: {
        plugins: {
          legend: { labels: { color: '#1a1a1a' } }
        }
      }
    });
    return chartInstance;
  }

  function updateChart(chart, s) {
    var canvas = document.getElementById('spending-chart');
    var emptyMsg = document.getElementById('empty-chart-msg');
    if (!chart) return;
    var agg = aggregateByCategory(s.transactions);
    var labels = Object.keys(agg);
    if (labels.length === 0) {
      if (canvas) canvas.style.display = 'none';
      if (emptyMsg) emptyMsg.style.display = '';
      return;
    }
    if (canvas) canvas.style.display = '';
    if (emptyMsg) emptyMsg.style.display = 'none';
    var colors = labels.map(function (l) { return 'hsl(' + hashHue(l) + ',65%,55%)'; });
    chart.data.labels = labels;
    chart.data.datasets[0].data = labels.map(function (l) { return agg[l]; });
    chart.data.datasets[0].backgroundColor = colors;
    var labelColor = s.theme === 'dark' ? '#f1f5f9' : '#1a1a1a';
    chart.options.plugins.legend.labels.color = labelColor;
    chart.update();
  }

  // handlers

  function wireFormHandler() {
    var form   = document.getElementById('transaction-form');
    var errEl  = document.getElementById('form-error');
    var nameEl = document.getElementById('item-name');
    var amtEl  = document.getElementById('item-amount');
    var catEl  = document.getElementById('category-select');
    [nameEl, amtEl].forEach(function (el) {
      if (el) el.addEventListener('input', function () { if (errEl) errEl.textContent = ''; });
    });
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name   = nameEl ? nameEl.value : '';
      var amount = amtEl  ? amtEl.value  : '';
      var cat    = catEl  ? catEl.value  : '';
      var err = validateTransaction(name, amount);
      if (err) { if (errEl) errEl.textContent = err; return; }
      if (errEl) errEl.textContent = '';
      var tx = {
        id:        crypto.randomUUID(),
        name:      name.trim(),
        amount:    parseFloat(amount),
        category:  cat,
        createdAt: Date.now()
      };
      state.transactions.push(tx);
      storage.save(state);
      renderBalance(state);
      renderList(state);
      updateChart(chartInstance, state);
      form.reset();
      renderCategories(state);
    });
  }

  function wireDeleteHandler() {
    var list = document.getElementById('transaction-list');
    if (!list) return;
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('.delete-btn');
      if (!btn) return;
      var id = btn.dataset.id;
      state.transactions = state.transactions.filter(function (t) { return t.id !== id; });
      storage.save(state);
      renderBalance(state);
      renderList(state);
      updateChart(chartInstance, state);
    });
  }

  function wireSortHandler() {
    var sel = document.getElementById('sort-select');
    if (!sel) return;
    sel.addEventListener('change', function () {
      state.sortOrder = sel.value;
      renderList(state);
    });
  }

  function wireCustomCatHandler() {
    var btn    = document.getElementById('custom-cat-btn');
    var input  = document.getElementById('custom-cat-input');
    var errEl  = document.getElementById('custom-cat-error');
    if (input) input.addEventListener('input', function () { if (errEl) errEl.textContent = ''; });
    if (!btn) return;
    btn.addEventListener('click', function () {
      var name = input ? input.value : '';
      var err = validateCategory(name, state.categories);
      if (err) { if (errEl) errEl.textContent = err; return; }
      if (errEl) errEl.textContent = '';
      state.categories.push(name.trim());
      storage.save(state);
      renderCategories(state);
      if (input) input.value = '';
    });
  }

  function wireThemeHandler() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      document.body.classList.toggle('dark', state.theme === 'dark');
      btn.textContent = state.theme === 'dark' ? '\u{1F31E}' : '\u{1F319}';
      storage.save(state);
      updateChart(chartInstance, state);
    });
  }

  // init

  function init() {
    var loaded = storage.load();
    state.transactions = loaded.transactions;
    state.categories   = loaded.categories;
    state.theme        = loaded.theme;

    document.body.classList.toggle('dark', state.theme === 'dark');
    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.textContent = state.theme === 'dark' ? '\u{1F31E}' : '\u{1F319}';

    renderCategories(state);
    renderBalance(state);
    renderList(state);
    chartInstance = initChart();
    updateChart(chartInstance, state);

    wireFormHandler();
    wireDeleteHandler();
    wireSortHandler();
    wireCustomCatHandler();
    wireThemeHandler();
  }

  init();

})();
