/* ---- Build 87: placeholder dice. A d20 tumbles for every attack roll and a damage die for every damage roll,
   settling on the face that came up. Shapes follow the die (d4 triangle, d6 square, d8 diamond, d10 kite, d12 pentagon,
   d20 hexagon). Art to be redesigned later. ---- */
const DIE_SHAPE = {
  4: ['M50 7 95 88H5Z', 'M50 7v52M50 59 5 88M50 59l45 29'],
  6: ['M10 10h80v80H10Z', 'M10 10l12 12h56l12-12M22 22v56H10M78 22v56h12M22 78h56'],
  8: ['M50 3 95 50 50 97 5 50Z', 'M5 50h90M50 3 30 50 50 97 70 50Z'],
  10: ['M50 3 93 40 50 97 7 40Z', 'M50 3 32 52 50 64 68 52ZM7 40l25 12M93 40 68 52M50 64v33'],
  12: ['M50 3 95 36 78 93H22L5 36Z', 'M50 20 72 38 64 66H36L28 38ZM50 3v17M95 36 72 38M78 93 64 66M22 93l14-27M5 36l23 2'],
  2: ['M50 5a45 45 0 1 0 .1 0Z', 'M50 15a35 35 0 1 0 .1 0ZM50 22a28 28 0 1 0 .1 0Z'],   // a D2 is a coin with a milled rim (Build 117)
  tok: ['M50 6a44 44 0 1 0 .1 0Z', 'M50 20a30 30 0 1 0 .1 0Z'],   // a round damage token for weapons with no damage dice (Build 117)
  20: ['M50 3 92 27v46L50 97 8 73V27Z', 'M50 20 76 64H24ZM50 3v17M92 27 76 64M92 73 76 64M50 97 76 64M50 97 24 64M8 73l16-9M8 27l16 37M92 27 50 20 8 27'],
};
/* Dice colours, after real tabletop sets but darkened to suit the game: a to-hit d20 per class, and a damage die per
   class that always stays in the red family. f = body, h = highlight, d = shadow, l = facet lines, n = numbers, e = edge.
   Fighter: heavy steel. Dwarf: forged bronze. Elf: moss green. Cleric: ivory with gold numbers. Magic User: smoky
   violet with a fleck of sparkle. Thief: graphite. Monsters: charred, sooty dice. */
