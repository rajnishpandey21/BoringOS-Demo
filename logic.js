import { allocationStages, campaignStages, DEMO_DATE, DIRECT, formatPlatform, importOffers, seed } from './data.js';

export const STORAGE_KEY = 'boring-os:v1';
export const freshState = () => structuredClone(seed);
export const find = (rows, id) => rows.find(row => row.id === id);
export const total = (rows, value) => rows.reduce((sum, row) => sum + value(row), 0);
export const initials = name => name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
export const clientFor = (state, campaign) => find(state.clients, campaign.clientId);
export const sourceName = (state, id) => id === DIRECT ? 'Direct' : find(state.agencies, id)?.name ?? 'Unknown source';
export const isOverdue = task => task.status !== 'Completed' && task.date < DEMO_DATE;
export const stale = date => (Date.parse(DEMO_DATE) - Date.parse(date)) / 86400000 > 90;

export function loadState(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { state: freshState(), recovered: false };
    const state = JSON.parse(raw);
    const arrays = Object.keys(seed).filter(key => Array.isArray(seed[key]));
    if (state?.demo !== true || !arrays.every(key => Array.isArray(state[key]) && state[key].every(row => row && typeof row.id === 'string')) ||
      !state.sourcing?.brief || typeof state.sourcing.searched !== 'boolean' || !state.sourcing.selected || Array.isArray(state.sourcing.selected) ||
      typeof state.sourcing.selected !== 'object' || !state.clients.length || !state.employees.length ||
      checkBrief(state.sourcing.brief) || validateReferences(state).length) {
      throw new Error('Invalid demo storage');
    }
    return { state, recovered: false };
  } catch {
    return { state: freshState(), recovered: true };
  }
}

export function profileFor(state, creatorId, platform = 'Instagram') {
  const profile = state.socialProfiles.find(row => row.creatorId === creatorId && row.platform === platform);
  return profile ? { ...profile, ...state.creatorMetrics.find(row => row.profileId === profile.id), id: profile.id } : null;
}

export function offerReasons(offer, { format = 'Instagram Reel', date = DEMO_DATE, budget = Infinity } = {}) {
  const reasons = [];
  if (offer.deliverableType !== format) reasons.push('Wrong content format');
  if (offer.terms !== 'Organic posting · one revision') reasons.push('Different commercial terms');
  if (offer.availability !== 'Available') reasons.push('Unavailable');
  if (offer.validUntil < DEMO_DATE) reasons.push('Expired rate');
  else if (offer.validUntil < date) reasons.push('Rate expires before campaign');
  if (offer.contractualRestrictions) reasons.push('Restricted exclusivity');
  if (offer.buyingRate > budget) reasons.push('Above buying budget');
  return reasons;
}

export function offerOptions(state, creatorId, criteria = {}) {
  return state.sourceOffers.filter(offer => offer.creatorId === creatorId)
    .map(offer => ({ ...offer, reasons: offerReasons(offer, criteria) }))
    .sort((a, b) => a.buyingRate - b.buyingRate || a.id.localeCompare(b.id));
}

export function bestOffer(state, creatorId, criteria) {
  return offerOptions(state, creatorId, criteria).find(offer => !offer.reasons.length);
}

export function matchCreators(state, brief) {
  const candidates = [];
  const rejected = [];
  const category = brief.category === 'Wellness' ? ['Healthcare', 'Fitness', 'Yoga'] : [brief.category];
  const identifiedProfiles = new Set();
  for (const creator of state.creators) {
    const profile = profileFor(state, creator.id, brief.platform);
    const audienceShare = creator.audience.find(row => row.city === brief.audience)?.share ?? 0;
    if (!profile || identifiedProfiles.has(profile.canonicalId) || brief.city && creator.city !== brief.city ||
      brief.category && !category.includes(creator.niche) || brief.audience && audienceShare < 15 ||
      profile.followers < brief.minFollowers || profile.engagement < brief.minEngagement) continue;
    identifiedProfiles.add(profile.canonicalId);
    const offers = offerOptions(state, creator.id, brief);
    const eligible = offers.filter(offer => !offer.reasons.length && profile.formats.includes(brief.format));
    const best = eligible[0];
    rejected.push(...offers.filter(offer => offer.reasons.length).map(offer => ({ creator, offer })));
    if (!best) continue;
    const score = 30 + Math.min(25, audienceShare / 2) + Math.min(20, profile.engagement * 2.5) +
      Math.max(0, 15 - best.buyingRate / 2500) + 10;
    candidates.push({ creator, profile, audienceShare, eligible, best, score, direct: eligible.some(offer => offer.sourceId === DIRECT) });
  }
  candidates.sort((a, b) => Number(b.direct) - Number(a.direct) || b.score - a.score || a.creator.name.localeCompare(b.creator.name));
  const direct = candidates.filter(row => row.direct).length;
  return { candidates, rejected, direct, partnerOnly: candidates.length - direct, shortage: Math.max(0, brief.desired - candidates.length) };
}

