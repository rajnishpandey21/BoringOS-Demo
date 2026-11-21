import { DEMO_DATE, formats, markets, niches, platforms } from './data.js';
import { bestOffer, campaignStatus, clientFor, find, isOverdue, offerOptions, overview, profileFor, sourceName, stageFor, stale } from './logic.js';
import { action, avatar, badge, bar, button, clickable, compact, date, empty, esc, fullDate, head, icon, input, money, number, route, section, select, shortMoney, table } from './ui.js';

export const campaignFilters = ['All statuses', 'Planning', 'Active', 'Overdue', 'Completed'];

export function campaignTable(state, campaigns, dashboard = false) {
  return campaigns.length ? table(['Campaign', 'Status', 'Progress', 'Due', ...(dashboard ? [] : ['Stage', 'Owner']), ''],
    campaigns.map(campaign => {
      const client = clientFor(state, campaign);
      const deliveries = state.deliverables.filter(item => item.campaignId === campaign.id);
      const progress = deliveries.length ? Math.round(deliveries.reduce((sum, row) => sum + row.progress, 0) / (deliveries.length * 5) * 100) : 0;
      const status = campaignStatus(state, campaign);
      return `<tr><td><div class="identity">${avatar(client.name, state.clients.indexOf(client))}<div>${clickable(campaign.title, 'campaign', campaign.id)}<small>${esc(client.name)}</small></div></div></td>
        <td>${badge(status)}</td><td><div class="progress-cell">${bar(progress, campaign.title)}<small>${progress}%</small></div></td><td class="nowrap">${date(campaign.endDate)}</td>
        ${dashboard ? '' : `<td>${esc(stageFor(state, campaign))}</td><td>${esc(find(state.employees, campaign.ownerId)?.name)}</td>`}
        <td><button type="button" class="icon-button" ${action('campaign', campaign.id)} aria-label="Open ${esc(campaign.title)}">${icon('chevron', 17)}</button></td></tr>`;
    }), 'Campaign progress') : empty('No campaigns in this view', 'Try another status or client.');
}

