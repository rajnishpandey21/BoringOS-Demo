import assert from 'node:assert/strict';
import { defaultBrief, DEMO_DATE, seed } from './data.js';
import { agencyDetail, creatorDetail, creatorRows, creatorsView, dashboard, partnersView } from './directory.js';
import {
  assignProduction, bestOffer, campaignStatus, checkBrief, createCampaign, financials, freshState,
  importInventory, loadState, matchCreators, offerOptions, overview, price, quoteTotal, shortlist,
  stageFor, STORAGE_KEY, suggestedSelection, updateAllocation, validateReferences
} from './logic.js';
import { campaignDetail, campaignsView, deliveryDetail, moneyView, quotePreview, sourcingView, studioView, taskDetail } from './operations.js';
import { nav, shell } from './ui.js';

const state = freshState();
assert.deepEqual(validateReferences(state), []);
assert.equal(state.creators.length, 50);
assert.equal(state.sourceOffers.length, 75);
assert.equal(state.agencies.length, 5);
assert.equal(state.clients.length, 6);
assert.equal(state.campaigns.length, 8);
assert.equal(state.employees.filter(row => row.role === 'Lead').length, 4);
assert.equal(state.employees.length, 15);
assert.ok(state.tasks.length >= 25);
assert.ok(state.deliverables.length >= 15);
assert.ok(state.campaignCreators.length >= 15);
assert.ok(state.creators.filter(row => row.city === 'Dehradun' && row.audience.some(item => item.city === 'Dehradun')).length >= 15);
assert.ok(state.creators.every(row => row.audience.reduce((sum, item) => sum + item.share, 0) === 100));

const brief = { ...defaultBrief, title: 'Winter <script>alert(1)</script> Demo' };
assert.equal(checkBrief(brief), '');
assert.match(checkBrief({ ...brief, date: 'no date' }), /date/);
assert.match(checkBrief({ ...brief, format: 'YouTube Short' }), /platform/);
const match = matchCreators(state, brief);
assert.equal(match.candidates.length, 19);
assert.equal(match.shortage, 6);
assert.equal(match.direct + match.partnerOnly, match.candidates.length);
assert.equal(new Set(match.candidates.map(row => row.creator.id)).size, match.candidates.length);
for (const reason of ['Unavailable', 'Expired rate', 'Restricted exclusivity', 'Wrong content format', 'Above buying budget']) {
  assert.ok(match.rejected.some(row => row.offer.reasons.includes(reason)), reason);
}
for (const id of ['cr1', 'cr2', 'cr3']) {
  assert.ok(offerOptions(state, id)[0].reasons.length);
  assert.ok(bestOffer(state, id).buyingRate > offerOptions(state, id)[0].buyingRate);
}
assert.equal(matchCreators(state, { ...brief, date: '2027-01-10' }).candidates.length, 0);
assert.equal(matchCreators(state, { ...brief, audience: 'Mumbai' }).candidates.length, 0);
assert.ok(matchCreators(state, { ...brief, platform: 'YouTube', format: 'YouTube Short', category: '', city: 'Delhi', audience: 'Delhi' }).candidates.length);

const selected = suggestedSelection(match, brief);
const rows = shortlist(match, selected, brief.markup);
assert.ok(rows.reduce((sum, row) => sum + row.cost, 0) <= brief.budget);
const switchable = match.candidates.find(row => row.eligible.length > 1 && selected[row.creator.id]);
const alt = switchable.eligible[1];
const alternate = shortlist(match, { ...selected, [switchable.creator.id]: alt.id }, brief.markup);
assert.equal(alternate.length, rows.length);
assert.equal(alternate.find(row => row.creatorId === switchable.creator.id).cost, alt.buyingRate);
assert.notEqual(alternate.reduce((sum, row) => sum + row.cost, 0), rows.reduce((sum, row) => sum + row.cost, 0));
assert.deepEqual(price(100, 25, 2, 40), { cost: 240, sellingRate: 125, revenue: 300, profit: 60, margin: 20 });
assert.throws(() => createCampaign(state, brief, [rows[0], rows[0]]), /unique/);
assert.throws(() => createCampaign(state, { ...brief, budget: 25000 }, rows), /buying budget/);

const before = overview(state);
const campaign = createCampaign(state, brief, rows);
assert.equal(state.campaigns[0].id, campaign.id);
assert.equal(stageFor(state, campaign), 'Sourcing');
assert.equal(campaignStatus(state, campaign), 'Planning');
assert.ok(campaignsView(state, {}).includes('Winter &lt;script&gt;'));
assert.ok(dashboard(state).includes('Winter &lt;script&gt;'));
assert.equal(overview(state).contribution, before.contribution + rows.reduce((sum, row) => sum + row.profit, 0));
assert.equal(overview(state).campaigns, before.campaigns);
const quote = state.quotations.find(row => row.campaignId === campaign.id);
assert.ok(quote.lines.every(row => Object.keys(row).sort().join() === 'creatorId,format,quantity,sellingRate'));
assert.equal(quoteTotal(quote), rows.reduce((sum, row) => sum + row.revenue, 0));
const quoteHTML = quotePreview(state, quote);
assert.match(quoteHTML, /Unit price/);
assert.match(quoteHTML, /Winter &lt;script&gt;/);
assert.doesNotMatch(quoteHTML, /buying|buy rate|supplier|gross|<script>/i);