const DIE_PAL = {
  Fighter: {hit: {f: '#8c959b', h: '#dfe5e8', d: '#343c40', l: '#4e575c', n: '#fffaf0', e: '#15191b'}, dmg: {f: '#a3221a', h: '#e46a50', d: '#460806', l: '#6a1410', n: '#fff2dc', e: '#1a0302'}},
  Dwarf: {hit: {f: '#a8743a', h: '#ecc684', d: '#4a2a0e', l: '#6a4420', n: '#fff4d8', e: '#1e1006'}, dmg: {f: '#9a3416', h: '#dc7840', d: '#421206', l: '#5e2010', n: '#fff0d8', e: '#1a0602'}},
  Elf: {hit: {f: '#5f8a4c', h: '#b8dc94', d: '#203a18', l: '#34522a', n: '#f4fae6', e: '#0e1a0a'}, dmg: {f: '#7e1c22', h: '#c85456', d: '#34060e', l: '#561418', n: '#fbe8dc', e: '#160204'}},
  Cleric: {hit: {f: '#e2d6b4', h: '#fffcee', d: '#a08c5c', l: '#b8964e', n: '#6a4606', e: '#4a3818'}, dmg: {f: '#a82a18', h: '#ec8454', d: '#480a04', l: '#c8962e', n: '#ffe6a0', e: '#200402'}},
  'Magic User': {hit: {f: '#6a52a8', h: '#ccb8f6', d: '#20163f', l: '#4a3a80', n: '#f6eeff', e: '#120a24'}, dmg: {f: '#6a1018', h: '#b04434', d: '#280406', l: '#480a12', n: '#f6e6dc', e: '#140204'}, sparkle: true},
  Thief: {hit: {f: '#3e3e44', h: '#8e8e96', d: '#101014', l: '#2a2a30', n: '#e4d0a0', e: '#000000'}, dmg: {f: '#561010', h: '#a03424', d: '#180202', l: '#3a0808', n: '#ecccA0', e: '#000000'}},
  monster: {hit: {f: '#4a2e24', h: '#94684e', d: '#160a06', l: '#2e1a12', n: '#f0d8b8', e: '#0a0402'}, dmg: {f: '#6a2414', h: '#ac5432', d: '#260804', l: '#3e1408', n: '#f8e0c0', e: '#0a0200'}},
};
/* Which palette a unit rolls with. A second hero of the same class gets a shifted variant, so every character's dice differ. */
function diePal(u) {
  const i = S.party.indexOf(u);
  if (i < 0) return {pal: 'monster', alt: false};
  return {pal: DIE_PAL[u.cls] ? u.cls : 'Fighter', alt: S.party.slice(0, i).filter(x => x.cls === u.cls).length % 2 === 1};
}
const dieVars = (pal, dmg) => { const p = (DIE_PAL[pal] || DIE_PAL.monster)[dmg ? 'dmg' : 'hit']; return `--df:${p.f};--dh:${p.h};--dd:${p.d};--dl:${p.l};--dn:${p.n};--de:${p.e}`; };
let DIE_ID = 0;
function dieSVG(sides, sparkle) {
  const [o, l] = DIE_SHAPE[sides] || DIE_SHAPE[20], id = 'dg' + (++DIE_ID);
  // Sparkle flecks sit around the edge of the face, never over the number.
  const fleck = sparkle ? Array.from({length: 6}, () => { const a = Math.random() * 6.283, r = 24 + Math.random() * 10; return `<circle class="ds" cx="${(50 + Math.cos(a) * r).toFixed(1)}" cy="${(54 + Math.sin(a) * r * .9).toFixed(1)}" r="${(.8 + Math.random() * 1.3).toFixed(1)}"/>`; }).join('') : '';
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="${id}" cx="36%" cy="28%" r="80%"><stop offset="0" style="stop-color:var(--dh,#fffaf0)"/><stop offset=".45" style="stop-color:var(--df,#efe4c8)"/><stop offset="1" style="stop-color:var(--dd,#8a7350)"/></radialGradient></defs><path d="${o}" fill="url(#${id})"/>${fleck}<path class="dl" d="${l}"/><path class="do" d="${o}"/></svg>`;
}
function diceFx(e) {
  const win = e.side === 'm' ? document.querySelector(`.foe[data-foe="${e.i}"] .win`) : document.querySelector(`.hero[data-hero="${e.i}"] .pwrap`);
  if (!win || (!e.sides && !e.token)) return;
  const foe = e.side === 'm', size = foe ? 58 : 46, step = size + (foe ? 8 : 6);   // bigger dice (Build 117)
  // Foes: top-left of the monster's window. Heroes: the empty right-hand end of the hero's card, beside the name.
  const r = (foe ? win : win.closest('.hero') || win).getBoundingClientRect();
  const x = foe ? r.left + scrollX + 8 + e.slot * step : r.right + scrollX - 14 - size - (1 - e.slot) * step;
  const y = foe ? r.top + scrollY + 8 : r.top + scrollY + 14;
  const cls = 'fx-die' + (e.dmg ? ' dmg' : '') + (e.crit ? ' crit' : '') + (e.fumble ? ' fumble' : '') + (e.miss ? ' missed' : '') + (foe ? '' : ' small') + (e.alt ? ' alt' : '') + (e.sides === 2 && !e.token ? ' d2' : '');
  const cap = e.cap || '', post = e.post || 0;
  const hold = Math.round((e.hold ?? 1300) * 1.2), life = e.tumble + post + hold;   // dice stay on screen 20% longer before fading (Build 97)
  const el = document.createElement('div'); el.className = cls;
  const pal = e.pal || 'monster';
  el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;--sz:${size}px;--out:${life}ms;${dieVars(pal, e.dmg)}`;
  el.innerHTML = `${dieSVG(e.token ? 'tok' : e.sides, (DIE_PAL[pal] || {}).sparkle)}<b>${e.token ? '' : R(e.sides)}</b>${cap ? `<i>${cap}</i>` : ''}${e.label ? `<u>${e.label}</u>` : ''}`;
  fxLayer().appendChild(el); setTimeout(() => el.remove(), life + 450);
  const num = el.querySelector('b');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  dimFor(e.tumble + post);
  if (reduce || e.tumble <= 0) { num.textContent = e.mods && e.mods.length ? e.mods[e.mods.length - 1].to : e.val; el.classList.add('settled', 'judged'); return; }
  if (e.token) { el.animate([{transform: 'scale(.4)', opacity: 0}, {transform: 'scale(1.08)', opacity: 1, offset: .7}, {transform: 'none'}], {duration: e.tumble, easing: 'ease-out', fill: 'backwards'}); setTimeout(() => { el.classList.add('settled'); runMods(el, e); }, e.tumble); return; }
  diceSound(e.tumble, !foe);
  // Every throw is different: where it comes from, how far it spins, how it bounces before settling.
  const side = Math.random() < .5 ? -1 : 1, sx = side * (10 + Math.random() * 24), sy = -(12 + Math.random() * 22);
  const spin0 = side * (200 + Math.random() * 300), wob = () => (Math.random() - .5);
  const bounces = Math.random() < .55 ? 2 : 1;
  const frames = [{transform: `translate(${sx}px,${sy}px) rotate(${spin0}deg) scale(.55)`, opacity: 0, offset: 0},
    {transform: `translate(${sx * .3}px,${-3 - Math.random() * 7}px) rotate(${spin0 * (.3 + Math.random() * .2)}deg) scale(.92)`, opacity: 1, offset: .32 + Math.random() * .08}];
  if (bounces === 2) frames.push({transform: `translate(${-sx * .1}px,${1 + Math.random() * 2}px) rotate(${wob() * 60}deg) scale(1.06)`, offset: .58 + Math.random() * .06},
    {transform: `translate(${sx * .04}px,${-2 - Math.random() * 3}px) rotate(${wob() * 18}deg) scale(1)`, offset: .8});
  else frames.push({transform: `translate(${-sx * .08}px,${1 + Math.random() * 2}px) rotate(${wob() * 34}deg) scale(1.05)`, offset: .7 + Math.random() * .06});
  frames.push({transform: 'none', offset: 1});
  el.animate(frames, {duration: e.tumble, easing: 'cubic-bezier(.25,.7,.35,1)', fill: 'backwards'});
  // The faces flick past fast at first, then slow as the die comes to rest.
  const t0 = performance.now();
  const flick = () => {
    const k = (performance.now() - t0) / e.tumble;
    if (k >= 1) { num.textContent = e.val; el.classList.add('settled'); runMods(el, e); return; }
    num.textContent = R(e.sides); setTimeout(flick, 40 + k * k * 110 + Math.random() * 20);
  };
  flick();
}
/* Build 117 (Tom's feedback): after a die settles, each modifier appears under it with its source (weapon, stat or
   monster) and value, flies up into the die and the number on its face counts up to the new total. A to-hit die then
   shows the AC it had to reach and whether it hit. e.mods = [{ico, txt, to, neg}], worked out by the battle engine. */