export function dashboard(state) {
  const kpi = overview(state);
  const cards = [
    ['Active clients', kpi.clients, 'partners', 'active-clients', 'blue', 'Across live work'],
    ['Active campaigns', kpi.campaigns, 'campaigns', 'active-campaigns', 'yellow', 'Includes overdue'],
    ['Unique creators', kpi.creators, 'creators', 'all-creators', 'coral', 'Across all sources'],
    ['Pending approvals', kpi.approvals, 'check', 'approvals', 'mint', 'In client review'],
    ['Overdue tasks', kpi.overdue, 'clock', 'overdue', 'lilac', `As of ${date(DEMO_DATE)}`],
    ['Est. contribution', shortMoney(kpi.contribution), 'money', 'contribution', 'blue', 'Across campaigns']
  ];
  const current = state.campaigns.filter(row => campaignStatus(state, row) !== 'Completed');
  const upcoming = [
    ...state.tasks.filter(row => row.status !== 'Completed' && !isOverdue(row)).map(row => ({ ...row, kind: 'task' })),
    ...state.deliverables.filter(row => row.progress < 5 && row.date >= DEMO_DATE).map(row => ({ ...row, kind: 'delivery' }))
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const mix = [...new Set(state.campaigns.map(row => row.service))].map(service => [service, state.campaigns.filter(row => row.service === service).length]).sort((a, b) => b[1] - a[1]);
  const serviceColors = ['cobalt', 'yellow', 'coral', 'mint'];
  const queue = kpi.overdue + kpi.approvals;
  return `<section class="hero">
      <div class="hero-copy"><div class="hero-kicker"><span></span> THE AGENCY OPERATING SYSTEM</div><h1>Command Center<span>.</span></h1><p>Less chaos. More campaigns.</p><div class="hero-actions">${route('sourcing', 'New sourcing brief', 'button hero-button')}${route('campaigns', 'View campaigns', 'button hero-secondary')}</div></div>
      <div class="hero-art" aria-hidden="true"><div class="hero-dots"></div><div class="orbit orbit-a"></div><div class="orbit orbit-b"></div><div class="burst-shadow"></div><div class="burst"></div><div class="burst-face"><i></i><i></i><b></b></div><div class="orbit-star">✦</div><div class="hero-stamp">GOOD<br>WORK<span>.</span></div></div>
    </section>
    <div class="overview-heading"><div><div class="eyebrow">THE BIG PICTURE</div><h2>At a glance</h2></div><span class="day-tag">${icon('calendar', 15)} ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(DEMO_DATE))}</span></div>
    <section class="kpi-grid" aria-label="Workspace indicators">${cards.map(([label, value, symbol, id, color, hint]) => `<button class="kpi" ${action('kpi', id)}><span class="kpi-top"><span class="kpi-icon ${color}">${icon(symbol, 17)}</span>${icon('external', 14)}</span><strong>${esc(value)}</strong><span class="kpi-label">${label}</span><small>${hint}</small></button>`).join('')}</section>
    <div class="dashboard-grid">
      <section class="panel campaign-panel">${section('Campaign progress', 'A live view of work in motion.', route('campaigns', 'All campaigns'))}${campaignTable(state, current.slice(0, 5), true)}</section>
      <section class="panel deadlines">${section('Coming up', 'Upcoming tasks and posts.', '<span class="panel-icon">' + icon('calendar', 19) + '</span>')}
        ${upcoming.length ? `<div class="deadline-list">${upcoming.map(row => `<button class="deadline-row" ${action(row.kind, row.id)}><span class="date-block"><strong>${row.date.slice(-2)}</strong><small>${date(row.date).split(' ').find(word => /[a-z]/i.test(word))}</small></span><span><strong>${esc(row.title)}</strong><small>${esc(find(state.campaigns, row.campaignId)?.title)}</small></span>${icon('chevron', 15)}</button>`).join('')}</div>` : empty('Nothing on the calendar')}
        ${route('studio', 'Open Content Studio', 'text-link panel-footer')}</section>
      <section class="panel">${section('Recent activity', 'What changed across the workspace.')}<div class="activity-list">${state.activityLog.slice(0, 5).map(row => `<button class="activity-row" ${action(row.agencyId ? 'agency' : 'campaign', row.agencyId || row.campaignId)}><span class="activity-icon">${icon(({ approval: 'check', source: 'sourcing', payment: 'money', content: 'studio' })[row.type], 16)}</span><span>${esc(row.text)}<small>${date(row.date)}</small></span>${icon('chevron', 15)}</button>`).join('')}</div></section>
      <div class="stack">
        <section class="panel service-panel">${section('Service mix', `${state.campaigns.length} campaigns by primary service`)}
          <div class="service-bar" aria-hidden="true">${mix.map(([, count], i) => `<i class="${serviceColors[i]}" style="flex:${count}"></i>`).join('')}</div>
          <div class="service-legend">${mix.map(([service, count], i) => `<button class="bare-link" ${action('service', service)}><i class="${serviceColors[i]}"></i>${esc(service)} <strong>${count}</strong></button>`).join('')}</div>
        </section>
        <section class="ops-alert">${icon('bell', 22)}<div><strong>${queue ? `${queue} items need attention` : 'Clear for takeoff'}</strong><p>${kpi.approvals} approvals · ${kpi.overdue} overdue tasks</p></div>${queue ? button('View queue', action('kpi', kpi.overdue ? 'overdue' : 'approvals'), '', 'ink') : ''}</section>
      </div>
    </div>`;
}

const any = label => ['', label];
const comparator = (a, b) => (a ?? Infinity) - (b ?? Infinity);
const searchMatch = (search, ...parts) => parts.join(' ').toLowerCase().includes((search ?? '').trim().toLowerCase());

export function creatorRows(state, filter) {
  return state.creators.map((creator, index) => ({
    creator, index, profile: profileFor(state, creator.id, filter.platform || 'Instagram'),
    best: bestOffer(state, creator.id, { format: formats.find(format => format.startsWith(filter.platform || 'Instagram')) })
  })).filter(({ creator, profile, best }) => {
    if (!profile || !searchMatch(filter.q, creator.name, profile.handle, creator.niche, creator.city)) return false;
    if (filter.city && creator.city !== filter.city || filter.niche && creator.niche !== filter.niche ||
      filter.audience && !creator.audience.some(row => row.city === filter.audience)) return false;
    if (filter.tier === 'nano' && profile.followers >= 10000 ||
      filter.tier === 'micro' && (profile.followers < 10000 || profile.followers >= 100000) ||
      filter.tier === 'mid' && profile.followers < 100000) return false;
    return (!filter.engagement || profile.engagement >= Number(filter.engagement)) &&
      (!filter.availability || Boolean(best) === (filter.availability === 'yes')) &&
      (!filter.max || best && best.buyingRate <= Number(filter.max));
  }).sort((a, b) => ({
    followers: () => b.profile.followers - a.profile.followers, views: () => b.profile.avgViews - a.profile.avgViews,
    engagement: () => b.profile.engagement - a.profile.engagement, rate: () => comparator(a.best?.buyingRate, b.best?.buyingRate),
    name: () => a.creator.name.localeCompare(b.creator.name)
  })[filter.sort || 'followers']());
}

export function creatorsView(state, filter) {
  const rows = creatorRows(state, filter);
  const fields = [
    ['Residence', 'city', [any('All cities'), ...markets]], ['Primary niche', 'niche', [any('All niches'), ...niches]],
    ['Platform', 'platform', [any('Primary profile'), ...platforms]], ['Audience market', 'audience', [any('All markets'), ...markets]],
    ['Follower tier', 'tier', [any('All tiers'), ['nano', 'Under 10K'], ['micro', '10K–99K'], ['mid', '100K+']]],
    ['Engagement', 'engagement', [any('Any engagement'), ['3', '3% or higher'], ['5', '5% or higher'], ['7', '7% or higher']]],
    ['Availability', 'availability', [any('All offers'), ['yes', 'Eligible offer'], ['no', 'No eligible offer']]],
    ['Sort by', 'sort', [['followers', 'Most followers'], ['views', 'Most views'], ['engagement', 'Highest engagement'], ['rate', 'Best valid rate'], ['name', 'Name A–Z']]]
  ];
  const exportButton = button('Export CSV', 'data-action="export-creators"', 'download');
  return `${head('TALENT DIRECTORY', 'Creator Universe', 'Creators, without the circus. Every identity and sourcing option in one place.', exportButton)}
    <section class="panel directory-panel">
      <div class="toolbar"><label class="search-field">${icon('search', 18)}<input type="search" aria-label="Search creators" placeholder="Search name, handle, or niche" data-filter="q" value="${esc(filter.q)}"></label>
      <span class="result-count">${rows.length} of ${state.creators.length} creators</span>${button('Clear filters', 'data-action="clear-filters"', 'close', 'quiet')}</div>
      <div class="filters">${fields.map(([label, key, choices]) => select(label, `data-filter="${key}"`, choices, filter[key] || (key === 'sort' ? 'followers' : ''))).join('')}${input('Max buying rate (₹)', 'type="number" min="0" data-filter="max" placeholder="Any rate"', filter.max)}</div>
      ${rows.length ? table(['Creator', 'Residence', 'Niche', 'Followers', 'Avg. views', 'Engagement', 'Best valid rate', ''], rows.map(({ creator, index, profile, best }) => `<tr>
        <td><div class="identity">${avatar(creator.name, index)}<div>${clickable(creator.name, 'creator', creator.id)}<small>${esc(profile.handle)} ${stale(profile.measuredAt) ? '· Stale' : ''}</small></div></div></td>
        <td>${esc(creator.city)}</td><td>${badge(creator.niche, 'neutral')}</td><td>${compact(profile.followers)}</td><td>${compact(profile.avgViews)}</td><td>${profile.engagement}%</td>
        <td>${best ? money(best.buyingRate) : '—'}</td><td>${button('View source options', action('creator', creator.id, 'data-focus="offers"'), '', 'quiet small')}</td></tr>`), 'Creator directory') : empty('No creators match these filters', 'Clear a filter or try a different search.')}
    </section>`;
}

function sourceTable(state, offers, highlightedId, partner = false) {
  return offers.length ? table([partner ? 'Creator' : 'Source', 'Deliverable & terms', 'Buying rate', 'Validity', 'Eligibility'], offers.map(offer => `<tr>
    <td>${partner ? clickable(find(state.creators, offer.creatorId).name, 'creator', offer.creatorId) : esc(sourceName(state, offer.sourceId))}<small>Verified ${date(offer.lastVerifiedAt)}</small></td>
    <td>${esc(offer.deliverableType)}<small>${esc(offer.terms)}</small></td><td>${money(offer.buyingRate)}</td><td>${fullDate(offer.validUntil)}</td>
    <td>${offer.id === highlightedId ? badge('Best eligible', 'available') : offer.reasons?.length ? badge(offer.reasons.join(' · '), 'overdue') : badge(offer.availability, offer.availability === 'Available' ? 'available' : 'overdue')}${offer.contractualRestrictions ? `<small>${esc(offer.contractualRestrictions)}</small>` : ''}<small title="${esc(offer.commercialNotes)}">Organic usage only</small></td></tr>`), 'Source offers') : empty('No sourcing offers under this filter');
}

export function creatorDetail(state, id, selectedFormat = formats[0]) {
  const creator = find(state.creators, id);
  const profiles = platforms.map(platform => profileFor(state, id, platform)).filter(Boolean);
  const offers = offerOptions(state, id, { format: selectedFormat });
  const recommendation = offers.find(offer => !offer.reasons.length);
  const history = state.campaignCreators.filter(row => row.creatorId === id);
  return `<div class="profile-intro">${avatar(creator.name, state.creators.indexOf(creator))}<div><p>${esc(creator.bio)}</p><div class="tag-list">${badge(creator.city, 'neutral')}${badge(creator.niche, 'neutral')}${badge(`${creator.reliability}% reliability`, 'available')}${stale(creator.verifiedAt) ? badge('Profile verification stale', 'overdue') : ''}</div></div></div>
    <p class="muted">Profile verified ${fullDate(creator.verifiedAt)}. Contacts are managed through the selected supplier and subject to its terms.</p>
    ${section('Social profiles')}<div class="mini-grid">${profiles.map(row => `<div class="mini-card"><strong>${esc(row.platform)}</strong><p>${esc(row.handle)}</p><div class="tag-list">${badge(`${compact(row.followers)} followers`, 'neutral')}${badge(`${compact(row.avgViews)} avg. views`, 'neutral')}${badge(`${row.engagement}% engagement`, 'neutral')}</div><p>${esc(row.formats.join(' · '))}</p><small>Measured ${fullDate(row.measuredAt)} ${stale(row.measuredAt) ? '· stale metric' : ''}</small></div>`).join('')}</div>
    ${section('Audience distribution', `Core age ${creator.age} · ${creator.genderMix}`)}<div class="distribution">${creator.audience.map(row => `<div><span>${esc(row.city)}</span>${bar(row.share, row.city)}<strong>${row.share}%</strong></div>`).join('')}</div>
    <div id="offer-section">${section('Source options', 'Recommendation compares eligible offers with matching format and terms.', select('Compare format', 'data-detail="creator-format"', formats, selectedFormat))}${sourceTable(state, offers, recommendation?.id)}</div>
    ${section('Portfolio & campaign history')}<div class="tag-list">${creator.portfolio.map(name => badge(`${name} · demo placeholder`, 'neutral')).join('')}</div>
    ${history.length ? `<ul class="history">${history.map(row => `<li>${clickable(find(state.campaigns, row.campaignId).title, 'campaign', row.campaignId)} ${badge(row.status)}</li>`).join('')}</ul>` : '<p class="muted">No previous campaigns in this workspace.</p>'}`;
}

export function partnersView(state, filter) {
  const rows = state.agencies.filter(row => searchMatch(filter.q, row.name, row.contact, ...row.specialties, ...row.cities) && (!filter.city || row.cities.includes(filter.city)));
  return `${head('SUPPLIER DIRECTORY', 'Partner Network', 'External talent, clear terms, and a single record for each creator.')}
    <div class="panel toolbar wrap"><label class="search-field">${icon('search', 18)}<input type="search" data-filter="q" aria-label="Search agencies" placeholder="Search agency, contact, or specialty" value="${esc(filter.q)}"></label>
    ${select('Market coverage', 'data-filter="city"', [any('All markets'), ...markets], filter.city || '')}<span class="result-count">${rows.length} partners</span></div>
    <div class="partner-grid">${rows.map((agency, i) => `<article class="panel partner-card"><div class="partner-top"><span class="partner-mark tint-${i}">${esc(agency.initials)}</span>${badge(`${agency.reliability}% reliability`, 'available')}</div>
      <h2>${esc(agency.name)}</h2><p>${esc(agency.cities.join(' · '))}</p><div class="tag-list">${agency.specialties.map(name => badge(name, 'neutral')).join('')}</div>
      <div class="partner-facts"><div><small>Source offers</small><strong>${state.sourceOffers.filter(row => row.sourceId === agency.id).length}</strong></div><div><small>Payment terms</small><strong>${esc(agency.terms)}</strong></div></div>
      ${button('Open inventory', action('agency', agency.id), 'partners', 'secondary')}
    </article>`).join('')}</div>${rows.length ? '' : empty('No agencies match these filters')}`;
}

export function agencyDetail(state, id, filter, summary) {
  const agency = find(state.agencies, id);
  const inventory = state.sourceOffers.filter(row => row.sourceId === id);
  const rows = inventory.filter(row => searchMatch(filter.q, find(state.creators, row.creatorId).name, row.contractualRestrictions, row.deliverableType) &&
    (!filter.format || row.deliverableType === filter.format) && (!filter.availability || row.availability === filter.availability));
  const offers = rows.map(row => offerOptions(state, row.creatorId, { format: row.deliverableType }).find(item => item.id === row.id));
  return `<div class="mini-grid"><div class="mini-card"><strong>${esc(agency.contact)}</strong><p>${esc(agency.email)}</p><small>${esc(agency.cities.join(' · '))}</small></div><div class="mini-card"><strong>${esc(agency.terms)}</strong><p>${agency.reliability}% reliability</p><small>${inventory.length} inventory offers</small></div></div>
    ${section('Creator inventory', 'Import a fixed sample batch into existing creator records.', button('Simulate demo import', action('import', id), 'plus', 'primary'))}
    ${summary ? `<div class="notice" role="status">${summary.matched} existing creators matched · ${summary.newCreators} new identities · ${summary.imported} offers imported</div>` : ''}
    <div class="filters no-border">${input('Search inventory', 'type="search" data-detail="agency-q" placeholder="Creator, format, or term"', filter.q)}
      ${select('Format', 'data-detail="agency-format"', [any('All formats'), ...formats], filter.format || '')}
      ${select('Availability', 'data-detail="agency-availability"', [any('Any availability'), 'Available', 'Unavailable'], filter.availability || '')}</div>
    ${sourceTable(state, offers, undefined, true)}`;
}
