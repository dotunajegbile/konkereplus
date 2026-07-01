/* ============================================================
   KonkerePlus — Mock data (prototype)
   All data hardcoded; no backend. Money in NGN unless noted.
   ============================================================ */
window.KP = window.KP || {};

KP.fmt = {
  ngn(minor) {
    const n = Math.round(minor / 100);
    return '₦' + n.toLocaleString('en-NG');
  },
  ngnK(minor) {
    const n = minor / 100;
    if (n >= 1e6) return '₦' + (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M';
    if (n >= 1e3) return '₦' + (n / 1e3).toFixed(0) + 'k';
    return '₦' + n.toLocaleString('en-NG');
  },
  date(d) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  initials(name) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
};

/* ---------- Roles (§4, §13.2) ---------- */
KP.roles = {
  super_admin:  { label: 'Super Admin',      persona: 'Sade · Platform Operator',   scope: 'Platform-wide' },
  company_admin:{ label: 'Company Admin',     persona: 'Emeka · Operations Director', scope: 'Whole tenant' },
  prop_mgr:     { label: 'Property Manager',  persona: 'Ngozi',                       scope: 'Assigned properties' },
  con_pm:       { label: 'Construction PM',   persona: 'Tunde',                       scope: 'Assigned projects' },
  owner:        { label: 'Property Owner',    persona: 'Mr & Mrs Adeyemi',            scope: 'Owned entities (read-mostly)' },
  tenant:       { label: 'Tenant',            persona: 'Bola · Renter',               scope: 'Own lease / unit' },
  legal:        { label: 'Legal',             persona: 'Chika · In-house Counsel',    scope: 'Legal entities in tenant' },
  accountant:   { label: 'Accountant',        persona: 'Ifeoma',                      scope: 'Financial data in tenant' },
};

/* Navigation catalogue — each item lists roles allowed to see it (permission-filtered nav, §9.3) */
KP.nav = [
  { id: 'dashboard',    label: 'Dashboard',      icon: '▤', roles: '*' },
  { group: 'Portfolio' },
  { id: 'properties',   label: 'Properties',     icon: '▦', roles: ['super_admin','company_admin','prop_mgr','con_pm','owner','accountant'] },
  { id: 'units',        label: 'Units',          icon: '▥', roles: ['company_admin','prop_mgr','owner'] },
  { id: 'tenants',      label: 'Tenants',        icon: '☺', roles: ['company_admin','prop_mgr','legal','accountant'] },
  { id: 'leases',       label: 'Leases',         icon: '✎', roles: ['company_admin','prop_mgr','owner','legal','accountant'] },
  { id: 'rent',         label: 'Rent & Invoices',icon: '₦', roles: ['company_admin','prop_mgr','owner','accountant'] },
  { group: 'Operations' },
  { id: 'maintenance',  label: 'Maintenance',    icon: '⚒', roles: ['company_admin','prop_mgr','owner','accountant'] },
  { id: 'construction', label: 'Construction',   icon: '⌂', roles: ['company_admin','con_pm','owner'] },
  { id: 'crm',          label: 'CRM & Leads',    icon: '◎', roles: ['company_admin','prop_mgr'] },
  { id: 'legal',        label: 'Legal',          icon: '§', roles: ['company_admin','legal','owner'] },
  { group: 'Business' },
  { id: 'finance',      label: 'Finance',        icon: '$', roles: ['company_admin','accountant','owner'] },
  { id: 'documents',    label: 'Documents',      icon: '▣', roles: ['company_admin','prop_mgr','con_pm','legal','accountant','owner'] },
  { id: 'comms',        label: 'Communications', icon: '✉', roles: '*' },
  { id: 'reports',      label: 'Reports',        icon: '◔', roles: ['super_admin','company_admin','owner','accountant'] },
  { group: 'Portal' },
  { id: 'my-lease',     label: 'My Lease',       icon: '✎', roles: ['tenant'] },
  { id: 'pay-rent',     label: 'Pay Rent',       icon: '₦', roles: ['tenant'] },
  { id: 'my-requests',  label: 'Maintenance',    icon: '⚒', roles: ['tenant'] },
  { group: 'Admin' },
  { id: 'admin',        label: 'Users & Roles',  icon: '⚙', roles: ['super_admin','company_admin'] },
  { id: 'tenants-platform', label: 'Tenants (SaaS)', icon: '☷', roles: ['super_admin'] },
  { id: 'audit',        label: 'Audit Logs',     icon: '❑', roles: ['super_admin','company_admin','legal','accountant'] },
];

/* ---------- Properties (§5.3) ---------- */
KP.properties = [
  { id:'PR-1042', code:'KP-LEK-01', name:'Konkere Heights, Lekki', type:'Residential', status:'active', stage:'Completed', city:'Lekki, Lagos', units:48, occupied:44, ownerName:'Adeyemi Family Trust', manager:'Ngozi Okafor', incomeMtd:1848000000, expenseMtd:412000000, img:'linear-gradient(135deg,#1e3a8a,#2f6bff)' },
  { id:'PR-1043', code:'KP-VI-02',  name:'Marina View Towers, VI', type:'Commercial',  status:'active', stage:'Completed', city:'Victoria Island', units:32, occupied:29, ownerName:'Adeyemi Family Trust', manager:'Ngozi Okafor', incomeMtd:2640000000, expenseMtd:690000000, img:'linear-gradient(135deg,#0f766e,#22c55e)' },
  { id:'PR-1044', code:'KP-IKY-03', name:'Grove Court, Ikoyi',     type:'Mixed-use',   status:'active', stage:'Completed', city:'Ikoyi, Lagos', units:24, occupied:20, ownerName:'Chukwu Holdings', manager:'Ngozi Okafor', incomeMtd:1290000000, expenseMtd:305000000, img:'linear-gradient(135deg,#7c3aed,#a855f7)' },
  { id:'PR-1045', code:'KP-ABJ-04', name:'Palm Ridge Estate, Abuja',type:'Residential', status:'under_construction', stage:'Superstructure · 62%', city:'Gwarinpa, Abuja', units:60, occupied:0, ownerName:'Konkere Plus Dev', manager:'Tunde Bello', incomeMtd:0, expenseMtd:0, img:'linear-gradient(135deg,#b45309,#f5a524)' },
  { id:'PR-1046', code:'KP-PH-05',  name:'Harbour Point, PH',      type:'Warehouse',   status:'active', stage:'Completed', city:'Port Harcourt', units:8, occupied:7, ownerName:'MegaLogistics Ltd', manager:'Ngozi Okafor', incomeMtd:920000000, expenseMtd:140000000, img:'linear-gradient(135deg,#334155,#64748b)' },
  { id:'PR-1047', code:'KP-LEK-06', name:'Sable Residences, Lekki',type:'Short-stay',  status:'active', stage:'Completed', city:'Lekki Phase 1', units:16, occupied:13, ownerName:'Adeyemi Family Trust', manager:'Ngozi Okafor', incomeMtd:1120000000, expenseMtd:260000000, img:'linear-gradient(135deg,#be123c,#f43f5e)' },
];

/* ---------- Units (§5.4) ---------- */
KP.units = [
  { id:'U-3301', no:'A-1204', property:'Konkere Heights, Lekki', beds:3, baths:3, sqft:1450, rent:150000000, status:'occupied', tenant:'Bola Adeyemi', lease:'LSE-8821' },
  { id:'U-3302', no:'A-1205', property:'Konkere Heights, Lekki', beds:2, baths:2, sqft:1080, rent:110000000, status:'occupied', tenant:'Segun Ade', lease:'LSE-8834' },
  { id:'U-3303', no:'A-1206', property:'Konkere Heights, Lekki', beds:3, baths:3, sqft:1450, rent:150000000, status:'notice', tenant:'Chioma Eze', lease:'LSE-8801' },
  { id:'U-3304', no:'A-1207', property:'Konkere Heights, Lekki', beds:1, baths:1, sqft:720,  rent:78000000,  status:'available', tenant:'—', lease:'—' },
  { id:'U-3305', no:'B-0803', property:'Marina View Towers, VI',  beds:0, baths:1, sqft:2400, rent:420000000, status:'occupied', tenant:'FinEdge Corp', lease:'LSE-8702' },
  { id:'U-3306', no:'B-0804', property:'Marina View Towers, VI',  beds:0, baths:1, sqft:1800, rent:320000000, status:'reserved', tenant:'—', lease:'—' },
  { id:'U-3307', no:'C-0402', property:'Grove Court, Ikoyi',       beds:2, baths:2, sqft:990,  rent:135000000, status:'maintenance', tenant:'—', lease:'—' },
  { id:'U-3308', no:'C-0405', property:'Grove Court, Ikoyi',       beds:3, baths:3, sqft:1520, rent:180000000, status:'vacant', tenant:'—', lease:'—' },
];

/* ---------- Tenants (§5.5) ---------- */
KP.tenants = [
  { id:'TP-9', name:'Bola Adeyemi', unit:'A-1204', property:'Konkere Heights', phone:'+234 803 111 2233', since:'2024-08-01', balance:0, status:'current', kyc:'Verified' },
  { id:'TP-10', name:'Segun Ade', unit:'A-1205', property:'Konkere Heights', phone:'+234 802 555 8890', since:'2025-01-15', balance:22000000, status:'arrears', kyc:'Verified' },
  { id:'TP-11', name:'Chioma Eze', unit:'A-1206', property:'Konkere Heights', phone:'+234 806 234 1188', since:'2023-07-01', balance:0, status:'notice', kyc:'Verified' },
  { id:'TP-12', name:'FinEdge Corp', unit:'B-0803', property:'Marina View', phone:'+234 701 900 4455', since:'2022-03-01', balance:0, status:'current', kyc:'Corporate' },
  { id:'TP-13', name:'Amara Nwosu', unit:'C-0402', property:'Grove Court', phone:'+234 809 776 3321', since:'2025-03-10', balance:41000000, status:'arrears', kyc:'Pending' },
];

/* ---------- Leases (§5.6) ---------- */
KP.leases = [
  { id:'LSE-8821', tenant:'Bola Adeyemi', unit:'A-1204', property:'Konkere Heights', start:'2024-08-01', end:'2026-07-31', rent:150000000, cadence:'Annual', deposit:150000000, status:'active' },
  { id:'LSE-8834', tenant:'Segun Ade', unit:'A-1205', property:'Konkere Heights', start:'2025-01-15', end:'2026-01-14', rent:110000000, cadence:'Annual', deposit:110000000, status:'active' },
  { id:'LSE-8801', tenant:'Chioma Eze', unit:'A-1206', property:'Konkere Heights', start:'2023-07-01', end:'2026-06-30', rent:150000000, cadence:'Annual', deposit:150000000, status:'active' },
  { id:'LSE-8702', tenant:'FinEdge Corp', unit:'B-0803', property:'Marina View', start:'2022-03-01', end:'2027-02-28', rent:420000000, cadence:'Biannual', deposit:840000000, status:'active' },
  { id:'LSE-8850', tenant:'Amara Nwosu', unit:'C-0402', property:'Grove Court', start:'2025-03-10', end:'2026-03-09', rent:135000000, cadence:'Annual', deposit:135000000, status:'pending_signature' },
  { id:'LSE-8855', tenant:'Kunle Bright', unit:'A-1207', property:'Konkere Heights', start:'2026-07-15', end:'2027-07-14', rent:78000000, cadence:'Annual', deposit:78000000, status:'draft' },
];

/* ---------- Rent invoices (§5.7) ---------- */
KP.invoices = [
  { id:'INV-5501', tenant:'Bola Adeyemi', unit:'A-1204', period:'2026 Annual', amount:150000000, due:'2026-08-01', status:'open' },
  { id:'INV-5498', tenant:'Segun Ade', unit:'A-1205', period:'2026 Annual', amount:110000000, paid:88000000, due:'2026-06-15', status:'part_paid' },
  { id:'INV-5490', tenant:'Amara Nwosu', unit:'C-0402', period:'2026 Annual', amount:135000000, paid:94000000, due:'2026-05-20', status:'overdue' },
  { id:'INV-5480', tenant:'FinEdge Corp', unit:'B-0803', period:'2026 H1', amount:420000000, paid:420000000, due:'2026-03-01', status:'paid' },
  { id:'INV-5475', tenant:'Chioma Eze', unit:'A-1206', period:'2026 Annual', amount:150000000, paid:150000000, due:'2026-01-01', status:'paid' },
];

/* ---------- Maintenance (§5.8) ---------- */
KP.maintenance = [
  { id:'MR-771', title:'AC not cooling — bedroom', property:'Konkere Heights', unit:'A-1204', type:'routine', priority:'medium', status:'in_progress', assignee:'CoolAir Ltd', created:'2026-06-27', sla:'2026-07-01' },
  { id:'MR-772', title:'Water leak under kitchen sink', property:'Konkere Heights', unit:'A-1205', type:'emergency', priority:'emergency', status:'assigned', assignee:'BuildRight Ltd', created:'2026-06-30', sla:'2026-06-30' },
  { id:'MR-770', title:'Lobby lighting replacement', property:'Marina View', unit:'Common', type:'preventive', priority:'low', status:'open', assignee:'—', created:'2026-06-25', sla:'2026-07-05' },
  { id:'MR-768', title:'Elevator inspection — annual', property:'Grove Court', unit:'Common', type:'inspection', priority:'high', status:'completed', assignee:'LiftCare NG', created:'2026-06-18', sla:'2026-06-24' },
  { id:'MR-773', title:'Broken window latch', property:'Grove Court', unit:'C-0402', type:'routine', priority:'low', status:'on_hold', assignee:'Internal', created:'2026-06-29', sla:'2026-07-06' },
];

/* ---------- Construction (§5.9) ---------- */
KP.projects = [
  { id:'PJ-201', name:'Palm Ridge Estate', property:'Palm Ridge, Abuja', progress:62, budget:480000000000, spent:298000000000, start:'2025-02-01', due:'2026-12-15', status:'On track', crew:84, rfisOpen:3, coOpen:2 },
  { id:'PJ-202', name:'Konkere Heights Ph.2', property:'Lekki', progress:18, budget:210000000000, spent:41000000000, start:'2026-04-01', due:'2027-09-30', status:'On track', crew:36, rfisOpen:5, coOpen:1 },
  { id:'PJ-203', name:'Harbour Point Extension', property:'Port Harcourt', progress:91, budget:96000000000, spent:92000000000, start:'2024-09-01', due:'2026-07-20', status:'At risk', crew:22, rfisOpen:1, coOpen:0 },
];
KP.dailyReports = [
  { id:'DR-4410', project:'Palm Ridge Estate', date:'2026-06-30', weather:'Sunny 31°C', crew:84, work:'Level 6 slab formwork; column rebar tie L5', issues:'Cement delivery delayed 2h', photos:6 },
  { id:'DR-4402', project:'Palm Ridge Estate', date:'2026-06-29', weather:'Cloudy 29°C', crew:80, work:'Level 5 concrete pour completed', issues:'None', photos:9 },
  { id:'DR-4390', project:'Konkere Heights Ph.2', date:'2026-06-30', weather:'Sunny 32°C', crew:36, work:'Foundation excavation block C', issues:'Minor water ingress — pump deployed', photos:4 },
];
KP.rfis = [
  { id:'RFI-88', project:'Palm Ridge Estate', subject:'Rebar spec clarification — L6 slab', status:'submitted', raised:'2026-06-28', impact:'Schedule: none' },
  { id:'RFI-86', project:'Konkere Heights Ph.2', subject:'Drainage tie-in location', status:'review', raised:'2026-06-26', impact:'Cost: +₦2.1M' },
  { id:'CO-14',  project:'Palm Ridge Estate', subject:'Upgrade lobby cladding to granite', status:'pending_approval', raised:'2026-06-24', impact:'Budget +₦18M · +9 days', kind:'change_order' },
];

/* ---------- CRM (§5.10) ---------- */
KP.leads = [
  { id:'LD-330', name:'David Okonkwo', source:'Website · Listing', interest:'Grove Court C-0405', stage:'qualified', value:180000000, owner:'Ngozi', updated:'2026-06-29' },
  { id:'LD-331', name:'Zainab Bello', source:'Referral', interest:'2-bed rental, Lekki', stage:'viewing_booked', value:110000000, owner:'Ngozi', updated:'2026-06-30' },
  { id:'LD-332', name:'Emeka Corp', source:'Website · Contact', interest:'Office space, VI', stage:'contacted', value:420000000, owner:'Ngozi', updated:'2026-06-28' },
  { id:'LD-333', name:'Fatima Yusuf', source:'WhatsApp campaign', interest:'Short-stay, Lekki', stage:'new', value:35000000, owner:'—', updated:'2026-06-30' },
  { id:'LD-334', name:'GreenBuild Ltd', source:'Vendor reg', interest:'Become owner', stage:'won', value:0, owner:'Emeka', updated:'2026-06-27' },
];
KP.pipelineStages = ['new','contacted','qualified','viewing_booked','offer','won'];

/* ---------- Legal (§5.11) ---------- */
KP.cases = [
  { id:'LC-51', title:'Arrears recovery — A-1205', type:'Dispute', party:'Segun Ade', status:'active', lawyer:'Barr. Okoro', nextDate:'2026-07-14', property:'Konkere Heights' },
  { id:'LC-52', title:'Eviction — C-0402', type:'Eviction', party:'Amara Nwosu', status:'hearing_scheduled', lawyer:'Barr. Okoro', nextDate:'2026-07-09', property:'Grove Court' },
  { id:'LC-49', title:'Boundary dispute — Palm Ridge', type:'Lawsuit', party:'Adjacent landholder', status:'on_hold', lawyer:'Chika (in-house)', nextDate:'—', property:'Palm Ridge' },
  { id:'LC-53', title:'Lease breach notice — B-0803', type:'Dispute', party:'FinEdge Corp', status:'open', lawyer:'—', nextDate:'2026-07-22', property:'Marina View' },
];

/* ---------- Finance (§5.14) ---------- */
KP.finance = {
  collectionRate: 87,
  arrears: 6300000000,
  noiMtd: 5100000000,
  cashPosition: 18400000000,
  vendorPayable: 2140000000,
  expenses: [
    { id:'EX-201', vendor:'CoolAir Ltd', category:'Maintenance', amount:34000000, date:'2026-06-28', status:'approved' },
    { id:'EX-202', vendor:'MegaSupply', category:'Materials', amount:210000000, date:'2026-06-27', status:'pending' },
    { id:'EX-203', vendor:'LiftCare NG', category:'Maintenance', amount:56000000, date:'2026-06-24', status:'paid' },
    { id:'EX-204', vendor:'PowerGen Services', category:'Utilities', amount:88000000, date:'2026-06-22', status:'approved' },
  ],
};

/* ---------- Documents (§5.13) ---------- */
KP.documents = [
  { id:'DOC-901', name:'Lease Agreement — A-1204.pdf', category:'Lease', owner:'Konkere Heights', version:3, updated:'2026-06-01', expires:'2026-07-31', status:'approved' },
  { id:'DOC-902', name:'Certificate of Occupancy.pdf', category:'Certificate', owner:'Grove Court', version:1, updated:'2025-11-14', expires:'2030-11-13', status:'approved' },
  { id:'DOC-903', name:'Structural Drawings — Rev C.dwg', category:'Drawing', owner:'Palm Ridge', version:3, updated:'2026-06-20', expires:'—', status:'in_review' },
  { id:'DOC-904', name:'Insurance Policy 2026.pdf', category:'Insurance', owner:'Marina View', version:1, updated:'2026-01-05', expires:'2026-12-31', status:'approved' },
  { id:'DOC-905', name:'Eviction Notice — C-0402.pdf', category:'Legal', owner:'Grove Court', version:2, updated:'2026-06-28', expires:'—', status:'pending_approval' },
];

/* ---------- Communications (§5.12) ---------- */
KP.threads = [
  { id:'TH-1', with:'Bola Adeyemi', role:'Tenant', last:'Thanks, payment sent just now.', time:'09:12', unread:0 },
  { id:'TH-2', with:'BuildRight Ltd', role:'Contractor', last:'On our way to A-1205 for the leak.', time:'08:40', unread:2 },
  { id:'TH-3', with:'Barr. Okoro', role:'Lawyer', last:'Hearing confirmed for the 9th.', time:'Yst', unread:1 },
  { id:'TH-4', with:'Adeyemi Family Trust', role:'Owner', last:'Can you send the June statement?', time:'Yst', unread:0 },
];

/* ---------- Audit (§18) ---------- */
KP.audit = [
  { id:'AE-9931', actor:'Ngozi Okafor', action:'lease.approve', entity:'LSE-8850', time:'2026-06-30 09:22', ip:'102.89.x.x' },
  { id:'AE-9930', actor:'System', action:'payment.apply', entity:'INV-5498', time:'2026-06-30 09:12', ip:'—' },
  { id:'AE-9929', actor:'Ifeoma Nnamdi', action:'expense.create', entity:'EX-202', time:'2026-06-30 08:55', ip:'102.89.x.x' },
  { id:'AE-9928', actor:'Sade (impersonating Emeka)', action:'user.role.change', entity:'USR-338', time:'2026-06-29 17:40', ip:'41.203.x.x', flag:true },
  { id:'AE-9927', actor:'Chika Obi', action:'notice.issue', entity:'LC-52', time:'2026-06-29 15:10', ip:'102.89.x.x' },
];

/* ---------- Platform tenants (Super Admin, §5.1) ---------- */
KP.saasTenants = [
  { id:'T-KP', name:'Konkere Plus (anchor)', plan:'Enterprise', users:142, properties:6, status:'active', region:'af-west (Lagos)', mrr:0 },
  { id:'T-AX', name:'Axis Developers', plan:'Growth', users:38, properties:11, status:'active', region:'af-west (Lagos)', mrr:145000000 },
  { id:'T-HV', name:'Havila Estates', plan:'Starter', users:9, properties:3, status:'suspended', region:'eu-west', mrr:38000000 },
];

/* ---------- Public listings (§5.2) ---------- */
KP.listings = [
  { id:'L-1', title:'3-Bedroom Apartment, Konkere Heights', type:'Residential', deal:'For Rent', price:'₦1.5M / yr', beds:3, baths:3, sqft:1450, city:'Lekki, Lagos', tag:'Featured', img:'linear-gradient(135deg,#1e3a8a,#2f6bff)' },
  { id:'L-2', title:'Premium Office Floor, Marina View', type:'Commercial', deal:'For Lease', price:'₦4.2M / 6mo', beds:0, baths:2, sqft:2400, city:'Victoria Island', tag:'New', img:'linear-gradient(135deg,#0f766e,#22c55e)' },
  { id:'L-3', title:'2-Bedroom Flat, Grove Court', type:'Residential', deal:'For Rent', price:'₦1.35M / yr', beds:2, baths:2, sqft:990, city:'Ikoyi, Lagos', tag:'', img:'linear-gradient(135deg,#7c3aed,#a855f7)' },
  { id:'L-4', title:'Serviced Studio, Sable Residences', type:'Short-stay', deal:'Per Night', price:'₦85k / night', beds:1, baths:1, sqft:520, city:'Lekki Phase 1', tag:'Featured', img:'linear-gradient(135deg,#be123c,#f43f5e)' },
  { id:'L-5', title:'Warehouse Unit, Harbour Point', type:'Warehouse', deal:'For Lease', price:'₦9.2M / yr', beds:0, baths:1, sqft:8000, city:'Port Harcourt', tag:'', img:'linear-gradient(135deg,#334155,#64748b)' },
  { id:'L-6', title:'1-Bedroom Apartment, Konkere Heights', type:'Residential', deal:'For Rent', price:'₦780k / yr', beds:1, baths:1, sqft:720, city:'Lekki, Lagos', tag:'', img:'linear-gradient(135deg,#0369a1,#38bdf8)' },
];