function runMods(el, e) {
  const num = el.querySelector('b'), mods = e.mods || [];
  mods.forEach((m, k) => setTimeout(() => {
    if (!el.isConnected) return;
    const c = document.createElement('span'); c.className = 'dmod' + (m.neg ? ' neg' : ''); c.innerHTML = `${m.ico || ''}<em>${m.txt}</em>`;
    el.appendChild(c);
    setTimeout(() => c.classList.add('in'), MOD_STEP * .62);
    setTimeout(() => { c.remove(); num.textContent = m.to; num.classList.remove('bump'); void num.offsetWidth; num.classList.add('bump'); modSound(m.neg); }, MOD_STEP * .62 + 230);
  }, MOD_PAUSE + k * MOD_STEP));
  setTimeout(() => el.isConnected && el.classList.add('judged'), MOD_PAUSE + mods.length * MOD_STEP);
}
/* Darkens the screen behind the dice while they roll and add up, so they stand out. */
let DIM_END = 0, DIM_T = null;
function dimFor(ms) {
  let d = document.getElementById('dicedim');
  if (!d) { d = document.createElement('div'); d.id = 'dicedim'; document.body.appendChild(d); }
  DIM_END = Math.max(DIM_END, Date.now() + ms); d.classList.add('on'); clearTimeout(DIM_T);
  const off = () => { const left = DIM_END - Date.now(); if (left > 0) DIM_T = setTimeout(off, left + 250); else d.classList.remove('on'); };
  DIM_T = setTimeout(off, ms + 250);
}
function modSound(neg) {
  if (!AC || AC.state !== 'running') return;
  const t = AC.currentTime + .005, o = AC.createOscillator(), g = AC.createGain(), f = neg ? 520 : 760;
  o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(neg ? f * .7 : f * 1.5, t + .09);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.13, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .2);
  o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + .22);
}
/* Modifier chips for a die: pairs of [icon, value, multiplier?] in order, skipping zeros, with the running total. */
const modIco = {stat: k => `<span class="dmi">${STAT_SVG[k]}</span>`, item: (n, st) => img(n, st || 0, 'dmi'), mon: f => MONS[f.name] ? `<img class="dmi mon" alt="" src="${MONS[f.name]}">` : '', shield: () => `<span class="dmi">${SHIELD_SVG}</span>`};
function modList(start, parts) {
  let v = start; const out = [];
  parts.forEach(([ico, n, mult, word]) => {
    if (mult) { if (mult === 1) return; v = Math.floor(v * mult); out.push({ico, txt: (word ? word + ' ' : '') + '×' + mult, to: v}); return; }
    if (!n) return; v += n; out.push({ico, txt: (word ? word + ' ' : '') + signed(n), to: v, neg: n < 0});
  });
  return out;
}
/* A dice rattle made on the fly (no audio file): a run of small clacks that spread out as the die slows, then a
   heavier knock as it settles. Count, spacing and pitch change every throw. */
