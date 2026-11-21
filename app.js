import { allocationStages, defaultBrief, DEMO_DATE, formatPlatform, formats, taskStages } from './data.js';
import { agencyDetail, creatorDetail, creatorRows, creatorsView, dashboard, partnersView } from './directory.js';
import { assignProduction, campaignStatus, checkBrief, createCampaign, find, freshState, importInventory, loadState, matchCreators, offerOptions, price, profileFor, recordActivity, shortlist, STORAGE_KEY, suggestedSelection, updateAllocation } from './logic.js';
import { campaignDetail, campaignsView, deliveryDetail, moneyView, quotePreview, sourcingView, studioView, taskDetail } from './operations.js';
import { action, button, clickable, empty, esc, icon, money, nav, shell, table, todayLabel } from './ui.js';

const root = document.getElementById('app');
const dialog = document.getElementById('dialog');
const toastElement = document.getElementById('toast');
const loaded = loadState({ getItem: key => window.localStorage.getItem(key) });
let state = loaded.state;
let filters = {};
let draft = { ...state.sourcing.brief };
let calculation = { buying: 15000, markup: 30, quantity: 5, additional: 2500 };
let menu = false;
let detail;
let modalOrigin;
let toastTimer;
let toastText = '';
let page = readPage();

function readPage() {
  const hash = location.hash.slice(1);
  return nav.some(([id]) => hash === id) ? hash : 'dashboard';
}

function toast(message) {
  toastText = message;
  toastElement.textContent = message;
  toastElement.classList.add('visible');
  const notice = dialog.querySelector('.dialog-notice');
  if (dialog.open && notice) {
    notice.textContent = message;
    notice.hidden = false;
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastText = '';
    toastElement.classList.remove('visible');
    const notice = dialog.querySelector('.dialog-notice');
    if (notice) notice.hidden = true;
  }, 3800);
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    toast('Browser storage is unavailable. Changes will last for this session.');
    return false;
  }
}

