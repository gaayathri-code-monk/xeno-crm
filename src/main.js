import './styles/main.css';

import { shoppers, SEGS, makeInitialCampaigns } from './data/shoppers.js';
import { dispatch, onReceipt } from './utils/channelService.js';
import { setApiKey, getApiKey } from './utils/aiService.js';
import { notify, showModal, closeModalFn, fmt } from './utils/ui.js';

import { renderDashboard, renderKPIs, renderPipeStats, renderCallbackFeed, renderDashCampaignTable } from './components/Dashboard.js';
import { renderShoppers, renderSegments, renderCampaigns, renderAnalytics } from './components/Pages.js';
import { renderCompose, aiWrite, aiPickSeg, renderAgent, renderChat, renderAgentActivity, sendChat, openIngest, openSegBuilder, buildSeg } from './components/Composer.js';

// ── App State ─────────────────────────────────────────
const state = {
  shoppers,
  campaigns:      makeInitialCampaigns(),
  comms:          [],
  callbacks:      [],
  agentActivity:  [],
  chatHistory:    [],
  selectedSeg:    's1',
  campFilter:     '',
};

// ── Sidebar HTML ──────────────────────────────────────
function buildSidebar() {
  return `
    <aside class="sidebar">
      <div class="s-logo">
        <div class="s-mark">X</div>
        <div><div class="s-name">Xeno CRM</div><div class="s-tag">AI-Native Platform</div></div>
      </div>
      <nav>
        <div class="nav-sec">Overview</div>
        <div class="ni active" data-page="dashboard"><span class="ni-ic">◈</span>Dashboard</div>
        <div class="nav-sec">Shoppers</div>
        <div class="ni" data-page="shoppers"><span class="ni-ic">◉</span>All Shoppers</div>
        <div class="ni" data-page="segments"><span class="ni-ic">◎</span>Segments<span class="nbadge" id="nb-seg">6</span></div>
        <div class="nav-sec">Campaigns</div>
        <div class="ni" data-page="campaigns"><span class="ni-ic">◈</span>Campaigns<span class="nbadge" id="nb-camp">3</span></div>
        <div class="ni" data-page="compose"><span class="ni-ic">✦</span>AI Composer</div>
        <div class="nav-sec">Intelligence</div>
        <div class="ni" data-page="agent"><span class="ni-ic">⬡</span>AI Agent</div>
        <div class="ni" data-page="analytics"><span class="ni-ic">◇</span>Analytics</div>
      </nav>
      <div class="s-foot"><div class="pulse-dot"></div><span>Channel service active</span></div>
    </aside>`;
}

// ── Main HTML ─────────────────────────────────────────
function buildMain() {
  return `
    <main class="main">
      <div class="topbar">
        <div>
          <div class="pg-title" id="pt">Dashboard</div>
          <div class="pg-sub"   id="ps">Welcome back — your brand at a glance</div>
        </div>
        <div class="flex g8 fac">
          <button class="btn" id="btn-ingest">⬆ Ingest Data</button>
          <button class="btn primary" id="btn-new-camp">✦ New Campaign</button>
        </div>
      </div>
      <div class="content">
        ${buildPages()}
      </div>
    </main>`;
}

