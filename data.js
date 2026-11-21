export const DEMO_DATE = '2026-11-21';
export const DIRECT = 'direct';
export const currency = 'INR';
export const platforms = ['Instagram', 'YouTube', 'LinkedIn'];
export const formats = ['Instagram Reel', 'Instagram Story', 'YouTube Short', 'LinkedIn Post'];
export const formatPlatform = Object.fromEntries(formats.map(format => [format, format.split(' ')[0]]));
export const taskStages = ['To Do', 'In Progress', 'In Review', 'Completed'];
export const productionStages = ['Script', 'Shoot', 'Edit', 'Review', 'Client Approved', 'Published'];
export const campaignStages = ['Briefed', 'Sourcing', 'Confirmed', 'Content In Progress', 'Approved', 'Published', 'Insights Collected', 'Closed'];
export const allocationStages = ['Shortlisted', 'Confirmed', 'Content In Progress', 'Approved', 'Published', 'Insights Collected'];

export const defaultBrief = {
  clientId: 'cl1', title: 'Dehradun Wellness Wave', city: 'Dehradun', category: 'Wellness',
  audience: 'Dehradun', platform: 'Instagram', format: 'Instagram Reel', desired: 25,
  minFollowers: 5000, minEngagement: 2, date: '2026-12-05', budget: 320000, markup: 30
};

const names = [
  'Aarohi Negi', 'Kabir Bisht', 'Anika Rawat', 'Vihaan Rana', 'Meher Nautiyal', 'Ishaan Thapliyal',
  'Tara Joshi', 'Ritvik Gusain', 'Aanya Panwar', 'Arjun Dobhal', 'Sia Kothari', 'Neel Bhandari',
  'Avni Kandari', 'Kiaan Semwal', 'Mira Uniyal', 'Devika Bartwal', 'Reyansh Pundir', 'Myra Raturi',
  'Ved Dimri', 'Inaya Bahuguna', 'Dhruv Dhyani', 'Rhea Kuksal', 'Samar Chamoli', 'Naina Gairola',
  'Ruhi Ahuja', 'Advik Sethi', 'Mahi Malhotra', 'Neil Chawla', 'Kiara Batra', 'Abeer Bajaj',
  'Ira Purohit', 'Shaurya Daga', 'Vanya Soni', 'Pranav Jindal', 'Shanaya Vyas', 'Ahan Shah',
  'Sara Merchant', 'Arnav Palkar', 'Navya Dalvi', 'Veer Sawant', 'Diya Wagh', 'Krish Borkar',
  'Anvi Gowda', 'Ayaan Rao', 'Amaira Hegde', 'Atharv Bhat', 'Zoya Menon', 'Yash Shetty',
  'Maanya Sen', 'Rohan Iyer'
];
export const niches = ['Healthcare', 'Fitness', 'Yoga', 'Food', 'Lifestyle', 'Travel', 'Fashion', 'Beauty', 'Technology', 'Business'];
export const markets = ['Dehradun', 'Delhi', 'Jaipur', 'Mumbai', 'Bengaluru', 'Pune', 'Kolkata', 'Chandigarh', 'Rishikesh'];
const creators = names.map((name, i) => {
  const city = i < 24 ? 'Dehradun' : markets[1 + Math.min(6, Math.floor((i - 24) / 5))];
  const niche = i < 24 ? niches[i % 3] : niches[3 + i % 7];
  return {
    id: `cr${i + 1}`, name, city, niche,
    audience: [{ city: i < 24 ? 'Dehradun' : city, share: 25 + i % 19 }, { city: city === 'Delhi' ? 'Mumbai' : 'Delhi', share: 20 }, { city: 'Other markets', share: 55 - i % 19 }],
    age: i % 2 ? '25–34' : '18–24', genderMix: `${48 + i % 19}% women · ${52 - i % 19}% men`,
    reliability: 83 + i * 7 % 17, verifiedAt: i % 9 === 8 ? '2026-07-12' : '2026-11-06',
    bio: `${city}-based ${niche.toLowerCase()} storyteller creating short-form series and brand collaborations.`,
    portfolio: [`${niche} creator series`, 'Behind the scenes']
  };
});

