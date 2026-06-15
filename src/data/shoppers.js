// ── Seeded random ────────────────────────────────────
function srng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}
function pk(arr, r) { return arr[Math.floor(r() * arr.length)]; }

// ── Raw data ─────────────────────────────────────────
const FIRST = ['Priya','Rohan','Sneha','Arjun','Meera','Kiran','Anjali','Vikram','Divya','Rahul','Nisha','Amit','Pooja','Sanjay','Kavya','Deepak','Sunita','Rajesh','Ritu','Venkat','Lakshmi','Suresh','Ananya','Kartik','Bharti'];
const LAST  = ['Sharma','Patel','Kumar','Singh','Reddy','Nair','Joshi','Iyer','Chopra','Verma','Gupta','Menon','Sinha','Rao','Pillai','Kapoor','Shah','Mehta','Bose','Das'];
const CITIES   = ['Mumbai','Delhi','Bengaluru','Chennai','Hyderabad','Pune','Kolkata','Ahmedabad','Jaipur','Surat','Kochi','Chandigarh'];
const CHANNELS = ['WhatsApp','SMS','Email','RCS'];
const EMOJIS   = ['🧑','👩','👨','🧑‍💻','👩‍💼','👨‍🎨','🧑‍🍳','👩‍🔬','👨‍🏫','🧑‍🎤'];
const HUES     = ['#8B5CF6','#D946EF','#2DD4BF','#F59E0B','#60A5FA','#A78BFA','#34D399','#FB923C'];

// ── Generate shoppers ────────────────────────────────
export const shoppers = Array.from({ length: 60 }, (_, i) => {
  const r   = srng(i * 13 + 7);
  const fn  = pk(FIRST, r), ln = pk(LAST, r);
  const sp  = Math.round(r() * 50000 + 1500);
  const ord = Math.floor(r() * 20) + 1;
  const dsl = Math.floor(r() * 200);
  const tag = sp > 32000 && ord >= 8 ? 'champion'
            : sp > 20000             ? 'high-value'
            : dsl > 90               ? 'at-risk'
            : dsl > 60               ? 'dormant'
            : ord === 1              ? 'new'
            :                          'loyal';
  return {
    id:        `SH${String(i + 1).padStart(3, '0')}`,
    name:      `${fn} ${ln}`,
    email:     `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@mail.com`,
    city:      pk(CITIES, r),
    totalSpend: sp,
    orders:     ord,
    daysSinceLast: dsl,
    lastOrder:  new Date(Date.now() - dsl * 864e5).toLocaleDateString('en-IN'),
    tag,
    emoji:  pk(EMOJIS, r),
    color:  pk(HUES, r),
    pref:   pk(CHANNELS, r),
    score:  Math.min(99, Math.max(10, Math.round(sp / 600 + ord * 3 - dsl * 0.25))),
  };
});

// ── Segments ─────────────────────────────────────────
export const SEGS = [
  { id: 's1', name: 'Champions',    desc: 'Spent ₹32K+ with 8+ orders',    icon: '🏆', f: s => s.totalSpend >= 32000 && s.orders >= 8 },
  { id: 's2', name: 'High Value',   desc: 'Total spend above ₹20,000',      icon: '💎', f: s => s.totalSpend >= 20000 },
  { id: 's3', name: 'At Risk',      desc: 'No purchase in 90+ days',         icon: '⚠️', f: s => s.daysSinceLast >= 90 },
  { id: 's4', name: 'Dormant',      desc: 'No purchase in 60+ days',         icon: '😴', f: s => s.daysSinceLast >= 60 },
  { id: 's5', name: 'New Shoppers', desc: 'Single order, just joined',        icon: '✨', f: s => s.orders === 1 },
  { id: 's6', name: 'Loyal',        desc: '5+ orders, bought within 30d',    icon: '❤️', f: s => s.orders >= 5 && s.daysSinceLast < 30 },
];

// ── Initial campaigns ────────────────────────────────
export function makeInitialCampaigns() {
  return [
    {
      id: 'c1', name: 'Summer Win-Back', seg: 's3', chan: 'WhatsApp', status: 'running',
      msg: 'Hey {{name}}! We miss you 💛 Come back and enjoy 15% off with code SUMBACK15. Shop now →',
      sent: 0, delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, conv: 0, rev: 0,
      created: 'Jun 1, 2026',
    },
    {
      id: 'c2', name: 'Champions Exclusive', seg: 's1', chan: 'Email', status: 'running',
      msg: 'Dear {{name}}, as one of our top shoppers, enjoy early access to our new collection + free shipping all month!',
      sent: 0, delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, conv: 0, rev: 0,
      created: 'Jun 8, 2026',
    },
    {
      id: 'c3', name: 'New Shopper Welcome', seg: 's5', chan: 'SMS', status: 'running',
      msg: 'Welcome {{name}}! 🎉 Your 2nd order gets 10% off automatically. Happy shopping!',
      sent: 0, delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, conv: 0, rev: 0,
      created: 'Jun 10, 2026',
    },
  ];
}

export const CHANNELS_LIST = ['WhatsApp', 'SMS', 'Email', 'RCS'];
export function fmt(n) { return Number(n).toLocaleString('en-IN'); }