export function price(buyingRate, markup, quantity = 1, additional = 0) {
  const cost = buyingRate * quantity + additional;
  const sellingRate = Math.round(buyingRate * (1 + markup / 100));
  const revenue = sellingRate * quantity + Math.round(additional * (1 + markup / 100));
  return { cost, sellingRate, revenue, profit: revenue - cost, margin: revenue ? (revenue - cost) * 100 / revenue : 0 };
}

export function shortlist(match, selected, markup) {
  return match.candidates.flatMap(row => {
    const offer = row.eligible.find(item => item.id === selected[row.creator.id]);
    return offer ? [{ creatorId: row.creator.id, offer, quantity: 1, ...price(offer.buyingRate, markup) }] : [];
  });
}

export function suggestedSelection(match, brief) {
  const selected = {};
  let committed = 0;
  let count = 0;
  for (const { creator, best } of match.candidates) {
    if (count === brief.desired) break;
    if (committed + best.buyingRate > brief.budget) continue;
    selected[creator.id] = best.id;
    committed += best.buyingRate;
    count++;
  }
  return selected;
}

export function quoteTotal(quote) {
  return quote.serviceFee + total(quote.lines, line => line.sellingRate * line.quantity);
}

export function stageFor(state, campaign) {
  const deliveries = state.deliverables.filter(row => row.campaignId === campaign.id);
  const allocations = state.campaignCreators.filter(row => row.campaignId === campaign.id);
  const hasInsights = deliveries.every(delivery => state.performanceRecords.some(row => row.deliverableId === delivery.id));
  if (!deliveries.length) return campaignStages[Number(allocations.length > 0)];
  const allPublished = deliveries.every(row => row.progress === 5);
  if (allPublished && hasInsights && allocations.every(row => row.status === 'Insights Collected')) {
    return campaignStages[campaign.status === 'Completed' ? 7 : 6];
  }
  if (allPublished) return campaignStages[5];
  if (deliveries.every(row => row.progress >= 4)) return campaignStages[4];
  if (deliveries.some(row => row.progress >= 1)) return campaignStages[3];
  if (allocations.some(row => row.status !== 'Shortlisted')) return campaignStages[2];
  return campaignStages[allocations.length ? 1 : 0];
}

export function campaignStatus(state, campaign) {
  const stage = stageFor(state, campaign);
  if (stage === 'Closed') return 'Completed';
  if (campaign.endDate < DEMO_DATE && !['Published', 'Insights Collected'].includes(stage)) return 'Overdue';
  return ['Briefed', 'Sourcing'].includes(stage) ? 'Planning' : 'Active';
}

export function financials(state, campaign) {
  const allocations = state.campaignCreators.filter(row => row.campaignId === campaign.id);
  const projectedRevenue = campaign.serviceFee + total(allocations, row => row.sellingRate * row.quantity);
  const projectedCost = campaign.productionCost + total(allocations, row => row.buyingRate * row.quantity);
  const committedCost = campaign.productionCost + total(allocations.filter(row => row.status !== 'Shortlisted'), row => row.buyingRate * row.quantity);
  const payments = state.payments.filter(row => row.campaignId === campaign.id && row.paid);
  const realizedRevenue = total(payments.filter(row => row.type === 'Receivable'), row => row.amount);
  const actualCost = campaign.actualProductionCost + total(payments.filter(row => row.type === 'Payable'), row => row.amount);
  return { projectedRevenue, projectedCost, committedCost, realizedRevenue, actualCost, contribution: projectedRevenue - projectedCost, realizedContribution: realizedRevenue - actualCost };
}

export function overview(state) {
  const active = state.campaigns.filter(row => ['Active', 'Overdue'].includes(campaignStatus(state, row)));
  return {
    clients: new Set(active.map(row => row.clientId)).size, campaigns: active.length, creators: state.creators.length,
    approvals: state.deliverables.filter(row => row.progress === 3).length,
    overdue: state.tasks.filter(isOverdue).length,
    contribution: total(state.campaigns, row => financials(state, row).contribution)
  };
}