const socialProfiles = creators.flatMap((creator, i) => [platforms[0], ...(i % 3 === 0 ? [platforms[i >= 27 && i % 2 === 0 ? 2 : 1]] : [])].map((platform, index) => ({
  id: `sp${i + 1}-${index}`, creatorId: creator.id, platform,
  handle: `@${creator.name.toLowerCase().replaceAll(' ', '.')}.studio`,
  canonicalId: `${platform.toLowerCase()}:${creator.name.toLowerCase().replaceAll(' ', '.')}.studio`,
  formats: formats.filter(format => formatPlatform[format] === platform)
})));
const creatorMetrics = socialProfiles.map((profile, i) => {
  const followers = 5700 + (i * 17423 % 476000);
  return {
    id: `m${i + 1}`, profileId: profile.id, followers,
    avgViews: Math.round(followers * (0.24 + (i % 9) * 0.065)),
    engagement: Math.round((2.3 + i * 0.71 % 6.2) * 10) / 10,
    measuredAt: i % 10 === 8 ? '2026-06-18' : '2026-11-12'
  };
});

const agencies = [
  ['Northstar Collective', 'Pihu Lakra', ['Dehradun', 'Rishikesh', 'Chandigarh'], ['Healthcare', 'Fitness', 'Yoga'], 'Net 15', 96, 'NS'],
  ['Sidecar Talent', 'Aman Vohra', ['Delhi', 'Dehradun', 'Jaipur'], ['Fitness', 'Lifestyle', 'Fashion'], '50% advance', 93, 'SC'],
  ['Paper Kite Network', 'Tanvi Vaid', ['Mumbai', 'Pune', 'Dehradun'], ['Beauty', 'Food', 'Yoga'], 'Net 30', 91, 'PK'],
  ['Studio Relay', 'Nakul Madan', ['Bengaluru', 'Mumbai', 'Delhi'], ['Technology', 'Business', 'Lifestyle'], 'Net 15', 97, 'SR'],
  ['Good Noise Media', 'Leena Gera', ['Jaipur', 'Kolkata', 'Dehradun'], ['Travel', 'Healthcare', 'Food'], 'Net 30', 89, 'GN']
].map(([name, contact, cities, specialties, terms, reliability, initials], i) => ({
  id: `ag${i + 1}`, name, contact, cities, specialties, terms, reliability, initials,
  email: `inventory@${name.toLowerCase().replaceAll(' ', '-')}.example.invalid`
}));

function makeOffer(id, creatorId, sourceId, buyingRate, overrides = {}) {
  return {
    id, creatorId, sourceId, deliverableType: formats[0], buyingRate, currency,
    availability: 'Available', validUntil: '2026-12-31', contractualRestrictions: '',
    terms: 'Organic posting · one revision', commercialNotes: 'Organic usage only. Paid usage requires a separate agreement.',
    lastVerifiedAt: '2026-11-14', ...overrides
  };
}

const sourceOffers = creators.map((creator, i) => {
  const sourceId = i < 10 || i >= 24 && i % 2 === 0 ? DIRECT : agencies[i % agencies.length].id;
  const conditions = i === 19 ? { availability: 'Unavailable' } : i === 20 ? { validUntil: '2026-11-02' } :
    i === 21 ? { contractualRestrictions: 'Exclusive with a competing wellness brand through December' } :
    i === 22 ? { deliverableType: formats[1] } : i === 23 ? { buyingRate: 400000 } :
    [24, 30, 42].includes(i) ? { deliverableType: i === 24 ? formats[2] : formats[3] } : {};
  return makeOffer(`of${i + 1}`, creator.id, sourceId, 8500 + i * 1703 % 16000, conditions);
});
for (let j = 0; j < 25; j++) {
  const i = j < 10 ? j : j < 15 ? j - 10 : j + 10;
  const agency = agencies[(i + (j < 10 ? 1 : 2)) % 5].id;
  const sourceId = sourceOffers[i].sourceId === DIRECT ? agency : DIRECT;
  const conditions = j === 0 ? { validUntil: '2026-11-02' } : j === 1 ? { contractualRestrictions: 'Exclusive through December' } :
    j === 2 ? { availability: 'Unavailable' } : j >= 17 && j % 2 ? { deliverableType: formats[1], terms: 'Organic posting · one revision' } : {};
  sourceOffers.push(makeOffer(`of${j + 51}`, creators[i].id, sourceId, 6900 + j * 953 % 18000, conditions));
}

const clients = [
  ['Hillside Health', 'HH', 'Healthcare', ['Influencer Marketing', 'Social Media']],
  ['Roam & Ritual', 'RR', 'Travel', ['Social Media', 'Content Production']],
  ['Monsoon Market', 'MM', 'Retail', ['Paid Advertising', 'Content Production']],
  ['Copper Coffee Co.', 'CC', 'Food', ['Influencer Marketing', 'Social Media']],
  ['Form & Field', 'FF', 'Fashion', ['Content Production', 'Paid Advertising']],
  ['Circuit Club', 'CT', 'Technology', ['Paid Advertising', 'Influencer Marketing']]
].map(([name, initials, category, services], i) => ({ id: `cl${i + 1}`, name, initials, category, services, email: `brand@${name.toLowerCase().replace(/[^a-z]/g, '')}.example.invalid` }));

