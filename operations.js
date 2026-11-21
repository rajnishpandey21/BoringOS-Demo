import { allocationStages, campaignStages, DEMO_DATE, formats, markets, niches, platforms, productionStages, taskStages } from './data.js';
import { campaignStatus, clientFor, financials, find, isOverdue, matchCreators, offerOptions, quoteTotal, scheduleConflicts, shortlist, sourceName, stageFor, total } from './logic.js';
import { action, avatar, badge, bar, button, clickable, compact, date, empty, esc, fullDate, head, icon, input, money, number, options, route, section, select, table } from './ui.js';
import { campaignFilters, campaignTable } from './directory.js';

const any = label => ['', label];
const clientChoices = state => state.clients.map(row => [row.id, row.name]);
const priorityOptions = ['High', 'Normal', 'Low'];

function sourcingForm(state, draft) {
  const fields = [
    select('Client', 'name="clientId" required', clientChoices(state), draft.clientId),
    input('Campaign title', 'name="title" required maxlength="100" placeholder="Give this brief a title"', draft.title),
    select('Creator residence', 'name="city"', [any('Any city'), ...markets], draft.city),
    select('Creator category', 'name="category"', [any('Any category'), ['Wellness', 'Wellness · health, fitness & yoga'], ...niches], draft.category),
    select('Target audience market', 'name="audience"', [any('Any audience market'), ...markets], draft.audience),
    select('Platform', 'name="platform" required', platforms, draft.platform),
    select('Deliverable type', 'name="format" required', formats, draft.format),
    input('Desired creators', 'name="desired" type="number" min="1" max="500" required', draft.desired),
    input('Minimum followers', 'name="minFollowers" type="number" min="0" step="1" required', draft.minFollowers),
    input('Minimum engagement (%)', 'name="minEngagement" type="number" min="0" max="100" step="0.1" required', draft.minEngagement),
    input('Campaign date', `name="date" type="date" min="${DEMO_DATE}" required`, draft.date),
    input('Buying budget (₹)', 'name="budget" type="number" min="1" max="1000000000" required', draft.budget),
    input('Agency markup (%)', 'name="markup" type="number" min="0" max="1000" step="0.1" required', draft.markup)
  ];
  return `<form id="sourcing-form" class="panel sourcing-form">
    ${section('Build your brief', 'Audience market and creator residence are filtered separately.', button('Load Dehradun demo', 'data-action="load-brief"', 'spark', 'secondary'))}
    <div class="brief-grid">${fields.join('')}</div>
    <div class="form-footer"><span id="brief-error" class="field-error" role="alert"></span><button class="button primary" type="submit">${icon('sourcing', 18)} Find Matches</button></div>
  </form>`;
}

export function sourcingView(state, draft) {
  const { brief, searched, selected } = state.sourcing;
  const result = searched ? renderMatches(state, brief, selected) : `<section class="panel sourcing-empty">${empty('Your sourcing results will appear here', 'Run the Dehradun demo or enter your own brief to see eligible supply.')}</section>`;
  return `${head('TALENT PROCUREMENT', 'Smart Sourcing', 'Turn a brief into eligible talent, defensible rates, and a client-ready quote.')}
    <div class="sourcing-layout">${sourcingForm(state, draft)}
    <aside class="sourcing-guide"><div class="eyebrow">${icon('sourcing', 18)} SOURCING GUIDE</div><h2>Brief to booking.</h2>
    <ol><li><strong>Check direct supply.</strong><span>Creators with an eligible direct offer count here, even if a partner offers a lower rate.</span></li><li><strong>Fill the gap.</strong><span>Partner-only supply adds creators who have no eligible direct offer.</span></li><li><strong>Review the shortlist.</strong><span>Compare equivalent offers, stay within budget, and preview client pricing.</span></li></ol></aside></div>
    ${result}`;
}