const allocation = state.campaignCreators.find(row => row.campaignId === campaign.id);
const delivery = state.deliverables.find(row => row.id === allocation.deliverableId);
updateAllocation(state, allocation, 'Confirmed');
assert.equal(stageFor(state, campaign), 'Confirmed');
assert.equal(overview(state).campaigns, before.campaigns + 1);
const payable = state.payments.find(row => row.allocationId === allocation.id);
assert.equal(payable.amount, allocation.buyingRate);
assert.equal(financials(state, campaign).committedCost, allocation.buyingRate);
payable.paid = true;
assert.equal(financials(state, campaign).actualCost, allocation.buyingRate);
payable.paid = false;
assert.equal(financials(state, campaign).actualCost, 0);
assignProduction(state, delivery, 3);
assert.equal(overview(state).approvals, before.approvals + 1);
assignProduction(state, delivery, 4);
assert.equal(allocation.status, 'Approved');
assert.equal(overview(state).approvals, before.approvals);
const task = state.tasks.find(row => row.date < DEMO_DATE && row.status !== 'Completed');
task.status = 'Completed';
assert.equal(overview(state).overdue, before.overdue - 1);

const creatorCount = state.creators.length;
const offerCount = state.sourceOffers.length;
assert.deepEqual(importInventory(state), { matched: 3, newCreators: 0, imported: 3 });
assert.deepEqual(importInventory(state), { matched: 3, newCreators: 0, imported: 0 });
assert.equal(state.creators.length, creatorCount);
assert.equal(state.sourceOffers.length, offerCount + 3);
assert.deepEqual(validateReferences(state), []);
assert.equal(seed.sourceOffers.length, 75);
assert.equal(seed.campaigns.length, 8);

const storage = new Map([[STORAGE_KEY, JSON.stringify(state)]]);
let loaded = loadState({ getItem: key => storage.get(key) });
assert.equal(loaded.recovered, false);
assert.equal(loaded.state.campaigns[0].id, campaign.id);
assert.equal(loaded.state.tasks.find(row => row.id === task.id).status, 'Completed');
storage.set(STORAGE_KEY, '{bad state');
loaded = loadState({ getItem: key => storage.get(key) });
assert.equal(loaded.recovered, true);
assert.equal(loaded.state.campaigns.length, 8);
assert.equal(loaded.state.sourceOffers.length, 75);

state.sourcing = { brief, searched: true, selected };
const account = { buying: 100, markup: 25, quantity: 2, additional: 40 };
assert.equal(creatorRows(state, { q: 'aarohi' }).length, 1);
assert.equal(creatorRows(state, { city: 'Dehradun', niche: 'Yoga', audience: 'Mumbai' }).length, 0);
const views = [
  dashboard(state), creatorsView(state, {}), partnersView(state, {}), sourcingView(state, brief),
  campaignsView(state, {}), studioView(state, {}), moneyView(state, {}, account, '')
];
views.forEach((view, i) => {
  assert.match(view, /<h1>/);
  assert.doesNotMatch(view, /undefined|\bNaN\b|<script>/);
  assert.equal((shell(nav[i][0], view, false).match(/aria-current="page"/g) ?? []).length, 1);
});
for (const detail of [
  agencyDetail(state, 'ag1', { q: '' }, null), creatorDetail(state, 'cr1'), campaignDetail(state, campaign.id),
  taskDetail(state, task.id), deliveryDetail(state, delivery.id), studioView(state, { tab: 'Calendar' }),
  studioView(state, { tab: 'Approvals' }), moneyView(state, { tab: 'Payments' }, account, ''),
  moneyView(state, { tab: 'Quotes & calculator' }, account, ''), moneyView(state, { tab: 'Performance' }, account, '')
]) assert.doesNotMatch(detail, /undefined|\bNaN\b|<script>/);

// Bootstrap the real entry module against the DOM operations needed at first paint.
const appRoot = { innerHTML: '' };
const eventTarget = { addEventListener() {} };
globalThis.document = {
  ...eventTarget,
  getElementById: id => ({ app: appRoot, dialog: eventTarget, toast: {} })[id]
};
globalThis.window = { ...eventTarget, localStorage: { getItem: () => null } };
globalThis.location = { hash: '' };
for (const [id, title] of nav) {
  location.hash = `#${id}`;
  await import(`./app.js?route=${id}`);
  assert.ok(appRoot.innerHTML.includes(`href="#${id}" aria-current="page"`), title);
  assert.match(appRoot.innerHTML, /<main id="main"/);
}

console.log('BORING OS QA passed: linked fixtures, eligibility, shortlist, quote, campaign stages, payments, imports, storage, and view rendering.');
