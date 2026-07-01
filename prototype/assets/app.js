/* ============================================================
   KonkerePlus — Application shell (prototype SPA)
   Hash-routed, role-switchable, permission-filtered nav.
   ============================================================ */
(function () {
  const { fmt, roles, nav } = KP;

  const state = {
    role: localStorage.getItem('kp_role') || 'company_admin',
    view: 'dashboard',
    theme: localStorage.getItem('kp_theme') || 'dark',
  };
  document.documentElement.setAttribute('data-theme', state.theme);

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const money = fmt.ngnK;

  function toast(msg, kind = '') {
    let host = $('#toasts'); if (!host) { host = document.createElement('div'); host.id = 'toasts'; document.body.appendChild(host); }
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg;
    host.appendChild(t); setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3200);
  }
  KP.toast = toast;

  function modal(html) {
    let m = $('#modal-root'); if (!m) { m = document.createElement('div'); m.id = 'modal-root'; document.body.appendChild(m); }
    m.innerHTML = `<div class="modal-scrim">${html}</div>`;
    m.querySelector('.modal-scrim').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  }
  function closeModal() { const m = $('#modal-root'); if (m) m.innerHTML = ''; }
  KP.modal = modal; KP.closeModal = closeModal;

  const roleCan = (item) => item.roles === '*' || item.roles.includes(state.role);

  function statusBadge(s) {
    const map = {
      active:'green', occupied:'green', paid:'green', completed:'green', current:'green', won:'green', approved:'green', 'On track':'green',
      open:'grey', draft:'grey', available:'blue', reserved:'blue', new:'grey', pending:'amber', part_paid:'amber', notice:'amber',
      overdue:'red', arrears:'red', emergency:'red', 'At risk':'red', suspended:'red', maintenance:'amber', vacant:'grey',
      in_progress:'blue', assigned:'blue', on_hold:'amber', pending_signature:'amber', pending_approval:'amber', hearing_scheduled:'amber',
      review:'blue', submitted:'blue', contacted:'blue', qualified:'blue', viewing_booked:'blue', in_review:'blue',
    };
    const label = String(s).replace(/_/g, ' ');
    return `<span class="badge ${map[s]||'grey'}"><span class="dot"></span>${label}</span>`;
  }
  const pill = (txt, cls='grey') => `<span class="badge ${cls}">${txt}</span>`;

  /* ============================================================
     SHELL
     ============================================================ */
  function renderShell() {
    const r = roles[state.role];
    const items = nav.filter(n => n.group || roleCan(n));
    // drop group headers with no visible items after them
    const navHtml = items.map((n, i) => {
      if (n.group) {
        const nextItems = items.slice(i + 1);
        const untilNext = [];
        for (const x of nextItems) { if (x.group) break; untilNext.push(x); }
        if (!untilNext.length) return '';
        return `<div class="nav-group">${n.group}</div>`;
      }
      const active = n.id === state.view ? ' active' : '';
      return `<a class="nav-item${active}" href="#${n.id}"><span class="ic">${n.icon}</span><span>${n.label}</span></a>`;
    }).join('');

    document.body.innerHTML = `
      <div class="app">
        <aside class="sidebar">
          <div class="brand"><span class="logo">K+</span><div><b>KonkerePlus</b><small>Konkere Plus · anchor</small></div></div>
          <nav class="nav">${navHtml}</nav>
          <div class="side-foot">
            <div class="role-card">
              <div class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em">Viewing as</div>
              <select id="role-switch" class="select" style="margin-top:6px">
                ${Object.entries(roles).map(([k,v]) => `<option value="${k}" ${k===state.role?'selected':''}>${v.label}</option>`).join('')}
              </select>
              <div class="muted" style="font-size:11px;margin-top:8px">${r.persona}</div>
              <div class="muted" style="font-size:11px">Scope: ${r.scope}</div>
            </div>
          </div>
        </aside>
        <main class="main">
          <header class="topbar">
            <div class="row gap">
              <button class="btn ghost sm" id="menu-toggle" title="Menu">☰</button>
              <div class="search-box"><span>⌕</span><input class="input" placeholder="Search properties, tenants, invoices…" id="global-search"></div>
            </div>
            <div class="row gap">
              <button class="btn ghost sm" id="theme-toggle" title="Toggle theme">${state.theme==='dark'?'☀':'☾'}</button>
              <button class="btn ghost sm" title="Notifications" style="position:relative">✉<span class="notif-dot"></span></button>
              <a class="btn ghost sm" href="index.html" title="Public site">↗ Site</a>
              <div class="avatar" title="${r.persona}">${fmt.initials(r.persona.split('·')[0])}</div>
            </div>
          </header>
          <div class="content" id="content"></div>
        </main>
      </div>`;

    $('#role-switch').addEventListener('change', e => {
      state.role = e.target.value; localStorage.setItem('kp_role', state.role);
      // if current view not permitted for new role, go to dashboard
      const cur = nav.find(n => n.id === state.view);
      if (cur && !(cur.roles === '*' || cur.roles.includes(state.role))) location.hash = 'dashboard';
      renderShell(); route();
      toast('Now viewing as ' + roles[state.role].label);
    });
    $('#theme-toggle').addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('kp_theme', state.theme);
      document.documentElement.setAttribute('data-theme', state.theme);
      renderShell(); route();
    });
    $('#menu-toggle').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
    $('#global-search').addEventListener('keydown', e => { if (e.key === 'Enter') globalSearch(e.target.value); });
  }

  function globalSearch(q) {
    q = (q||'').toLowerCase().trim(); if (!q) return;
    const hits = [];
    KP.properties.forEach(p => { if ((p.name+p.code+p.city).toLowerCase().includes(q)) hits.push(['Property', p.name, '#properties']); });
    KP.tenants.forEach(t => { if (t.name.toLowerCase().includes(q)) hits.push(['Tenant', t.name, '#tenants']); });
    KP.invoices.forEach(i => { if ((i.id+i.tenant).toLowerCase().includes(q)) hits.push(['Invoice', i.id+' · '+i.tenant, '#rent']); });
    KP.leases.forEach(l => { if ((l.id+l.tenant).toLowerCase().includes(q)) hits.push(['Lease', l.id+' · '+l.tenant, '#leases']); });
    modal(`<div class="modal">
      <div class="modal-h"><h3>Search · "${q}"</h3><button class="btn ghost sm" onclick="KP.closeModal()">✕</button></div>
      <div class="modal-b">${hits.length ? hits.map(h=>`<a class="search-hit" href="${h[2]}" onclick="KP.closeModal()">${pill(h[0],'blue')} <b>${h[1]}</b></a>`).join('') : '<div class="empty">No permission-scoped results.</div>'}</div>
      <div class="muted" style="font-size:11px;padding:0 20px 16px">Results are permission-filtered per role (FR-SRCH-1).</div>
    </div>`);
  }

  /* ============================================================
     ROUTER
     ============================================================ */
  function route() {
    const hash = (location.hash || '#dashboard').slice(1);
    const [view, arg] = hash.split('/');
    state.view = view;
    renderShell();
    // permission gate — deny-by-default (NFR-SEC-2)
    const item = nav.find(n => n.id === view);
    if (item && !(item.roles === '*' || item.roles.includes(state.role))) {
      $('#content').innerHTML = views.denied();
      return;
    }
    const fn = views[view] || views.dashboard;
    $('#content').innerHTML = fn(arg);
    window.scrollTo(0, 0);
  }

  /* ============================================================
     VIEWS
     ============================================================ */
  const pageH = (title, sub, actions='') =>
    `<div class="page-h"><div><h1>${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div><div class="row gap wrap">${actions}</div></div>`;

  const views = {
    denied: () => `<div class="empty" style="padding-top:80px"><div class="ic">🔒</div><h3>Permission denied</h3><p>The <b>${roles[state.role].label}</b> role cannot access this area.<br>Every screen is gated by tenant + role + ownership scope (NFR-SEC-2).</p></div>`,

    /* ---------- DASHBOARD (role-specific) ---------- */
    dashboard() { return dashboards[state.role] ? dashboards[state.role]() : dashboards.default(); },

    /* ---------- PROPERTIES ---------- */
    properties() {
      const rows = KP.properties.map(p => `
        <tr onclick="location.hash='properties/${p.id}'">
          <td><div class="row gap"><span class="thumb" style="background:${p.img}"></span><div><b>${p.name}</b><div class="muted mono" style="font-size:11px">${p.code}</div></div></div></td>
          <td>${pill(p.type,'blue')}</td>
          <td>${statusBadge(p.status)}</td>
          <td class="num">${p.units?Math.round(p.occupied/p.units*100):0}%</td>
          <td class="num">${money(p.incomeMtd)}</td>
          <td>${p.manager}</td>
        </tr>`).join('');
      return pageH('Properties', `${KP.properties.length} properties · ${roles[state.role].scope}`,
        `<button class="btn" onclick="KP.toast('Map view (prototype)')">🗺 Map</button><button class="btn primary" onclick="KP.toast('New property wizard (prototype)')">+ New property</button>`)
        + `<div class="chips-row">${['All','Residential','Commercial','Mixed-use','Warehouse','Short-stay'].map((c,i)=>`<span class="chip ${i===0?'active':''}">${c}</span>`).join('')}</div>`
        + `<div class="card pad-0"><table class="tbl"><thead><tr><th>Property</th><th>Type</th><th>Status</th><th class="num">Occupancy</th><th class="num">Income (MTD)</th><th>Manager</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },
    propertyDetail(id) {
      const p = KP.properties.find(x => x.id === id) || KP.properties[0];
      const units = KP.units.filter(u => p.name.includes(u.property.split(',')[0]));
      const occ = p.units ? Math.round(p.occupied / p.units * 100) : 0;
      return `<a class="back" href="#properties">← Properties</a>`
        + pageH(p.name, `${p.code} · ${p.city}`, `<button class="btn">Edit</button><button class="btn primary" onclick="KP.toast('Action scoped by permission')">Quick action</button>`)
        + `<div class="hero" style="background:${p.img}"><span class="badge ${p.status==='active'?'green':'amber'}"><span class="dot"></span>${p.status.replace('_',' ')}</span></div>`
        + `<div class="grid stats-4" style="margin:16px 0">
            ${stat('Occupancy', occ+'%', p.occupied+' / '+p.units+' units')}
            ${stat('Income (MTD)', money(p.incomeMtd))}
            ${stat('Expenses (MTD)', money(p.expenseMtd))}
            ${stat('Net (MTD)', money(p.incomeMtd - p.expenseMtd), null, 'up')}
          </div>`
        + `<div class="tabs">${['Overview','Units','Financials','Maintenance','Documents','Legal'].map((t,i)=>`<span class="tab ${i===0?'active':''}">${t}</span>`).join('')}</div>`
        + `<div class="card pad-0"><table class="tbl"><thead><tr><th>Unit</th><th>Beds</th><th class="num">Rent/yr</th><th>Status</th><th>Tenant</th></tr></thead><tbody>${
            units.map(u=>`<tr><td class="mono">${u.no}</td><td>${u.beds} bd</td><td class="num">${money(u.rent)}</td><td>${statusBadge(u.status)}</td><td>${u.tenant}</td></tr>`).join('') || '<tr><td colspan=5><div class="empty">No units loaded for this property.</div></td></tr>'
          }</tbody></table></div>`;
    },

    /* ---------- UNITS ---------- */
    units() {
      const rows = KP.units.map(u => `<tr>
        <td class="mono"><b>${u.no}</b></td><td>${u.property}</td><td>${u.beds} bd · ${u.baths} ba</td>
        <td class="num">${u.sqft} ft²</td><td class="num">${money(u.rent)}</td><td>${statusBadge(u.status)}</td><td>${u.tenant}</td></tr>`).join('');
      return pageH('Units', `${KP.units.length} units across portfolio`, `<button class="btn primary" onclick="KP.toast('Bulk unit creation (FR-UNIT-3)')">+ Bulk create</button>`)
        + `<div class="card pad-0"><table class="tbl"><thead><tr><th>Unit</th><th>Property</th><th>Config</th><th class="num">Size</th><th class="num">Rent/yr</th><th>Status</th><th>Tenant</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },

    /* ---------- TENANTS ---------- */
    tenants() {
      const rows = KP.tenants.map(t => `<tr>
        <td><div class="row gap"><span class="avatar">${fmt.initials(t.name)}</span><div><b>${t.name}</b><div class="muted" style="font-size:11px">${t.phone}</div></div></div></td>
        <td class="mono">${t.unit}</td><td>${t.property}</td><td>${fmt.date(t.since)}</td>
        <td class="num" style="color:${t.balance>0?'var(--error)':'var(--muted)'}">${t.balance?money(t.balance):'₦0'}</td>
        <td>${statusBadge(t.status)}</td><td>${pill(t.kyc, t.kyc==='Pending'?'amber':'green')}</td></tr>`).join('');
      return pageH('Tenants', `${KP.tenants.length} tenant profiles`, `<button class="btn primary" onclick="KP.toast('New tenant profile (prototype)')">+ Add tenant</button>`)
        + `<div class="card pad-0"><table class="tbl"><thead><tr><th>Tenant</th><th>Unit</th><th>Property</th><th>Since</th><th class="num">Balance</th><th>Status</th><th>KYC</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },

    /* ---------- LEASES ---------- */
    leases() {
      const rows = KP.leases.map(l => `<tr>
        <td class="mono"><b>${l.id}</b></td><td>${l.tenant}</td><td class="mono">${l.unit}</td>
        <td>${fmt.date(l.start)} → ${fmt.date(l.end)}</td><td class="num">${money(l.rent)}</td><td>${l.cadence}</td><td>${statusBadge(l.status)}</td></tr>`).join('');
      return pageH('Leases', 'Draft → approve → sign → active (§15.1)',
        `<button class="btn primary" onclick="KP.leaseWizard()">+ New lease</button>`)
        + `<div class="chips-row">${['All','Active','Pending signature','Draft','Expiring ≤60d'].map((c,i)=>`<span class="chip ${i===0?'active':''}">${c}</span>`).join('')}</div>`
        + `<div class="card pad-0"><table class="tbl"><thead><tr><th>Lease</th><th>Tenant</th><th>Unit</th><th>Term</th><th class="num">Rent/yr</th><th>Cadence</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },

    /* ---------- RENT & INVOICES ---------- */
    rent() {
      const rows = KP.invoices.map(i => {
        const paid = i.paid || (i.status==='paid'?i.amount:0);
        const pct = Math.round(paid / i.amount * 100);
        return `<tr>
          <td class="mono"><b>${i.id}</b></td><td>${i.tenant}</td><td class="mono">${i.unit}</td><td>${i.period}</td>
          <td class="num">${money(i.amount)}</td>
          <td style="width:120px"><div class="bar ${pct>=100?'green':'amber'}"><span style="width:${pct}%"></span></div><div class="muted" style="font-size:11px;margin-top:3px">${pct}% · due ${fmt.date(i.due)}</div></td>
          <td>${statusBadge(i.status)}</td></tr>`;
      }).join('');
      const totalDue = KP.invoices.filter(i=>i.status!=='paid').reduce((s,i)=>s+(i.amount-(i.paid||0)),0);
      return pageH('Rent & Invoices', 'Idempotent payment handling · daily reconciliation (BR-04)',
        `<button class="btn" onclick="KP.toast('Reconciliation run queued')">↻ Reconcile</button><button class="btn primary" onclick="KP.toast('Invoice generation (fn_generate_rent_invoices)')">+ Generate invoices</button>`)
        + `<div class="grid stats-4" style="margin-bottom:16px">
            ${stat('Collection rate', KP.finance.collectionRate+'%', 'this period', 'up')}
            ${stat('Outstanding', money(totalDue))}
            ${stat('Arrears', money(KP.finance.arrears), null, 'down')}
            ${stat('Collected (MTD)', money(KP.finance.noiMtd))}</div>`
        + `<div class="card pad-0"><table class="tbl"><thead><tr><th>Invoice</th><th>Tenant</th><th>Unit</th><th>Period</th><th class="num">Amount</th><th>Progress</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },

    /* ---------- MAINTENANCE ---------- */
    maintenance() {
      const cols = { open:[], assigned:[], in_progress:[], completed:[] };
      KP.maintenance.forEach(m => { const k = m.status==='on_hold'?'assigned':m.status; (cols[k]||cols.open).push(m); });
      const card = m => `<div class="kanban-card" onclick="KP.toast('${m.id} · ${m.title}')">
        <div class="row between"><span class="mono muted" style="font-size:11px">${m.id}</span>${m.priority==='emergency'?pill('EMERGENCY','red'):pill(m.priority, m.priority==='high'?'amber':'grey')}</div>
        <div style="font-weight:600;margin:6px 0">${m.title}</div>
        <div class="muted" style="font-size:12px">${m.property} · ${m.unit}</div>
        <div class="row between" style="margin-top:8px"><span class="badge grey">${m.assignee}</span><span class="muted" style="font-size:11px">SLA ${fmt.date(m.sla)}</span></div></div>`;
      const col = (title, key, cls) => `<div class="kanban-col"><div class="kanban-h">${title} <span class="badge ${cls}">${cols[key].length}</span></div>${cols[key].map(card).join('')||'<div class="muted" style="font-size:12px;padding:8px">None</div>'}</div>`;
      return pageH('Maintenance', 'Request intake → assign → SLA → complete (§15.2)', `<button class="btn primary" onclick="KP.maintRequest()">+ New request</button>`)
        + `<div class="kanban">${col('Open','open','grey')}${col('Assigned','assigned','blue')}${col('In progress','in_progress','amber')}${col('Completed','completed','green')}</div>`;
    },

    /* ---------- CONSTRUCTION ---------- */
    construction() {
      const cards = KP.projects.map(p => `<div class="card">
        <div class="row between"><div><b>${p.name}</b><div class="muted" style="font-size:12px">${p.property}</div></div>${statusBadge(p.status)}</div>
        <div class="row between" style="margin:14px 0 6px"><span class="muted" style="font-size:12px">Progress</span><b>${p.progress}%</b></div>
        <div class="bar ${p.status==='At risk'?'amber':''}"><span style="width:${p.progress}%"></span></div>
        <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">
          <div><div class="muted" style="font-size:11px">Budget</div><b>${money(p.budget)}</b></div>
          <div><div class="muted" style="font-size:11px">Spent</div><b>${money(p.spent)}</b></div>
          <div><div class="muted" style="font-size:11px">Due</div><b>${fmt.date(p.due)}</b></div>
          <div><div class="muted" style="font-size:11px">Crew</div><b>${p.crew}</b></div>
        </div>
        <div class="row gap" style="margin-top:12px">${pill(p.rfisOpen+' RFIs', p.rfisOpen?'amber':'grey')}${pill(p.coOpen+' change orders', p.coOpen?'amber':'grey')}</div>
      </div>`).join('');
      const drRows = KP.dailyReports.map(d=>`<tr><td class="mono">${d.id}</td><td>${d.project}</td><td>${fmt.date(d.date)}</td><td>${d.work}</td><td>${pill(d.crew+' crew','grey')}</td><td>${pill('📷 '+d.photos,'blue')}</td></tr>`).join('');
      const rfiRows = KP.rfis.map(r=>`<tr><td class="mono">${r.id}</td><td>${r.subject}</td><td>${r.project}</td><td>${statusBadge(r.status)}</td><td class="muted">${r.impact}</td></tr>`).join('');
      return pageH('Construction', 'Projects · daily reports · RFIs & change orders (§5.9)', `<button class="btn primary" onclick="KP.toast('New daily report (offline-capable, MOB-4)')">+ Daily report</button>`)
        + `<div class="grid stats-3" style="margin-bottom:20px">${cards}</div>`
        + `<div class="card-h" style="margin-top:8px"><h3>Recent daily reports</h3><a class="muted" href="#">View all →</a></div>`
        + `<div class="card pad-0" style="margin-bottom:20px"><table class="tbl"><thead><tr><th>Report</th><th>Project</th><th>Date</th><th>Work done</th><th>Crew</th><th>Photos</th></tr></thead><tbody>${drRows}</tbody></table></div>`
        + `<div class="card-h"><h3>RFIs & change orders</h3></div>`
        + `<div class="card pad-0"><table class="tbl"><thead><tr><th>ID</th><th>Subject</th><th>Project</th><th>Status</th><th>Impact</th></tr></thead><tbody>${rfiRows}</tbody></table></div>`;
    },

    /* ---------- CRM ---------- */
    crm() {
      const byStage = {}; KP.pipelineStages.forEach(s => byStage[s] = KP.leads.filter(l => l.stage === s));
      const stageCol = s => `<div class="kanban-col"><div class="kanban-h">${s.replace(/_/g,' ')} <span class="badge grey">${byStage[s].length}</span></div>${
        byStage[s].map(l=>`<div class="kanban-card"><div class="row between"><b>${l.name}</b>${l.value?pill(money(l.value),'green'):''}</div><div class="muted" style="font-size:12px;margin:5px 0">${l.interest}</div><div class="row between"><span class="badge grey">${l.source}</span><span class="muted" style="font-size:11px">${l.owner}</span></div></div>`).join('')||'<div class="muted" style="font-size:12px;padding:8px">—</div>'
      }</div>`;
      return pageH('CRM & Leads', 'Lead → contacted → qualified → won (§15.7)', `<button class="btn primary" onclick="KP.toast('New lead (prototype)')">+ New lead</button>`)
        + `<div class="kanban">${KP.pipelineStages.map(stageCol).join('')}</div>`;
    },

    /* ---------- LEGAL ---------- */
    legal() {
      const rows = KP.cases.map(c=>`<tr>
        <td class="mono"><b>${c.id}</b></td><td>${c.title}</td><td>${pill(c.type, c.type==='Eviction'?'red':'blue')}</td>
        <td>${c.party}</td><td>${statusBadge(c.status)}</td><td>${c.lawyer}</td><td>${c.nextDate==='—'?'<span class="muted">—</span>':fmt.date(c.nextDate)}</td></tr>`).join('');
      return pageH('Legal', 'Cases · notices · hearings (§5.11) — case tracker, not legal advice', `<button class="btn primary" onclick="KP.toast('New case (prototype)')">+ New case</button>`)
        + `<div class="grid stats-4" style="margin-bottom:16px">${stat('Open cases', KP.cases.filter(c=>c.status!=='closed').length)}${stat('Hearings ≤14d', 2, null, 'down')}${stat('Evictions', KP.cases.filter(c=>c.type==='Eviction').length)}${stat('Notices pending', 1)}</div>`
        + `<div class="card pad-0"><table class="tbl"><thead><tr><th>Case</th><th>Title</th><th>Type</th><th>Party</th><th>Status</th><th>Lawyer</th><th>Next date</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },

    /* ---------- FINANCE ---------- */
    finance() {
      const f = KP.finance;
      const rows = f.expenses.map(e=>`<tr><td class="mono">${e.id}</td><td>${e.vendor}</td><td>${pill(e.category,'blue')}</td><td class="num">${money(e.amount)}</td><td>${fmt.date(e.date)}</td><td>${statusBadge(e.status)}</td></tr>`).join('');
      return pageH('Finance', 'Invoices · expenses · statements · QuickBooks/Xero sync (§5.14)', `<button class="btn" onclick="KP.toast('Owner statement PDF generated')">📄 Owner statement</button><button class="btn primary" onclick="KP.toast('Synced to QuickBooks (A-08)')">↻ Sync accounting</button>`)
        + `<div class="grid stats-4" style="margin-bottom:16px">${stat('Cash position', money(f.cashPosition),null,'up')}${stat('NOI (MTD)', money(f.noiMtd))}${stat('Arrears', money(f.arrears),null,'down')}${stat('Vendor payable', money(f.vendorPayable))}</div>`
        + `<div class="card-h"><h3>Expenses & vendor payments</h3><a class="muted" href="#">Export CSV →</a></div>`
        + `<div class="card pad-0"><table class="tbl"><thead><tr><th>Ref</th><th>Vendor</th><th>Category</th><th class="num">Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },

    /* ---------- DOCUMENTS ---------- */
    documents() {
      const rows = KP.documents.map(d=>`<tr>
        <td><div class="row gap"><span class="doc-ic">${d.name.endsWith('.dwg')?'▤':'▣'}</span><b>${d.name}</b></div></td>
        <td>${pill(d.category,'blue')}</td><td>${d.owner}</td><td class="mono">v${d.version}</td><td>${fmt.date(d.updated)}</td>
        <td>${d.expires==='—'?'<span class="muted">—</span>':fmt.date(d.expires)}</td><td>${statusBadge(d.status)}</td></tr>`).join('');
      return pageH('Documents', 'Folders · versioning · OCR search · e-signature (§5.13)', `<button class="btn primary" onclick="KP.toast('Upload (presigned S3)')">↑ Upload</button>`)
        + `<div class="search-box big"><span>⌕</span><input class="input" placeholder="Full-text / OCR search across documents (FR-DOC-2)…"></div>`
        + `<div class="card pad-0"><table class="tbl"><thead><tr><th>Name</th><th>Category</th><th>Owner</th><th>Ver</th><th>Updated</th><th>Expires</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },

    /* ---------- COMMS ---------- */
    comms() {
      const list = KP.threads.map((t,i)=>`<div class="thread ${i===0?'active':''}"><span class="avatar">${fmt.initials(t.with)}</span><div class="grow"><div class="row between"><b>${t.with}</b><span class="muted" style="font-size:11px">${t.time}</span></div><div class="muted" style="font-size:12px">${t.last}</div></div>${t.unread?`<span class="badge blue">${t.unread}</span>`:''}<div class="muted" style="font-size:10px;position:absolute;right:14px;bottom:8px">${t.role}</div></div>`).join('');
      return pageH('Communications', 'In-app · email · SMS · WhatsApp · push (§5.12)', `<button class="btn primary" onclick="KP.toast('New message')">+ New message</button>`)
        + `<div class="comms"><div class="card pad-0 thread-list">${list}</div>
            <div class="card chat">
              <div class="chat-h"><span class="avatar">BA</span><div><b>Bola Adeyemi</b><div class="muted" style="font-size:11px">Tenant · A-1204 · Konkere Heights</div></div></div>
              <div class="chat-body">
                <div class="msg in">Hi, I've just paid the rent for this year. Could you confirm the receipt?</div>
                <div class="msg out">Received — receipt INV-5501 is in your portal under Receipts. Thank you!</div>
                <div class="msg in">Thanks, payment sent just now. 👍</div>
              </div>
              <div class="chat-input"><input class="input" placeholder="Type a message…"><button class="btn primary">Send</button></div>
            </div></div>`;
    },

    /* ---------- REPORTS ---------- */
    reports() {
      const kpis = [['Collection rate','87%','up'],['Occupancy','86%','up'],['Avg. resolution','2.4 days','up'],['Renewal rate','78%','down'],['NOI / property','₦51M','up'],['DSO','19 days','up']];
      return pageH('Reports & Analytics', 'Operational + financial reports · scheduled exports (§17)', `<button class="btn">📅 Schedule</button><button class="btn primary" onclick="KP.toast('Exported XLSX')">↓ Export</button>`)
        + `<div class="grid stats-3" style="margin-bottom:20px">${kpis.map(k=>stat(k[0],k[1],null,k[2])).join('')}</div>`
        + `<div class="grid" style="grid-template-columns:2fr 1fr">
            <div class="card"><div class="card-h"><h3>Rent collection — 6 months</h3><span class="badge green">▲ 4.2%</span></div>${barChart([72,78,81,84,83,87])}</div>
            <div class="card"><div class="card-h"><h3>Occupancy by property</h3></div>${KP.properties.filter(p=>p.units).slice(0,5).map(p=>{const o=Math.round(p.occupied/p.units*100);return `<div style="margin-bottom:12px"><div class="row between" style="font-size:12px;margin-bottom:4px"><span>${p.name.split(',')[0]}</span><b>${o}%</b></div><div class="bar"><span style="width:${o}%"></span></div></div>`;}).join('')}</div>
          </div>`;
    },

    /* ---------- ADMIN ---------- */
    admin() {
      const row = (name, role, status, scope) => `<tr><td><div class="row gap"><span class="avatar">${fmt.initials(name)}</span><b>${name}</b></div></td><td>${pill(role,'blue')}</td><td>${statusBadge(status)}</td><td class="muted">${scope}</td><td><button class="btn ghost sm">Edit</button></td></tr>`;
      return pageH('Users & Roles', 'RBAC — roles compose granular permissions (FR-IAM-3)', `<button class="btn" onclick="KP.toast('Custom role builder (prototype)')">+ Custom role</button><button class="btn primary" onclick="KP.toast('Invite sent')">+ Invite user</button>`)
        + `<div class="card pad-0" style="margin-bottom:20px"><table class="tbl"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Scope</th><th></th></tr></thead><tbody>
            ${row('Emeka Obi','Company Admin','active','Whole tenant')}
            ${row('Ngozi Okafor','Property Manager','active','3 properties')}
            ${row('Tunde Bello','Construction PM','active','2 projects')}
            ${row('Ifeoma Nnamdi','Accountant','active','Financial data')}
            ${row('Chika Obi','Legal','active','Legal entities')}
            ${row('Kunle Ade','Receptionist','invited','CRM (limited)')}
          </tbody></table></div>`
        + `<div class="card-h"><h3>Permission matrix (excerpt · §13.2)</h3></div>` + permMatrix();
    },

    tenantsPlatform() {
      const rows = KP.saasTenants.map(t=>`<tr><td><b>${t.name}</b></td><td>${pill(t.plan,'blue')}</td><td class="num">${t.users}</td><td class="num">${t.properties}</td><td>${t.region}</td><td class="num">${t.mrr?money(t.mrr):'—'}</td><td>${statusBadge(t.status)}</td><td><button class="btn ghost sm" onclick="KP.toast('Break-glass impersonation is time-boxed & audited (BR-13)')">Impersonate</button></td></tr>`).join('');
      return pageH('Tenants (SaaS)', 'Platform operator view — provision / suspend isolated tenants (§5.1)', `<button class="btn primary" onclick="KP.toast('Provision tenant — seeds roles + admin invite (US-ADM-01)')">+ Provision tenant</button>`)
        + `<div class="grid stats-4" style="margin-bottom:16px">${stat('Tenants',KP.saasTenants.length)}${stat('Active',KP.saasTenants.filter(t=>t.status==='active').length,null,'up')}${stat('Total MRR', money(KP.saasTenants.reduce((s,t)=>s+t.mrr,0)))}${stat('Platform users', KP.saasTenants.reduce((s,t)=>s+t.users,0))}</div>`
        + `<div class="card pad-0"><table class="tbl"><thead><tr><th>Tenant</th><th>Plan</th><th class="num">Users</th><th class="num">Properties</th><th>Region</th><th class="num">MRR</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },

    audit() {
      const rows = KP.audit.map(a=>`<tr class="${a.flag?'flag':''}"><td class="mono">${a.id}</td><td>${a.actor}${a.flag?' '+pill('flagged','red'):''}</td><td><code class="code">${a.action}</code></td><td class="mono">${a.entity}</td><td class="muted">${a.time}</td><td class="muted mono">${a.ip}</td></tr>`).join('');
      return pageH('Audit Logs', 'Append-only · immutable · 7-yr retention (§18)', `<button class="btn" onclick="KP.toast('Exported for legal hold')">↓ Export</button>`)
        + `<div class="card pad-0"><table class="tbl"><thead><tr><th>Event</th><th>Actor</th><th>Action</th><th>Entity</th><th>Time</th><th>IP</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    },

    /* ---------- TENANT PORTAL ---------- */
    myLease() {
      const l = KP.leases[0];
      return pageH('My Lease', 'Konkere Heights · A-1204')
        + `<div class="grid" style="grid-template-columns:2fr 1fr">
            <div class="card"><div class="card-h"><h3>Lease ${l.id}</h3>${statusBadge('active')}</div>
              <div class="kv"><span>Property</span><b>Konkere Heights, Lekki</b></div>
              <div class="kv"><span>Unit</span><b>A-1204 · 3 bed / 3 bath</b></div>
              <div class="kv"><span>Term</span><b>${fmt.date(l.start)} → ${fmt.date(l.end)}</b></div>
              <div class="kv"><span>Rent</span><b>${money(l.rent)} / year</b></div>
              <div class="kv"><span>Deposit</span><b>${money(l.deposit)}</b></div>
              <div class="kv"><span>Cadence</span><b>${l.cadence}</b></div>
              <div class="row gap" style="margin-top:16px"><button class="btn" onclick="KP.toast('Signed lease PDF')">📄 View document</button><button class="btn" onclick="KP.toast('Renewal request sent')">Request renewal</button></div>
            </div>
            <div class="card center col" style="text-align:center">
              <div class="muted" style="font-size:12px">Lease ends in</div>
              <div style="font-size:40px;font-weight:700;letter-spacing:-.02em">396</div>
              <div class="muted">days</div>
              <div class="bar" style="width:100%;margin-top:14px"><span style="width:46%"></span></div>
            </div></div>`;
    },
    payRent() {
      const inv = KP.invoices[0];
      return pageH('Pay Rent', 'Instant receipt · idempotent (US-RENT-01)')
        + `<div class="grid" style="grid-template-columns:1fr 1fr;max-width:840px">
            <div class="card"><div class="muted" style="font-size:12px">Outstanding invoice</div>
              <div style="font-size:34px;font-weight:700;margin:6px 0">${money(inv.amount)}</div>
              <div class="muted">${inv.id} · ${inv.period} · due ${fmt.date(inv.due)}</div>
              <div class="bar" style="margin-top:16px"><span style="width:0%"></span></div>
              <div class="muted" style="font-size:12px;margin-top:6px">Balance: ${money(inv.amount)}</div>
            </div>
            <div class="card"><h3 style="margin-bottom:14px">Choose payment method</h3>
              <div class="pay-methods">
                ${['💳 Card','🏦 Bank transfer','📱 Paystack','👛 Wallet'].map((m,i)=>`<label class="pay-opt ${i===2?'sel':''}"><input type="radio" name="pm" ${i===2?'checked':''}><span>${m}</span></label>`).join('')}
              </div>
              <button class="btn primary lg" style="width:100%;margin-top:16px;justify-content:center" onclick="KP.payFlow()">Pay ${money(inv.amount)}</button>
              <div class="muted" style="font-size:11px;text-align:center;margin-top:8px">🔒 Payments require connectivity · disabled offline (MOB-8)</div>
            </div></div>`;
    },
    myRequests() {
      const mine = KP.maintenance.slice(0,3);
      return pageH('Maintenance', 'Report an issue with photos', `<button class="btn primary" onclick="KP.maintRequest()">+ New request</button>`)
        + mine.map(m=>`<div class="card" style="margin-bottom:12px"><div class="row between"><div><b>${m.title}</b><div class="muted" style="font-size:12px">${m.id} · raised ${fmt.date(m.created)}</div></div>${statusBadge(m.status)}</div>
          <div class="timeline"><span class="done">Submitted</span><span class="${['assigned','in_progress','completed'].includes(m.status)?'done':''}">Assigned</span><span class="${['in_progress','completed'].includes(m.status)?'done':''}">In progress</span><span class="${m.status==='completed'?'done':''}">Done</span></div></div>`).join('');
    },
  };
  // alias hyphenated routes
  views['my-lease'] = views.myLease;
  views['pay-rent'] = views.payRent;
  views['my-requests'] = views.myRequests;
  views['tenants-platform'] = views.tenantsPlatform;
  views['propertyDetail'] = views.propertyDetail;
  // properties detail routing
  const _properties = views.properties;
  views.properties = (arg) => arg ? views.propertyDetail(arg) : _properties();

  /* ---------- shared widgets ---------- */
  function stat(label, value, sub, delta) {
    return `<div class="stat"><div class="label">${label}</div><div class="value">${value}</div>${sub?`<div class="muted" style="font-size:11px;margin-top:2px">${sub}</div>`:''}${delta?`<div class="delta ${delta}">${delta==='up'?'▲':'▼'} vs last period</div>`:''}</div>`;
  }
  function barChart(vals) {
    const max = Math.max(...vals);
    return `<div class="barchart">${vals.map(v=>`<div class="bc-col"><div class="bc-bar" style="height:${v/max*100}%"></div><span>${v}</span></div>`).join('')}</div>`;
  }
  function permMatrix() {
    const caps = ['Properties','Leases','Payments','Maintenance','Legal','Finance','Audit'];
    const data = {
      'Company Admin':['CRUD','CRUD/A','R','R','R','R','R'],
      'Property Mgr':['RU(O)','CRU(O)','R(O)','CRUD(O)','R(O)','R(O)','—'],
      'Owner':['R(O)','R(O)','R(O)','R(O)','R(O)','R(O)','—'],
      'Tenant':['—','R(S)','C(S)','CRU(S)','R','—','—'],
      'Accountant':['R','R','CRUD','R','—','CRUD','R(fin)'],
      'Legal':['R','R','—','—','CRUD/A','—','R(leg)'],
    };
    return `<div class="card pad-0" style="overflow:auto"><table class="tbl matrix"><thead><tr><th>Role</th>${caps.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>
      ${Object.entries(data).map(([role,vals])=>`<tr><td><b>${role}</b></td>${vals.map(v=>`<td class="${v==='—'?'muted':''}">${v}</td>`).join('')}</tr>`).join('')}
    </tbody></table></div>`;
  }

  /* ============================================================
     ROLE DASHBOARDS (§14.4)
     ============================================================ */
  const dashboards = {
    default: () => dashboards.company_admin(),
    company_admin() {
      const totalIncome = KP.properties.reduce((s,p)=>s+p.incomeMtd,0);
      return pageH(`Good morning, Emeka`, 'Company Admin · whole-tenant view')
        + `<div class="grid stats-4" style="margin-bottom:20px">
            ${stat('Portfolio income (MTD)', money(totalIncome), null,'up')}
            ${stat('Collection rate', KP.finance.collectionRate+'%', null,'up')}
            ${stat('Occupancy', '86%', '113 / 132 units','up')}
            ${stat('Open maintenance', KP.maintenance.filter(m=>m.status!=='completed').length, '1 emergency','down')}</div>`
        + `<div class="grid" style="grid-template-columns:2fr 1fr;margin-bottom:20px">
            <div class="card"><div class="card-h"><h3>Rent collection — 6 months</h3><span class="badge green">▲ 4.2%</span></div>${barChart([72,78,81,84,83,87])}</div>
            <div class="card"><div class="card-h"><h3>Needs attention</h3></div>
              ${attn('🚨','Emergency maintenance','Water leak · A-1205 · SLA today','#maintenance')}
              ${attn('⚖️','Eviction hearing','C-0402 · in 9 days','#legal')}
              ${attn('✍️','Lease awaiting signature','LSE-8850 · Amara Nwosu','#leases')}
              ${attn('₦','Overdue invoice','INV-5490 · ₦41M','#rent')}
            </div></div>`
        + twoColLists();
    },
    prop_mgr() {
      return pageH('Good morning, Ngozi', 'Property Manager · 3 assigned properties')
        + `<div class="grid stats-4" style="margin-bottom:20px">
            ${stat('Occupancy', '86%', 'assigned properties','up')}
            ${stat('Arrears', money(KP.finance.arrears), '2 tenants','down')}
            ${stat('Maintenance SLA', '92%', 'on-time','up')}
            ${stat('Renewals ≤60d', 3)}</div>`
        + `<div class="grid" style="grid-template-columns:1fr 1fr;margin-bottom:20px">
            <div class="card"><div class="card-h"><h3>Maintenance by status</h3><a class="muted" href="#maintenance">Open board →</a></div>${maintFunnel()}</div>
            <div class="card"><div class="card-h"><h3>Arrears watch</h3></div>${KP.tenants.filter(t=>t.balance>0).map(t=>`<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--border)"><div class="row gap"><span class="avatar">${fmt.initials(t.name)}</span><div><b>${t.name}</b><div class="muted" style="font-size:11px">${t.unit}</div></div></div><b style="color:var(--error)">${money(t.balance)}</b></div>`).join('')}</div>
          </div>` + twoColLists();
    },
    con_pm() {
      const p = KP.projects[0];
      return pageH('Good morning, Tunde', 'Construction PM · 2 assigned projects')
        + `<div class="grid stats-4" style="margin-bottom:20px">
            ${stat('Palm Ridge progress', p.progress+'%', 'on track','up')}
            ${stat('Budget used', Math.round(p.spent/p.budget*100)+'%')}
            ${stat('Open RFIs', KP.projects.reduce((s,x)=>s+x.rfisOpen,0))}
            ${stat('Daily reports', '3', 'today')}</div>`
        + `<div class="card" style="margin-bottom:20px"><div class="card-h"><h3>Project timeline</h3></div>${KP.projects.map(pr=>`<div style="margin-bottom:16px"><div class="row between" style="font-size:13px;margin-bottom:6px"><b>${pr.name}</b><span class="muted">${pr.progress}% · due ${fmt.date(pr.due)}</span></div><div class="bar ${pr.status==='At risk'?'amber':''}" style="height:10px"><span style="width:${pr.progress}%"></span></div></div>`).join('')}</div>`
        + `<div class="card"><div class="card-h"><h3>Today's site reports</h3><a class="muted" href="#construction">All reports →</a></div><table class="tbl"><tbody>${KP.dailyReports.map(d=>`<tr><td class="mono">${d.id}</td><td>${d.project}</td><td>${d.work}</td><td>${pill('📷 '+d.photos,'blue')}</td></tr>`).join('')}</tbody></table></div>`;
    },
    owner() {
      const owned = KP.properties.filter(p=>p.ownerName.includes('Adeyemi'));
      const inc = owned.reduce((s,p)=>s+p.incomeMtd,0), exp = owned.reduce((s,p)=>s+p.expenseMtd,0);
      return pageH('Welcome, Mr & Mrs Adeyemi', 'Property Owner · read-only portfolio view')
        + `<div class="grid stats-4" style="margin-bottom:20px">
            ${stat('Portfolio value', '₦4.2B')}
            ${stat('Income (MTD)', money(inc),null,'up')}
            ${stat('Expenses (MTD)', money(exp))}
            ${stat('Net (MTD)', money(inc-exp),null,'up')}</div>`
        + `<div class="card-h"><h3>My properties</h3><button class="btn sm" onclick="KP.toast('Owner statement PDF (US-OWN-01)')">📄 Statement</button></div>`
        + `<div class="grid stats-3" style="margin-bottom:8px">${owned.map(p=>`<div class="card"><div class="hero sm" style="background:${p.img}"></div><b style="display:block;margin-top:10px">${p.name}</b><div class="muted" style="font-size:12px">${p.city}</div><div class="grid" style="grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"><div><div class="muted" style="font-size:11px">Occupancy</div><b>${Math.round(p.occupied/p.units*100)}%</b></div><div><div class="muted" style="font-size:11px">Net (MTD)</div><b>${money(p.incomeMtd-p.expenseMtd)}</b></div></div></div>`).join('')}</div>`;
    },
    tenant() {
      const inv = KP.invoices[0];
      return pageH('Hi Bola', 'Konkere Heights · A-1204')
        + `<div class="grid" style="grid-template-columns:1.3fr 1fr 1fr;margin-bottom:20px">
            <div class="card" style="border-color:var(--brand);background:linear-gradient(180deg,var(--brand-soft),transparent)"><div class="muted" style="font-size:12px">Rent due</div><div style="font-size:30px;font-weight:700;margin:6px 0">${money(inv.amount)}</div><div class="muted" style="font-size:12px">${inv.period} · due ${fmt.date(inv.due)}</div><button class="btn primary" style="margin-top:14px;width:100%;justify-content:center" onclick="location.hash='pay-rent'">Pay now</button></div>
            <div class="card center col" style="text-align:center"><div class="muted" style="font-size:12px">Lease ends in</div><div style="font-size:32px;font-weight:700">396d</div><a class="btn ghost sm" href="#my-lease" style="margin-top:8px">View lease</a></div>
            <div class="card center col" style="text-align:center"><div class="muted" style="font-size:12px">Open requests</div><div style="font-size:32px;font-weight:700">1</div><a class="btn ghost sm" href="#my-requests" style="margin-top:8px">Maintenance</a></div>
          </div>`
        + `<div class="grid" style="grid-template-columns:1fr 1fr">
            <div class="card"><div class="card-h"><h3>Recent receipts</h3></div>${['INV-5475 · 2025 Annual · ₦1.5M','INV-5320 · 2024 Annual · ₦1.4M'].map(r=>`<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--border)"><span>${r}</span><button class="btn ghost sm" onclick="KP.toast('Receipt PDF')">↓ PDF</button></div>`).join('')}</div>
            <div class="card"><div class="card-h"><h3>Messages</h3><a class="muted" href="#comms">Open →</a></div>${attn('✉','Property Management','Receipt INV-5501 is in your portal','#comms')}${attn('⚒','CoolAir Ltd','Technician arriving tomorrow 10am','#comms')}</div>
          </div>`;
    },
    legal() {
      return pageH('Good morning, Chika', 'Legal · in-house counsel')
        + `<div class="grid stats-4" style="margin-bottom:20px">${stat('Open cases',KP.cases.filter(c=>c.status!=='closed').length)}${stat('Hearings ≤14d',2,null,'down')}${stat('Evictions',KP.cases.filter(c=>c.type==='Eviction').length)}${stat('Notices pending',1)}</div>`
        + `<div class="card-h"><h3>Upcoming hearings & deadlines</h3><a class="muted" href="#legal">All cases →</a></div>`
        + `<div class="card pad-0"><table class="tbl"><thead><tr><th>Case</th><th>Type</th><th>Party</th><th>Status</th><th>Next date</th></tr></thead><tbody>${KP.cases.filter(c=>c.nextDate!=='—').map(c=>`<tr><td class="mono">${c.id} · ${c.title}</td><td>${pill(c.type,c.type==='Eviction'?'red':'blue')}</td><td>${c.party}</td><td>${statusBadge(c.status)}</td><td>${fmt.date(c.nextDate)}</td></tr>`).join('')}</tbody></table></div>`;
    },
    accountant() {
      const f = KP.finance;
      return pageH('Good morning, Ifeoma', 'Accountant · financial operations')
        + `<div class="grid stats-4" style="margin-bottom:20px">${stat('Cash position',money(f.cashPosition),null,'up')}${stat('Collection rate',f.collectionRate+'%',null,'up')}${stat('Vendor payable',money(f.vendorPayable))}${stat('Reconciliation','2 unmatched',null,'down')}</div>`
        + `<div class="grid" style="grid-template-columns:1fr 1fr">
            <div class="card"><div class="card-h"><h3>Invoices to action</h3><a class="muted" href="#rent">Rent →</a></div>${KP.invoices.filter(i=>i.status!=='paid').map(i=>`<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--border)"><div><b>${i.id}</b> · ${i.tenant}<div class="muted" style="font-size:11px">${i.period} · due ${fmt.date(i.due)}</div></div>${statusBadge(i.status)}</div>`).join('')}</div>
            <div class="card"><div class="card-h"><h3>Vendor payments</h3><a class="muted" href="#finance">Finance →</a></div>${f.expenses.map(e=>`<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--border)"><div><b>${e.vendor}</b><div class="muted" style="font-size:11px">${e.category}</div></div><div style="text-align:right"><b>${money(e.amount)}</b><div>${statusBadge(e.status)}</div></div></div>`).join('')}</div>
          </div>`;
    },
    super_admin() {
      return pageH('Platform Operations', 'Super Admin · Sade · platform-wide')
        + `<div class="grid stats-4" style="margin-bottom:20px">${stat('Tenants',KP.saasTenants.length,null,'up')}${stat('Active tenants',KP.saasTenants.filter(t=>t.status==='active').length)}${stat('Total MRR',money(KP.saasTenants.reduce((s,t)=>s+t.mrr,0)),null,'up')}${stat('Uptime','99.97%','30-day')}</div>`
        + `<div class="grid" style="grid-template-columns:1fr 1fr">
            <div class="card"><div class="card-h"><h3>Tenants</h3><a class="muted" href="#tenants-platform">Manage →</a></div>${KP.saasTenants.map(t=>`<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--border)"><div><b>${t.name}</b><div class="muted" style="font-size:11px">${t.plan} · ${t.region}</div></div>${statusBadge(t.status)}</div>`).join('')}</div>
            <div class="card"><div class="card-h"><h3>Platform audit — recent</h3><a class="muted" href="#audit">All →</a></div>${KP.audit.slice(0,4).map(a=>`<div class="row between" style="padding:9px 0;border-bottom:1px solid var(--border)"><div><code class="code">${a.action}</code> <span class="muted" style="font-size:11px">${a.entity}</span>${a.flag?' '+pill('flagged','red'):''}</div><span class="muted" style="font-size:11px">${a.time.split(' ')[1]}</span></div>`).join('')}</div>
          </div>`;
    },
  };

  function attn(ic, title, sub, href) {
    return `<a class="attn" href="${href}"><span class="attn-ic">${ic}</span><div><b>${title}</b><div class="muted" style="font-size:12px">${sub}</div></div><span class="muted">→</span></a>`;
  }
  function maintFunnel() {
    const counts = { open:0, assigned:0, in_progress:0, completed:0 };
    KP.maintenance.forEach(m=>{const k=m.status==='on_hold'?'assigned':m.status;counts[k]=(counts[k]||0)+1;});
    const max = Math.max(...Object.values(counts),1);
    return Object.entries(counts).map(([k,v])=>`<div style="margin-bottom:10px"><div class="row between" style="font-size:12px;margin-bottom:4px"><span>${k.replace('_',' ')}</span><b>${v}</b></div><div class="bar"><span style="width:${v/max*100}%"></span></div></div>`).join('');
  }
  function twoColLists() {
    return `<div class="grid" style="grid-template-columns:1fr 1fr">
      <div class="card"><div class="card-h"><h3>Lease renewals ≤60 days</h3><a class="muted" href="#leases">All →</a></div>
        ${KP.leases.filter(l=>l.status==='active').slice(0,3).map(l=>`<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--border)"><div><b>${l.tenant}</b><div class="muted" style="font-size:11px">${l.unit} · ends ${fmt.date(l.end)}</div></div><button class="btn ghost sm" onclick="KP.toast('Renewal triggered')">Renew</button></div>`).join('')}</div>
      <div class="card"><div class="card-h"><h3>Recent activity</h3></div>
        ${KP.audit.slice(0,4).map(a=>`<div class="row gap" style="padding:9px 0;border-bottom:1px solid var(--border)"><span class="avatar" style="width:26px;height:26px;font-size:10px">${fmt.initials(a.actor)}</span><div style="font-size:12px"><b>${a.actor.split('(')[0]}</b> <code class="code">${a.action}</code> ${a.entity}</div></div>`).join('')}</div>
    </div>`;
  }

  /* ============================================================
     FLOWS (modals)
     ============================================================ */
  KP.leaseWizard = function () {
    let step = 0;
    const steps = ['Parties','Unit','Term & rent','Deposit & clauses','Review'];
    function render() {
      const body = [
        `<div class="field"><label>Tenant party</label><input class="input" value="Kunle Bright" placeholder="Search tenant…"></div><div class="field" style="margin-top:12px"><label>Guarantor</label><input class="input" placeholder="Optional"></div>`,
        `<div class="field"><label>Unit</label><select class="select"><option>A-1207 · Konkere Heights · 1 bed (available)</option></select></div>`,
        `<div class="grid" style="grid-template-columns:1fr 1fr;gap:12px"><div class="field"><label>Start date</label><input class="input" value="2026-07-15"></div><div class="field"><label>End date</label><input class="input" value="2027-07-14"></div><div class="field"><label>Annual rent (₦)</label><input class="input" value="780,000"></div><div class="field"><label>Cadence</label><select class="select"><option>Annual</option><option>Biannual</option><option>Monthly</option></select></div></div>`,
        `<div class="grid" style="grid-template-columns:1fr 1fr;gap:12px"><div class="field"><label>Deposit (₦)</label><input class="input" value="780,000"></div><div class="field"><label>Escalation cap %</label><input class="input" value="7"></div></div><div class="field" style="margin-top:12px"><label>Clauses</label><textarea class="input" rows="3">Standard residential clauses; 5-day grace; late fee per policy.</textarea></div>`,
        `<div class="review"><div class="kv"><span>Tenant</span><b>Kunle Bright</b></div><div class="kv"><span>Unit</span><b>A-1207 · Konkere Heights</b></div><div class="kv"><span>Term</span><b>15 Jul 2026 → 14 Jul 2027</b></div><div class="kv"><span>Rent</span><b>₦780,000 / year</b></div><div class="kv"><span>Deposit</span><b>₦780,000</b></div><div class="muted" style="font-size:12px;margin-top:12px">On send: enters approval → e-signature (DocuSign) → active (§15.1). Draft is saved at each step.</div></div>`,
      ][step];
      modal(`<div class="modal wide"><div class="modal-h"><h3>New lease — ${steps[step]}</h3><button class="btn ghost sm" onclick="KP.closeModal()">✕</button></div>
        <div class="stepper">${steps.map((s,i)=>`<div class="step ${i===step?'active':''} ${i<step?'done':''}"><span class="n">${i<step?'✓':i+1}</span>${s}</div>`).join('')}</div>
        <div class="modal-b">${body}</div>
        <div class="modal-f"><button class="btn" ${step===0?'disabled':''} id="lw-back">Back</button><button class="btn primary" id="lw-next">${step===steps.length-1?'Send for signature':'Continue'}</button></div></div>`);
      $('#lw-back').onclick = () => { if (step>0){step--;render();} };
      $('#lw-next').onclick = () => { if (step<steps.length-1){step++;render();} else {closeModal();toast('Lease sent for signature (DocuSign) ✓','green');} };
    }
    render();
  };

  KP.maintRequest = function () {
    let step = 0;
    const steps = ['Category','Describe','Photos','Availability'];
    function render() {
      const body = [
        `<div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">${['🔧 Plumbing','⚡ Electrical','❄️ HVAC','🚪 Doors/Windows','🎨 Painting','🔑 Other'].map((c,i)=>`<label class="pay-opt ${i===2?'sel':''}"><input type="radio" name="cat" ${i===2?'checked':''}><span>${c}</span></label>`).join('')}</div>`,
        `<div class="field"><label>What's the issue?</label><textarea class="input" rows="4" placeholder="Describe the problem…">AC in master bedroom not cooling.</textarea></div><div class="field" style="margin-top:12px"><label>Priority</label><select class="select"><option>Medium</option><option>High</option><option>Emergency</option></select></div>`,
        `<div class="uploader"><div class="up-drop">📷 Tap to add photos<br><span class="muted" style="font-size:11px">Geo + time-stamped (MOB-3)</span></div><div class="up-thumbs"><span class="up-thumb">🖼</span><span class="up-thumb">🖼</span></div></div>`,
        `<div class="field"><label>Best time for access</label><select class="select"><option>Weekday mornings</option><option>Weekday afternoons</option><option>Weekends</option></select></div><div class="muted" style="font-size:12px;margin-top:12px">You'll get status updates in-app and can message the technician.</div>`,
      ][step];
      modal(`<div class="modal"><div class="modal-h"><h3>New maintenance request</h3><button class="btn ghost sm" onclick="KP.closeModal()">✕</button></div>
        <div class="stepper sm">${steps.map((s,i)=>`<div class="step ${i===step?'active':''} ${i<step?'done':''}"><span class="n">${i<step?'✓':i+1}</span>${s}</div>`).join('')}</div>
        <div class="modal-b">${body}</div>
        <div class="modal-f"><button class="btn" ${step===0?'disabled':''} id="mr-back">Back</button><button class="btn primary" id="mr-next">${step===steps.length-1?'Submit request':'Continue'}</button></div></div>`);
      $('#mr-back').onclick = () => { if(step>0){step--;render();} };
      $('#mr-next').onclick = () => { if(step<steps.length-1){step++;render();} else {closeModal();toast('Maintenance request submitted ✓','green');} };
    }
    render();
  };

  KP.payFlow = function () {
    modal(`<div class="modal"><div class="modal-h"><h3>Confirm payment</h3><button class="btn ghost sm" onclick="KP.closeModal()">✕</button></div>
      <div class="modal-b center col" style="text-align:center;padding:30px 24px">
        <div id="pay-spin" class="spinner"></div>
        <div id="pay-msg" style="margin-top:16px;font-weight:600">Processing via Paystack…</div>
        <div class="muted" style="font-size:12px;margin-top:6px">Idempotency-Key ensures no double charge (BR-04)</div>
      </div></div>`);
    setTimeout(() => {
      const el = $('#pay-spin'); if (!el) return;
      el.outerHTML = '<div class="pay-check">✓</div>';
      $('#pay-msg').textContent = 'Payment successful — receipt ready';
      setTimeout(() => { closeModal(); toast('Rent paid · receipt INV-5501 generated ✓','green'); location.hash='dashboard'; }, 1100);
    }, 1600);
  };

  /* ---------- boot ---------- */
  window.addEventListener('hashchange', route);
  renderShell();
  route();
})();