function diceSound(ms, small) {
  if (!AC || AC.state !== 'running') return;
  const now = AC.currentTime + .01, dur = ms / 1000, n = 5 + R(4), gaps = [];
  for (let i = 0; i < n; i++) gaps.push((.6 + Math.random() * .8) * (1 + i * .35));
  const sum = gaps.reduce((a, b) => a + b, 0); let t = 0;
  gaps.forEach((g, i) => { t += g / sum * dur * .9; clack(now + t - g / sum * dur * .9 * .5, (small ? .16 : .22) * (1 - i / n * .5) + Math.random() * .08, 1500 + Math.random() * 2800, false); });
  clack(now + dur, small ? .32 : .42, 700 + Math.random() * 500, true);
}
/* The sound of the red slash across the "Monsters approach" panel: a rising whoosh timed to the sweep (which starts
   80 ms in and lasts 240 ms), a ringing steel "shing" as it finishes, and the game's blade hit underneath. */
function encSlashSfx() {
  if (!AC || AC.state !== 'running') return;
  const t0 = AC.currentTime + .05, len = .34;
  const buf = AC.createBuffer(1, Math.ceil(AC.sampleRate * len), AC.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = AC.createBufferSource(), bp = AC.createBiquadFilter(), g = AC.createGain();
  src.buffer = buf; bp.type = 'bandpass'; bp.Q.value = 1.6;
  bp.frequency.setValueAtTime(500, t0); bp.frequency.exponentialRampToValueAtTime(4800, t0 + .26);
  g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.55, t0 + .2); g.gain.exponentialRampToValueAtTime(.0001, t0 + len);
  src.connect(bp); bp.connect(g); g.connect(sfxBus); src.start(t0); src.stop(t0 + len);
  const ring = t0 + .22;
  [[2300, .07], [3480, .05], [5150, .035], [6900, .02]].forEach(([f, v]) => {
    const o = AC.createOscillator(), og = AC.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f * 1.02, ring); o.frequency.exponentialRampToValueAtTime(f, ring + .5);
    og.gain.setValueAtTime(.0001, ring); og.gain.exponentialRampToValueAtTime(v, ring + .008); og.gain.exponentialRampToValueAtTime(.0001, ring + .6);
    o.connect(og); og.connect(sfxBus); o.start(ring); o.stop(ring + .62);
  });
  setTimeout(() => playSfx('blade', .75, 1.1), 270);
}
function clack(at, vol, freq, knock) {
  const len = knock ? .07 : .028, buf = AC.createBuffer(1, Math.ceil(AC.sampleRate * len), AC.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, knock ? 3 : 6);
  const src = AC.createBufferSource(), bp = AC.createBiquadFilter(), g = AC.createGain();
  src.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = knock ? 2.2 : 5; g.gain.value = vol;
  src.connect(bp); bp.connect(g); g.connect(sfxBus); src.start(at);
}
/* Queues a die over unit u that settles just as the current FX_LEAD (used by damage spells, whose projectile timing is fixed). */
function dieFx(u, o) {
  const L = FX_LEAD, tumble = dieTime(), start = Math.max(0, L - tumble);
  FX_LEAD = start; fx(Object.assign({k: 'dice', u, tumble: L - start || tumble}, o)); FX_LEAD = L;
}
/* Attack dice run in order: the d20 tumbles, and only a damaging hit then rolls the damage die. The attacker
   lunges once the last die has landed, and the blow lands CHARGE later. Times are ms from the start of the action. */
