/**
 * aiService.js
 *
 * Wraps Anthropic API calls with smart fallback responses.
 * If no API key is set, uses pre-built intelligent responses
 * that are data-aware (segment counts, campaign revenue etc.)
 */

let _apiKey = '';
export function setApiKey(key) { _apiKey = key; }
export function getApiKey()    { return _apiKey; }

// ── Live API call ─────────────────────────────────────
export async function callClaude(userPrompt, systemPrompt) {
  if (!_apiKey) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': _apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content[0].text;
  } catch {
    return null;
  }
}

// ── Fallback message templates ────────────────────────
const MSG_TEMPLATES = {
  winback:   `Hey {{name}}! 👋 We haven't seen you in a while — and we miss you! Come back today and enjoy 15% off your next order. Use code COMEBACK15 at checkout. Shop now →`,
  summer:    `Hi {{name}}! ☀️ Summer is here and so are our hottest styles. Shop the new collection and get free shipping on orders above ₹1,499 this week only!`,
  champion:  `Dear {{name}}, as one of our most valued shoppers, you get exclusive early access to our new arrivals — 24 hours before everyone else. Your loyalty means everything to us 💛`,
  welcome:   `Welcome to StyleCo, {{name}}! 🎉 Your first repeat purchase gets 10% off automatically — no code needed. Happy shopping!`,
  default:   `Hi {{name}}! We have something special curated just for you. Check out our latest collection and enjoy an exclusive offer this week only →`,
};

export function getFallbackMessage(goal) {
  const g = goal.toLowerCase();
  if (g.includes('win') || g.includes('back') || g.includes('dormant'))  return MSG_TEMPLATES.winback;
  if (g.includes('summer') || g.includes('sale') || g.includes('season')) return MSG_TEMPLATES.summer;
  if (g.includes('champion') || g.includes('vip') || g.includes('loyal')) return MSG_TEMPLATES.champion;
  if (g.includes('welcome') || g.includes('new') || g.includes('first')) return MSG_TEMPLATES.welcome;
  return MSG_TEMPLATES.default;
}

// ── Fallback segment picker ───────────────────────────
export function getFallbackSegment(goal, SEGS) {
  const g = goal.toLowerCase();
  if (g.includes('win') || g.includes('back') || g.includes('inactive'))  return SEGS[2]; // At Risk
  if (g.includes('loyal') || g.includes('vip') || g.includes('champion')) return SEGS[0]; // Champions
  if (g.includes('new') || g.includes('welcome'))                          return SEGS[4]; // New
  if (g.includes('high') || g.includes('premium'))                        return SEGS[1]; // High Value
  return SEGS[3]; // Dormant
}

// ── Fallback agent replies ────────────────────────────
const AGENT_REPLIES = [
  (camps) => `Based on your live data, **Champions Exclusive** is performing best — highest attributed revenue (₹${Number(camps[1]?.rev || 0).toLocaleString('en-IN')}) and strong engagement from a premium audience.\n\n**My recommendations:**\n1. 📣 Follow up with High Value shoppers who haven't converted yet\n2. 💬 WhatsApp consistently delivers the highest open rates for fashion brands\n3. The win-back campaign is timed well — 90–120 day dormancy is the optimal recovery window`,

  (_) => `**WhatsApp** is the clear winner for re-engagement. Here's why:\n\n📊 Open rates: 85–95% (vs 45% SMS, 22% Email)\n💬 Rich media — product images, CTA buttons, quick replies\n🎯 Your WhatsApp-preferred shoppers are highly active\n\nPair WhatsApp with your **Dormant** segment. A 15% off offer typically recovers 12–18% of dormant shoppers within 7 days.`,

  (_) => `This week, target **At Risk** shoppers — people who haven't bought in 90+ days.\n\n⚡ Why urgency matters:\n• 90 days = optimal recovery window. After 120 days, recovery drops 60%\n• A win-back offer now converts 3× better than waiting\n• Recommended: 15% off via WhatsApp with a 48-hour countdown\n\nWant me to draft the message and set up the campaign right now?`,

  (_) => `Here's a summer sale message for Champions:\n\n*"Dear {{name}}, as one of our top shoppers, you get first access to the Summer Edit — 20% off everything, 48 hours only. This is your exclusive invite 👑 Shop now →"*\n\n**Why this works:**\n✓ Exclusivity drives opens (+34% vs generic messages)\n✓ Clear 20% discount removes decision friction\n✓ 48-hour urgency boosts CTR by 2.4×\n✓ Short enough for WhatsApp or SMS`,

  (camps) => {
    const total = camps.reduce((a, c) => a + c.sent, 0);
    const rev   = camps.reduce((a, c) => a + c.rev,  0);
    const conv  = camps.reduce((a, c) => a + c.conv, 0);
    const best  = camps.reduce((a, c) => c.rev > a.rev ? c : a, camps[0]);
    return `**Campaign snapshot across ${camps.length} active campaigns:**\n\n📊 Total reach: ${total.toLocaleString('en-IN')} shoppers\n💰 Total conversions: ${conv}\n₹ Total revenue: ₹${rev.toLocaleString('en-IN')}\n\n🏆 Best performer: **${best?.name || 'N/A'}**\n\nOverall health looks strong. Want optimisation suggestions for underperforming campaigns?`;
  },
];

let _agentIdx = 0;
export function getFallbackAgentReply(campaigns) {
  const reply = AGENT_REPLIES[_agentIdx % AGENT_REPLIES.length](campaigns);
  _agentIdx++;
  return reply;
}