function calculated() {
  const amount = (value, max) => Math.min(max, Math.max(0, Number(value) || 0));
  const result = price(amount(calculation.buying, 1000000000), amount(calculation.markup, 1000),
    Math.max(1, Math.floor(amount(calculation.quantity, 10000))), amount(calculation.additional, 1000000000));
  return [
    ['Selling price per unit', money(result.sellingRate)], ['Total buying cost', money(result.cost)],
    ['Total revenue', money(result.revenue)], ['Gross profit', money(result.profit)], ['Gross margin', `${result.margin.toFixed(1)}%`]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');
}

function screen() {
  const filter = filters[page] ?? {};
  switch (page) {
    case 'creators': return creatorsView(state, filter);
    case 'partners': return partnersView(state, filter);
    case 'sourcing': return sourcingView(state, draft);
    case 'campaigns': return campaignsView(state, filter);
    case 'studio': return studioView(state, filter);
    case 'money': return moneyView(state, filter, calculation, calculated());
    default: return dashboard(state);
  }
}

function preserveControl(container, update) {
  const active = document.activeElement;
  const keys = ['data-filter', 'data-detail', 'data-candidate', 'data-source-for', 'data-allocation-status', 'data-allocation-source',
    'data-production', 'data-task-select', 'data-checklist', 'data-action', 'name', 'id'];
  const key = container.contains(active) && keys.find(name => active.hasAttribute(name));
  const value = key ? active.getAttribute(key) : '';
  const id = key ? active.dataset.id : undefined;
  const alternate = key ? active.dataset.value : undefined;
  const caret = key && active instanceof HTMLInputElement ? [active.selectionStart, active.selectionEnd] : null;
  const positions = [...container.querySelectorAll('.table-wrap')].map(node => node.scrollLeft);
  update();
  container.querySelectorAll('.table-wrap').forEach((node, i) => { node.scrollLeft = positions[i] ?? 0; });
  if (!key) return;
  const replacement = [...container.querySelectorAll(`[${key}]`)].find(node => node.getAttribute(key) === value &&
    node.dataset.id === id && node.dataset.value === alternate);
  replacement?.focus({ preventScroll: true });
  if (caret?.[0] != null && replacement instanceof HTMLInputElement) replacement.setSelectionRange(...caret);
}

function render({ preserve = true } = {}) {
  const content = screen();
  const main = document.getElementById('main');
  if (main && preserve) preserveControl(main, () => { main.innerHTML = content; });
  else root.innerHTML = shell(page, content, menu);
}

function navigate(next, filter, focus = true) {
  if (filter) filters[next] = filter;
  menu = false;
  page = next;
  if (location.hash !== `#${next}`) history.pushState(null, '', `#${next}`);
  render({ preserve: false });
  if (focus) document.getElementById('main').focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function searchResults(query) {
  const needle = query.trim().toLowerCase();
  const results = [
    ...nav.map(([id, title]) => ({ title, type: 'Navigate', act: 'navigate-search', id })),
    ...(needle ? [
      ...state.creators.map(row => ({ title: row.name, terms: state.socialProfiles.filter(profile => profile.creatorId === row.id).map(profile => profile.handle).join(' '), type: 'Creator', act: 'creator', id: row.id })),
      ...state.agencies.map(row => ({ title: row.name, type: 'Agency', act: 'agency', id: row.id })),
      ...state.campaigns.map(row => ({ title: row.title, type: 'Campaign', act: 'campaign', id: row.id }))
    ] : [])
  ].filter(row => `${row.title} ${row.type} ${row.terms ?? ''}`.toLowerCase().includes(needle)).slice(0, 12);
  return results.length ? results.map(row => `<button class="search-result" ${action(row.act, row.id)}><span>${esc(row.title)}</span><small>${esc(row.type)}</small></button>`).join('') : empty('No workspace matches');
}

function modalContent() {
  const { type, id } = detail;
  switch (type) {
    case 'creator': return [find(state.creators, id).name, 'CREATOR PROFILE', creatorDetail(state, id, detail.format), 'wide'];
    case 'agency': return [find(state.agencies, id).name, 'PARTNER PROFILE', agencyDetail(state, id, detail.filter, detail.summary), 'wide'];
    case 'campaign': return [find(state.campaigns, id).title, 'CAMPAIGN WORKSPACE', campaignDetail(state, id), 'wide'];
    case 'task': return [find(state.tasks, id).title, 'CREATIVE TASK', taskDetail(state, id), 'compact'];
    case 'delivery': return [find(state.deliverables, id).title, 'CONTENT DETAIL', deliveryDetail(state, id), 'compact'];
    case 'quote': return ['Client quotation', 'CLIENT PREVIEW', quotePreview(state, detail.quote || find(state.quotations, id)), 'wide client-dialog'];
    case 'search': return ['Search workspace', 'QUICK FIND', `<label class="search-field modal-search">${icon('search')}<input id="workspace-search" type="search" placeholder="Search sections, creators, partners, campaigns" aria-label="Search workspace" value="${esc(detail.query)}"></label><div class="search-results">${searchResults(detail.query)}</div>`, 'compact'];
    case 'clients': {
      const groups = new Map();
      overviewLive().forEach(row => groups.set(row.clientId, (groups.get(row.clientId) || 0) + 1));
      return ['Active clients', 'LIVE CAMPAIGN WORK', table(['Client', 'Live campaigns'], [...groups].map(([id, count]) => `<tr><td>${clickable(find(state.clients, id).name, 'client-campaigns', id)}</td><td>${count}</td></tr>`), 'Active clients'), 'compact'];
    }
    case 'switch': {
      const row = find(state.campaignCreators, id);
      return ['Confirm supplier switch', 'LOCKED ALLOCATION', `<p>Switch the confirmed supplier for ${esc(find(state.creators, row.creatorId).name)}? The new buying rate updates the commitment. The agreed client selling price stays locked.</p><div class="actions">${button('Cancel', action('campaign', row.campaignId))}${button('Confirm supplier switch', action('confirm-switch', id), 'check', 'primary')}</div>`, 'compact'];
    }
    case 'reset': return ['Reset demo data?', 'SETTINGS', `<p>This removes changes made in this browser and restores the original synthetic records.</p><div class="actions">${button('Cancel', 'data-action="settings"')}${button('Reset Demo Data', 'data-action="do-reset"', '', 'danger')}</div>`, 'compact'];
    default: return ['Workspace settings', 'BORING OS', `<p>Serious about operations. Unreasonably unboring about everything else.</p><p class="muted">This workspace uses synthetic records and saves changes in this browser. The demo clock is fixed at ${todayLabel}.</p><hr>${button('Reset Demo Data', 'data-action="reset"', 'settings', 'danger')}`, 'compact'];
  }
}

function paintModal({ preserve = false, focus = '' } = {}) {
  const [title, kicker, body, size] = modalContent();
  dialog.className = size;
  const scroll = preserve ? dialog.querySelector('.modal-body')?.scrollTop ?? 0 : 0;
  const paint = () => {
    const notice = detail.type === 'quote' ? '' : `<div class="dialog-notice" role="status" ${toastText ? '' : 'hidden'}>${esc(toastText)}</div>`;
    dialog.innerHTML = `<header class="modal-head"><div><div class="eyebrow">${kicker}</div><h2 id="dialog-title">${esc(title)}</h2></div><button type="button" class="icon-button modal-close" data-action="close" aria-label="Close dialog">${icon('close', 23)}</button></header><div class="modal-body">${body}</div>${notice}`;
  };
  if (preserve) preserveControl(dialog, paint);
  else paint();
  dialog.querySelector('.modal-body').scrollTop = scroll;
  if (!dialog.open) dialog.showModal();
  if (focus) dialog.querySelector(focus)?.focus({ preventScroll: true });
  else if (!preserve) dialog.querySelector('.modal-close').focus({ preventScroll: true });
}

function openModal(type, id, extras = {}) {
  if (!dialog.open) {
    const active = document.activeElement;
    modalOrigin = active instanceof HTMLElement ? {
      element: active, action: active.dataset.action, id: active.dataset.id
    } : null;
  }
  detail = { type, id, ...extras };
  paintModal({ focus: type === 'search' ? '#workspace-search' : '' });
  if (extras.jump) dialog.querySelector('#offer-section')?.scrollIntoView({ block: 'start' });
}

function closeModal(restore = true) {
  if (dialog.open) dialog.close();
  detail = null;
  if (!restore || !modalOrigin) return;
  const { element, action: oldAction, id } = modalOrigin;
  if (element.isConnected) element.focus({ preventScroll: true });
  else if (oldAction) [...root.querySelectorAll('[data-action]')].find(node => node.dataset.action === oldAction && node.dataset.id === id)?.focus({ preventScroll: true });
}

function selectedRows() {
  const { brief, selected } = state.sourcing;
  return shortlist(matchCreators(state, brief), selected, brief.markup);
}

function runSourcing(brief) {
  const result = matchCreators(state, brief);
  state.sourcing = { brief, searched: true, selected: suggestedSelection(result, brief) };
  draft = { ...brief };
  const saved = save();
  render();
  if (saved) toast(`${result.candidates.length} eligible creators found.`);
  document.getElementById('matches')?.scrollIntoView({ block: 'start' });
}

function changeSelection(creatorId, offerId) {
  const result = matchCreators(state, state.sourcing.brief);
  const candidate = result.candidates.find(row => row.creator.id === creatorId);
  if (!candidate) return;
  if (offerId === false) delete state.sourcing.selected[creatorId];
  else {
    const valid = candidate.eligible.find(offer => offer.id === offerId);
    state.sourcing.selected[creatorId] = (valid ?? candidate.best).id;
  }
  save();
  render();
}

function exportCreators() {
  const rows = creatorRows(state, filters.creators ?? {});
  const cells = [
    ['Data classification', 'Creator', 'Handle', 'Platform', 'Residence', 'Niche', 'Followers', 'Average views', 'Engagement (%)', 'Best valid buying rate (INR)'],
    ...rows.map(({ creator, profile, best }) => ['Synthetic demo', creator.name, profile.handle, profile.platform, creator.city, creator.niche, profile.followers, profile.avgViews, profile.engagement, best?.buyingRate ?? ''])
  ];
  const csv = cells.map(row => row.map(value => {
    const text = String(value);
    return '"' + (/^[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""') + '"';
  }).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'boring-os-demo-creators.csv';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`${rows.length} creator records exported.`);
}

function overviewLive() {
  const active = new Set(['Active', 'Overdue']);
  return state.campaigns.filter(row => active.has(campaignStatus(state, row)));
}

function mutate(message, repaint = true) {
  if (save()) toast(message);
  render();
  if (repaint && detail && dialog.open) paintModal({ preserve: true });
}

function changeTask(id, status) {
  const row = find(state.tasks, id);
  row.status = status;
  recordActivity(state, 'content', `${row.title} moved to ${status}`, { campaignId: row.campaignId });
  mutate(`Task moved to ${status}.`);
}

function syncPost(delivery) {
  delivery.postUrl = delivery.progress === 5 ? delivery.postUrl || `https://posts.example.invalid/${delivery.id}` : '';
  delivery.checklist[2] = delivery.progress >= 4;
}

function switchSupplier(id, offerId) {
  const row = find(state.campaignCreators, id);
  const campaign = find(state.campaigns, row.campaignId);
  const offer = offerOptions(state, row.creatorId, { format: row.format, date: row.date, budget: campaign.budget }).find(item => item.id === offerId && !item.reasons.length);
  const payable = state.payments.find(item => item.allocationId === id);
  if (!offer || payable?.paid) {
    toast(payable?.paid ? 'This supplier payment is already settled.' : 'This offer is no longer eligible.');
    openModal('campaign', row.campaignId);
    return;
  }
  const otherCost = state.campaignCreators.filter(item => item.campaignId === row.campaignId && item.id !== row.id)
    .reduce((sum, item) => sum + item.buyingRate * item.quantity, campaign.productionCost);
  if (otherCost + offer.buyingRate * row.quantity > campaign.budget) {
    toast('The supplier switch would exceed the campaign buying budget.');
    openModal('campaign', row.campaignId);
    return;
  }
  Object.assign(row, { offerId: offer.id, sourceId: offer.sourceId, buyingRate: offer.buyingRate, terms: offer.terms });
  if (payable) payable.amount = row.buyingRate * row.quantity;
  recordActivity(state, 'source', `Supplier updated for ${find(state.creators, row.creatorId).name}`, { campaignId: row.campaignId });
  mutate('Supplier and buying rate snapshot updated.', false);
  openModal('campaign', row.campaignId);
}

function collectInsights(campaignId) {
  const published = state.deliverables.filter(row => row.campaignId === campaignId && row.progress === 5);
  for (const delivery of published) {
    const row = state.campaignCreators.find(item => item.deliverableId === delivery.id);
    if (!state.performanceRecords.some(item => item.deliverableId === delivery.id)) {
      const profile = row && profileFor(state, row.creatorId, formatPlatform[row.format]);
      const views = Math.round(profile?.avgViews ?? 8000 + delivery.title.length * 383);
      state.performanceRecords.push({ id: `pf-${delivery.id}`, campaignId, deliverableId: delivery.id, date: DEMO_DATE, views,
        engagements: Math.round(views * (profile?.engagement ?? 4) / 100), impressions: Math.round(views * 1.52),
        reportedReach: Math.round(views * 1.1), clicks: find(state.campaigns, campaignId).adSpend ? Math.round(views * 0.01) : 0 });
    }
    if (row) updateAllocation(state, row, 'Insights Collected', false);
  }
  recordActivity(state, 'content', 'Demo performance insights recorded', { campaignId });
  mutate('Demo insights recorded.');
}

const actions = {
  menu() {
    menu = !menu;
    render({ preserve: false });
    root.querySelector(menu ? '.sidebar nav a' : '.menu-button')?.focus();
  },
  settings: () => openModal('settings'),
  reset: () => openModal('reset'),
  'do-reset'() {
    state = freshState();
    draft = { ...defaultBrief };
    filters = {};
    calculation = { buying: 15000, markup: 30, quantity: 5, additional: 2500 };
    closeModal(false);
    navigate('dashboard');
    if (save()) toast('Original demo data restored.');
  },
  close: () => closeModal(),
  search: () => openModal('search', null, { query: '' }),
  creator(id, node) { openModal('creator', id, { jump: node.dataset.focus === 'offers' }); },
  agency(id) { openModal('agency', id, { filter: {} }); },
  campaign: id => openModal('campaign', id),
  delivery: id => openModal('delivery', id),
  task: id => openModal('task', id),
  quote: id => openModal('quote', id),
  'navigate-search'(id) { closeModal(false); navigate(id); },
  'client-campaigns'(id) { closeModal(false); navigate('campaigns', { client: id, status: 'Live work' }); },
  kpi(id) {
    if (id === 'active-clients') openModal('clients');
    if (id === 'active-campaigns') navigate('campaigns', { status: 'Live work' });
    if (id === 'all-creators') navigate('creators', {});
    if (id === 'approvals') navigate('studio', { tab: 'Approvals' });
    if (id === 'overdue') navigate('studio', { tab: 'Board', overdue: true });
    if (id === 'contribution') navigate('money', { tab: 'Overview' });
  },
  service: id => navigate('campaigns', { service: id }),
  'clear-filters'() { filters[page] = {}; render(); },
  'export-creators': exportCreators,
  import(id) {
    detail.summary = importInventory(state, id);
    if (detail.summary.imported) recordActivity(state, 'source', `${detail.summary.imported} demo offers imported`, { agencyId: id });
    mutate(detail.summary.imported ? 'New offers linked to existing creators.' : 'This demo batch has already been imported.');
  },
  'load-brief': () => runSourcing({ ...defaultBrief }),
  'preview-sourcing'() {
    const { brief } = state.sourcing;
    const lines = selectedRows().map(row => ({ creatorId: row.creatorId, format: row.offer.deliverableType, quantity: row.quantity, sellingRate: row.sellingRate }));
    if (lines.length) openModal('quote', null, { quote: { clientId: brief.clientId, title: brief.title, date: DEMO_DATE, serviceFee: 0, lines } });
  },
  'create-campaign'() {
    try {
      const campaign = createCampaign(state, state.sourcing.brief, selectedRows());
      state.sourcing.selected = {};
      navigate('campaigns', {});
      if (save()) toast('Campaign, draft quote, and deliverables created.');
      openModal('campaign', campaign.id);
    } catch (error) {
      toast(error.message);
    }
  },
  'task-status': (id, node) => changeTask(id, taskStages[Number(node.dataset.value)]),
  revision(id) {
    find(state.deliverables, id).revisions++;
    mutate('Revision logged.');
  },
  'collect-insights': collectInsights,
  'close-campaign'(id) {
    find(state.campaigns, id).status = 'Completed';
    recordActivity(state, 'content', 'Campaign closed', { campaignId: id });
    mutate('Campaign closed.');
  },
  'confirm-switch': id => switchSupplier(id, detail.offerId),
  'studio-tab'(id) { filters.studio = { ...filters.studio, tab: id }; render(); },
  'money-tab'(id) { filters.money = { ...filters.money, tab: id }; render(); },
  'clear-overdue'() { delete filters.studio.overdue; render(); },
  'filter-employee'(id) { filters.studio = { ...filters.studio, employee: id }; render(); },
  payment(id) {
    const row = find(state.payments, id);
    row.paid = !row.paid;
    const next = row.paid ? 'paid' : 'unpaid';
    recordActivity(state, 'payment', `${row.invoiceId || 'Supplier payment'} marked ${next}`, { campaignId: row.campaignId });
    mutate(`Payment marked ${next}.`);
  }
};

document.addEventListener('click', event => {
  const node = event.target.closest('[data-action]');
  if (node && !node.disabled) {
    actions[node.dataset.action]?.(node.dataset.id, node);
    return;
  }
  const link = event.target.closest('a[href^="#"]');
  if (link?.classList.contains('skip')) {
    event.preventDefault();
    document.getElementById('main').focus();
    return;
  }
  if (link && nav.some(([id]) => id === link.hash.slice(1)) && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    navigate(link.hash.slice(1));
  }
});

document.addEventListener('input', event => {
  const node = event.target;
  if (node.dataset.filter && node instanceof HTMLInputElement) {
    filters[page] = { ...filters[page], [node.dataset.filter]: node.value };
    render();
  }
  if (node.matches('#sourcing-form input')) draft = { ...draft, [node.name]: node.value };
  if (node.dataset.calculator) {
    calculation[node.dataset.calculator] = node.value;
    document.getElementById('calculator-results').innerHTML = calculated();
  }
  if (node.id === 'workspace-search') {
    detail.query = node.value;
    dialog.querySelector('.search-results').innerHTML = searchResults(detail.query);
  }
  if (node.dataset.detail === 'agency-q') {
    detail.filter.q = node.value;
    paintModal({ preserve: true });
  }
});

document.addEventListener('change', event => {
  const node = event.target;
  const { filter, detail: field, candidate, sourceFor, taskSelect, production, checklist, allocationStatus, allocationSource } = node.dataset;
  if (filter && node instanceof HTMLSelectElement) {
    filters[page] = { ...filters[page], [filter]: node.value };
    render();
  }
  if (node.matches('#sourcing-form select')) {
    draft = { ...draft, [node.name]: node.value };
    if (node.name === 'platform' && formatPlatform[draft.format] !== node.value) {
      draft.format = formats.find(format => formatPlatform[format] === node.value);
      document.querySelector('#sourcing-form [name="format"]').value = draft.format;
    }
  }
  if (field && node instanceof HTMLSelectElement) {
    if (field === 'creator-format') detail.format = node.value;
    else detail.filter[field.replace('agency-', '')] = node.value;
    paintModal({ preserve: true });
  }
  if (candidate) {
    const select = [...root.querySelectorAll('[data-source-for]')].find(item => item.dataset.sourceFor === candidate);
    changeSelection(candidate, node.checked ? select?.value : false);
  }
  if (sourceFor) changeSelection(sourceFor, node.value);
  if (taskSelect) changeTask(taskSelect, node.value);
  if (production) {
    const row = find(state.deliverables, production);
    assignProduction(state, row, Number(node.value));
    syncPost(row);
    recordActivity(state, Number(node.value) >= 4 ? 'approval' : 'content', `${row.title} production stage updated`, { campaignId: row.campaignId });
    mutate('Production stage updated.');
  }
  if (checklist) {
    find(state.deliverables, checklist).checklist[Number(node.dataset.value)] = node.checked;
    save();
  }
  if (allocationStatus && allocationStages.includes(node.value)) {
    const row = find(state.campaignCreators, allocationStatus);
    updateAllocation(state, row, node.value);
    const delivery = find(state.deliverables, row.deliverableId);
    if (delivery) syncPost(delivery);
    mutate('Creator allocation updated.');
  }
  if (allocationSource) {
    const row = find(state.campaignCreators, allocationSource);
    if (row.status === 'Shortlisted') switchSupplier(row.id, node.value);
    else openModal('switch', row.id, { offerId: node.value });
  }
});

document.addEventListener('submit', event => {
  if (event.target.id !== 'sourcing-form') return;
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target));
  const brief = { ...payload, title: payload.title.trim() };
  for (const key of ['desired', 'minFollowers', 'minEngagement', 'budget', 'markup']) brief[key] = Number(payload[key]);
  const error = checkBrief(brief);
  if (error) {
    document.getElementById('brief-error').textContent = error;
    return;
  }
  runSourcing(brief);
});

dialog.addEventListener('cancel', event => { event.preventDefault(); closeModal(); });
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeModal();
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    actions.search();
  }
  if (event.key === 'Escape' && menu && !dialog.open) actions.menu();
});
window.addEventListener('hashchange', () => {
  if (!location.hash || nav.some(([id]) => location.hash === `#${id}`)) {
    const next = readPage();
    if (next !== page) {
      page = next;
      menu = false;
      render({ preserve: false });
      window.scrollTo(0, 0);
    }
  }
});
render({ preserve: false });
if (loaded.recovered) {
  if (save()) toast('Saved demo data could not be read. Original records restored.');
}