export function importInventory(state, agencyId = 'ag1') {
  const batch = importOffers.map(offer => agencyId === 'ag1' ? offer : {
    ...offer, id: offer.id.replace('ag1', agencyId), sourceId: agencyId
  });
  const matched = batch.filter(offer => find(state.creators, offer.creatorId));
  const newOffers = matched.filter(offer => !find(state.sourceOffers, offer.id));
  state.sourceOffers.push(...newOffers.map(offer => ({ ...offer })));
  return { matched: new Set(matched.map(offer => offer.creatorId)).size, newCreators: 0, imported: newOffers.length };
}

export function recordActivity(state, type, text, references = {}) {
  state.activityLog.unshift({ id: makeId('act'), type, text, date: DEMO_DATE, ...references });
}

const makeId = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

export function createCampaign(state, brief, rows) {
  if (!rows.length || new Set(rows.map(row => row.creatorId)).size !== rows.length) throw new Error('Select unique creators before creating a campaign.');
  if (checkBrief(brief) || !find(state.clients, brief.clientId)) throw new Error('Complete a valid sourcing brief before creating a campaign.');
  const match = matchCreators(state, brief);
  const validated = shortlist(match, Object.fromEntries(rows.map(row => [row.creatorId, row.offer.id])), brief.markup);
  if (validated.length !== rows.length) throw new Error('Refresh the shortlist to select currently eligible supplier offers.');
  if (validated.length > brief.desired || total(validated, row => row.cost) > brief.budget) throw new Error('Bring the shortlist within the creator target and buying budget.');
  const id = makeId('cp');
  const campaign = {
    id, title: brief.title, clientId: brief.clientId, status: 'Planning', service: 'Influencer Marketing',
    ownerId: state.employees[0].id, date: brief.date, endDate: brief.date, serviceFee: 0, adSpend: 0,
    budget: brief.budget, productionCost: 0, actualProductionCost: 0,
    brief: `${brief.desired} creators · ${brief.category || 'Any niche'} · ${brief.city || 'Any residence'} · ${brief.audience || 'Any audience market'} · ${brief.format}`
  };
  const allocations = validated.map(row => ({
    id: makeId('cc'), campaignId: id, creatorId: row.creatorId, offerId: row.offer.id, sourceId: row.offer.sourceId,
    format: row.offer.deliverableType, terms: row.offer.terms, buyingRate: row.offer.buyingRate, sellingRate: row.sellingRate,
    quantity: row.quantity, status: 'Shortlisted', date: brief.date, deliverableId: makeId('dl')
  }));
  const deliveries = allocations.map(row => ({
    id: row.deliverableId, campaignId: id, title: `${find(state.creators, row.creatorId).name} · ${row.format}`,
    type: row.format, date: brief.date, progress: 0, revisions: 0, checklist: [false, false, false],
    brief: campaign.brief, postUrl: ''
  }));
  const quote = {
    id: makeId('qt'), campaignId: id, clientId: brief.clientId, title: brief.title, date: DEMO_DATE, status: 'Draft',
    serviceFee: 0, lines: validated.map(({ creatorId, offer, quantity, sellingRate }) => ({ creatorId, format: offer.deliverableType, quantity, sellingRate }))
  };
  state.campaigns.unshift(campaign);
  state.campaignCreators.push(...allocations);
  state.deliverables.push(...deliveries);
  state.quotations.unshift(quote);
  recordActivity(state, 'source', `${campaign.title} created with ${rows.length} creators`, { campaignId: id });
  return campaign;
}

export function updateAllocation(state, row, status, syncDelivery = true) {
  row.status = status;
  const id = `pay-${row.id}`;
  const payable = find(state.payments, id);
  if (status !== 'Shortlisted' && !payable) state.payments.push({
    id, allocationId: row.id, campaignId: row.campaignId, type: 'Payable', amount: row.buyingRate * row.quantity, paid: false
  });
  if (status === 'Shortlisted' && payable && !payable.paid) state.payments = state.payments.filter(item => item.id !== id);
  const delivery = find(state.deliverables, row.deliverableId);
  if (syncDelivery && delivery) {
    const progress = allocationStages.indexOf(status);
    const mapped = [0, 0, 2, 4, 5, 5][progress];
    if (progress !== 2 || delivery.progress < 1 || delivery.progress > 3) delivery.progress = mapped;
  }
}

export function assignProduction(state, delivery, progress) {
  delivery.progress = progress;
  const row = state.campaignCreators.find(allocation => allocation.deliverableId === delivery.id);
  if (!row || progress === 0 && row.status === 'Shortlisted') return;
  const nextStatus = progress === 5 && row.status === 'Insights Collected' ? row.status :
    progress === 5 ? 'Published' : progress === 4 ? 'Approved' : progress === 0 ? 'Confirmed' : 'Content In Progress';
  updateAllocation(state, row, nextStatus, false);
}