const employees = [
  'Anya Lamba', 'Ravi Awasthi', 'Kavya Beniwal', 'Rahul Saran', 'Misha Shah', 'Jay Kapoor',
  'Riya Bakshi', 'Neha Puri', 'Om Kale', 'Aditi Prasad', 'Kunal Chadha', 'Jia Mehra',
  'Raghav Bhasin', 'Sana Suri', 'Nikhil Arora'
].map((name, i) => ({ id: `em${i + 1}`, name, role: i < 4 ? 'Lead' : ['Designer', 'Editor', 'Producer'][i % 3] }));

const campaigns = [
  ['The Winter Reset', 'cl1', 'Active', 1, '2026-12-05', 64000, 0],
  ['Good Days, Great Coffee', 'cl4', 'Active', 0, '2026-11-29', 42000, 0],
  ['The Weekend Edit', 'cl2', 'Active', 1, '2026-12-03', 54000, 0],
  ['Objects in Motion', 'cl5', 'Overdue', 2, '2026-11-17', 58000, 95000],
  ['The Local Aisle', 'cl3', 'Planning', 1, '2026-12-13', 47000, 125000],
  ['Switch On', 'cl6', 'Active', 0, '2026-12-02', 61000, 160000],
  ['Mountain Mornings', 'cl2', 'Completed', 1, '2026-10-27', 53000, 0],
  ['Made for the Monsoon', 'cl3', 'Completed', 2, '2026-10-24', 75000, 190000]
].map(([title, clientId, status, serviceIndex, endDate, serviceFee, adSpend], i) => {
  const client = clients.find(item => item.id === clientId);
  return {
    id: `cp${i + 1}`, title, clientId, status, service: client.services[serviceIndex % client.services.length],
    ownerId: employees[i % 4].id, date: i > 5 ? '2026-10-15' : i === 4 ? '2026-12-01' : '2026-11-12',
    endDate, serviceFee, adSpend, budget: 145000 + 10000 * i,
    productionCost: 15000 + i * 1250, actualProductionCost: status === 'Completed' ? 15000 + i * 1250 : i === 4 ? 0 : 6000 + i * 500,
    brief: `Plan and deliver a coordinated creator and content rollout for ${client.name} in the Indian market.`
  };
});

const deliverableNames = ['Hero campaign cut', 'Creator rollout reel', 'Campaign social carousel'];
const progressByCampaign = [[3, 4, 5], [4, 3, 2], [1, 2, 3], [3, 2, 2], [], [4, 5, 5], [5, 5, 5], [5, 5, 5]];
const deliverables = campaigns.flatMap((campaign, i) => progressByCampaign[i].map((progress, j) => ({
  id: `dl${i + 1}-${j + 1}`, campaignId: campaign.id, title: deliverableNames[j],
  type: j === 2 ? 'Carousel' : 'Reel', date: i > 5 || i === 3 ? campaign.endDate :
    progress === 5 ? `2026-11-${18 + j}` : `2026-11-${22 + (i + j) % 8}`,
  progress, revisions: (i + j) % 3, checklist: [true, progress >= 2, progress >= 4],
  brief: `Produce the ${deliverableNames[j].toLowerCase()} for ${campaign.title}. Follow client brand guidelines and use approved captions.`,
  postUrl: progress === 5 ? `https://posts.example.invalid/${campaign.id}-${j + 1}` : ''
})));

const groups = [[0, 2, 4], [25, 27, 31], [13, 17], [32, 36], [], [38, 41, 43], [5, 9, 14], [44, 46, 48]];
const campaignCreators = campaigns.flatMap((campaign, i) => groups[i].map((creatorIndex, j) => {
  const offer = sourceOffers[creatorIndex];
  const deliverable = deliverables.find(item => item.id === `dl${i + 1}-${j + 1}`);
  const status = campaign.status === 'Completed' ? 'Insights Collected' : allocationStages[Math.max(1, deliverable.progress)];
  return {
    id: `cc${i + 1}-${j + 1}`, campaignId: campaign.id, creatorId: offer.creatorId, offerId: offer.id, sourceId: offer.sourceId,
    format: offer.deliverableType, terms: offer.terms, buyingRate: offer.buyingRate,
    sellingRate: Math.round(offer.buyingRate * 1.3), quantity: 1, status, date: deliverable.date, deliverableId: deliverable.id
  };
}));