function buildPages() {
  return `
    <!-- DASHBOARD -->
    <div class="page active" id="page-dashboard">
      <div class="g4" id="kpi-grid"></div>
      <div class="g2 mb20">
        <div class="card">
          <div class="flex fac fjb mb16"><div class="card-title">Channel Delivery Rates</div><span class="badge running">⬤ Live</span></div>
          <div style="position:relative;height:196px;"><canvas id="chanChart" role="img" aria-label="Delivery rates by channel">Chart</canvas></div>
        </div>
        <div class="card">
          <div class="card-title mb14">Live Message Pipeline</div>
          <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:16px;">
            <div style="font-size:9.5px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.12em;margin-bottom:14px;">Async Callback Loop</div>
            <div class="flow-row">
              <div class="flow-node"><div class="flow-icon" style="background:var(--vd);">📣</div><div class="flow-label">CRM<br>Send</div></div>
              <div class="flow-pipe"><div class="flow-pulse"></div></div>
              <div class="flow-node"><div class="flow-icon" style="background:var(--fuchsia-d);">📡</div><div class="flow-label">Channel<br>Service</div></div>
              <div class="flow-pipe"><div class="flow-pulse fp2"></div></div>
              <div class="flow-node"><div class="flow-icon" style="background:var(--gold-d);">📬</div><div class="flow-label">Shopper<br>Device</div></div>
              <div class="flow-pipe"><div class="flow-pulse fp3"></div></div>
              <div class="flow-node"><div class="flow-icon" style="background:rgba(255,255,255,.04);">↩️</div><div class="flow-label">Receipt<br>Callback</div></div>
            </div>
            <div id="pipe-stats" class="flex g16 mt14" style="flex-wrap:wrap;font-size:11px;"></div>
          </div>
          <div class="mt14">
            <div class="small bold muted mb8" style="text-transform:uppercase;letter-spacing:.06em;font-size:10px;">Recent Receipts</div>
            <div id="cb-feed" style="max-height:130px;overflow-y:auto;font-size:11px;display:flex;flex-direction:column;gap:3px;"></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="flex fac fjb mb14">
          <div class="card-title">Active Campaigns</div>
          <button class="btn sm" id="btn-view-all">View All →</button>
        </div>
        <div class="tw" id="dash-table"></div>
      </div>
    </div>

    <!-- SHOPPERS -->
    <div class="page" id="page-shoppers">
      <div class="flex g8 mb16 fac">
        <input type="text" id="sh-search" placeholder="Search by name, email, city…" style="max-width:320px;" oninput="window._renderShoppers()">
        <select id="sh-filter" onchange="window._renderShoppers()" style="max-width:160px;">
          <option value="">All Shoppers</option>
          <option value="champion">Champions</option>
          <option value="high-value">High Value</option>
          <option value="loyal">Loyal</option>
          <option value="at-risk">At Risk</option>
          <option value="dormant">Dormant</option>
          <option value="new">New</option>
        </select>
        <div class="muted small" id="sh-count" style="margin-left:auto;"></div>
      </div>
      <div class="card"><div class="tw" id="sh-table"></div></div>
    </div>

    <!-- SEGMENTS -->
    <div class="page" id="page-segments">
      <div class="flex fac fjb mb16">
        <div id="seg-chips" class="flex g8" style="flex-wrap:wrap;"></div>
        <button class="btn primary" id="btn-seg-builder">✦ AI Segment Builder</button>
      </div>
      <div id="seg-detail"></div>
    </div>

    <!-- CAMPAIGNS -->
    <div class="page" id="page-campaigns">
      <div class="flex fac fjb mb16">
        <div id="camp-filter" class="flex g8"></div>
        <button class="btn primary" id="btn-new-camp2">+ New Campaign</button>
      </div>
      <div class="card"><div class="tw" id="camp-table"></div></div>
    </div>

    <!-- COMPOSE -->
    <div class="page" id="page-compose">
      <div class="g2" style="align-items:start;">
        <div>
          <div class="card mb16">
            <div class="card-title mb4">Campaign Setup</div>
            <div class="card-sub mb18">Configure your outreach</div>
            <div class="fg"><label>Campaign Name</label><input type="text" id="cn-name" placeholder="e.g. Summer Win-Back 2026"></div>
            <div class="fg"><label>Target Segment</label><select id="cn-seg"><option value="">Select segment…</option></select></div>
            <div class="fg"><label>Channel</label>
              <select id="cn-chan">
                <option value="WhatsApp">💬 WhatsApp</option>
                <option value="SMS">📱 SMS</option>
                <option value="Email">✉️ Email</option>
                <option value="RCS">📡 RCS</option>
              </select>
            </div>
            <div class="fg"><label>Message</label><textarea id="cn-msg" placeholder="Write a message or use AI Composer →"></textarea></div>
            <button class="btn primary w100" id="btn-launch">🚀 Launch Campaign</button>
          </div>
        </div>
        <div>
          <div class="api-banner">
            <span>🔑</span>
            <input type="password" id="api-key-input" placeholder="Paste Anthropic API key for live AI (optional)">
            <button class="btn sm" id="btn-save-key">Save</button>
          </div>
          <div class="ai-panel mb16">
            <div class="ai-badge">✦ AI Message Writer</div>
            <div class="fg">
              <label>Describe your campaign goal</label>
              <textarea id="ai-goal" placeholder='e.g. "Win back shoppers who haven\'t bought in 60 days with a summer offer"' style="min-height:68px;"></textarea>
            </div>
            <button class="btn primary w100" id="ai-write-btn">✦ Generate Message</button>
            <div id="ai-write-res" class="mt12"></div>
          </div>
          <div class="ai-panel">
            <div class="ai-badge">◎ Smart Segment Picker</div>
            <div class="card-sub mb12">AI recommends the best audience for your goal</div>
            <button class="btn w100" id="ai-seg-btn">Suggest Best Segment</button>
            <div id="ai-seg-res" class="mt10"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- AGENT -->
    <div class="page" id="page-agent">
      <div style="display:grid;grid-template-columns:1fr 320px;gap:16px;height:calc(100vh - 116px);">
        <div class="card" style="display:flex;flex-direction:column;padding:0;overflow:hidden;">
          <div style="padding:16px 22px;border-bottom:1px solid var(--border);background:var(--bg2);">
            <div class="flex fac g8">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#8B5CF6,#D946EF);display:flex;align-items:center;justify-content:center;font-size:16px;">🤖</div>
              <div><div class="card-title">Xeno AI Agent</div><div class="card-sub">Natural language campaign orchestration</div></div>
              <span class="badge delivered" style="margin-left:auto;">⬤ Online</span>
            </div>
          </div>
          <div class="chat-msgs" id="chat-msgs"></div>
          <div class="chat-input-row">
            <input type="text" id="chat-in" placeholder='Try: "Launch a win-back campaign for dormant shoppers"' onkeydown="if(event.key==='Enter')window._sendChat()">
            <button class="btn primary" id="btn-send-chat">Send →</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;overflow-y:auto;">
          <div class="api-banner" style="margin-bottom:0;">
            <span>🔑</span>
            <input type="password" id="api-key-agent" placeholder="Anthropic API key for live AI">
            <button class="btn sm" id="btn-save-key-agent">Save</button>
          </div>
          <div class="card">
            <div class="card-title mb12">Quick Prompts</div>
            <div id="agent-prompts" style="display:flex;flex-direction:column;gap:6px;"></div>
          </div>
          <div class="card">
            <div class="card-title mb12">Agent Activity</div>
            <div id="agent-act" style="font-size:11px;display:flex;flex-direction:column;gap:7px;max-height:260px;overflow-y:auto;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ANALYTICS -->
    <div class="page" id="page-analytics">
      <div class="g4 mb20" id="ana-kpis"></div>
      <div class="g2 mb16">
        <div class="card"><div class="card-title mb14">Conversion Funnel</div><div id="funnel"></div></div>
        <div class="card">
          <div class="card-title mb14">Revenue by Campaign</div>
          <div style="position:relative;height:200px;"><canvas id="revChart" role="img" aria-label="Revenue per campaign">Chart</canvas></div>
        </div>
      </div>
      <div class="card"><div class="card-title mb14">Performance Matrix</div><div class="tw" id="ana-table"></div></div>
    </div>`;
}

