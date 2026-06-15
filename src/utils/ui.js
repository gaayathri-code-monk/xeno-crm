// ── Badge HTML ────────────────────────────────────────
const BADGE_ICONS = {
  delivered:'✓', sent:'→', opened:'◉', clicked:'◈', failed:'✕',
  pending:'…', read:'✓✓', running:'⬤', completed:'✓', draft:'·',
  converted:'◆', whatsapp:'●', sms:'●', email:'●', rcs:'●',
};
export function badge(s) {
  return `<span class="badge ${s}">${BADGE_ICONS[s] || ''}${s}</span>`;
}

// ── Avatar HTML ───────────────────────────────────────
export function av(sh, sz = 30) {
  return `<div class="avatar" style="width:${sz}px;height:${sz}px;background:${sh.color}1A;font-size:${Math.round(sz * .46)}px;">${sh.emoji}</div>`;
}

// ── Score ring SVG ────────────────────────────────────
export function scoreRing(s) {
  const c = s >= 70 ? '#2DD4BF' : s >= 40 ? '#F59E0B' : '#FB7185';
  return `<div class="score-ring">
    <svg viewBox="0 0 38 38" style="position:absolute;inset:0;width:100%;height:100%;" aria-hidden="true">
      <circle cx="19" cy="19" r="16" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="3"/>
      <circle cx="19" cy="19" r="16" fill="none" stroke="${c}" stroke-width="3"
        stroke-dasharray="${Math.round(s * 1.005)} 100.5"
        stroke-linecap="round" transform="rotate(-90 19 19)"/>
    </svg>
    <div class="score-inner">${s}</div>
  </div>`;
}

// ── Notification ──────────────────────────────────────
const NOTIF_COLORS = { violet:'#8B5CF6', teal:'#2DD4BF', gold:'#F59E0B', rose:'#FB7185', fuchsia:'#D946EF' };
export function notify(icon, title, msg, type = 'violet') {
  const stack = document.getElementById('notif-stack');
  const n = document.createElement('div');
  n.className = 'notif';
  n.style.borderLeft = `3px solid ${NOTIF_COLORS[type] || NOTIF_COLORS.violet}`;
  n.innerHTML = `<div style="font-size:18px;flex-shrink:0;">${icon}</div>
    <div>
      <div class="notif-title">${title}</div>
      <div class="notif-msg">${msg}</div>
    </div>`;
  stack.appendChild(n);
  setTimeout(() => { n.style.transition = 'opacity .4s'; n.style.opacity = '0'; }, 3500);
  setTimeout(() => n.remove(), 4000);
}

// ── Modal ─────────────────────────────────────────────
export function showModal(html) {
  document.getElementById('modal-box').innerHTML = html;
  document.getElementById('modal-bg').classList.add('open');
}
export function closeModalFn() {
  document.getElementById('modal-bg').classList.remove('open');
}

// ── Format number ─────────────────────────────────────
export function fmt(n) { return Number(n).toLocaleString('en-IN'); }

// ── AI dots spinner ───────────────────────────────────
export function aiSpinner(text = 'Thinking…') {
  return `<div class="ai-dots">
    <div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div>
    <span class="muted small" style="margin-left:8px;">${text}</span>
  </div>`;
}

// ── Navigate helper ───────────────────────────────────
export function activateNavItem(page) {
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('active'));
  const el = document.querySelector(`[data-page="${page}"]`);
  if (el) el.classList.add('active');
}
