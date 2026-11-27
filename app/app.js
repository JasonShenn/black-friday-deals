// DealBeacon: renders the deal grid, the search and filters, the sort order
// and the per-deal detail view. All data comes from deals.js; nothing here
// fetches anything from the network.

import { CHECKED_AT, CATEGORIES, DEALS, SIGNAL_LABELS, STORES } from './deals.js';

// ---- small helpers -------------------------------------------------------

function discountPct(deal) {
  return Math.round((1 - deal.sale / deal.usual) * 100);
}

function money(n) {
  return '$' + n.toFixed(2).replace(/\.00$/, '');
}

function saveAmount(deal) {
  return money(deal.usual - deal.sale);
}

const SIGNAL_RANK = { 'new-low': 0, good: 1, routine: 2 };

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

// ---- state ---------------------------------------------------------------

const state = {
  query: '',
  category: 'All',
  store: 'All',
  minDiscount: 0,
  sort: 'value',
};

// ---- filtering and sorting ----------------------------------------------

function filteredDeals() {
  const q = state.query.trim().toLowerCase();
  const list = DEALS.filter((deal) => {
    if (state.category !== 'All' && deal.category !== state.category) return false;
    if (state.store !== 'All' && deal.store !== state.store) return false;
    if (discountPct(deal) < state.minDiscount) return false;
    if (q && !(deal.name + ' ' + deal.store + ' ' + deal.category).toLowerCase().includes(q)) return false;
    return true;
  });
  const by = {
    value: (a, b) => SIGNAL_RANK[a.signal] - SIGNAL_RANK[b.signal] || discountPct(b) - discountPct(a),
    discount: (a, b) => discountPct(b) - discountPct(a),
    priceAsc: (a, b) => a.sale - b.sale,
    priceDesc: (a, b) => b.sale - a.sale,
    savings: (a, b) => (b.usual - b.sale) - (a.usual - a.sale),
  }[state.sort] || ((a, b) => 0);
  return list.slice().sort(by);
}

// ---- deal card -----------------------------------------------------------

function dealCard(deal) {
  const card = el('article', 'card');
  card.dataset.id = deal.id;

  const top = el('div', 'card-top');
  top.appendChild(el('span', 'store-badge', deal.store));
  top.appendChild(el('span', 'signal signal-' + deal.signal, SIGNAL_LABELS[deal.signal]));
  card.appendChild(top);

  const name = el('h3', 'card-name', deal.name);
  card.appendChild(name);

  const prices = el('div', 'card-prices');
  prices.appendChild(el('span', 'sale-price', money(deal.sale)));
  const usual = el('span', 'usual-price', money(deal.usual));
  prices.appendChild(usual);
  prices.appendChild(el('span', 'discount-badge', '−' + discountPct(deal) + '%'));
  card.appendChild(prices);

  card.appendChild(el('p', 'save-line', 'You save ' + saveAmount(deal)));
  card.appendChild(el('p', 'evidence', deal.evidence));

  const meta = el('div', 'card-meta');
  meta.appendChild(el('span', 'checked', 'Checked ' + CHECKED_AT));
  meta.appendChild(el('span', 'source', 'Source: ' + deal.source));
  card.appendChild(meta);

  if (deal.code) {
    card.appendChild(el('p', 'promo-code', 'Use code ' + deal.code + ' at checkout'));
  }

  const actions = el('div', 'card-actions');
  const shop = el('a', 'shop-link', 'View at ' + deal.store + ' ↗');
  shop.href = deal.url;
  shop.target = '_blank';
  shop.rel = 'noopener';
  actions.appendChild(shop);
  const details = el('a', 'details-link', 'Details');
  details.href = '#/deal/' + deal.id;
  actions.appendChild(details);
  card.appendChild(actions);

  return card;
}

// ---- grid ----------------------------------------------------------------

const grid = document.getElementById('deal-grid');
const countLine = document.getElementById('result-count');
const emptyNote = document.getElementById('empty-note');

function renderGrid() {
  const list = filteredDeals();
  grid.textContent = '';
  list.forEach((deal) => grid.appendChild(dealCard(deal)));
  const total = DEALS.length;
  countLine.textContent = list.length === total
    ? 'Showing all ' + total + ' deals'
    : 'Showing ' + list.length + ' of ' + total + ' deals';
  emptyNote.hidden = list.length !== 0;
}