function renderMatches(state, brief, selected) {
  const result = matchCreators(state, brief);
  const rows = shortlist(result, selected, brief.markup);
  const cost = total(rows, row => row.cost);
  const revenue = total(rows, row => row.revenue);
  const over = cost > brief.budget;
  const tooMany = rows.length > brief.desired;
  const invalid = !rows.length || over || tooMany;
  const facts = [
    ['Direct eligible', result.direct], ['Partner-only', result.partnerOnly], ['Unique coverage', result.candidates.length],
    ['Supply shortage', result.shortage], ['Est. target buying cost', money(total(result.candidates.slice(0, brief.desired), row => row.best.buyingRate))]
  ];
  const selectorRows = result.candidates.map(({ creator, profile, audienceShare, eligible, best, score, direct }, i) => {
    const chosen = eligible.find(offer => offer.id === selected[creator.id]);
    return `<tr><td><input type="checkbox" aria-label="Select ${esc(creator.name)}" data-candidate="${esc(creator.id)}" ${chosen ? 'checked' : ''}></td>
      <td><div class="identity">${avatar(creator.name, i)}<div>${clickable(creator.name, 'creator', creator.id)}<small>${esc(creator.niche)} · ${profile.engagement}% engagement</small></div></div></td>
      <td>${badge(direct ? 'Direct eligible' : 'Partner-only', direct ? 'available' : 'planning')}</td><td>${audienceShare ? `${audienceShare}%` : '—'}</td><td>${Math.round(score)}</td>
      <td><select aria-label="Supplier for ${esc(creator.name)}" data-source-for="${esc(creator.id)}">${options(eligible.map(offer => [offer.id, `${sourceName(state, offer.sourceId)} · ${money(offer.buyingRate)}${offer.id === best.id ? ' (best)' : ''}`]), chosen?.id || best.id)}</select></td>
      <td>${chosen ? money(chosen.buyingRate) : '—'}</td></tr>`;
  });
  return `<section id="matches" class="matches">
    ${section('Sourcing results', `${brief.title} · target ${brief.desired} creators · ${fullDate(brief.date)}`)}
    <div class="match-facts">${facts.map(([label, value], i) => `<div class="mini-card ${i === 3 && result.shortage ? 'warning-bg' : ''}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>
    <div class="panel shortlist-panel">${section('Creator shortlist', 'Direct supply is listed first. Each identity has one selection and one supplier.')}
      <details class="scoring" open><summary>How matching and scoring work</summary><p>We filter by platform, niche, residence, follower count, engagement, and a 15% minimum audience share in the target market. Eligible creators earn 30 points for niche fit, up to 25 for audience share, 20 for engagement, 15 for lower rates, and 10 for availability. The suggested shortlist fills direct supply first and stays within the buying ceiling.</p></details>
      ${selectorRows.length ? table(['Pick', 'Creator', 'Supply', 'Audience', 'Score', 'Eligible supplier', 'Buying'], selectorRows, 'Eligible shortlist') : empty('No eligible creators', 'Check excluded offers or broaden the submitted brief.')}
    </div>
    <section class="panel commercial-box">${section('Shortlist commercial summary', 'Internal view · INR')}
      <div class="commercial-facts">${[
        ['Selected', `${rows.length} / ${brief.desired}`], ['Buying', money(cost)], ['Selling', money(revenue)],
        ['Gross profit', money(revenue - cost)], ['Gross margin', `${revenue ? ((revenue - cost) / revenue * 100).toFixed(1) : '0.0'}%`],
        ['Budget used', `${Math.round(cost / brief.budget * 100)}%`]
      ].map(([label, value]) => `<div><small>${label}</small><strong>${value}</strong></div>`).join('')}</div>
      <p class="${over || tooMany ? 'field-error' : 'muted'}" aria-live="polite">${over ? `Buying budget exceeded by ${money(cost - brief.budget)}. ` : ''}${tooMany ? 'Remove creators to meet the brief target. ' : ''}${!over && !tooMany ? `${Math.max(0, brief.desired - rows.length)} creator places still open · buying ceiling ${money(brief.budget)}` : ''}</p>
      <div class="actions">${button('Preview client quote', 'data-action="preview-sourcing" ' + (!rows.length ? 'disabled' : ''), 'file')}${button('Create Campaign from Shortlist', 'data-action="create-campaign" ' + (invalid ? 'disabled' : ''), 'plus', 'primary')}</div>
    </section>
    <section class="panel excluded">${section('Excluded offers', `${result.rejected.length} offers from otherwise matching creators`)}
    ${result.rejected.length ? table(['Creator', 'Source', 'Format', 'Buying rate', 'Reason'], result.rejected.map(({ creator, offer }) => `<tr><td>${clickable(creator.name, 'creator', creator.id)}</td><td>${esc(sourceName(state, offer.sourceId))}</td><td>${esc(offer.deliverableType)}</td><td>${money(offer.buyingRate)}</td><td>${badge(offer.reasons.join(' · '), 'overdue')}</td></tr>`), 'Excluded offers') : empty('No offer exclusions for this brief')}</section>
    </section>`;
}

export function campaignsView(state, filter) {
  const status = filter.status || 'All statuses';
  const services = [...new Set(state.campaigns.map(row => row.service))];
  const rows = state.campaigns.filter(row => (!filter.client || row.clientId === filter.client) && (!filter.service || row.service === filter.service) &&
    (status === 'All statuses' || (status === 'Live work' ? ['Active', 'Overdue'].includes(campaignStatus(state, row)) : campaignStatus(state, row) === status)));
  return `${head('CAMPAIGN OPERATIONS', 'Campaign HQ', 'Nothing slips through the cracks. Track talent, production, and delivery together.', route('sourcing', 'New sourcing brief', 'button primary'))}
    <section class="panel">${section('Campaigns', `${rows.length} matching campaigns`)}
    <div class="filters">${select('Client', 'data-filter="client"', [any('All clients'), ...clientChoices(state)], filter.client || '')}
    ${select('Status', 'data-filter="status"', [...campaignFilters, 'Live work'], status)}
    ${select('Service', 'data-filter="service"', [any('All services'), ...services], filter.service || '')}</div>
    ${campaignTable(state, rows)}</section>`;
}

export function campaignDetail(state, id) {
  const campaign = find(state.campaigns, id);
  const client = clientFor(state, campaign);
  const stage = stageFor(state, campaign);
  const finances = financials(state, campaign);
  const allocations = state.campaignCreators.filter(row => row.campaignId === id);
  const deliveries = state.deliverables.filter(row => row.campaignId === id);
  const metrics = state.performanceRecords.filter(row => row.campaignId === id && deliveries.some(delivery => delivery.id === row.deliverableId && delivery.progress === 5));
  const nextPipelineAction = stage === 'Insights Collected' ? button('Close campaign', action('close-campaign', id), 'check') :
    stage === 'Published' ? button('Record demo insights', action('collect-insights', id), 'money') : '';
  return `<div class="tag-list">${badge(campaignStatus(state, campaign))}${badge(client.name, 'neutral')}${badge(campaign.service, 'neutral')}</div>
    <p>${esc(campaign.brief)}</p><p class="muted">Scheduled ${fullDate(campaign.date)} to ${fullDate(campaign.endDate)} · Lead ${esc(find(state.employees, campaign.ownerId)?.name)}</p>
    <div class="match-facts detail-facts">${[['Buying budget', campaign.budget], ['Committed cost', finances.committedCost], ['Est. contribution', finances.contribution]].map(([label, value]) => `<div class="mini-card"><small>${label}</small><strong>${money(value)}</strong></div>`).join('')}</div>
    ${section('Campaign pipeline', stage, nextPipelineAction)}<ol class="pipeline">${campaignStages.map((name, i) => `<li class="${i <= campaignStages.indexOf(stage) ? 'done' : ''}" ${name === stage ? 'aria-current="step"' : ''}>${esc(name)}</li>`).join('')}</ol>
    ${section('Creator allocations', `${allocations.length} unique creators with locked rate snapshots`)}
    ${allocations.length ? table(['Creator', 'Source & snapshot', 'Schedule', 'Status'], allocations.map(row => {
      const choices = offerOptions(state, row.creatorId, { format: row.format, date: row.date, budget: campaign.budget }).filter(offer => !offer.reasons.length);
      const conflicts = scheduleConflicts(state, row);
      return `<tr><td>${clickable(find(state.creators, row.creatorId).name, 'creator', row.creatorId)}<small>${esc(row.format)}</small></td>
        <td>${esc(sourceName(state, row.sourceId))}<small>${money(row.buyingRate)} buy · ${money(row.sellingRate)} sell</small>
        ${choices.some(offer => offer.id !== row.offerId) ? `<select data-allocation-source="${esc(row.id)}" aria-label="Change source for ${esc(find(state.creators, row.creatorId).name)}">${options([[row.offerId, 'Keep current source'], ...choices.filter(item => item.id !== row.offerId).map(offer => [offer.id, `Switch to ${sourceName(state, offer.sourceId)} · ${money(offer.buyingRate)}`])], row.offerId)}</select>` : ''}</td>
        <td>${date(row.date)}${conflicts.map(text => `<small class="field-error">${esc(text)}</small>`).join('')}</td>
        <td><select data-allocation-status="${esc(row.id)}" aria-label="Allocation status for ${esc(find(state.creators, row.creatorId).name)}">${options(allocationStages, row.status)}</select></td></tr>`;
    }), 'Creator allocations') : empty('No creators allocated yet')}
    ${section('Deliverables & publishing')}${deliveries.length ? table(['Deliverable', 'Scheduled', 'Production', 'Approval'], deliveries.map(row => `<tr><td>${clickable(row.title, 'delivery', row.id)}<small>${esc(row.type)}</small></td><td>${fullDate(row.date)}</td><td>${badge(productionStages[row.progress])}</td><td>${row.progress >= 4 ? 'Approved' : row.progress === 3 ? 'Pending review' : 'In production'}</td></tr>`), 'Campaign deliverables') : empty('No deliverables scheduled')}
    ${section('Reported performance', 'Synthetic platform reporting. Reach is summed across posts.')}${metrics.length ? metricsFacts(metrics) : empty('No reported insights yet')}`;
}

function metricsFacts(rows) {
  return `<div class="match-facts">${[['Views', 'views'], ['Engagements', 'engagements'], ['Impressions', 'impressions'], ['Reported reach', 'reportedReach'], ['Clicks', 'clicks']].map(([label, key]) => `<div class="mini-card"><span>${label}</span><strong>${number(total(rows, row => row[key]))}</strong></div>`).join('')}</div>`;
}

export function studioView(state, filter) {
  const tab = filter.tab || 'Board';
  const employee = filter.employee || state.employees[4].id;
  const assignee = filter.role === 'Staff' ? employee : filter.employee;
  const term = (filter.q || '').trim().toLowerCase();
  const matches = row => {
    const campaign = find(state.campaigns, row.campaignId);
    return (!filter.client || campaign.clientId === filter.client) && `${row.title} ${campaign.title} ${clientFor(state, campaign).name}`.toLowerCase().includes(term);
  };
  const tasks = state.tasks.filter(row => matches(row) && (!assignee || row.assigneeId === assignee) &&
    (!filter.status || row.status === filter.status) && (!filter.priority || row.priority === filter.priority) && (!filter.overdue || isOverdue(row)));
  const deliveries = state.deliverables.filter(row => matches(row) && (tab !== 'Approvals' || row.progress === 3) &&
    (!assignee || state.tasks.some(task => task.deliverableId === row.id && task.assigneeId === assignee)))
    .sort((a, b) => a.date.localeCompare(b.date));
  const employeeChoices = state.employees.map(row => [row.id, row.name]);
  const workload = state.employees.map(row => ({ ...row, count: state.tasks.filter(task => task.assigneeId === row.id && task.status !== 'Completed').length }))
    .filter(row => row.count).sort((a, b) => b.count - a.count);
  return `${head('CREATIVE OPERATIONS', 'Content Studio', 'Keep creative work, client review, and the publishing schedule in sync.')}
    <section class="panel studio-controls">
      <div class="toolbar wrap"><div class="tabs" aria-label="Studio views">${['Board', 'Calendar', 'Approvals'].map(name => button(name, action('studio-tab', name, `aria-pressed="${name === tab}"`), '', name === tab ? 'ink' : 'quiet')).join('')}</div>
      ${select('Role simulation', 'data-filter="role"', ['Lead', 'Staff'], filter.role || 'Lead')}</div>
      <div class="filters">${input('Search work', 'type="search" data-filter="q" placeholder="Task, campaign, or client"', filter.q)}
        ${select(filter.role === 'Staff' ? 'Viewing as' : 'Employee', 'data-filter="employee"', [...(filter.role === 'Staff' ? [] : [any('All employees')]), ...employeeChoices], filter.role === 'Staff' ? employee : filter.employee || '')}
        ${select('Client', 'data-filter="client"', [any('All clients'), ...clientChoices(state)], filter.client || '')}
        ${tab === 'Board' ? select('Status', 'data-filter="status"', [any('All statuses'), ...taskStages], filter.status || '') + select('Priority', 'data-filter="priority"', [any('All priorities'), ...priorityOptions], filter.priority || '') : ''}
        ${filter.overdue && tab === 'Board' ? button('Clear overdue filter', 'data-action="clear-overdue"', 'close') : ''}</div></section>
    ${tab === 'Board' && filter.role !== 'Staff' ? `<details class="panel workload"><summary>Lead view · ${total(workload, row => row.count)} open tasks across ${workload.length} team members</summary><div class="tag-list">${workload.map(row => button(`${row.name} · ${row.count}`, action('filter-employee', row.id), '', 'small')).join('')}</div></details>` : ''}
    ${tab === 'Board' ? `<div class="board" aria-label="Creative task board">${taskStages.map((stage, i) => {
      const entries = tasks.filter(row => row.status === stage);
      return `<section class="board-column"><div class="board-head"><h2>${stage}</h2><span>${entries.length}</span></div>${entries.length ? entries.map(row => taskCard(state, row, i)).join('') : '<p class="board-empty">No tasks here.</p>'}</section>`;
    }).join('')}</div>` : `<section class="panel">${section(tab === 'Calendar' ? 'Publishing schedule' : 'Client approval queue', `${deliveries.length} matching deliverables`)}
      ${deliveries.length ? table(['Date', 'Deliverable', 'Client', 'Campaign', 'Production'], deliveries.map(row => {
        const campaign = find(state.campaigns, row.campaignId);
        return `<tr><td>${fullDate(row.date)}</td><td>${clickable(row.title, 'delivery', row.id)}<small>${esc(row.type)}</small></td><td>${esc(clientFor(state, campaign).name)}</td><td>${clickable(campaign.title, 'campaign', campaign.id)}</td><td>${badge(productionStages[row.progress])}</td></tr>`;
      }), 'Publishing schedule') : empty('No content matches this view')}</section>`}`;
}

function taskCard(state, row, i) {
  const campaign = find(state.campaigns, row.campaignId);
  return `<article class="task-card"><div class="task-top">${badge(row.priority, row.priority === 'High' ? 'overdue' : 'neutral')}<small>${esc(row.type)}</small></div>
    <h3>${clickable(row.title, 'task', row.id)}</h3><p>${esc(clientFor(state, campaign).name)} · ${esc(campaign.title)}</p>
    <small>${esc(find(state.employees, row.assigneeId).name)} · ${date(row.date)} ${isOverdue(row) ? ' <b class="field-error">Overdue</b>' : ''}</small>
    ${row.deliverableId ? `<div class="task-delivery">${clickable(find(state.deliverables, row.deliverableId).title, 'delivery', row.deliverableId)}</div>` : ''}
    <div class="task-actions">${i > 0 ? button('Move back', action('task-status', row.id, `data-value="${i - 1}"`), '', 'small quiet') : ''}${i < 3 ? button(i === 2 ? 'Complete' : 'Advance', action('task-status', row.id, `data-value="${i + 1}"`), '', 'small') : ''}</div></article>`;
}

export function taskDetail(state, id) {
  const row = find(state.tasks, id);
  const campaign = find(state.campaigns, row.campaignId);
  return `<div class="tag-list">${badge(row.type, 'neutral')}${badge(row.priority, row.priority === 'High' ? 'overdue' : 'neutral')}${isOverdue(row) ? badge('Overdue', 'overdue') : ''}</div>
    <p>${esc(clientFor(state, campaign).name)} · ${clickable(campaign.title, 'campaign', campaign.id)}</p>
    <p class="muted">Assigned to ${esc(find(state.employees, row.assigneeId).name)} · Due ${fullDate(row.date)}</p>
    ${select('Task status', `data-task-select="${esc(id)}"`, taskStages, row.status)}
    ${row.deliverableId ? `<p>Linked deliverable · ${clickable(find(state.deliverables, row.deliverableId).title, 'delivery', row.deliverableId)}</p>` : ''}`;
}

export function deliveryDetail(state, id) {
  const row = find(state.deliverables, id);
  const campaign = find(state.campaigns, row.campaignId);
  return `<div class="tag-list">${badge(row.type, 'neutral')}${badge(row.progress >= 4 ? 'Client approved' : row.progress === 3 ? 'Pending approval' : 'In production')}${row.date < DEMO_DATE && row.progress < 5 ? badge('Overdue', 'overdue') : ''}</div>
    <p>${esc(row.brief)}</p><p class="muted">${clickable(campaign.title, 'campaign', campaign.id)} · Scheduled ${fullDate(row.date)}</p>
    ${section('Production pipeline')}<ol class="pipeline">${productionStages.map((name, i) => `<li class="${i <= row.progress ? 'done' : ''}" ${i === row.progress ? 'aria-current="step"' : ''}>${esc(name)}</li>`).join('')}</ol>
    ${select('Production stage', `data-production="${esc(id)}"`, productionStages.map((name, i) => [i, name]), row.progress)}
    ${section('Checklist')}<div class="checklist">${['Creative brief ready', 'Draft assets reviewed', 'Client sign-off recorded'].map((label, i) => `<label><input type="checkbox" data-checklist="${esc(id)}" data-value="${i}" ${row.checklist[i] ? 'checked' : ''}> ${label}</label>`).join('')}</div>
    <div class="profile-intro"><div><strong>Revisions</strong><p>${row.revisions} logged</p></div>${button('Log revision', action('revision', id), 'plus')}</div>
    <p class="muted">Post URL placeholder · ${esc(row.postUrl || 'Assigned when marked Published')}</p>`;
}

export function quotePreview(state, quote) {
  const client = find(state.clients, quote.clientId);
  const lines = quote.lines.map(row => `<tr><td>${esc(find(state.creators, row.creatorId)?.name)}</td><td>${esc(row.format)}</td><td>${row.quantity}</td><td>${money(row.sellingRate)}</td><td>${money(row.sellingRate * row.quantity)}</td></tr>`);
  if (quote.serviceFee) lines.push(`<tr><td>Boring Company</td><td>Agency services</td><td>1</td><td>${money(quote.serviceFee)}</td><td>${money(quote.serviceFee)}</td></tr>`);
  return `<article class="quote-sheet"><div class="quote-brand"><span class="brand-mark" aria-hidden="true">B<span>.</span></span><div><strong>BORING COMPANY</strong><small>Quotation · synthetic sample</small></div></div>
    <h3>${esc(quote.title)}</h3><p>Prepared for ${esc(client?.name)} · ${fullDate(quote.date)}</p>
    ${table(['Creator', 'Deliverable', 'Qty', 'Unit price', 'Line total'], lines, 'Client quotation')}
    <div class="quote-total"><span>Total (INR)</span><strong>${money(quoteTotal(quote))}</strong></div></article>`;
}

export function moneyView(state, filter, calculation, calculationHTML) {
  const tab = filter.tab || 'Overview';
  const payments = state.payments;
  const metrics = state.performanceRecords.filter(row => find(state.deliverables, row.deliverableId)?.progress === 5);
  const projected = total(state.campaigns, row => financials(state, row).projectedRevenue);
  const paidFees = total(state.campaigns.filter(row => payments.some(payment => payment.campaignId === row.id && payment.type === 'Receivable' && payment.paid)), row => row.serviceFee);
  const spend = total(state.campaigns, row => row.adSpend);
  const contributions = total(state.campaigns, row => financials(state, row).contribution);
  const openIn = total(payments.filter(row => row.type === 'Receivable' && !row.paid), row => row.amount);
  const openOut = total(payments.filter(row => row.type === 'Payable' && !row.paid), row => row.amount);
  const summary = [['Projected revenue', projected], ['Est. contribution', contributions], ['Open receivables', openIn], ['Open payables', openOut]];
  const paymentRows = payments.filter(row => !filter.payment || row.type === filter.payment);
  const oldRows = [
    ...paymentRows.filter(row => row.type === 'Receivable').map(row => ({ ...row, label: row.invoiceId })),
    ...paymentRows.filter(row => row.type === 'Payable').map(row => ({ ...row, label: sourceName(state, find(state.campaignCreators, row.allocationId).sourceId) }))
  ];
  return `${head('COMMERCIAL OPERATIONS', 'Money & Metrics', 'The numbers don’t lie. Follow client prices, commitments, and reported results.')}
    <div class="match-facts money-facts">${summary.map(([label, value]) => `<div class="mini-card"><span>${label}</span><strong>${money(value)}</strong></div>`).join('')}</div>
    <div class="tabs money-tabs" aria-label="Money and Metrics views">${['Overview', 'Quotes & calculator', 'Payments', 'Performance'].map(name => button(name, action('money-tab', name, `aria-pressed="${tab === name}"`), '', tab === name ? 'ink' : 'quiet')).join('')}</div>
    ${tab === 'Overview' ? `<div class="match-facts detail-facts">${[['Projected agency service fees', total(state.campaigns, row => row.serviceFee)], ['Received agency service fees', paidFees], ['Paid ad spend · pass-through', spend]].map(([label, value]) => `<div class="mini-card"><span>${label}</span><strong>${money(value)}</strong></div>`).join('')}</div>
      <section class="panel">${section('Campaign profitability', 'Estimated contribution uses projected revenue and costs. Realized revenue and actual supplier costs use recorded payment status.')}
      ${table(['Campaign', 'Projected revenue', 'Realized revenue', 'Projected cost', 'Committed cost', 'Actual cost', 'Est. contribution', 'Actual contribution', 'Ad spend'], state.campaigns.map(row => {
        const f = financials(state, row);
        return `<tr><td>${clickable(row.title, 'campaign', row.id)}</td>${[f.projectedRevenue, f.realizedRevenue, f.projectedCost, f.committedCost, f.actualCost, f.contribution, f.realizedContribution, row.adSpend].map(value => `<td>${money(value)}</td>`).join('')}</tr>`;
      }), 'Campaign profitability')}</section>` : ''}
    ${tab === 'Quotes & calculator' ? `<div class="money-grid"><section class="panel calculator">${section('Pricing calculator', 'Additional direct costs receive the same markup.')}
      <div class="filters no-border">${input('Buying cost per unit (₹)', 'type="number" min="0" max="1000000000" data-calculator="buying"', calculation.buying)}
        ${input('Markup (%)', 'type="number" min="0" max="1000" step="0.1" data-calculator="markup"', calculation.markup)}
        ${input('Quantity', 'type="number" min="1" max="10000" data-calculator="quantity"', calculation.quantity)}
        ${input('Additional direct costs (₹)', 'type="number" min="0" max="1000000000" data-calculator="additional"', calculation.additional)}</div>
      <div id="calculator-results" class="calculator-results" aria-live="polite">${calculationHTML}</div></section>
      <section class="panel">${section('Client quotations', 'Selling prices and deliverables for each client.')}
        ${table(['Quotation', 'Status', 'Total', ''], state.quotations.map(row => `<tr><td>${clickable(row.title, 'quote', row.id)}<small>${esc(find(state.clients, row.clientId)?.name)}</small></td><td>${badge(row.status, row.status === 'Accepted' ? 'available' : 'planning')}</td><td>${money(quoteTotal(row))}</td><td>${button('Preview', action('quote', row.id), 'file', 'small quiet')}</td></tr>`), 'Client quotations')}</section></div>` : ''}
    ${tab === 'Payments' ? `<section class="panel">${section('Invoices & supplier payables', 'Payment status updates the simulated cash totals.', select('Payment type', 'data-filter="payment"', [any('All records'), 'Receivable', 'Payable'], filter.payment || ''))}
      ${oldRows.length ? table(['Reference / supplier', 'Campaign', 'Type', 'Amount', 'Status', ''], oldRows.map(row => `<tr><td>${esc(row.label)}</td><td>${clickable(find(state.campaigns, row.campaignId).title, 'campaign', row.campaignId)}</td><td>${esc(row.type)}</td><td>${money(row.amount)}</td><td>${badge(row.paid ? 'Paid' : 'Unpaid', row.paid ? 'available' : 'planning')}</td><td>${button(row.paid ? 'Mark unpaid' : 'Mark paid', action('payment', row.id), '', 'small')}</td></tr>`), 'Payment ledger') : empty('No payments in this view')}</section>` : ''}
    ${tab === 'Performance' ? `${metricsFacts(metrics)}<section class="panel performance-panel">${section('Reported campaign performance', 'Synthetic platform metrics. Reported reach is summed across posts, so audiences can overlap.')}
      ${renderPerformance(state, metrics)}</section>` : ''}`;
}

function renderPerformance(state, metrics) {
  const campaigns = state.campaigns.filter(campaign => metrics.some(row => row.campaignId === campaign.id)).map(campaign => ({
    ...campaign, metrics: metrics.filter(row => row.campaignId === campaign.id)
  })).map(campaign => ({ ...campaign, views: total(campaign.metrics, row => row.views) })).sort((a, b) => b.views - a.views);
  if (!campaigns.length) return empty('No campaign performance reported');
  return `<div class="chart" aria-label="Views by campaign">${campaigns.map(row => `<div class="chart-row">${clickable(row.title, 'campaign', row.id)}${bar(Math.round(row.views * 100 / campaigns[0].views), 'Share of maximum campaign views')}${compact(row.views)}</div>`).join('')}</div>
    ${table(['Campaign', 'Views', 'Engagements', 'Impressions', 'Reported reach', 'Clicks'], campaigns.map(row => `<tr><td>${clickable(row.title, 'campaign', row.id)}</td>${['views', 'engagements', 'impressions', 'reportedReach', 'clicks'].map(key => `<td>${number(total(row.metrics, metric => metric[key]))}</td>`).join('')}</tr>`), 'Campaign performance')}`;
}
