/* ---- Build 87: AC badge, dice helpers and the attack preview shown when hovering an enemy ---- */
const SHIELD_SVG = '<svg viewBox="0 0 16 18" aria-hidden="true"><path d="M8 .8 1.3 3v5.2c0 4.3 2.9 7.5 6.7 9 3.8-1.5 6.7-4.7 6.7-9V3z" fill="#8a7350" stroke="#2a1a0e" stroke-width="1.1"/><path d="M8 2.6 3 4.2v4c0 3.2 2.1 5.7 5 7z" fill="#b89a66"/><path d="M8 4.5v9.6M4.6 8.4h6.8" stroke="#2a1a0e" stroke-width=".9" opacity=".55"/></svg>';
/* Stat icons in the same bronze style as the AC shield: STR two crossed swords (Build 106; was a flexed arm), DEX a feather, INT a head giving off magic. */
const STAT_SVG = {
  STR: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.08 16.92 L4.08 5.92 L2.8 2.8 L5.92 4.08 L16.92 15.08Z" fill="#b8b0a0" stroke="#2a1a0e" stroke-width="1.1" stroke-linejoin="round"/><path d="M15.4 15.4 L5.4 5.4" stroke="#ece6d8" stroke-width=".7" stroke-linecap="round"/><path d="M19.4 20 L16.4 17" stroke="#2a1a0e" stroke-width="3.2" stroke-linecap="round"/><path d="M19.4 20 L16.4 17" stroke="#4a3220" stroke-width="1.6" stroke-linecap="round"/><path d="M19.1 13.9 L13.9 19.1" stroke="#2a1a0e" stroke-width="3" stroke-linecap="round"/><path d="M19.1 13.9 L13.9 19.1" stroke="#8a7350" stroke-width="1.6" stroke-linecap="round"/><circle cx="20.3" cy="20.9" r="1.5" fill="#8a7350" stroke="#2a1a0e" stroke-width="1"/><path d="M8.92 16.92 L19.92 5.92 L21.2 2.8 L18.08 4.08 L7.08 15.08Z" fill="#b8b0a0" stroke="#2a1a0e" stroke-width="1.1" stroke-linejoin="round"/><path d="M8.6 15.4 L18.6 5.4" stroke="#ece6d8" stroke-width=".7" stroke-linecap="round"/><path d="M4.6 20 L7.6 17" stroke="#2a1a0e" stroke-width="3.2" stroke-linecap="round"/><path d="M4.6 20 L7.6 17" stroke="#4a3220" stroke-width="1.6" stroke-linecap="round"/><path d="M4.9 13.9 L10.1 19.1" stroke="#2a1a0e" stroke-width="3" stroke-linecap="round"/><path d="M4.9 13.9 L10.1 19.1" stroke="#8a7350" stroke-width="1.6" stroke-linecap="round"/><circle cx="3.7" cy="20.9" r="1.5" fill="#8a7350" stroke="#2a1a0e" stroke-width="1"/></svg>',
  DEX: '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M16.2 1.4C9.6 2.2 4.8 6.8 4.6 14c6.4-.6 11-5.6 11.6-12.6z" fill="#8a7350" stroke="#2a1a0e" stroke-width="1.1" stroke-linejoin="round"/><path d="M15.6 2.2C11 5.4 7.4 9.6 5.2 13.6" fill="none" stroke="#c9ad78" stroke-width="1"/><path d="M16 2 2 16.6" stroke="#2a1a0e" stroke-width="1.2" stroke-linecap="round"/><path d="M12 6.8l2.2.6M9.8 9.2l2.4.4M7.8 11.6l2.2.2" stroke="#2a1a0e" stroke-width=".7" opacity=".55"/></svg>',
  INT: '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M8.6 3.6V.8M5.2 4.4 3.6 2.2M12 4.4l1.6-2.2M3.2 6.8.8 6M14 6.8l2.4-.8" stroke="#9a7ae0" stroke-width="1.3" stroke-linecap="round"/><circle cx="8.6" cy=".9" r=".9" fill="#d8c8ff"/><circle cx="3.4" cy="2" r=".7" fill="#d8c8ff"/><circle cx="13.8" cy="2" r=".7" fill="#d8c8ff"/><path d="M5 17.4v-3.2c-1.6-.9-2.4-2.5-2.2-4.3.2-2.6 2.4-4.2 5-4.2 2.8 0 4.8 1.9 4.8 4.4l1 1.8-1.1.4V14c0 .8-.7 1.2-1.5 1.1l-1-.1v2.4z" fill="#8a7350" stroke="#2a1a0e" stroke-width="1.1" stroke-linejoin="round"/><path d="M4.6 9.6c.2-1.6 1.6-2.6 3.2-2.6" fill="none" stroke="#c9ad78" stroke-width="1" stroke-linecap="round"/></svg>',
};
// CON a heart, WIS a candle, CHA a mask (Paul's picks, Build 105).
STAT_SVG.CON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.2S3.4 15.6 3.4 9.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.6 2.4c0 6.2-8.6 11.8-8.6 11.8z" fill="#8a7350" stroke="#2a1a0e" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.6 8.6c.5-1.2 1.6-1.9 2.9-1.8" fill="none" stroke="#c9ad78" stroke-width="1.4" stroke-linecap="round"/></svg>';
STAT_SVG.WIS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.4 11h7.2v10.4H8.4z" fill="#8a7350" stroke="#2a1a0e" stroke-width="1.3" stroke-linejoin="round"/><path d="M8.4 12.6c1.2.6 2.2-.4 3.4.4s2.4-.2 3.8.2" fill="none" stroke="#c9ad78" stroke-width="1.1"/><path d="M12 2.4c2 2.4 2.6 4 2.6 5.2a2.6 2.6 0 0 1-5.2 0c0-1.2.6-2.8 2.6-5.2z" fill="#e8b048" stroke="#2a1a0e" stroke-width="1.1"/><path d="M12 6.2c.7.9.9 1.5.9 2a.9.9 0 0 1-1.8 0c0-.5.2-1.1.9-2z" fill="#fff2c8"/><path d="M12 9.8V11" stroke="#2a1a0e" stroke-width="1"/><path d="M6 21.4h12" stroke="#2a1a0e" stroke-width="1.6" stroke-linecap="round"/></svg>';
STAT_SVG.CHA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 4.6C8.8 3 15.2 3 20.4 4.6c.4 8.6-2.6 15-8.4 15.4C6.2 19.6 3.2 13.2 3.6 4.6z" fill="#8a7350" stroke="#2a1a0e" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.6 9.4c1-1 2.6-1 3.6 0M13.8 9.4c1-1 2.6-1 3.6 0" fill="none" stroke="#2a1a0e" stroke-width="1.6" stroke-linecap="round"/><path d="M7.8 13.2c2.2 2.8 6.2 2.8 8.4 0" fill="#2a1a0e" stroke="#2a1a0e" stroke-width="1.2" stroke-linejoin="round"/><path d="M6 6.4c1.6-.5 3.2-.6 4.6-.6" fill="none" stroke="#c9ad78" stroke-width="1" stroke-linecap="round"/></svg>';
const STAT_NAME = {STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution', WIS: 'Wisdom', INT: 'Intelligence', CHA: 'Charisma'};
/* One cell of a stat grid: icon, short name, value. */
const statCell = (s, v, h) => h
  ? `<div class="sg-tt" tabindex="0" data-tt="${esc(statTip(s, h))}"><span class="sgi">${STAT_SVG[s]}</span><b>${s}</b>${v}</div>`
  : `<div title="${STAT_NAME[s]}"><span class="sgi">${STAT_SVG[s]}</span><b>${s}</b>${v}</div>`;
/* Stat tooltips: a line of lore, then what the stat gives this hero now (per the rules Doc). */
/* Spellbook tooltip: what a spell does for this caster, with damage or healing as one roll and where the bonus comes from. */
function spellRoll(h, s, bonusExpr, kind) {
  const sd = diceParts(s.dice), bd = diceParts(bonusExpr), die = (n, x) => `${n > 1 ? n : ''}D${x}`, base = sd.n ? die(sd.n, sd.sides) : '';
  const hybrid = HYBRID.includes(h.cls), halfInt = kind === 'dmg' && s.halfInt;
  const adj = b => { if (kind === 'dmg' && h.cls === 'Magic User') b = Math.round(b * .9); if (hybrid) b = Math.floor(b / 2); if (halfInt) b = Math.floor(b / 2); return b; };
  const scaled = (kind === 'dmg' && h.cls === 'Magic User') || hybrid || halfInt;
  if (!scaled && bd.n) { const m = sd.mod + bd.mod; return `${base}+${die(bd.n, bd.sides)}${m ? '+' + m : ''}`; }
  const [lo, hi] = diceRange(bonusExpr), bl = adj(lo) + sd.mod, bh = adj(hi) + sd.mod;
  return bl === bh ? `${base}${bl ? '+' + bl : ''}` : `${base}+${bl}–${bh}`;
}
function spellTip(h, sp) {
  const s = SPELLS[sp], hybrid = HYBRID.includes(h.cls), icon = `${img(sp, 0, 'ico ttico')} ${esc(sp)}`;
  let out = `<div class="tt-h">${esc(sp)} <i class="tt-cap">level ${s.lvl} spell</i></div>`;
  const note = t => `<div class="tt-n">${t}</div>`;
  if (s.kind === 'dmg') {
    const ie = intDmgExpr(h.st.INT), share = hybrid || s.halfInt;
    out += `<div class="tt-row tt-main"><span>Damage</span><b>${spellRoll(h, s, ie, 'dmg')}</b></div>` + ttRow(icon, s.dice) + ttRow(statIco('INT'), (ie === '0' ? '+0' : '+' + ie) + (share ? ' (half)' : ''));
    if (s.target === 'all') out += note('Hits every enemy, then 5 sparks leap between them.');
    if (s.splash) out += note('Every other enemy takes half.');
    if (s.ail) out += note(`${ail(s.ail[0])}: ${s.ail[1]}% chance on each enemy hit.`);
    if (s.undead) out += note('Only harms the undead.');
    if (s.self) out += note(`Costs the caster ${s.self} HP.`);
    out += note('Magic never misses.');
  } else if (s.kind === 'heal') {
    const we = DICE_WIS(h.st.WIS).replace(/^\+/, '');
    out += `<div class="tt-row tt-main"><span>Healing</span><b>${spellRoll(h, s, we, 'heal')}</b></div>` + ttRow(icon, s.dice) + ttRow(statIco('WIS'), (we === '0' ? '+0' : '+' + we) + (hybrid ? ' (half)' : ''));
    out += note(s.target === 'party' ? 'Heals every living ally.' : 'Heals one ally.');
  } else if (s.kind === 'ctl') {
    const lo = Math.min(85, s.base[0] + h.st.INT), hi = Math.min(85, s.base[1] + h.st.INT);
    out += ttRow('Enemies level 1–5', `${lo}%`) + ttRow('Enemies level 6+', `${hi}%`) + ttRow(statIco('INT'), `+${h.st.INT}%`);
    out += note(`${s.status === 'SLEEP' ? 'Asleep' : 'Entangled'} for ${s.turns} turns, with AC lowered by ${s.status === 'SLEEP' ? '15%' : '25%'}. Bosses are immune. Chance capped at 85%.`);
  } else out += note(esc(s.desc));
  return out;
}
const STAT_LORE = {
  STR: 'The weight behind every blow. The wilds respect only what they cannot push aside.',
  DEX: 'Quick hands and quicker feet decide whether a blade glances off or finds its mark.',
  CON: 'The grit to keep breathing long after the road has bled you dry.',
  WIS: 'An old, quiet knowing that steadies a healer\'s hand over torn flesh.',
  INT: 'A trained and hungry mind that bends raw power into fire and lightning.',
  CHA: 'A steady gaze and a silver tongue, worth more than coin in a hungry land.',
};
function statTip(s, h) {
  const v = h.st[s], magic = !NO_MAGIC.includes(h.cls), hybrid = HYBRID.includes(h.cls);
  const rows = {
    STR: () => ttRow('Weapon damage', signed(strDmg(v)) || '+0'),
    DEX: () => ttRow('To hit', signed(dexHit(v)) || '+0') + ttRow('Armour Class', signed(dexAC(v)) || '+0'),
    CON: () => ttRow('HP each level up', DICE_CON(v)) + ttRow('Max HP now', h.max),
    WIS: () => magic ? ttRow('Healing spells', DICE_WIS(v) + (hybrid ? ' (half)' : '')) : ttRow('Healing spells', 'cannot cast'),
    INT: () => magic ? ttRow('Spell damage', DICE_INT(v) + (hybrid ? ' (half)' : '')) + ttRow('Sleep and Entangle', `+${v}% chance`) : ttRow('Spell damage', 'cannot cast'),
    CHA: () => ttRow('Starting purse', `+${chaGold(h)} GP`) + '<div class="tt-n">Prices and encounters: still to come.</div>',
  };
  return `<div class="tt-h">${STAT_NAME[s]} ${v}${v >= capOf(h.cls, s) ? ' <i class="tt-cap">(max)</i>' : ''}</div><div class="tt-lore">${STAT_LORE[s]}</div>${rows[s]()}`;
}
const statIco = k => `<span class="acb sm stat" title="${STAT_NAME[k]}">${STAT_SVG[k]}<i>${k}</i></span>`;
const acBadge = (n, cls = '') => `<span class="acb ${cls}" title="${/\benemyac\b/.test(cls) ? 'The higher the armour class, the harder this enemy is to hit' : 'The higher the armour class, the harder your character is to hit'}">${SHIELD_SVG}<b>${n}</b></span>`;
/* Splits a dice expression into the dice and the flat modifier: 'D8+3' -> {n:1, sides:8, mod:3}; '1-4' -> one D4; '5' -> mod only. */
function diceParts(expr) {
  const e = String(expr ?? '').trim().replace(/^\+/, '');
  let m = e.match(/^(\d+)-(\d+)$/); if (m) return {n: 1, sides: +m[2] - +m[1] + 1, mod: +m[1] - 1};
  if (/^-?\d+$/.test(e)) return {n: 0, sides: 0, mod: +e};
  m = e.match(/^(\d*)D(\d+)([+-]\d+)?$/i); if (!m) return {n: 0, sides: 0, mod: 0};
  return {n: +(m[1] || 1), sides: +m[2], mod: +(m[3] || 0)};
}
const diceRange = expr => { const p = diceParts(expr); return [p.n + p.mod, p.n * p.sides + p.mod]; };
/* Rolls an expression and remembers the bare dice so the dice animation can show the face that came up. */
function rollShown(expr) { const p = diceParts(expr); let face = 0; for (let i = 0; i < p.n; i++) face += R(p.sides); return {total: face + p.mod, face, sides: p.n === 1 ? p.sides : p.n ? p.n * p.sides : 0, mod: p.mod, multi: p.n > 1}; }
/* The INT and WIS bonus tables as dice expressions, for showing ranges (the real rolls still use intDmg / wisHeal). */
const intDmgExpr = s => s < 8 ? '0' : s <= 12 ? '1' : s <= 15 ? 'D3+2' : s <= 17 ? 'D3+4' : s <= 19 ? 'D6+4' : s === 20 ? 'D6+5' : s <= 24 ? 'D6+6' : 'D6+7';
/* Chance (0-1) that a d20 + bonus beats an AC: a natural 1 always misses, a natural 20 always hits, and a Thief hits on 15+. */
function hitChance(bonus, ac, keenFrom = 21) { let n = 0; for (let r = 2; r <= 20; r++) if (r === 20 || r >= keenFrom || r + bonus >= ac) n++; return n / 20; }
const pctTxt = p => Math.round(p * 100) + '%';
function ailImmune(f, kind) { return /Immune to [^.]*\b(sleep|shock|poison|tangle)/i.test(f.special || '') && new RegExp(kind === 'ENTANGLED' ? 'tangle' : kind, 'i').test(f.special); }
/* One weapon (or bare fist) against one foe. */
function attackPreview(h, f, ranged) {
  const it = ranged ? h.equip.ranged : h.equip.melee;
  const w = it ? WPN[it.name] : {hit: 0, dmg: '1', note: ''};
  const bonus = it ? weaponHit(h, it) : dexHit(h.st.DEX), ac = foeAC(f), thief = h.cls === 'Thief';
  const evade = /evades 15%/.test(f.special || '') ? .85 : 1;
  const p = hitChance(bonus, ac, thief ? 15 : 21) * evade;
  const str = strDmg(h.st.STR), worn = it ? WEAR_W[wearH(it)][1] : 0;
  let [lo, hi] = diceRange(w.dmg); lo += str - worn; hi += str - worn;
  const undead = /undead/.test(w.note || '') && f.type === 'Undead';
  if (undead) { lo = Math.floor(lo * 1.5); hi = Math.floor(hi * 1.5); }
  const floored = lo < 1; lo = Math.max(1, lo); hi = Math.max(1, hi);
  const critFrom = thief ? 15 : w.critOn || 20, critHi = Math.max(2, Math.floor(hi * 1.5));
  const ails = [];
  const m = (w.note || '').match(/(\d+)% chance to (burn|shock|poison)/i);
  if (m) ails.push([m[2].toUpperCase(), +m[1]]);
  if (w.proc) w.proc[1].forEach(k => ails.push([k, w.proc[0] / w.proc[1].length]));
  const twice = !ranged && it ? (thief ? 30 : 5) : 0;
  // Chance this attack crits, worked out the same way as the real roll (natural 20, a Thief's 15+, or a weapon's crit range on a hit).
  let critN = 0;
  for (let r = 2; r <= 20; r++) { const hit = r === 20 || (thief && r >= 15) || r + bonus >= ac; if (r === 20 || (thief && r >= 15) || (hit && w.critOn && r >= w.critOn)) critN++; }
  const critP = critN / 20 * evade;
  // The lowest d20 face that hits: a natural 1 always misses, a natural 20 always hits, a Thief hits on 15+.
  let need = 20; for (let r = 19; r >= 2; r--) { if ((thief && r >= 15) || r + bonus >= ac) need = r; else break; }
  // Damage as one expression (D6+1 weapon with +3 STR reads D6+4), then where each part comes from.
  const dp = diceParts(w.dmg), flat = dp.mod + str - worn;
  const dmgExpr = dp.n ? `${dp.n > 1 ? dp.n : ''}D${dp.sides}${flat ? (flat > 0 ? '+' : '−') + Math.abs(flat) : ''}` : String(Math.max(1, flat));
  const wIco = it ? img(it.name, it.shown || 0, 'ico pvico') : '<span class="pvfist">Fist</span>';
  const wHit = it ? (WPN[it.name].hit || 0) : 0, dex = dexHit(h.st.DEX), wornHit = it ? WEAR_W[wearH(it)][0] : 0;
  const rng = lo === hi ? '' : ` <span class="pv-rng">${lo}–${hi}${floored ? ', min 1' : ''}</span>`;
  return `<div class="pv-act"><b>${ranged ? 'Shoot' : 'Attack'}</b> <span class="note">${it ? esc(it.name) : 'Fist'}</span></div>
    <div class="pv-row"><span>Roll needed</span><span class="pv-need">${needDie(need, h)}<i>${need === 20 ? 'natural 20 only' : 'or higher on the die'}</i></span></div>
    <div class="pv-src"><span>Source</span><span>d20 ${wHit ? `${wIco}${signed(wHit)}` : ''} ${dex ? `${statIco('DEX')}${signed(dex)}` : ''} ${wornHit ? `<i>worn</i> −${wornHit}` : ''} vs ${acBadge(ac, 'sm enemyac')}</span></div>
    <div class="pv-row"><span>Damage</span><span><b class="pv-dmg">${dmgExpr}</b>${undead ? ' <i>×1.5 undead</i>' : ''}</span></div>
    <div class="pv-src"><span>Source</span><span>${wIco}${String(w.dmg).replace(/^\+/, '')} ${str ? `${statIco('STR')}${signed(str)}` : ''} ${worn ? `<i>worn</i> −${worn}` : ''}</span></div>
    <div class="pv-row sm"><span>Critical</span><span>${pctTxt(critP)}</span></div>
    ${twice ? `<div class="pv-row sm"><span>Double Strike</span><span>${twice}%</span></div>` : ''}
    ${evade < 1 ? `<div class="pv-row sm"><span></span><span>Evades 15% of hits (included above)</span></div>` : ''}
    ${ails.map(([k, c]) => `<div class="pv-row sm"><span>${ail(k)}</span><span>${ailImmune(f, k) || (k === 'BURN' && fireMult(f) === 0) ? 'Immune' : `${Math.round(c)}% on a hit · ${Math.round(c * p)}% overall`}</span></div>`).join('')}`;
}
const PV = {el: null, hold: null, hide: null, held: 0, lastTouch: 0};
const pvTouchy = () => Date.now() - PV.lastTouch < 800;
function showPreview(anchor, html) {
  if (!PV.el) { PV.el = document.createElement('div'); PV.el.className = 'tip pv'; PV.el.setAttribute('role', 'tooltip'); document.body.appendChild(PV.el); }
  const t = PV.el; t.innerHTML = html; t.hidden = false; clearTimeout(PV.hide);
  const r = anchor.getBoundingClientRect(), tw = t.offsetWidth, th = t.offsetHeight, W = innerWidth, H = innerHeight, gap = 10;
  let x, y;
  if (r.right + gap + tw <= W - 8) { x = r.right + gap; y = r.top; }
  else if (r.left - gap - tw >= 8) { x = r.left - gap - tw; y = r.top; }
  else { x = r.left + r.width / 2 - tw / 2; y = r.top - th - gap; if (y < 8) y = r.bottom + gap; }
  t.style.left = Math.max(8, Math.min(W - tw - 8, x)) + 'px'; t.style.top = Math.max(8, Math.min(H - th - 8, y)) + 'px';
}
const needDie = (n, h) => { const p = h ? diePal(h) : {pal: 'Cleric', alt: false}; return `<span class="pvdie${typeof n === 'string' ? ' na' : ''}${p.alt ? ' alt' : ''}" style="${dieVars(p.pal, false)}" title="${typeof n === 'string' ? 'This spell always hits, so no roll is needed' : `Roll ${n} or higher on a d20 to hit`}">${dieSVG(20, (DIE_PAL[p.pal] || {}).sparkle)}<b>${n}</b></span>`; };
function hidePreview() { if (PV.el) PV.el.hidden = true; }
/* One spell against one foe. */
function spellPreview(h, sp, f) {
  const s = SPELLS[sp];
  let out = `<div class="pv-act"><b>${esc(sp)}</b> <span class="note">spell</span></div>`;
  if (s.kind === 'ctl') {
    const base = f.lvl <= 5 ? s.base[0] : s.base[1], ch = Math.min(85, base + h.st.INT);
    const immune = ailImmune(f, s.status);
    return out + `<div class="pv-row"><span>${s.status === 'SLEEP' ? 'Sleep' : 'Entangle'}</span><span>${immune ? '<b>Immune</b>' : `<b class="pv-pct">${ch}%</b>`}</span></div>
      <div class="pv-row sm"><span></span><span>${s.turns} turns · ${base}% + ${h.st.INT} INT${ch === 85 ? ' (max 85%)' : ''}</span></div>`;
  }
  if (s.kind !== 'dmg') return out + `<div class="pv-row sm"><span></span><span>${esc(s.desc)}</span></div>`;
  if (s.undead && f.type !== 'Undead') return out + `<div class="pv-row"><span>Effect</span><span><b>None</b> (only harms the undead)</span></div>`;
  const ie = intDmgExpr(h.st.INT), [ilo, ihi] = diceRange(ie);
  const adj = b => { if (h.cls === 'Magic User') b = Math.round(b * .9); if (HYBRID.includes(h.cls)) b = Math.floor(b / 2); if (s.halfInt) b = Math.floor(b / 2); return b; };
  const [dlo, dhi] = diceRange(s.dice), fm = sp === 'Fireball' ? fireMult(f) : 1;
  const lo = Math.max(1, Math.floor((dlo + adj(ilo)) * fm)), hi = Math.max(1, Math.floor((dhi + adj(ihi)) * fm));
  const share = s.halfInt ? 'half ' : h.cls === 'Magic User' ? '90% ' : HYBRID.includes(h.cls) ? 'half ' : '';
  // One damage expression: the full INT dice fold in (D6+1 with D3+4 reads D6+D3+5); a scaled INT bonus folds in as a flat amount or range.
  const spellExpr = () => {
    const sd = diceParts(s.dice), id = diceParts(ie), die = (n, x) => `${n > 1 ? n : ''}D${x}`;
    const base = sd.n ? die(sd.n, sd.sides) : '';
    if (!share && id.n) { const m = sd.mod + id.mod; return `${base}${base ? '+' : ''}${die(id.n, id.sides)}${m ? '+' + m : ''}`; }
    const bl = adj(ilo) + sd.mod, bh = adj(ihi) + sd.mod;
    return bl === bh ? `${base}${bl ? '+' + bl : ''}` : `${base}+${bl}–${bh}`;
  };
  out += `<div class="pv-row"><span>Roll needed</span><span class="pv-need">${needDie('N/A', h)}<i>magic never misses</i></span></div>
    <div class="pv-row"><span>Damage</span><span>${fm === 0 ? '<b class="pv-dmg">Immune</b>' : `<b class="pv-dmg">${spellExpr()}</b>`}</span></div>
    <div class="pv-src"><span>Source</span><span>${img(sp, 0, 'ico pvico')}${s.dice} ${ie !== '0' ? `${statIco('INT')}+${ie}` : ''}</span></div>`;
  if (s.splash) out += `<div class="pv-row sm"><span></span><span>Every other enemy takes half</span></div>`;
  if (s.target === 'all') out += `<div class="pv-row sm"><span></span><span>Hits every enemy, then 5 sparks</span></div>`;
  if (s.ail) out += `<div class="pv-row sm"><span>${ail(s.ail[0])}</span><span>${ailImmune(f, s.ail[0]) || (s.ail[0] === 'BURN' && fireMult(f) === 0) ? 'Immune' : s.ail[1] + '%'}</span></div>`;
  if (s.self) out += `<div class="pv-row sm"><span></span><span>Costs the caster ${s.self} HP</span></div>`;
  return out;
}
