import { fmt, badge } from '../utils/ui.js';
import Chart from 'chart.js/auto';

let chanChartRef = null;

export function renderDashboard(state) {
  renderKPIs(state);
  renderPipeStats(state);
  renderCallbackFeed(state);
  renderDashCampaignTable(state);
  renderChannelChart(state);
}

export function renderKPIs(state) {
  const { campaigns } = state;
  const tS  = campaigns.reduce((a, c) => a + c.sent, 0);
  const tD  = campaigns.reduce((a, c) => a + c.delivered, 0);
  const tCl = campaigns.reduce((a, c) => a + c.clicked, 0);
  const tR  = campaigns.reduce((a, c) => a + c.rev, 0);
  const dr  = tS ? Math.round(tD / tS * 100) : 0;
  const ctr = tD ? Math.round(tCl / tD * 100) : 0;

  const g = document.getElementById('kpi-grid');
  if (!g) return;
  g.innerHTML = `
    <div class="stat-card accent-v">
      <div class="stat-label">Total Shoppers</div>
      <div class="stat-value">${fmt(state.shoppers.length)}</div>
      <div class="stat-change up">↑ 12 added this week</div>
    </div>
    <div class="stat-card accent-fuchsia">
      <div class="stat-label">Messages Sent</div>
      <div class="stat-value">${fmt(tS)}</div>
      <div class="stat-change up">${dr}% delivery rate</div>
    </div>
    <div class="stat-card accent-teal">
      <div class="stat-label">Click-Through Rate</div>
      <div class="stat-value">${ctr}%</div>
      <div class="stat-change ${ctr > 10 ? 'up' : 'down'}">${ctr > 10 ? '↑ Above avg' : '↓ Below avg'}</div>
    </div>
    <div class="stat-card accent-gold">
      <div class="stat-label">Campaign Revenue</div>
      <div class="stat-value" style="font-size:22px;">₹${fmt(tR)}</div>
      <div class="stat-change up">↑ attributed</div>
    </div>`;
}

export function renderPipeStats(state) {
  const { comms } = state;
  const tS  = comms.length;
  const tD  = comms.filter(c => ['delivered','opened','read','clicked','converted'].includes(c.status)).length;
  const tO  = comms.filter(c => ['opened','read'].includes(c.status)).length;
  const tCl = comms.filter(c => c.status === 'clicked').length;
  const tF  = comms.filter(c => c.status === 'failed').length;
  const el  = document.getElementById('pipe-stats');
  if (!el) return;
  el.innerHTML = `
    <span class="cv">📤 ${tS} sent</span>
    <span class="ce">✓ ${tD} del</span>
    <span style="color:#60A5FA;">◉ ${tO} open</span>
    <span class="ca">◈ ${tCl} clicked</span>
    <span class="cr">✕ ${tF} failed</span>`;
}

export function renderCallbackFeed(state) {
  const el = document.getElementById('cb-feed');
  if (!el) return;
  el.innerHTML = state.callbacks.slice(0, 14).map(c =>
    `<div style="display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid var(--border);">
      <span class="muted" style="font-family:monospace;font-size:10px;min-width:70px;">${c.t}</span>
      ${badge(c.status)}
      <span class="muted">${c.id.split('-').pop()} · ${c.chan}</span>
    </div>`
  ).join('');
}

export function renderDashCampaignTable(state) {
  const el = document.getElementById('dash-table');
  if (!el) return;
  el.innerHTML = `
    <table>
      <thead><tr>
        <th>Campaign</th><th>Channel</th><th>Sent</th>
        <th>Delivered</th><th>CTR</th><th>Revenue</th><th>Status</th>
      </tr></thead>
      <tbody>
        ${state.campaigns.map(c => {
          const ctr = c.delivered ? Math.round(c.clicked / c.delivered * 100) : 0;
          const dr  = c.sent      ? Math.round(c.delivered / c.sent * 100)    : 0;
          return `<tr>
            <td><span class="bold">${c.name}</span></td>
            <td>${badge(c.chan.toLowerCase())}</td>
            <td>${fmt(c.sent)}</td>
            <td>${fmt(c.delivered)}<span class="muted small"> ${dr}%</span></td>
            <td>${ctr}%</td>
            <td class="bold ca">₹${fmt(c.rev)}</td>
            <td>${badge(c.status)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function renderChannelChart(state) {
  setTimeout(() => {
    const ctx = document.getElementById('chanChart');
    if (!ctx) return;
    if (chanChartRef) { chanChartRef.destroy(); chanChartRef = null; }
    const labels = ['WhatsApp', 'SMS', 'Email', 'RCS'];
    const data = labels.map(ch => {
      const cs  = state.comms.filter(c => c.channel === ch);
      const del = cs.filter(c => ['delivered','opened','read','clicked','converted'].includes(c.status)).length;
      return cs.length ? Math.round(del / cs.length * 100) : Math.round(72 + Math.random() * 23);
    });
    chanChartRef = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Delivery %',
          data,
          backgroundColor: ['#25D36699','#8B5CF699','#60A5FA99','#F59E0B99'],
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { max: 100, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#4B5563', callback: v => v + '%' } },
          x: { grid: { display: false }, ticks: { color: '#4B5563' } },
        },
      },
    });
  }, 80);
}