// ---- detail view ---------------------------------------------------------

const detailView = document.getElementById('deal-detail');
const detailBody = document.getElementById('detail-body');

function renderDetail(id) {
  const deal = DEALS.find((d) => d.id === id);
  if (!deal) {
    detailView.hidden = true;
    return;
  }
  detailBody.textContent = '';
  detailBody.appendChild(el('span', 'store-badge', deal.store));
  detailBody.appendChild(el('span', 'signal signal-' + deal.signal, SIGNAL_LABELS[deal.signal]));
  detailBody.appendChild(el('h2', 'detail-name', deal.name));
  detailBody.appendChild(el('p', 'detail-category', deal.category + ' · ' + deal.store));

  const prices = el('div', 'detail-prices');
  prices.appendChild(el('span', 'sale-price big', money(deal.sale)));
  prices.appendChild(el('span', 'usual-price big', money(deal.usual)));
  prices.appendChild(el('span', 'discount-badge big', '−' + discountPct(deal) + '%'));
  detailBody.appendChild(prices);
  detailBody.appendChild(el('p', 'save-line', 'You save ' + saveAmount(deal) + ' off the usual price.'));

  detailBody.appendChild(el('h3', 'detail-heading', 'Is it really a deal?'));
  detailBody.appendChild(el('p', 'evidence', deal.evidence));

  detailBody.appendChild(el('h3', 'detail-heading', 'Price check'));
  const check = el('dl', 'check-list');
  const rows = [
    ['Checked', CHECKED_AT],
    ['Price source', deal.source],
    ['Sale price', money(deal.sale)],
    ['Usual price', money(deal.usual)],
    ['Discount', discountPct(deal) + '% off'],
  ];
  if (deal.code) rows.push(['Promo code', deal.code]);
  rows.forEach(([term, value]) => {
    check.appendChild(el('dt', null, term));
    check.appendChild(el('dd', null, value));
  });
  detailBody.appendChild(check);

  const shop = el('a', 'shop-link big', 'View at ' + deal.store + ' ↗');
  shop.href = deal.url;
  shop.target = '_blank';
  shop.rel = 'noopener';
  detailBody.appendChild(shop);

  detailView.hidden = false;
  detailView.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---- controls ------------------------------------------------------------

const searchBox = document.getElementById('search-box');
const categoryChips = document.getElementById('category-chips');
const storeSelect = document.getElementById('store-select');
const discountSelect = document.getElementById('discount-select');
const sortSelect = document.getElementById('sort-select');

const allChip = el('button', 'chip active', 'All');
allChip.type = 'button';
allChip.dataset.category = 'All';
allChip.setAttribute('aria-pressed', 'true');
allChip.addEventListener('click', () => {
  state.category = 'All';
  categoryChips.querySelectorAll('.chip').forEach((c) => {
    const on = c.dataset.category === 'All';
    c.classList.toggle('active', on);
    c.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  renderGrid();
});
categoryChips.appendChild(allChip);

CATEGORIES.forEach((category) => {
  const chip = el('button', 'chip', category);
  chip.type = 'button';
  chip.dataset.category = category;
  chip.setAttribute('aria-pressed', 'false');
  chip.addEventListener('click', () => {
    state.category = category;
    categoryChips.querySelectorAll('.chip').forEach((c) => {
      const on = c.dataset.category === category;
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    renderGrid();
  });
  categoryChips.appendChild(chip);
});

STORES.forEach((store) => {
  const option = el('option', null, store);
  option.value = store;
  storeSelect.appendChild(option);
});

searchBox.addEventListener('input', () => {
  state.query = searchBox.value;
  renderGrid();
});
storeSelect.addEventListener('change', () => {
  state.store = storeSelect.value;
  renderGrid();
});
discountSelect.addEventListener('change', () => {
  state.minDiscount = Number(discountSelect.value);
  renderGrid();
});
sortSelect.addEventListener('change', () => {
  state.sort = sortSelect.value;
  renderGrid();
});

document.getElementById('back-to-list').addEventListener('click', () => {
  location.hash = '#/';
});

// ---- routing -------------------------------------------------------------

function route() {
  const match = location.hash.match(/^#\/deal\/([\w-]+)$/);
  if (match) {
    renderGrid();
    renderDetail(match[1]);
  } else {
    detailView.hidden = true;
  }
}

window.addEventListener('hashchange', route);

renderGrid();
route();