export function scheduleConflicts(state, allocation) {
  const campaign = find(state.campaigns, allocation.campaignId);
  const category = clientFor(state, campaign).category;
  return state.campaignCreators.filter(row => row.campaignId !== campaign.id && row.creatorId === allocation.creatorId)
    .flatMap(row => {
      const other = find(state.campaigns, row.campaignId);
      if (campaignStatus(state, other) === 'Completed') return [];
      const days = Math.abs(Date.parse(row.date) - Date.parse(allocation.date)) / 86400000;
      const conflicts = [];
      if (days <= 3) conflicts.push(`Schedule overlap with ${other.title}`);
      if (days <= 30 && other.clientId !== campaign.clientId && clientFor(state, other).category === category) conflicts.push(`Competing brand category with ${other.title}`);
      return conflicts;
    });
}

export function validateReferences(state) {
  const errors = [];
  function unique(rows, key, label) {
    const values = rows.map(key);
    if (values.length !== new Set(values).size) errors.push(`Duplicate ${label}`);
  }
  function link(rows, key, targets, optional = false) {
    const ids = new Set(targets.map(row => row.id));
    if (rows.some(row => !(optional && row[key] == null) && !ids.has(row[key]))) errors.push(`Invalid ${key} link`);
  }
  for (const key of Object.keys(seed).filter(key => Array.isArray(seed[key]))) unique(state[key], row => row.id, `${key} IDs`);
  unique(state.socialProfiles, row => row.canonicalId, 'canonical handles');
  unique(state.campaignCreators, row => `${row.campaignId}/${row.creatorId}`, 'campaign creators');
  link(state.socialProfiles, 'creatorId', state.creators);
  link(state.creatorMetrics, 'profileId', state.socialProfiles);
  link(state.sourceOffers, 'creatorId', state.creators);
  link(state.sourceOffers, 'sourceId', [...state.agencies, { id: DIRECT }]);
  link(state.campaigns, 'clientId', state.clients);
  link(state.campaigns, 'ownerId', state.employees);
  link(state.campaignCreators, 'creatorId', state.creators);
  link(state.campaignCreators, 'offerId', state.sourceOffers);
  link(state.campaignCreators, 'deliverableId', state.deliverables, true);
  for (const key of ['campaignCreators', 'deliverables', 'tasks', 'quotations', 'invoices', 'payments', 'performanceRecords']) {
    link(state[key], 'campaignId', state.campaigns);
  }
  link(state.tasks, 'assigneeId', state.employees);
  link(state.tasks, 'deliverableId', state.deliverables, true);
  link(state.payments, 'allocationId', state.campaignCreators, true);
  link(state.payments, 'invoiceId', state.invoices, true);
  link(state.performanceRecords, 'deliverableId', state.deliverables);
  link(state.quotations, 'clientId', state.clients);
  link(state.invoices, 'clientId', state.clients);
  link(state.quotations.flatMap(row => row.lines), 'creatorId', state.creators);
  if (state.campaignCreators.some(row => {
    const offer = find(state.sourceOffers, row.offerId);
    return !offer || offer.creatorId !== row.creatorId || offer.sourceId !== row.sourceId;
  })) errors.push('Allocation does not match its source identity');
  return errors;
}

export function checkBrief(data) {
  if (!formatPlatform[data.format] || formatPlatform[data.format] !== data.platform) return 'Choose a deliverable that belongs to the selected platform.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(Date.parse(data.date)) || data.date < DEMO_DATE) return `Choose a campaign date on or after ${DEMO_DATE}.`;
  if (typeof data.title !== 'string' || !data.title.trim()) return 'Enter a campaign title.';
  if (!Number.isInteger(data.desired) || data.desired < 1 || data.desired > 500) return 'Enter a creator target from 1 to 500.';
  if (!Number.isFinite(data.budget) || data.budget < 1 || data.budget > 1000000000) return 'Enter a buying budget from ₹1 to ₹1,00,00,00,000.';
  if (!Number.isFinite(data.minFollowers) || data.minFollowers < 0 || !Number.isFinite(data.minEngagement) ||
    data.minEngagement < 0 || data.minEngagement > 100 || !Number.isFinite(data.markup) || data.markup < 0 || data.markup > 1000) {
    return 'Review the follower, engagement, and markup thresholds.';
  }
  return '';
}