// ── Page metadata ─────────────────────────────────────
const PAGE_META = {
  dashboard: ['Dashboard',    'Welcome back — your brand at a glance'],
  shoppers:  ['Shoppers',     'Browse and filter your shopper base'],
  segments:  ['Segments',     'Smart audience groups for targeted outreach'],
  campaigns: ['Campaigns',    'Track, manage and analyse all campaigns'],
  compose:   ['AI Composer',  'Build intelligent campaigns with AI assistance'],
  agent:     ['AI Agent',     'Natural language campaign orchestration'],
  analytics: ['Analytics',    'Deep performance insights across campaigns'],
};

// ── Navigation ────────────────────────────────────────
function navTo(page) {
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('active'));
  const el = document.querySelector(`[data-page="${page}"]`);
  if (el) el.classList.add('active');

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  const [title, sub] = PAGE_META[page] || [page, ''];
  document.getElementById('pt').textContent = title;
  document.getElementById('ps').textContent = sub;

  if (page === 'dashboard') renderDashboard(state);
  if (page === 'shoppers')  renderShoppers(state);
  if (page === 'segments')  renderSegments(state);
  if (page === 'campaigns') renderCampaigns(state, doSendCampaign);
  if (page === 'compose')   renderCompose();
  if (page === 'agent')     renderAgent(state);
  if (page === 'analytics') renderAnalytics(state);
}