const taskNames = ['Lock creative brief', 'Edit first cut', 'Prepare publishing assets', 'Review client feedback'];
const tasks = campaigns.flatMap((campaign, i) => taskNames.map((title, j) => {
  const deliverable = deliverables.find(item => item.id === `dl${i + 1}-${j % 3 + 1}`);
  const status = i > 5 || i === 5 && j === 1 ? 'Completed' : taskStages[(i + j) % 3];
  const dates = ['2026-11-20', '2026-11-22', '2026-11-24', '2026-11-26', '2026-11-28'];
  return {
    id: `tk${i + 1}-${j + 1}`, campaignId: campaign.id, deliverableId: deliverable?.id ?? null,
    title, assigneeId: employees[4 + (i * 3 + j) % 11].id, type: ['Strategy', 'Edit', 'Design', 'Review'][j],
    date: i > 5 ? campaign.endDate : i === 3 ? '2026-11-17' : i === 4 ? '2026-12-01' : dates[(i + j) % dates.length],
    status, priority: ['High', 'Normal', 'Low'][(i * 2 + j) % 3]
  };
}));

const quotations = campaigns.filter(campaign => campaign.id !== 'cp5').map(campaign => ({
  id: `qt-${campaign.id}`, clientId: campaign.clientId, campaignId: campaign.id, title: campaign.title,
  date: campaign.date, status: 'Accepted', serviceFee: campaign.serviceFee,
  lines: campaignCreators.filter(row => row.campaignId === campaign.id).map(row => ({
    creatorId: row.creatorId, format: row.format, quantity: row.quantity, sellingRate: row.sellingRate
  }))
}));
const invoices = quotations.map((quote, i) => ({
  id: `INV-${2601 + i}`, campaignId: quote.campaignId, clientId: quote.clientId,
  date: campaigns.find(row => row.id === quote.campaignId).endDate,
  amount: quote.serviceFee + quote.lines.reduce((total, row) => total + row.sellingRate * row.quantity, 0)
}));
const payments = [
  ...invoices.map((invoice, i) => ({ id: `rec-${invoice.id}`, invoiceId: invoice.id, campaignId: invoice.campaignId, type: 'Receivable', amount: invoice.amount, paid: i === 0 || i > 3 })),
  ...campaignCreators.map((row, i) => ({ id: `pay-${row.id}`, allocationId: row.id, campaignId: row.campaignId, type: 'Payable', amount: row.buyingRate * row.quantity, paid: row.status === 'Insights Collected' || row.status === 'Published' && i % 2 === 0 }))
];
const performanceRecords = deliverables.filter(row => row.progress === 5).map((row, i) => {
  const views = 11500 + (i * 21773 % 78000);
  return {
    id: `pf${i + 1}`, campaignId: row.campaignId, deliverableId: row.id, date: row.date,
    views, engagements: Math.round(views * (0.047 + i % 4 * 0.013)),
    impressions: Math.round(views * 1.55), reportedReach: Math.round(views * 1.12),
    clicks: campaigns.find(campaign => campaign.id === row.campaignId).adSpend ? Math.round(views * 0.012) : 0
  };
});

const activityLog = [
  { id: 'act1', type: 'approval', text: 'Creator rollout reel moved to client approval', campaignId: 'cp1', date: DEMO_DATE },
  { id: 'act2', type: 'source', text: 'Northstar Collective refreshed their creator rates', agencyId: 'ag1', date: '2026-11-20' },
  { id: 'act3', type: 'payment', text: 'Invoice INV-2601 marked paid', campaignId: 'cp1', date: '2026-11-20' },
  { id: 'act4', type: 'content', text: 'The Weekend Edit opened for production', campaignId: 'cp3', date: '2026-11-19' }
];

export const importOffers = [
  makeOffer('import-ag1-cr11', 'cr11', 'ag1', 9500),
  makeOffer('import-ag1-cr20', 'cr20', 'ag1', 13750),
  makeOffer('import-ag1-cr23', 'cr23', 'ag1', 15500)
];

export const seed = {
  demo: true, creators, socialProfiles, creatorMetrics, agencies, sourceOffers, clients, employees,
  campaigns, campaignCreators, deliverables, tasks, quotations, invoices, payments, performanceRecords, activityLog,
  sourcing: { brief: defaultBrief, searched: false, selected: {} }
};
