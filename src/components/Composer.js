import { SEGS, shoppers, fmt } from '../data/shoppers.js';
import { callClaude, getFallbackMessage, getFallbackSegment, getFallbackAgentReply } from '../utils/aiService.js';
import { notify, aiSpinner, showModal, closeModalFn } from '../utils/ui.js';

// ── COMPOSE ───────────────────────────────────────────
export function renderCompose() {
  const sel = document.getElementById('cn-seg');
  if (sel) {
    sel.innerHTML = '<option value="">Select segment…</option>' +
      SEGS.map(s => `<option value="${s.id}">${s.icon} ${s.name} (${shoppers.filter(s.f).length} shoppers)</option>`).join('');
  }
}

export async function aiWrite() {
  const goal = (document.getElementById('ai-goal') || { value: '' }).value.trim();
  if (!goal) { notify('⚠️', 'No goal', 'Describe your campaign objective', 'gold'); return; }

  const btn = document.getElementById('ai-write-btn');
  btn.disabled = true; btn.textContent = 'Writing…';
  const res = document.getElementById('ai-write-res');
  res.innerHTML = aiSpinner('AI composing your message…');
  await delay(1200);

  let msg = await callClaude(
    `Campaign goal: ${goal}\nWrite ONE short warm high-converting message. Use {{name}}. Under 160 chars for SMS. Include CTA. Return ONLY the message text.`,
    'You are a CRM copywriter for an Indian D2C fashion brand called StyleCo.'
  ) || getFallbackMessage(goal);

  const safe = msg.replace(/'/g, '&#39;').replace(/\n/g, ' ');
  res.innerHTML = `
    <div style="background:var(--bg4);border:1px solid var(--border3);border-radius:10px;padding:14px 15px;margin-top:4px;">
      <div style="font-size:12px;line-height:1.75;color:var(--pearl);">${msg}</div>
      <div class="mt10 flex g6">
        <button class="btn success sm" onclick="window._applyMsg('${safe}')">✓ Use This Message</button>
      </div>
    </div>`;
  btn.disabled = false; btn.textContent = '✦ Generate Message';
}

export async function aiPickSeg() {
  const goal = (document.getElementById('ai-goal') || { value: '' }).value.trim() || 'general campaign';
  const btn  = document.getElementById('ai-seg-btn');
  btn.disabled = true; btn.textContent = 'Thinking…';
  const res = document.getElementById('ai-seg-res');
  res.innerHTML = aiSpinner();
  await delay(900);

  let seg = null;
  if (window._getApiKey()) {
    const segInfo = SEGS.map(s => `${s.name}: ${s.desc} (${shoppers.filter(s.f).length})`).join(' | ');
    const reply   = await callClaude(
      `Goal:"${goal}". Segments:${segInfo}. JSON:{"name":"exact name","reason":"one sentence"}`,
      'CRM strategist.'
    );
    if (reply) { try { const p = JSON.parse(reply); seg = SEGS.find(s => s.name === p.name); } catch {} }
  }
  if (!seg) seg = getFallbackSegment(goal, SEGS);

  const reason = goal.toLowerCase().includes('win')
    ? 'Highest recovery potential at this stage of the customer lifecycle'
    : 'Best audience engagement rate for this campaign type';

  res.innerHTML = `
    <div style="background:var(--vd);border:1px solid var(--border3);border-radius:10px;padding:13px;margin-top:4px;">
      <div class="bold cv">${seg.icon} ${seg.name}</div>
      <div class="muted small mt8">${reason}</div>
      <button class="btn sm mt10" onclick="document.getElementById('cn-seg').value='${seg.id}'">Apply Segment</button>
    </div>`;
  btn.disabled = false; btn.textContent = 'Suggest Best Segment';
}

// ── AGENT ─────────────────────────────────────────────
const QUICK_PROMPTS = [
  'Launch a win-back campaign for dormant shoppers',
  'Which segment should I target this week?',
  'Draft a summer sale message for champions',
  'Which campaign is performing best?',
  'Recommend the best channel for re-engagement',
];

export function renderAgent(state) {
  const pp = document.getElementById('agent-prompts');
  if (pp) {
    pp.innerHTML = QUICK_PROMPTS.map(p =>
      `<button class="btn sm" style="text-align:left;justify-content:flex-start;font-size:12px;"
         onclick="document.getElementById('chat-in').value='${p}';window._sendChat()">${p}</button>`
    ).join('');
  }
  if (!state.chatHistory.length) {
    state.chatHistory.push({
      role: 'assistant',
      content: `👋 Hi! I'm the **Xeno AI Agent**.\n\nI can help you plan campaigns, identify the right audience, draft messages, and orchestrate outreach — all through conversation.\n\nTry: *"Launch a win-back campaign for dormant shoppers"*\n\n💡 Paste your Anthropic API key above for live AI, or I'll use smart pre-built intelligence.`,
    });
    renderChat(state);
  }
  renderAgentActivity(state);
}

export function renderChat(state) {
  const el = document.getElementById('chat-msgs');
  if (!el) return;
  el.innerHTML = state.chatHistory.map(m =>
    `<div class="chat-msg ${m.role}">
      <div class="ch-av">${m.role === 'user' ? '👤' : '🤖'}</div>
      <div class="bubble ${m.role === 'user' ? 'user' : 'ai'}">
        ${m.content
          .replace(/\n/g, '<br>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')}
      </div>
    </div>`
  ).join('');
  el.scrollTop = el.scrollHeight;
}

export function renderAgentActivity(state) {
  const el = document.getElementById('agent-act');
  if (!el) return;
  el.innerHTML = state.agentActivity.slice(0, 12).map(a =>
    `<div style="display:flex;gap:6px;padding:4px 0;border-bottom:1px solid var(--border);">
      <span class="muted" style="font-size:10px;font-family:monospace;min-width:66px;">${a.t}</span>
      <span>${a.txt}</span>
    </div>`
  ).join('');
}

export async function sendChat(state) {
  const input = document.getElementById('chat-in');
  const msg   = input.value.trim();
  if (!msg) return;
  input.value = '';

  state.chatHistory.push({ role: 'user', content: msg });
  const thinking = { role: 'assistant', content: '<span class="ai-dots"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span></span>' };
  state.chatHistory.push(thinking);
  renderChat(state);

  await delay(900 + Math.random() * 500);

  let reply = null;
  if (window._getApiKey()) {
    const segInfo  = SEGS.map(s => `${s.name}(${shoppers.filter(s.f).length}):${s.desc}`).join(';');
    const campInfo = state.campaigns.map(c => `"${c.name}" ${c.sent}sent,${c.delivered}del,${c.conv}conv,₹${c.rev}rev`).join('|');
    const messages = state.chatHistory
      .filter(m => !m.content.includes('ai-dots'))
      .map(m => ({ role: m.role, content: m.content.replace(/<[^>]+>/g, '') }));
    reply = await callClaude(
      messages[messages.length - 1].content,
      `You are Xeno AI Agent for StyleCo, an Indian D2C fashion brand. Segments: ${segInfo}. Campaigns: ${campInfo}. Be concise, action-oriented, data-aware.`
    );
  }
  if (!reply) reply = getFallbackAgentReply(state.campaigns);

  state.chatHistory.pop();
  state.chatHistory.push({ role: 'assistant', content: reply });
  state.agentActivity.unshift({ t: new Date().toLocaleTimeString(), txt: `🤖 "${msg.slice(0, 28)}…"` });

  renderChat(state);
  renderAgentActivity(state);
}

// ── MODALS ────────────────────────────────────────────
export function openIngest() {
  showModal(`
    <div class="modal-title">⬆ Ingest Customer Data</div>
    <div class="modal-sub">Import shoppers and order history into the CRM</div>
    <div class="ai-panel mb16">
      <div class="ai-badge">✦ AI Auto-Mapping</div>
      <div class="card-sub">AI automatically maps your CSV columns to CRM fields — no manual schema needed</div>
    </div>
    <div class="fg">
      <label>Data Source</label>
      <select><option>CSV Upload</option><option>Shopify Export</option><option>WooCommerce</option><option>Google Sheets</option></select>
    </div>
    <div class="upload-zone" onclick="window._simulateIngest()">
      <div style="font-size:28px;margin-bottom:10px;">📂</div>
      <div class="bold">Click to upload or drag & drop</div>
      <div class="muted small mt8">CSV, XLSX up to 10MB · AI maps fields automatically</div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="window._closeModal()">Cancel</button>
      <button class="btn primary" onclick="window._simulateIngest()">⬆ Ingest 60 Sample Records</button>
    </div>`);
}

export async function openSegBuilder() {
  showModal(`
    <div class="modal-title">✦ AI Segment Builder</div>
    <div class="modal-sub">Describe the audience you want in plain English</div>
    <div class="fg">
      <label>Describe your audience</label>
      <textarea id="seg-desc" style="min-height:100px;" placeholder='e.g. "Shoppers who spent over ₹20,000 but haven\'t bought in 45 days"'></textarea>
    </div>
    <div id="seg-build-res"></div>
    <div class="modal-footer">
      <button class="btn" onclick="window._closeModal()">Cancel</button>
      <button class="btn primary" onclick="window._buildSeg()">✦ Build Segment</button>
    </div>`);
}

export async function buildSeg() {
  const desc = (document.getElementById('seg-desc') || { value: '' }).value.trim();
  if (!desc) return;
  const res = document.getElementById('seg-build-res');
  res.innerHTML = `<div class="mt12">${aiSpinner('Analysing audience…')}</div>`;
  await delay(1000);

  let seg = null;
  if (window._getApiKey()) {
    const segInfo = SEGS.map(s => `${s.name}:${s.desc}`).join(';');
    const reply   = await callClaude(`Segments:${segInfo}.User wants:"${desc}".JSON:{"match":"name","reason":"one sentence"}`, 'CRM expert.');
    if (reply) { try { const p = JSON.parse(reply); seg = SEGS.find(s => s.name === p.match); } catch {} }
  }
  if (!seg) {
    const d = desc.toLowerCase();
    seg = (d.includes('spent') && (d.includes('not') || d.includes('haven') || d.includes('days'))) ? SEGS[2]
        : d.includes('loyal') || d.includes('repeat') ? SEGS[5]
        : d.includes('new') || d.includes('first')    ? SEGS[4]
        : d.includes('high') || d.includes('20000')   ? SEGS[1]
        : SEGS[2];
  }
  res.innerHTML = `
    <div style="background:var(--teal-d);border:1px solid rgba(45,212,191,.2);border-radius:10px;padding:15px;margin-top:14px;">
      <div class="bold ce mb8">✓ Best Match Found</div>
      <div class="bold">${seg.icon} ${seg.name} — ${shoppers.filter(seg.f).length} shoppers</div>
      <div class="muted small mt8">This segment best matches your described criteria.</div>
      <div class="flex g8 mt12">
        <button class="btn success sm" onclick="window._closeModal();window._pickSeg('${seg.id}');window._navTo('segments')">View Segment</button>
        <button class="btn primary sm" onclick="window._closeModal();window._launchSegCamp('${seg.id}')">📣 Campaign This</button>
      </div>
    </div>`;
}

// ── Utility ───────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