// ── Campaign send logic ───────────────────────────────
function doSendCampaign(campId) {
  const camp = state.campaigns.find(c => c.id === campId);
  if (!camp) return;
  const seg  = SEGS.find(s => s.id === camp.seg);
  if (!seg)  return;

  const targets = shoppers.filter(seg.f);
  camp.sent   = targets.length;
  camp.status = 'running';

  targets.forEach((sh, i) => {
    const cid = `m-${campId}-${sh.id}`;
    state.comms.push({ id: cid, campId, shopperName: sh.name, status: 'sent', channel: camp.chan });
    state.agentActivity.unshift({ t: new Date().toLocaleTimeString(), txt: `📤 ${sh.name.split(' ')[0]} via ${camp.chan}` });
    if (state.agentActivity.length > 30) state.agentActivity.pop();
    setTimeout(() => dispatch(cid, camp.chan), i * 70);
  });

  notify('🚀', 'Campaign Launched', `${camp.name} → ${targets.length} shoppers`, 'violet');
  document.getElementById('nb-camp').textContent = state.campaigns.length;
}

// ── Receipt handler (from channel service) ────────────
onReceipt((commId, status, chan) => {
  const c = state.comms.find(x => x.id === commId);
  if (!c) return;
  c.status = status;

  const camp = state.campaigns.find(x => x.id === c.campId);
  if (camp) {
    if (status === 'delivered') camp.delivered++;
    else if (status === 'failed')    camp.failed++;
    else if (status === 'opened')    camp.opened++;
    else if (status === 'read')      camp.read++;
    else if (status === 'clicked')   camp.clicked++;
    else if (status === 'converted') { camp.conv++; camp.rev += Math.round(1800 + Math.random() * 9000); }
  }

  state.callbacks.unshift({ t: new Date().toLocaleTimeString('en-IN'), id: commId, status, chan });
  if (state.callbacks.length > 60) state.callbacks.pop();

  // Refresh active page
  const active = document.querySelector('.page.active')?.id?.replace('page-', '');
  if (active === 'dashboard') { renderKPIs(state); renderPipeStats(state); renderCallbackFeed(state); renderDashCampaignTable(state); }
  if (active === 'campaigns') renderCampaigns(state);
  if (active === 'analytics') renderAnalytics(state);
});

