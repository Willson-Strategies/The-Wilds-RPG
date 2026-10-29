/* ---------------- hit effects ---------------- */
const TIER_N = {Basic: 0, Light: 1, Standard: 2, Advanced: 3, Superior: 4, Legendary: 5};
const SLASH_GLOW = ['#bdb3a2', '#cfc6b4', '#d9dfe6', '#8fb6dc', '#e0a040', '#c8281e'];
const SPELL_COL = {'Magic Missile': ['#c9a2ff', '#5a2a9a'], 'Advanced Magic Missile': ['#c9a2ff', '#5a2a9a'], 'Fireball': ['#ffb050', '#b8320c'], 'Lightning Bolt': ['#a8d4ff', '#1c3566'], 'Undead Ward': ['#fff1b8', '#b08a2a'], 'Undead Abyss': ['#f2e2ff', '#4a2a6a']};
const NUM_COL = {heal: '#a8e890', hit: '#f3e6c8', crit: '#ffb347', magic: '#d6b8ff', burn: '#ff6a3a', poison: '#6fd06f', miss: '#9a8f80', hurt: '#ff6b5a'};
let FXQ = [], FX_BUSY = 0, FX_LEAD = 0;   // FX_LEAD: ms after the action that the next effects start (projectiles land later)
const MM_HIT = 560, FB_LAUNCH = 720, FB_HIT = 1120, FB_SPREAD = 140;
const CHARGE = 300;   // wind-up before a weapon blow lands
let ATK_BASE = 0;     // a monster's second attack in a turn starts after its first
const SLEEP_HIT = 1300, BOLT_HIT = 160, BOLT_STEP = 120, ENT_HIT = 520, SKULL_HIT = 700, HEAL_AT = 260;
const STAR_SVG = s => `<svg width="${s}" height="${s}" viewBox="-10 -10 20 20"><path d="M0-10C1-3 3-1 10 0 3 1 1 3 0 10-1 3-3 1-10 0-3-1-1-3 0-10z" fill="#f4f1ff"/><circle r="2.2" fill="#fff"/></svg>`;
const SKULL_SVG = (s, abyss) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><path d="M20 3C10.5 3 5 9.6 5 17.4c0 4.6 2 7.7 4.6 9.6V32c0 1.4 1.1 2.4 2.4 2.4h2.2v-3.6h2.6v3.6h2.4v-3.6h2.6v3.6h2.4v-3.6h2.6v3.6H28c1.3 0 2.4-1 2.4-2.4v-5c2.6-1.9 4.6-5 4.6-9.6C35 9.6 29.5 3 20 3z" fill="${abyss ? '#3a2650' : '#efe6d2'}" stroke="${abyss ? '#d8b8ff' : '#5a4320'}" stroke-width="1.4"/><ellipse cx="13.6" cy="18.6" rx="4.4" ry="4.8" fill="${abyss ? '#e0c0ff' : '#1a120a'}"/><ellipse cx="26.4" cy="18.6" rx="4.4" ry="4.8" fill="${abyss ? '#e0c0ff' : '#1a120a'}"/><path d="M20 22.5l-2.4 4.6h4.8z" fill="${abyss ? '#e0c0ff' : '#1a120a'}"/></svg>`;
/* A free-flying effect: moves an element from (x0,y0) to (x1,y1) along an arc with an optional side-to-side drift. */
function flyEl(cls, html, x0, y0, x1, y1, wait, dur, o = {}) {
  setTimeout(() => {
    const el = fxAt(cls, x0, y0, 0, 0, o.style || '', html), t0 = performance.now(), dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len, lift = len * (o.arc || 0) * .25, ph = Math.random() * 6.28;
    let last = 0;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = o.lazy ? .5 - Math.cos(Math.PI * k) / 2 : k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const side = Math.sin(Math.PI * e) * lift + (o.wob ? Math.sin(ph + k * Math.PI * (o.wobF || 3)) * o.wob * Math.sin(Math.PI * k) : 0);
      const x = x0 + dx * e + nx * side, y = y0 + dy * e + ny * side;
      el.style.left = x + 'px'; el.style.top = y + 'px';
      if (o.trail && now - last > (o.every || 40)) { last = now; o.trail(x, y); }
      if (k < 1) requestAnimationFrame(step); else { el.remove(); if (o.done) o.done(x, y); }
    };
    requestAnimationFrame(step);
  }, wait);
}
/* A jagged lightning path between two points, in page coordinates. */
function jag(x0, y0, x1, y1, n, amp) {
  const pts = [[x0, y0]], dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  for (let i = 1; i < n; i++) { const t = i / n, o = (Math.random() - .5) * 2 * amp * Math.sin(Math.PI * t); pts.push([x0 + dx * t + nx * o, y0 + dy * t + ny * o]); }
  pts.push([x1, y1]); return pts.map(p => p[0].toFixed(0) + ',' + p[1].toFixed(0)).join(' ');
}
function boltLine(x0, y0, x1, y1, w, delay) {
  const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(4, Math.round(len / 34)), amp = Math.min(38, len * .09);
  for (let k = 0; k < 2; k++) {
    const pts = jag(x0, y0, x1, y1, n, amp);
    fxAt('fx-lstroke', 0, 0, 0, 0, `animation-delay:${delay + k * 60}ms;opacity:0`, `<svg width="1" height="1" style="overflow:visible"><polyline points="${pts}" fill="none" stroke="#5a8ee8" stroke-width="${w * 3.2}" stroke-linejoin="round" opacity=".45" style="filter:blur(3px)"/><polyline points="${pts}" fill="none" stroke="#e8f2ff" stroke-width="${w}" stroke-linejoin="bevel"/></svg>`);
  }
}
const winOf = u => unitEl(u);
/* Order a lightning chain so it leaps to the nearest target first, then on to the next nearest. */
function chainOrder(from, list) {
  const pos = u => { const el = unitEl(u); if (!el) return [0, 0]; const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  let [px, py] = pos(from); const left = [...list], out = [];
  while (left.length) { let bi = 0, bd = Infinity; left.forEach((u, i) => { const [x, y] = pos(u), d = Math.hypot(x - px, y - py); if (d < bd) { bd = d; bi = i; } }); const u = left.splice(bi, 1)[0]; out.push(u); [px, py] = pos(u); }
  return out;
}
const centre = el => { const r = el.getBoundingClientRect(); return [r.left + scrollX + r.width / 2, r.top + scrollY + r.height / 2, r]; };
/* Lingering looks on a portrait while a unit is asleep, bound in vines or warded. */
const VINE_OVER = '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="none" stroke-linecap="round"><path d="M-4 78C20 60 34 92 52 70S86 58 104 76" stroke="#25501c" stroke-width="6"/><path d="M-4 78C20 60 34 92 52 70S86 58 104 76" stroke="#6fae4a" stroke-width="2"/><path d="M-4 30C18 48 40 18 58 40S88 50 104 26" stroke="#25501c" stroke-width="5"/><path d="M-4 30C18 48 40 18 58 40S88 50 104 26" stroke="#6fae4a" stroke-width="1.6"/><path d="M20 104C30 70 12 46 30 20S40-2 34-4" stroke="#25501c" stroke-width="4"/><path d="M80 104C66 76 92 50 72 22" stroke="#25501c" stroke-width="4"/></g><g fill="#5c9a3c" stroke="#1d3a14" stroke-width=".6"><path d="M30 64q6-8 12-2-6 6-12 2z"/><path d="M70 66q4-9 11-5-4 7-11 5z"/><path d="M48 36q5-8 11-3-5 6-11 3z"/><path d="M14 40q2-8 9-6-2 7-9 6z"/></g></svg>';
function stOverlay(st) {
  if (!st) return '';
  const late = x => { const d = Math.max(0, (x.at || 0) - Date.now()); return d ? ` st-late" style="animation-delay:${d}ms` : ''; };
  let o = '';
  if (st.SLEEP) o += `<div class="st-sleep${late(st.SLEEP)}"><i>z</i><i>z</i><i>Z</i></div>`;
  if (st.ENTANGLED) o += `<div class="st-vine${late(st.ENTANGLED)}">${VINE_OVER}</div>`;
  if (st.WARD) o += `<div class="st-ward${late(st.WARD)}"></div>`;
  return o;
}
/* HP bars ease from their last shown value to the new one (fast start, soft finish, .75s). In battle a bar
   drops at the moment its damage number pops, so a double swing drains in two steps. */
const HPW = {}, BARPEND = {};
const hpClass = p => p <= 5 ? 'hp-crit' : p <= 25 ? 'hp-low' : p <= 40 ? 'hp-warn' : 'hp-ok';
function hpBar(k, hp, max) { const t = Math.max(0, hp) / max * 100, from = HPW[k] ?? t; return `<i data-hpk="${k}" data-pct="${t}" data-max="${max}" class="${hpClass(from)}" style="width:${from}%"></i>`; }
/* The HP number on a card changes with its bar, so it doesn't give a result away before the blow lands. */
function hpTxt(k, hp, max) { return `<span data-hpt="${k}">${HPW[k] !== undefined ? Math.round(HPW[k] * max / 100) : Math.max(0, hp)}</span>`; }
function setBar(el, pct) {
  el.style.width = pct + '%'; el.className = hpClass(pct); HPW[el.dataset.hpk] = pct;
  const txt = document.querySelector(`[data-hpt="${el.dataset.hpk}"]`); if (txt && el.dataset.max) txt.textContent = Math.round(pct * el.dataset.max / 100);
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
  if (n.nodeType !== 1) return;
  (n.matches && n.matches('i[data-hpk]') ? [n] : [...n.querySelectorAll('i[data-hpk]')]).forEach(b => {
    const k = b.dataset.hpk; if (BARPEND[k] > 0) return;
    requestAnimationFrame(() => requestAnimationFrame(() => { if (b.isConnected) setBar(b, +b.dataset.pct); }));
  });
}))).observe(document.body, {childList: true, subtree: true});
function fx(e) {
  if (!S.battle) return;
  const fi = S.battle.foes.indexOf(e.u), hi = S.party.indexOf(e.u);
  if (fi >= 0) { e.side = 'm'; e.i = fi; } else if (hi >= 0) { e.side = 'p'; e.i = hi; } else return;
  e.at = FX_LEAD; FXQ.push(e);
}
const unitCard = u => { const fi = S.battle ? S.battle.foes.indexOf(u) : -1; if (fi >= 0) return document.querySelector(`.foe[data-foe="${fi}"]`); const hi = S.party.indexOf(u); return hi >= 0 ? document.querySelector(`.hero[data-hero="${hi}"]`) : null; };
const unitEl = u => { const fi = S.battle ? S.battle.foes.indexOf(u) : -1; if (fi >= 0) return document.querySelector(`.foe[data-foe="${fi}"] .win`); const hi = S.party.indexOf(u); return hi >= 0 ? document.querySelector(`.hero[data-hero="${hi}"] .pwrap`) : null; };
// How each kind of monster lands a blow.
const MON_STYLE = {Beast: 'claw', Humanoid: 'steel', Undead: 'necro', Giant: 'crush', Fiend: 'hellfire', Monstrosity: 'rend', Dragon: 'jaws', Construct: 'stone'};
const monsterStyle = f => MON_STYLE[f.type] || 'steel';
function weaponStyle(it, ranged) {
  if (!it) return {k: 'blunt', tier: 0};
  const w = WPN[it.name];
  const tier = w.tier === 'Unique' ? 4 : (TIER_N[w.tier] || 0);
  const base = w.base || it.name;
  if (/undead/.test(w.note || '') || base === 'Staff' || base === 'Sling') return {k: 'blunt', tier};
  if (ranged) return {k: 'arrow', tier};
  return {k: 'slash', tier, legendary: w.tier === 'Legendary'};
}
function fxLayer() { let l = document.getElementById('fx'); if (!l) { l = document.createElement('div'); l.id = 'fx'; document.body.appendChild(l); } return l; }
function fxAt(cls, x, y, w, h, style, html) {
  const el = document.createElement('div'); el.className = cls;
  el.style.cssText = `left:${x}px;top:${y}px;${w ? `width:${w}px;height:${h}px;` : ''}${style || ''}`;
  if (html) el.innerHTML = html;
  fxLayer().appendChild(el); setTimeout(() => el.remove(), 2200); return el;
}
function slashSVG(size, glow, core, flip) {
  const d = flip ? 'M92 18 Q45 40 8 84' : 'M8 18 Q55 40 92 84';
  const gw = 7 + size / 22, cw = 1.6 + size / 70;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow:visible"><path class="g" pathLength="100" d="${d}" stroke="${glow}" stroke-width="${gw}" opacity=".75"/><path pathLength="100" d="${d}" stroke="${core}" stroke-width="${cw}"/></svg>`;
}
const fangs = (w, up) => `<svg width="${w}" height="${w * .32}" viewBox="0 0 100 32" style="overflow:visible"><path d="${up ? 'M0 0 H100 L94 0 88 26 82 0 74 0 68 30 62 0 54 0 50 22 46 0 38 0 32 30 26 0 18 0 12 26 6 0Z' : 'M0 32 H100 L94 32 88 6 82 32 74 32 68 2 62 32 54 32 50 10 46 32 38 32 32 2 26 32 18 32 12 6 6 32Z'}" fill="#efe6d2" stroke="#2a0a06" stroke-width="2"/></svg>`;
/* How long (ms from now) until the queued action's last die has landed and its last blow has struck. */
let INPUT_LOCK = 0, LOCK_T = null, LOG_SEEN = null;
function fxLockMs() {
  let t = 0;
  FXQ.forEach(e => { if (e.k === 'dice') t = Math.max(t, (e.at || 0) + (e.tumble || 0) + (e.post || 0)); else if (e.k === 'num' || e.k === 'miss' || e.k === 'tag') t = Math.max(t, e.at || 0); });
  return t ? t + 350 : 0;
}
function playFX() {
  if (!FXQ.length) return;
  const q = FXQ; FXQ = [];
  const t = {}; let end = 0;
  q.forEach(e => {
    if (e.k === 'dice') { setTimeout(() => diceFx(e), e.at || 0); end = Math.max(end, (e.at || 0) + (e.tumble || 0) + (e.post || 0)); return; }   // dice sit beside the other effects, never queue behind them
    const key = e.side + e.i, delay = Math.max(t[key] || 0, e.at || 0);
    t[key] = delay + (e.k === 'num' || e.k === 'miss' || e.k === 'tag' ? 330 : e.k === 'ail' ? 260 : 110);
    end = Math.max(end, delay + (e.crit || e.dbl ? 1900 : 1500));
    const bk = e.side + e.i;
    if (e.k === 'num') BARPEND[bk] = (BARPEND[bk] || 0) + 1;
    setTimeout(() => {
      if (e.k === 'num') { BARPEND[bk]--; const bar = document.querySelector(`i[data-hpk="${bk}"]`); if (bar && e.pct !== undefined) setBar(bar, BARPEND[bk] > 0 ? e.pct : +bar.dataset.pct); }
      fxOne(e);
    }, delay);
  });
  FX_BUSY = Date.now() + Math.min(end, 1700 + Math.max(0, DICE_SHIFT - CHARGE)); DICE_SHIFT = 0;
}
/* A glowing orb flies from (x0,y0) to (x1,y1) on a slight arc, shedding particles as it goes. */
function flyOrb(cls, x0, y0, x1, y1, wait, dur, size, col, arc, big) {
  setTimeout(() => {
    const orb = fxAt(cls, x0, y0, 0, 0, `--s:${size}px`), t0 = performance.now(), lift = Math.hypot(x1 - x0, y1 - y0) * arc * .25;
    let last = 0;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const x = x0 + (x1 - x0) * e, y = y0 + (y1 - y0) * e - Math.sin(Math.PI * e) * lift;
      orb.style.left = x + 'px'; orb.style.top = y + 'px';
      if (now - last > 16) { last = now; for (let n = 0; n < (big ? 3 : 2); n++) fxAt(big ? 'fx-ember' : 'fx-mote', x, y, 0, 0, `--c:${col};--dx:${(Math.random() - .5) * (big ? 46 : 34)}px;--dy:${(Math.random() - .5) * (big ? 46 : 34) + (big ? -14 : 0)}px`); }
      if (k < 1) requestAnimationFrame(step); else orb.remove();
    };
    requestAnimationFrame(step);
  }, wait);
}