const DIE_GAP = 150;
const dieTime = () => Math.round(560 + Math.random() * 160);   // slower and more deliberate (Build 117), and never quite the same
const MOD_PAUSE = 320, MOD_STEP = 700, VERDICT = 600, TOKEN_T = 320;
const modsTime = (n, verdict) => MOD_PAUSE + n * MOD_STEP + (verdict ? VERDICT : 220);
let DICE_SHIFT = 0, SWING_CHARGE_AT = 0, SWING_IMPACT = 0;
function diceTimeline(start, withDamage, charge, hitMods = 0, dmgMods = 0) {
  const t20 = dieTime(), p20 = modsTime(hitMods, true), s20 = start + t20 + p20, dStart = s20 + DIE_GAP;
  const tD = withDamage === 'token' ? TOKEN_T : withDamage ? dieTime() : 0, pD = withDamage ? modsTime(dmgMods, false) : 0;
  const settled = withDamage ? dStart + tD + pD : s20;
  const impact = settled + 140 + (charge ? CHARGE : 80);
  return {t20, p20, tD, pD, dStart, impact, chargeAt: impact - CHARGE};
}
function dieAt(u, o, start, tumble, impact) {
  const L = FX_LEAD; FX_LEAD = start;
  fx(Object.assign({k: 'dice', u, tumble, hold: Math.max(700, impact - start - tumble - (o.post || 0) + 450)}, o)); FX_LEAD = L;
}
/* The caption under a to-hit d20: the total after bonuses and the AC it has to reach, e.g. "+3 = 6 vs (shield) 9". */
const hitCap = (nat, total, ac, hit, keen) => `${nat === 20 ? 'Natural 20 · ' : nat === 1 ? 'Natural 1 · ' : keen && total < ac ? 'Keen strike · ' : ''}vs ${SHIELD_SVG}${ac} <s class="${hit ? 'yes' : 'no'}">${hit ? 'HIT' : 'MISS'}</s>`;
const signed = n => n ? (n > 0 ? '+' + n : '−' + Math.abs(n)) : '';