// ── Launch new campaign from compose form ─────────────
function doLaunchCampaign() {
  const name  = (document.getElementById('cn-name')  || { value: '' }).value.trim();
  const segId = (document.getElementById('cn-seg')   || { value: '' }).value;
  const chan  = (document.getElementById('cn-chan')   || { value: 'WhatsApp' }).value;
  const msg   = (document.getElementById('cn-msg')   || { value: '' }).value.trim();

  if (!name)  { notify('⚠️', 'Missing Name',    'Enter a campaign name',         'gold'); return; }
  if (!segId) { notify('⚠️', 'No Segment',      'Choose a target segment',       'gold'); return; }
  if (!msg)   { notify('⚠️', 'No Message',      'Write or generate a message',   'gold'); return; }

  const camp = {
    id: 'c' + Date.now(), name, seg: segId, chan, msg,
    status: 'draft', sent: 0, delivered: 0, failed: 0,
    opened: 0, read: 0, clicked: 0, conv: 0, rev: 0,
    created: new Date().toLocaleDateString('en-IN'),
  };
  state.campaigns.push(camp);
  notify('✓', 'Campaign Created', `${name} is live`, 'teal');
  navTo('campaigns');
  setTimeout(() => doSendCampaign(camp.id), 400);
}

// ── Global bridge (for inline onclick handlers) ───────
window._navTo          = navTo;
window._pickSeg        = (id) => { state.selectedSeg = id; renderSegments(state); };
window._launchSegCamp  = (segId) => { navTo('compose'); setTimeout(() => { const s = document.getElementById('cn-seg'); if (s) s.value = segId; }, 120); };
window._setCampFilter  = (f) => { state.campFilter = f; renderCampaigns(state); };
window._sendCampaign   = doSendCampaign;
window._renderShoppers = () => renderShoppers(state);
window._applyMsg       = (msg) => { const el = document.getElementById('cn-msg'); if (el) { el.value = msg.replace(/&#39;/g, "'"); notify('✓', 'Message Applied', 'AI message ready', 'teal'); } };
window._sendChat       = () => sendChat(state);
window._getApiKey      = getApiKey;
window._simulateIngest = () => { closeModalFn(); notify('⬆', 'Ingesting Data', 'Processing…', 'violet'); setTimeout(() => notify('✓', 'Ingest Complete', '60 shoppers · 847 orders · AI-mapped', 'teal'), 2200); };
window._closeModal     = closeModalFn;
window._buildSeg       = buildSeg;

// ── Boot ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Inject HTML
  document.getElementById('app').innerHTML = buildSidebar() + buildMain();

  // Modal close on backdrop click
  document.getElementById('modal-bg').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-bg')) closeModalFn();
  });

  // Nav clicks
  document.querySelectorAll('.ni').forEach(el => {
    el.addEventListener('click', () => navTo(el.dataset.page));
  });

  // Button events
  document.getElementById('app').addEventListener('click', e => {
    const id = e.target.id;
    if (id === 'btn-ingest')        openIngest();
    if (id === 'btn-new-camp' || id === 'btn-new-camp2') navTo('compose');
    if (id === 'btn-view-all')      navTo('campaigns');
    if (id === 'btn-seg-builder')   openSegBuilder();
    if (id === 'btn-launch')        doLaunchCampaign();
    if (id === 'ai-write-btn')      aiWrite();
    if (id === 'ai-seg-btn')        aiPickSeg();
    if (id === 'btn-send-chat')     sendChat(state);
    if (id === 'btn-save-key')      { const v = document.getElementById('api-key-input').value.trim(); if (v) { setApiKey(v); document.getElementById('api-key-agent').value = v; notify('🔑', 'API Key Saved', 'Live AI enabled', 'violet'); } }
    if (id === 'btn-save-key-agent'){ const v = document.getElementById('api-key-agent').value.trim(); if (v) { setApiKey(v); document.getElementById('api-key-input').value = v; notify('🔑', 'API Key Saved', 'Live AI enabled', 'violet'); } }
  });

  // Render initial page
  renderDashboard(state);

  // Auto-launch pre-loaded campaigns
  state.campaigns
    .filter(c => c.status === 'running' && c.sent === 0)
    .forEach((c, i) => setTimeout(() => doSendCampaign(c.id), 1200 + i * 600));
});
