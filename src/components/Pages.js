import { fmt, badge, av, scoreRing } from '../utils/ui.js';
import { SEGS } from '../data/shoppers.js';
import Chart from 'chart.js/auto';

// ── SHOPPERS ──────────────────────────────────────────
export function renderShoppers(state) {
  const q = (document.getElementById('sh-search') || { value: '' }).value.toLowerCase();
  const f = (document.getElementById('sh-filter') || { value: '' }).value;
  const list = state.shoppers.filter(s =>
    (!q || s.name.toLowerCase().includes(q) || s.email.includes(q) || s.city.toLowerCase().includes(q)) &&
    (!f || s.tag === f)
  );
  const shown = list.slice(0, 35);
  const cnt = document.getElementById('sh-count');
  if (cnt) cnt.textContent = `Showing ${shown.length} of ${list.length}`;

  const el = document.getElementById('sh-table');
  if (!el) return;
  el.innerHTML = `
    <table>
      <thead><tr>
        <th>Shopper</th><th>City</th><th>Total Spend</th>
        <th>Orders</th><th>Last Order</th><th>Score</th><th>Tag</th><th>Preferred</th>
      </tr></thead>
      <tbody>
        ${shown.map(s => `<tr>
          <td><div class="flex fac g8">${av(s)}
            <div><div class="bold">${s.name}</div><div class="muted small">${s.email}</div></div>
          </div></td>
          <td>${s.city}</td>
          <td class="bold">₹${fmt(s.totalSpend)}</td>
          <td>${s.orders}</td>
          <td>${s.lastOrder}</td>
          <td>${scoreRing(s.score)}</td>
          <td>${badge(s.tag)}</td>
          <td>${badge(s.pref.toLowerCase())}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

// ── SEGMENTS ──────────────────────────────────────────
export function renderSegments(state, onCampaign) {
  const chips = document.getElementById('seg-chips');
  if (chips) {
    chips.innerHTML = SEGS.map(s =>
      `<div class="seg-chip ${s.id === state.selectedSeg ? 'active' : ''}" onclick="window._pickSeg('${s.id}')">
        ${s.icon} ${s.name} <span style="opacity:.6;font-size:11px;">${state.shoppers.filter(s.f).length}</span>
      </div>`
    ).join('');
  }
  renderSegDetail(state, onCampaign);
}

function renderSegDetail(state, onCampaign) {
  const seg     = SEGS.find(s => s.id === state.selectedSeg);
  if (!seg) return;
  const members = state.shoppers.filter(seg.f);
  const tSpend  = members.reduce((a, s) => a + s.totalSpend, 0);
  const avgOrd  = members.length ? Math.round(members.reduce((a, s) => a + s.orders, 0) / members.length) : 0;

  const el = document.getElementById('seg-detail');
  if (!el) return;
  el.innerHTML = `
    <div class="g4 mb16">
      <div class="stat-card accent-v"><div class="stat-label">Members</div><div class="stat-value">${members.length}</div></div>
      <div class="stat-card accent-fuchsia"><div class="stat-label">Total Spend</div><div class="stat-value" style="font-size:22px;">₹${fmt(tSpend)}</div></div>
      <div class="stat-card accent-teal"><div class="stat-label">Avg Orders</div><div class="stat-value">${avgOrd}</div></div>
      <div class="stat-card accent-gold"><div class="stat-label">Avg Spend</div><div class="stat-value" style="font-size:18px;">₹${members.length ? fmt(Math.round(tSpend / members.length)) : 0}</div></div>
    </div>
    <div class="card">
      <div class="flex fac fjb mb14">
        <div>
          <div class="card-title">${seg.icon} ${seg.name}</div>
          <div class="card-sub mt8">${seg.desc}</div>
        </div>
        <button class="btn primary" onclick="window._launchSegCamp('${seg.id}')">📣 Campaign This Segment</button>
      </div>
      <div class="tw">
        <table>
          <thead><tr><th>Shopper</th><th>City</th><th>Spend</th><th>Orders</th><th>Days Since Last</th><th>Score</th></tr></thead>
          <tbody>
            ${members.slice(0, 20).map(s => `<tr>
              <td><div class="flex fac g8">${av(s)}
                <div><div class="bold">${s.name}</div><div class="muted small">${s.email}</div></div>
              </div></td>
              <td>${s.city}</td>
              <td>₹${fmt(s.totalSpend)}</td>
              <td>${s.orders}</td>
              <td class="${s.daysSinceLast > 90 ? 'cr' : s.daysSinceLast > 60 ? 'ca' : 'ce'}">${s.daysSinceLast}d</td>
              <td>${scoreRing(s.score)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ── CAMPAIGNS ─────────────────────────────────────────
export function renderCampaigns(state, onSend) {
  const filt = document.getElementById('camp-filter');
  if (filt) {
    filt.innerHTML = ['All', 'running', 'completed', 'draft'].map(s =>
      `<div class="seg-chip ${state.campFilter === (s === 'All' ? '' : s) ? 'active' : ''}"
         onclick="window._setCampFilter('${s === 'All' ? '' : s}')">${s}</div>`
    ).join('');
  }

  const list = state.campaigns.filter(c => !state.campFilter || c.status === state.campFilter);
  const el   = document.getElementById('camp-table');
  if (!el) return;

  el.innerHTML = `
    <table>
      <thead><tr>
        <th>Campaign</th><th>Channel</th><th>Segment</th><th>Sent</th>
        <th>Del%</th><th>Open%</th><th>CTR</th><th>Conv</th><th>Revenue</th><th>Status</th><th></th>
      </tr></thead>
      <tbody>
        ${list.map(c => {
          const seg = SEGS.find(s => s.id === c.seg);
          const dr  = c.sent      ? Math.round(c.delivered / c.sent * 100)      : 0;
          const or_ = c.delivered ? Math.round(c.opened / c.delivered * 100)    : 0;
          const ctr = c.delivered ? Math.round(c.clicked / c.delivered * 100)   : 0;
          return `<tr>
            <td><div class="bold">${c.name}</div><div class="muted small">${c.created}</div></td>
            <td>${badge(c.chan.toLowerCase())}</td>
            <td>${seg ? `${seg.icon} ${seg.name}` : '-'}</td>
            <td>${fmt(c.sent)}</td>
            <td class="${dr > 80 ? 'ce' : dr > 60 ? 'ca' : 'cr'}">${dr}%</td>
            <td class="${or_ > 30 ? 'ce' : or_ > 15 ? 'ca' : 'cr'}">${or_}%</td>
            <td>${ctr}%</td>
            <td class="ce">${c.conv}</td>
            <td class="bold ca">₹${fmt(c.rev)}</td>
            <td>${badge(c.status)}</td>
            <td>${c.status === 'draft'
              ? `<button class="btn success sm" onclick="window._sendCampaign('${c.id}')">🚀 Send</button>`
              : ''}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;

  document.getElementById('nb-camp').textContent = state.campaigns.length;
}

// ── ANALYTICS ─────────────────────────────────────────
let revChartRef = null;

export function renderAnalytics(state) {
  const { campaigns } = state;
  const tS  = campaigns.reduce((a, c) => a + c.sent,      0);
  const tD  = campaigns.reduce((a, c) => a + c.delivered, 0);
  const tO  = campaigns.reduce((a, c) => a + c.opened,    0);
  const tCl = campaigns.reduce((a, c) => a + c.clicked,   0);
  const tCo = campaigns.reduce((a, c) => a + c.conv,      0);
  const tR  = campaigns.reduce((a, c) => a + c.rev,       0);

  // KPIs
  const kEl = document.getElementById('ana-kpis');
  if (kEl) kEl.innerHTML = `
    <div class="stat-card accent-v"><div class="stat-label">Total Reach</div><div class="stat-value">${fmt(tS)}</div></div>
    <div class="stat-card accent-fuchsia"><div class="stat-label">Delivery Rate</div><div class="stat-value">${tS ? Math.round(tD / tS * 100) : 0}%</div></div>
    <div class="stat-card accent-teal"><div class="stat-label">Open Rate</div><div class="stat-value">${tD ? Math.round(tO / tD * 100) : 0}%</div></div>
    <div class="stat-card accent-gold"><div class="stat-label">Total Revenue</div><div class="stat-value" style="font-size:20px;">₹${fmt(tR)}</div></div>`;

  // Funnel
  const fEl = document.getElementById('funnel');
  if (fEl) {
    const steps = ['Sent','Delivered','Opened','Clicked','Converted'];
    const vals  = [tS, tD, tO, tCl, tCo];
    const cols  = ['#8B5CF6','#2DD4BF','#60A5FA','#F59E0B','#D946EF'];
    fEl.innerHTML = steps.map((l, i) => {
      const pct = tS ? Math.round(vals[i] / tS * 100) : 0;
      return `<div class="funnel-row">
        <div class="fl">${l}</div>
        <div class="ft"><div class="ff" style="width:${pct}%;background:${cols[i]};"></div></div>
        <div class="fn">${fmt(vals[i])}</div>
        <div class="fp">${pct}%</div>
      </div>`;
    }).join('');
  }

  // Revenue chart
  setTimeout(() => {
    const ctx = document.getElementById('revChart');
    if (!ctx) return;
    if (revChartRef) { revChartRef.destroy(); revChartRef = null; }
    revChartRef = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: campaigns.map(c => c.name.split(' ').slice(0, 2).join(' ')),
        datasets: [{
          label: 'Revenue',
          data: campaigns.map(c => c.rev),
          backgroundColor: ['#8B5CF699','#2DD4BF99','#60A5FA99','#D946EF99'],
          borderRadius: 8, borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#4B5563', callback: v => '₹' + fmt(v) } },
          x: { grid: { display: false }, ticks: { color: '#4B5563' } },
        },
      },
    });
  }, 80);

  // Table
  const aEl = document.getElementById('ana-table');
  if (!aEl) return;
  aEl.innerHTML = `
    <table>
      <thead><tr>
        <th>Campaign</th><th>Channel</th><th>Sent</th><th>Del%</th>
        <th>Open%</th><th>CTR%</th><th>Conv</th><th>Revenue</th><th>Rev/Msg</th>
      </tr></thead>
      <tbody>
        ${campaigns.map(c => {
          const dr  = c.sent      ? Math.round(c.delivered / c.sent * 100)    : 0;
          const or_ = c.delivered ? Math.round(c.opened / c.delivered * 100)  : 0;
          const ctr = c.delivered ? Math.round(c.clicked / c.delivered * 100) : 0;
          const rpm = c.sent      ? Math.round(c.rev / c.sent)                : 0;
          return `<tr>
            <td class="bold">${c.name}</td>
            <td>${badge(c.chan.toLowerCase())}</td>
            <td>${fmt(c.sent)}</td>
            <td class="${dr > 80 ? 'ce' : dr > 60 ? 'ca' : 'cr'}">${dr}%</td>
            <td class="${or_ > 30 ? 'ce' : or_ > 15 ? 'ca' : 'cr'}">${or_}%</td>
            <td class="${ctr > 10 ? 'ce' : ctr > 5 ? 'ca' : 'cr'}">${ctr}%</td>
            <td>${c.conv}</td>
            <td class="bold ca">₹${fmt(c.rev)}</td>
            <td>₹${fmt(rpm)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}
