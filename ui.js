import { DEMO_DATE } from './data.js';
import { find, initials } from './logic.js';

const icons = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  creators: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M15 3.2a4 4 0 0 1 0 7.6"/><circle cx="9" cy="7" r="4"/>',
  partners: '<path d="m10 13 4-4m-5.5 7.5-1 1a4 4 0 0 1-5.7-5.7l4-4a4 4 0 0 1 5.7 0m1 8.4a4 4 0 0 0 5.7 0l4-4a4 4 0 0 0-5.7-5.7l-1 1"/>',
  sourcing: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  campaigns: '<path d="M3 8V5a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8Zm0 1h18"/>',
  studio: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18m-13-5 3 5m3-5 3 5m-7 4 4 2-4 2z"/>',
  money: '<path d="M3 3v18h18M8 17v-4m5 4V8m5 9V5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  external: '<path d="M7 17 17 7M7 7h10v10"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  sliders: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor"/><circle cx="15" cy="17" r="2" fill="currentColor"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4m8-4v4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z"/>',
  spark: '<path d="M12 2v20M2 12h20M5 5l14 14m0-14L5 19"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  file: '<path d="M5 3h9l5 5v13H5zM14 3v6h5M8 13h8m-8 4h8"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>'
};

export const nav = [
  ['dashboard', 'Command Center'], ['creators', 'Creator Universe'], ['partners', 'Partner Network'],
  ['sourcing', 'Smart Sourcing'], ['campaigns', 'Campaign HQ'], ['studio', 'Content Studio'], ['money', 'Money & Metrics']
];
export const icon = (name, size = 18) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name] ?? icons.spark}</svg>`;
export const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
export const number = value => new Intl.NumberFormat('en-IN').format(value ?? 0);
export const compact = value => value >= 100000 ? `${+(value / 100000).toFixed(2)}L` : value >= 1000 ? `${+(value / 1000).toFixed(1)}K` : String(value);
export const shortMoney = value => `₹${compact(value)}`;
export const date = value => value ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(value)) : '—';
export const fullDate = value => value ? `${date(value)} ${value.slice(0, 4)}` : '—';
export const todayLabel = fullDate(DEMO_DATE);
export const opt = (value, label, selected) => `<option value="${esc(value)}"${String(value) === String(selected) ? ' selected' : ''}>${esc(label)}</option>`;
export const options = (rows, selected) => rows.map(row => Array.isArray(row) ? opt(row[0], row[1], selected) : opt(row, row, selected)).join('');
export const select = (label, attrs, rows, selected) => `<label class="field"><span>${esc(label)}</span><select ${attrs}>${options(rows, selected)}</select></label>`;
export const input = (label, attrs, value = '') => `<label class="field"><span>${esc(label)}</span><input ${attrs} value="${esc(value)}"></label>`;
export const badge = (label, variant = slug(label)) => `<span class="badge ${esc(variant)}">${esc(label)}</span>`;
export const avatar = (name, color = 0) => `<span class="avatar tint-${color % 5}" aria-hidden="true">${esc(initials(name))}</span>`;
export const bar = (percent, label = '') => `<div class="progress" role="progressbar" aria-label="${esc(label || 'Progress')}" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><i style="--progress:${percent}%"></i></div>`;
export const empty = (message, description = '') => `<div class="empty">${icon('search', 24)}<strong>${esc(message)}</strong>${description ? `<p>${esc(description)}</p>` : ''}</div>`;
export const button = (label, attrs, symbol = '', style = 'secondary') => `<button type="button" class="button ${style}" ${attrs}>${symbol ? icon(symbol, 16) : ''}${esc(label)}</button>`;
export const route = (name, label, className = 'text-link') => `<a class="${className}" href="#${name}">${esc(label)}</a>`;
export const head = (kicker, title, sub, actions = '') => `<header class="page-head"><div><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>${actions ? `<div class="actions">${actions}</div>` : ''}</header>`;
export const section = (title, meta = '', actions = '') => `<div class="panel-head"><div><h2>${esc(title)}</h2>${meta ? `<p>${esc(meta)}</p>` : ''}</div>${actions}</div>`;
export const table = (headers, rows, label) => `<div class="table-wrap" role="region" tabindex="0" aria-label="${esc(label)}"><table><thead><tr>${headers.map(label => `<th scope="col">${esc(label)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
export const action = (type, id, extra = '') => `data-action="${type}" data-id="${esc(id)}" ${extra}`;
export const clickable = (label, type, id) => `<button type="button" class="bare-link" ${action(type, id)}>${esc(label)}</button>`;
export const campaignName = (state, id) => find(state.campaigns, id)?.title ?? '';
export const creatorName = (state, id) => find(state.creators, id)?.name ?? '';

export function shell(page, view, menuOpen) {
  return `<div class="shell">
    <aside class="sidebar ${menuOpen ? 'menu-open' : ''}" id="sidebar">
      <a class="brand" href="#dashboard"><span class="brand-mark" aria-hidden="true">B<span>.</span></span><span><strong>BORING<span class="brand-os"> OS</span></strong><small>BY BORING COMPANY</small></span></a>
      <div class="side-label">WORKSPACE</div>
      <nav aria-label="Workspace">${nav.map(([id, label]) => `<a href="#${id}" ${id === page ? 'aria-current="page"' : ''}>${icon(id, 19)}<span>${esc(label)}</span>${id === page ? '<i aria-hidden="true"></i>' : ''}</a>`).join('')}</nav>
      <div class="sidebar-bottom">
        <button type="button" class="settings-link" data-action="settings">${icon('settings', 18)} Settings</button>
        <div class="workspace-user"><div class="user-monogram">BC</div><span><strong>Boring Company</strong><small>Studio workspace</small></span></div>
      </div>
    </aside>
    ${menuOpen ? '<button type="button" data-action="menu" class="scrim" aria-label="Close navigation"></button>' : ''}
    <div class="workspace">
      <header class="topbar">
        <div class="top-context"><button type="button" class="icon-button menu-button" data-action="menu" aria-label="Toggle navigation" aria-controls="sidebar" aria-expanded="${menuOpen}">${icon('menu', 22)}</button><span class="top-workspace">Workspace</span><span class="top-divider">/</span><strong>${esc(nav.find(([id]) => id === page)?.[1])}</strong></div>
        <div class="top-tools"><button type="button" class="search-trigger" data-action="search" aria-label="Search workspace" aria-keyshortcuts="Control+k Meta+k">${icon('search', 17)}<span>Search workspace</span><kbd>⌘ K</kbd></button><span class="demo-label" aria-label="Demo mode, synthetic data"><i aria-hidden="true"></i><span>DEMO MODE<span class="demo-detail"> / SYNTHETIC DATA</span></span></span></div>
      </header>
      <main id="main" tabindex="-1">${view}</main>
      <footer class="footer"><span>BORING OS / BORING COMPANY</span><span>Synthetic data · ${todayLabel}</span></footer>
    </div>
  </div>`;
}
