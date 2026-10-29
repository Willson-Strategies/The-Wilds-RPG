/* ---------------- battle engine ---------------- */
/* Strays from deeper areas (Build 114): on each wild encounter, 2% that a single monster from 2 levels above the
   area turns up, always alone; otherwise 5% that one monster from the next level up appears, half the time alone and
   half the time mixed into a normal group (at least 2). Falls back to a normal encounter if no such monster exists. */
function strayRoll(r) {
  const at = lv => DATA.monsters.filter(m => !BOSSES.includes(m.name) && m.lvl === lv);
  const d = R(100);
  if (d <= 2) return at(r.lvl + 2).length ? {up: 2, alone: true, from: at(r.lvl + 2)} : null;
  if (d <= 7 && at(r.lvl + 1).length) return {up: 1, alone: Math.random() < .5, from: at(r.lvl + 1)};
  return null;
}
function pickMonsters(r) {
  const stray = strayRoll(r);
  const L = avgLevel(), k = R(10);
  let n = L <= 2 ? (k <= 5 ? 1 : k <= 9 ? 2 : 3)
          : L <= 4 ? (k <= 3 ? 1 : k <= 7 ? 2 : k <= 9 ? 3 : 4)
          : (k <= 2 ? 1 : k <= 5 ? 2 : k <= 8 ? 3 : k === 9 ? 4 : 5);
  if (stray) n = stray.alone ? 1 : Math.max(2, n);
  const strayAt = stray ? (stray.alone ? 0 : Math.floor(Math.random() * n)) : -1;
  const pool = DATA.monsters.filter(m => !BOSSES.includes(m.name) && m.lvl === r.lvl);
  const lower = DATA.monsters.filter(m => !BOSSES.includes(m.name) && m.lvl === r.lvl - 1);
  const out = [];
  for (let i = 0; i < n; i++) {
    const src = i === strayAt ? stray.from : (lower.length && Math.random() < .3) ? lower : pool;
    const m = src[Math.floor(Math.random() * src.length)];
    out.push({id: 'm' + i, name: m.name, type: m.type, lvl: m.lvl, hp: m.hp, max: m.hp, ac: m.ac, hit: m.hit || 0, dmg: m.dmg, attacks: m.attacks || 1, special: m.special || '', status: {}, dead: false, used: {}, turn: 0, lastBy: null, stray: i === strayAt ? stray.up : 0});
  }
  const counts = {};
  out.forEach(m => { counts[m.name] = (counts[m.name] || 0) + 1; });
  const seen = {};
  out.forEach(m => { if (counts[m.name] > 1) { seen[m.name] = (seen[m.name] || 0) + 1; m.label = m.name + ' ' + 'ABCDE'[seen[m.name] - 1]; } else m.label = m.name; });
  return out;
}
function makeFoe(m, i) { return {id: 'm' + i, name: m.name, label: m.name, type: m.type, lvl: m.lvl, hp: m.hp, max: m.hp, ac: m.ac, hit: m.hit || 0, dmg: m.dmg, attacks: m.attacks || 1, special: m.special || '', status: {}, dead: false, used: {}, turn: 0, lastBy: null}; }
function startBattle(ambush = false, opts = {}) {
  stopTimers();
  const r = region();
  const picked = opts.foes ? opts.foes.map((n, i) => makeFoe(DATA.monsters.find(m => m.name === n), i)) : pickMonsters(r);
  if (opts.boss === 'beastcamp') picked.forEach(f => { f.hit += 1; f.hp = f.max = Math.ceil(f.max * 1.5); });   // the encampment's Beastmen: +1 to hit, +50% HP
  if (opts.foes) { const cnt = {}, seen = {}; picked.forEach(m => cnt[m.name] = (cnt[m.name] || 0) + 1); picked.forEach(m => { if (cnt[m.name] > 1) { seen[m.name] = (seen[m.name] || 0) + 1; m.label = m.name + ' ' + 'ABCDEF'[seen[m.name] - 1]; } }); }
  const seenN = new Set(); S.lastFoes = picked.filter(f => !seenN.has(f.name) && seenN.add(f.name)).map(f => ({name: f.name, type: f.type, lvl: f.lvl, ac: f.ac, hit: f.hit, dmg: f.dmg, attacks: f.attacks, special: f.special}));
  sheetFoe = 0; LOG_SEEN = null; INPUT_LOCK = 0;
  S.party.forEach(h => { delete h.fellInBattle; delete h.dyingFx; if (h.status) delete h.status.RANGE; });
  Object.keys(HPW).forEach(k => { if (k[0] === 'm') delete HPW[k]; });
  S.battle = {foes: picked, round: 1, queue: [], cur: null, mode: null, spell: null, log: [], kills: [], over: false, ambush, noFlee: !!opts.noFlee, intro: opts.intro || null, boss: opts.boss || null, loreKey: opts.loreKey || null, reward: opts.reward || null};
  addLog(`<span class="sys">${fmtClock(S.clock)}: ${S.battle.foes.map(f => f.label).join(', ')} ${S.battle.foes.length > 1 ? 'attack' : 'attacks'}!</span>`);
  if (ambush) { addLog('<span class="bad">Ambush! The enemy strikes before your party can react.</span>'); newRound(); }
  else if (opts.direct) { addLog(`<span class="sys">The party stands its ground.</span>`); newRound(); }   // already chose to fight (boss scenes)
  else S.battle.phase = 'encounter';   // the party chooses to fight or flee first
  save(); screenBattle();
}
function addLog(h) { S.battle.logN = (S.battle.logN || 0) + 1; S.battle.log.unshift(h); if (S.battle.log.length > 80) S.battle.log.pop(); }
/* Initiative, rolled once per battle. Each side acts in level order (equal levels roll off evenly);
   the two lines are merged hero-vs-monster by how far the monster outlevels the hero. */
const INIT_ODDS = {0: 60, 1: 50, 2: 30, 3: 15, 4: 8};
const heroFirstChance = d => d < 0 ? 100 : (INIT_ODDS[d] ?? 4);
function rollInitiative() {
  const B = S.battle;
  const line = (arr, side) => arr.map((u, i) => ({side, i, lvl: u.level || u.lvl, r: Math.random()})).sort((a, b) => b.lvl - a.lvl || a.r - b.r);
  const P = line(S.party, 'p'), M = line(B.foes, 'm'), out = [];
  while (P.length && M.length) out.push((R(100) <= heroFirstChance(M[0].lvl - P[0].lvl) ? P : M).shift());
  return interleave(out.concat(P, M).map(({side, i}) => ({side, i})));
}
// A monster never takes two turns in a row while a hero still has a turn to take.
function interleave(list, prevSide) {
  const rest = list.slice(), out = [];
  while (rest.length) {
    let j = 0;
    const last = out.length ? out[out.length - 1].side : prevSide;
    if (last === 'm' && rest[0].side === 'm') { const k = rest.findIndex(q => q.side === 'p'); if (k > 0) j = k; }
    out.push(rest.splice(j, 1)[0]);
  }
  return out;
}
function newRound() {
  const B = S.battle;
  if (!B.order) {
    B.order = rollInitiative();
    addLog(`<span class="sys">Initiative: ${B.order.map(q => q.side === 'p' ? esc(S.party[q.i].name) : nameOf(B.foes[q.i])).join(', ')}.</span>`);
  }
  const alive = B.order.filter(q => q.side === 'p' ? !S.party[q.i].dead : !B.foes[q.i].dead);
  const P = alive.filter(q => q.side === 'p'), M = alive.filter(q => q.side === 'm');
  if (B.skip !== undefined) { const sk = B.skip; delete B.skip; const j = P.findIndex(q => q.i === sk); if (j >= 0) P.splice(j, 1); }
  B.queue = ((B.ambush || B.firstStrike) && B.round === 1) ? M.concat(P) : interleave(alive.filter(q => q.side === 'm' || P.includes(q)), B.lastSide);
  nextTurn();
}
function nextTurn() {
  const B = S.battle;
  if (checkEnd()) return;
  while (B.queue.length) {
    const q = B.queue.shift();
    const u = q.side === 'p' ? S.party[q.i] : B.foes[q.i];
    if (u.dead) continue;
    if (startOfTurn(u, q.side)) { if (checkEnd()) return; continue; }
    if (u.dead) { if (checkEnd()) return; continue; }
    B.cur = q; B.mode = null; B.spell = null; B.lastSide = q.side;
    save();
    if (q.side === 'm') { render(); scheduleMonster(q.i, Math.max(520, FX_BUSY - Date.now() + 120)); return; }
    render(); return;
  }
  B.round++; addLog(`<span class="sys">Round ${B.round}</span>`); newRound();
}
function nameOf(u) { return u.label || u.name; }
function startOfTurn(u, side) {
  const st = u.status;
  if (side === 'p') delete st.RANGE;   // back in the thick of it
  if (st.POISON) { fx({k: 'ail', u, kind: 'POISON'}); const d = roll(st.POISON.dice || 'D3'); damage(u, d, null, {poison: true}); addLog(`<span class="bad">${nameOf(u)} suffers ${d} POISON damage.</span>`.replace('POISON', ail('POISON'))); if (--st.POISON.turns <= 0) delete st.POISON; if (u.dead) return true; }
  if (st.BURN && --st.BURN.turns <= 0) delete st.BURN;
  if (st.WARD && --st.WARD.turns <= 0) delete st.WARD;
  if (st.RESIST && --st.RESIST.turns <= 0) delete st.RESIST;
  if (side === 'm' && /Regenerates (\d+) HP/.test(u.special) && !st.BURNREGEN) { const n = +RegExp.$1; u.hp = Math.min(u.max, u.hp + n); addLog(`<span class="heal">${nameOf(u)} regenerates ${n} HP.</span>`); }
  if (st.SHOCK) { fx({k: 'ail', u, kind: 'SHOCK'}); delete st.SHOCK; addLog(`<span class="miss">${nameOf(u)} reels from the ${ail('SHOCK')} and loses the turn.</span>`); return true; }
  if (st.SLEEP) { addLog(`<span class="miss">${nameOf(u)} is asleep.</span>`); if (--st.SLEEP.turns <= 0) { delete st.SLEEP; addLog(`<span class="sys">${nameOf(u)} wakes.</span>`); } return true; }
  if (st.ENTANGLED) { addLog(`<span class="miss">${nameOf(u)} struggles against the vines.</span>`); if (--st.ENTANGLED.turns <= 0) delete st.ENTANGLED; return true; }
  return false;
}
function damage(u, d, by, opts = {}) {
  if (u.status.BURN && !opts.poison) d = Math.ceil(d * 1.15);
  if (u.status.WARD) d = Math.ceil(d / 2);
  d = Math.max(opts.crit ? 2 : 0, d);
  u.hp -= d;
  if (!opts.magic && !opts.poison && u.status.SLEEP) { delete u.status.SLEEP; }
  if (by) u.lastBy = by;
  const isHero = S.party.includes(u);
  fx({k: 'num', u, d, pct: Math.max(0, u.hp) / u.max * 100, crit: opts.crit, dbl: opts.dbl, col: opts.poison ? 'poison' : opts.col || (isHero ? 'hurt' : opts.magic ? 'magic' : '')});
  if (u.hp <= 0 && !u.dead) {
    u.dead = true; u.dyingFx = true; setTimeout(() => { if (u.dyingFx) { delete u.dyingFx; const el = unitCard(u); if (el) el.classList.add('dead'); } }, 4500); u.hp = 0; u.status = {};
    if (S.party.includes(u)) { u.fellInBattle = true; addLog(`<span class="bad">${esc(u.name)} falls!</span>`); ['armour', 'shield'].forEach(k => addWear(u.equip[k], R(10) / 20)); }   // falling costs worn armour and shield 1-10% durability
    else { addLog(`<span class="crit">${nameOf(u)} is slain.</span>`); S.battle.kills.push({lvl: u.lvl, by: u.lastBy}); }
  }
  return d;
}
function fireMult(u) { return /Immune to fire/i.test(u.special || '') ? 0 : /fire damage reduced by 50%/i.test(u.special || '') ? .5 : 1; }
// As in the rules Doc: Sleep lowers AC by 15%, Entangle by 25%, rounded to the nearest point (Build 105; was a flat -3 / -5).
function foeAC(f) { return f.ac - (f.status.SLEEP ? Math.round(f.ac * .15) : 0) - (f.status.ENTANGLED ? Math.round(f.ac * .25) : 0); }
function applyAil(u, kind, chance, extra = {}) {
  if (u.dead) return false;
  if (/Immune to [^.]*\b(sleep|shock|poison|tangle)/i.test(u.special) && new RegExp(kind === 'ENTANGLED' ? 'tangle' : kind, 'i').test(u.special)) return false;
  if (u.status.RESIST && Math.random() < .25) return false;
  if (Math.random() * 100 >= chance) return false;
  if (kind === 'BURN' && u.special && fireMult(u) === 0) { addLog(`<span class="miss">${nameOf(u)} cannot burn.</span>`); return false; }
  // The ailment shows on the card only when its effect plays, after the blow that caused it (Build 115).
  const shownAt = Date.now() + FX_LEAD + 450;
  if (['BURN', 'SHOCK', 'POISON'].includes(kind)) fx({k: 'ail', u, kind, reveal: true});
  if (kind === 'BURN') { u.status.BURN = {turns: extra.short ? 2 : 3, at: shownAt}; const d = Math.max(1, Math.floor(roll('D3') * (u.special ? fireMult(u) : 1))); damage(u, d, extra.by, {magic: true, col: 'burn'}); addLog(`<span class="bad">${nameOf(u)} catches fire: ${ail('BURN')} for ${d}.</span>`); }
  else if (kind === 'SHOCK') { u.status.SHOCK = {turns: 1, at: shownAt}; addLog(`<span class="bad">${nameOf(u)} is jolted: ${ail('SHOCK')}!</span>`); }
  else if (kind === 'POISON') { u.status.POISON = {turns: extra.short ? 1 : 3, dice: extra.dice || 'D3', at: shownAt}; addLog(`<span class="bad">${nameOf(u)} is ${ail('POISON')}ed.</span>`.replace('</span>ed', '</span>ed')); }
  else u.status[kind] = {turns: extra.turns || 2, at: shownAt};
  return true;
}
/* party actions */
function heroAttack(h, f, ranged) {
  const it = ranged ? h.equip.ranged : h.equip.melee;
  const w = it ? WPN[it.name] : {hit: 0, dmg: '1', note: ''};
  if (ranged) h.status.RANGE = {turns: 1};   // keeping their distance: +2 AC until their next turn
  // The dice roll first (to hit, then damage on a hit); the hero lunges once they have landed.
  FX_LEAD = 0; SWING_CHARGE_AT = 0;
  try { heroSwings(h, f, ranged, it, w); } finally { FX_LEAD = SWING_CHARGE_AT; fx({k: 'charge', u: h, to: f, cry: !ranged}); FX_LEAD = 0; }
}
function heroSwings(h, f, ranged, it, w) {
  const swings = (!ranged && it) ? 1 + ((n => n === 20 || (h.cls === 'Thief' && n >= 15))(R(20)) ? 1 : 0) : 1;
  if (swings === 2) addLog(`<span class="crit">${esc(h.name)} strikes twice!</span>`);
  let t = FX_LEAD;
  for (let s = 0; s < swings && !f.dead; s++) {
    const nat = R(20), bonus = it ? weaponHit(h, it) : dexHit(h.st.DEX);
    const keen = h.cls === 'Thief' && nat >= 15, ac = foeAC(f);
    const hit = nat !== 1 && (nat === 20 || keen || nat + bonus >= ac);
    const crit = nat === 20 || keen || (hit && w.critOn && nat >= w.critOn);   // e.g. Gorewarden's Axe: a hit on 16-19 also crits
    const dr = hit ? rollShown(w.dmg) : null;
    const evaded = hit && /evades 15%/.test(f.special) && Math.random() < .15;
    // Where every point comes from, added to the dice one at a time (Build 117).
    const st = it ? wearH(it) : 0, wi = it ? modIco.item(it.name, st) : '';
    const hitMods = nat === 1 ? [] : modList(nat, [[modIco.stat('DEX'), dexHit(h.st.DEX)], [wi, it ? WPN[it.name].hit || 0 : 0], [wi, -(it ? WEAR_W[st][0] : 0), 0, 'worn']]);
    let d = 0, dmgMods = [];
    if (hit) {
      const strB = strDmg(h.st.STR), wearB = it ? WEAR_W[st][1] : 0, undead = /undead/.test(w.note) && f.type === 'Undead';
      d = dr.face + dr.mod + strB - wearB;
      if (undead) d = Math.floor(d * 1.5);
      if (crit) d = Math.floor(d * 1.5);
      d = Math.max(crit ? 2 : 1, d);
      dmgMods = modList(dr.face, [[wi, dr.mod], [modIco.stat('STR'), strB], [wi, -wearB, 0, 'worn'], [wi, 0, undead ? 1.5 : 1, 'undead'], ['', 0, crit ? 1.5 : 1, 'crit']]);
      const last = dmgMods.length ? dmgMods[dmgMods.length - 1].to : dr.face;
      if (last !== d) dmgMods.push({ico: '', txt: 'at least ' + d, to: d});
    }
    const withDmg = hit && !evaded && (dr.sides ? true : 'token');   // a flat-damage weapon shows a damage token instead of a die
    const tl = diceTimeline(t, withDmg, s === 0, hitMods.length, withDmg ? dmgMods.length : 0);
    dieAt(f, {sides: 20, val: nat, slot: 0, mods: hitMods, post: tl.p20, cap: hitCap(nat, nat + bonus, ac, hit, keen), crit, fumble: nat === 1, miss: !hit, label: 'to hit', ...diePal(h)}, t, tl.t20, tl.impact);
    if (s === 0) SWING_CHARGE_AT = tl.chargeAt;
    const dbl = swings === 2 && s === 0;   // the first blow of a double strike carries the "Double Strike!" label
    FX_LEAD = tl.impact; DICE_SHIFT = Math.max(DICE_SHIFT, tl.impact); t = tl.impact + 1250;   // the second blow's dice wait for the first pair to clear
    if (!hit) { fx({k: 'miss', u: f, dbl}); addLog(`<span class="miss">${esc(h.name)} ${ranged ? 'shoots at' : 'swings at'} ${nameOf(f)} and misses (${nat}${bonus ? '+' + bonus : ''} vs AC ${ac}).</span>`); continue; }
    if (withDmg) dieAt(f, {token: !dr.sides, sides: dr.multi ? Math.max(4, Math.min(20, diceParts(w.dmg).sides)) : dr.sides, val: dr.face, slot: 1, dmg: true, crit, mods: dmgMods, post: tl.pD, label: dr.multi ? diceParts(w.dmg).n + 'D' + diceParts(w.dmg).sides : 'damage', ...diePal(h)}, tl.dStart, tl.tD, tl.impact);
    if (evaded) { fx({k: 'miss', u: f, dbl}); addLog(`<span class="miss">${nameOf(f)} twists away from ${esc(h.name)}'s blow.</span>`); continue; }
    fx(Object.assign({u: f}, weaponStyle(it, ranged)));
    const dealt = damage(f, d, h.id, {crit, dbl});
    if (f.dead && it) addWear(it, .05);   // each kill costs the weapon 1% durability
    addLog(`<span class="${crit ? 'crit' : 'hit'}">${esc(h.name)} ${crit ? 'lands a critical hit on' : 'hits'} ${nameOf(f)} with the ${it ? it.name : 'fist'} for ${dealt}.</span>`);
    const m = (w.note || '').match(/(\d+)% chance to (burn|shock|poison)/i);
    if (m && !f.dead) applyAil(f, m[2].toUpperCase(), +m[1], {by: h.id});
    if (w.proc && !f.dead && R(100) <= w.proc[0]) { const k = w.proc[1][Math.floor(Math.random() * w.proc[1].length)]; applyAil(f, k, 100, {by: h.id, short: true}); }
  }
}
function spellBonus(h, sp) {
  const s = SPELLS[sp];
  let b = s.kind === 'heal' ? wisHeal(h.st.WIS) : (s.kind === 'dmg' ? intDmg(h.st.INT) : 0);
  if (s.kind === 'dmg' && h.cls === 'Magic User') b = Math.round(b * .9);   // the Magic User adds 90% of her INT damage bonus
  if (HYBRID.includes(h.cls)) b = Math.floor(b / 2);
  if (s.halfInt) b = Math.floor(b / 2);   // Fireball only adds half the INT bonus
  return b;
}
function castSpell(h, slot, target) {
  const sp = h.book[slot], s = SPELLS[sp], B = S.battle;
  h.used[slot] = s.lvl >= 2 ? 2 : 1;
  if (s.lvl >= 2) { h.spentL2 = h.spentL2 || []; h.spentL2.push(sp); }
  if (h.cls === 'Magic User' || h.cls === 'Cleric') grunt(h);   // a cry of effort as the spell is loosed
  addLog(`<span class="sys">${esc(h.name)} casts ${sp}.</span>`);
  if (s.kind === 'dmg') {
    if (s.splash && (!target || target.dead)) target = B.foes.find(f => !f.dead);
    const targets = s.target === 'all' ? chainOrder(h, B.foes.filter(f => !f.dead)) : s.splash ? [target, ...B.foes.filter(f => !f.dead && f !== target)] : [target];
    let rolled = 0, castBonus;
    // The damage dice roll and add up first; the spell flies once they have (Build 117).
    const PRE = 720 + modsTime(2, false) + 150; DICE_SHIFT = Math.max(DICE_SHIFT, PRE + CHARGE);
    const proj = sp === 'Magic Missile' || sp === 'Advanced Magic Missile' ? 'missile' : s.splash ? 'fireball' : sp === 'Lightning Bolt' ? 'bolt' : s.undead ? 'skull' : null;
    if (s.undead) setTimeout(() => playSfx('undead_ward', .9), PRE);
    if (proj && targets[0]) { FX_LEAD = PRE; fx({k: proj, u: targets[0], from: h, volley: sp === 'Advanced Magic Missile' ? 5 : 1, chain: targets, abyss: sp === 'Undead Abyss'}); }
    targets.forEach((f, n) => {
      FX_LEAD = PRE + (proj === 'missile' ? MM_HIT + (sp === 'Advanced Magic Missile' ? 4 * 70 : 0) : proj === 'fireball' ? FB_HIT + n * FB_SPREAD : proj === 'bolt' ? BOLT_HIT + n * BOLT_STEP : proj === 'skull' ? SKULL_HIT : 0);
      if (s.undead && f.type !== 'Undead') { fx({k: 'tag', u: f, text: 'No effect', col: '#b8a888'}); addLog(`<span class="miss">The holy word has no power over ${nameOf(f)}.</span>`); return; }
      const fresh = !(s.splash && rolled), rs = fresh ? rollShown(s.dice) : null;
      const r = fresh ? rs.total : rolled; rolled = Math.max(rolled, r);   // Fireball rolls once for the whole blast
      fx({k: 'magic', u: f, col: SPELL_COL[sp], small: s.splash && f !== target});
      const fm = sp === 'Fireball' ? fireMult(f) : 1;
      if (fm === 0) { fx({k: 'miss', u: f, spell: true}); addLog(`<span class="miss">${nameOf(f)} is untouched by the flames.</span>`); return; }
      const splash = s.splash && f !== target ? .5 : 1;   // Fireball: full blast on the chosen enemy, half to the rest
      const bonus = s.splash ? (castBonus ??= spellBonus(h, sp)) : spellBonus(h, sp);
      if (fresh && rs.sides) {   // the spell's own bonus, then the caster's INT, added to the die one at a time
        const mods = modList(rs.face, [[modIco.item(sp), rs.mod], [modIco.stat('INT'), bonus]]), tm = dieTime(), post = modsTime(mods.length, false), L = FX_LEAD;
        dieAt(f, {sides: rs.sides, val: rs.face, slot: 0, dmg: true, mods, post, label: 'damage', ...diePal(h)}, 0, tm, L);
      }
      const dealt = damage(f, Math.max(1, Math.floor((r + bonus) * fm * splash)), h.id, {magic: true});
      addLog(`<span class="hit">${nameOf(f)} takes ${dealt} magic damage.</span>`);
      if (s.ail && !f.dead) applyAil(f, s.ail[0], s.ail[1], {by: h.id});
    });
    FX_LEAD = 0;
    if (s.sparks) for (let k = 0; k < 5; k++) { const live = B.foes.filter(f => !f.dead); if (!live.length) break; const f = live[Math.floor(Math.random() * live.length)]; const d = Math.max(1, Math.floor(rolled / 4)); const others = live.filter(x => x !== f);
      FX_LEAD = PRE + BOLT_HIT + targets.length * BOLT_STEP + 150 + k * 130; fx({k: 'spark', u: f, from: others.length ? others[Math.floor(Math.random() * others.length)] : h}); damage(f, d, h.id, {magic: true}); addLog(`<span class="hit">A spark leaps to ${nameOf(f)} for ${d}.</span>`); }
    FX_LEAD = 0;
    if (s.self) { const d = roll(s.self); h.hp -= d; FX_LEAD = PRE + SKULL_HIT + 250; fx({k: 'num', u: h, d, pct: Math.max(0, h.hp) / h.max * 100, col: 'hurt'}); FX_LEAD = 0; addLog(`<span class="bad">The rite costs ${esc(h.name)} ${d} HP.</span>`); if (h.hp <= 0) { h.hp = 0; h.dead = true; addLog(`<span class="bad">${esc(h.name)} collapses.</span>`); } }
  } else if (s.kind === 'ctl') {
    const f = target, base = f.lvl <= 5 ? s.base[0] : s.base[1];
    const sleep = sp === 'Sleep', hitAt = sleep ? SLEEP_HIT : ENT_HIT;
    FX_LEAD = 0; fx({k: sleep ? 'stars' : 'vines', u: f, from: h});
    FX_LEAD = hitAt; fx({k: 'magic', u: f, col: sleep ? ['#c8d0ff', '#2a3466'] : ['#a8e09a', '#1d4f22'], small: true});
    const ch = Math.min(85, base + h.st.INT);
    if (/Immune to [^.]*(sleep|tangle)/i.test(f.special) && new RegExp(s.status === 'SLEEP' ? 'sleep' : 'tangle', 'i').test(f.special)) { fx({k: 'tag', u: f, text: 'Unaffected', col: '#b8a888'}); addLog(`<span class="miss">${nameOf(f)} is unaffected.</span>`); }
    else if (Math.random() * 100 < ch) { f.status[s.status] = {turns: s.turns, at: Date.now() + hitAt + 150}; fx({k: 'tag', u: f, text: sleep ? 'Asleep' : 'Entangled', col: sleep ? '#c8d0ff' : '#a8e09a', zzz: sleep}); addLog(`<span class="crit">${nameOf(f)} ${s.status === 'SLEEP' ? 'falls asleep' : 'is bound fast by vines'} (${ch}% chance).</span>`); }
    else { fx({k: 'tag', u: f, text: 'Resisted', col: '#b8a888'}); addLog(`<span class="miss">${nameOf(f)} resists (${ch}% chance).</span>`); }
    FX_LEAD = 0;
  } else if (s.kind === 'heal') {
    healSfx();
    const targets = s.target === 'party' ? S.party.filter(x => !x.dead) : [target];
    FX_LEAD = 0; fx({k: 'castglow', u: h});
    targets.forEach((x, i) => { const n = roll(s.dice) + spellBonus(h, sp); const before = x.hp; x.hp = Math.min(x.max, x.hp + n);
      FX_LEAD = HEAL_AT + i * 140; fx({k: 'heal', u: x, big: sp !== 'Cure Light Wounds'}); fx({k: 'num', u: x, d: x.hp - before, pct: x.hp / x.max * 100, col: 'heal', heal: true});
      addLog(`<span class="heal">${esc(x.name)} is healed for ${x.hp - before}.</span>`); });
    FX_LEAD = 0;
  } else if (s.kind === 'ward') { playSfx('protect', .85); fx({k: 'castglow', u: h}); FX_LEAD = HEAL_AT; fx({k: 'ward', u: target}); fx({k: 'tag', u: target, text: 'Warded', col: '#ffe08a'}); FX_LEAD = 0; target.status.WARD = {turns: 3, at: Date.now() + HEAL_AT + 500}; addLog(`<span class="heal">A pale ward settles over ${esc(target.name)}.</span>`); }
  else if (s.kind === 'cure') { healSfx(); fx({k: 'castglow', u: h}); FX_LEAD = HEAL_AT; fx({k: 'cleanse', u: target}); fx({k: 'tag', u: target, text: 'Cleansed', col: '#cfe6ff'}); FX_LEAD = 0; ['POISON', 'BURN', 'SHOCK', 'SLEEP', 'ENTANGLED'].forEach(k => delete target.status[k]); target.status.RESIST = {turns: 3}; addLog(`<span class="heal">${esc(target.name)} is cleansed.</span>`); }
}
/* monster actions */
function pickHero() {
  const live = S.party.map((h, i) => ({h, w: h.dead ? 0 : (i < 2 ? 3 : 1)})).filter(x => x.w);
  let t = live.reduce((a, x) => a + x.w, 0) * Math.random();
  for (const x of live) { if ((t -= x.w) <= 0) return x.h; }
  return live[0] && live[0].h;
}
function packBonus(f) { return /Pack tactics/.test(f.special) ? S.battle.foes.filter(x => x !== f && !x.dead && x.name === f.name).length : 0; }
const stoneSkin = h => h.cls === 'Dwarf' ? Math.min(12, 2 + h.level) : 0;
function monsterAttack(f, h, bonusDice) {
  const base = ATK_BASE;
  // As with heroes: the dice roll first, then the monster lunges and the blow lands.
  FX_LEAD = base; SWING_CHARGE_AT = base; SWING_IMPACT = base + CHARGE;
  try { monsterBlow(f, h, bonusDice); } finally { FX_LEAD = SWING_CHARGE_AT; fx({k: 'charge', u: f, to: h}); FX_LEAD = 0; ATK_BASE = SWING_IMPACT + 1250; }   // a second attack's dice wait for the first pair to clear
}
function monsterBlow(f, h, bonusDice) {
  // Monsters never crit: a natural 20 always hits but deals normal damage.
  const magic = /ranged magic attacks/.test(f.special);
  const toHit = f.hit + packBonus(f), nat = R(20), ac = heroAC(h);
  const hit = nat !== 1 && (nat === 20 || nat + toHit >= ac);
  const ranged = /Ranged bow attack|Tail spikes/.test(f.special);
  const blade = h.equip.melee && WPN[h.equip.melee.name] && WPN[h.equip.melee.name].parry;
  const parried = hit && !magic && !ranged && blade && R(100) <= blade;
  const evaded = hit && !parried && !magic && h.cls === 'Thief' && R(100) <= 4 + h.level;
  const dr = hit && !parried && !evaded ? rollShown(f.dmg) : null;
  const extra = dr && bonusDice ? roll(bonusDice) : 0;
  let d = dr ? dr.total + extra : 0, skin = false;
  if (dr && !magic && d > 1 && R(100) <= stoneSkin(h)) { d -= 1; skin = true; }
  // The monster's own bonuses, shown with its face, then the Dwarf's stone skin (Build 117).
  const mi = modIco.mon(f), pack = packBonus(f);
  const hitMods = nat === 1 ? [] : modList(nat, [[mi, f.hit], [mi, pack, 0, 'pack']]);
  const dmgMods = dr ? modList(dr.face, [[mi, dr.mod], [mi, extra, 0, 'charge'], [modIco.shield(), skin ? -1 : 0, 0, 'stone skin']]) : [];
  const start = FX_LEAD, tl = diceTimeline(start, dr && (dr.sides ? true : 'token'), true, hitMods.length, dmgMods.length);
  dieAt(h, {sides: 20, val: nat, slot: 0, mods: hitMods, post: tl.p20, cap: hitCap(nat, nat + toHit, ac, hit), fumble: nat === 1, miss: !hit, foeRoll: true, pal: 'monster'}, start, tl.t20, tl.impact);
  SWING_CHARGE_AT = tl.chargeAt; SWING_IMPACT = tl.impact; FX_LEAD = tl.impact; DICE_SHIFT = Math.max(DICE_SHIFT, tl.impact);
  if (!hit) { fx({k: 'miss', u: h, spell: magic}); addLog(`<span class="miss">${nameOf(f)} attacks ${esc(h.name)} and misses (${nat}+${toHit} vs AC ${ac}).</span>`); return; }
  if (parried) { fx({k: 'miss', u: h, label: 'Parried'}); addLog(`<span class="miss">${esc(h.name)} parries ${nameOf(f)}'s blow with the ${h.equip.melee.name}!</span>`); return; }
  if (evaded) { fx({k: 'miss', u: h, label: 'Evaded'}); addLog(`<span class="miss">${esc(h.name)} evades ${nameOf(f)}'s blow!</span>`); return; }
  dieAt(h, {token: !dr.sides, sides: dr.multi ? Math.max(4, Math.min(20, diceParts(f.dmg).sides)) : dr.sides, val: dr.face, slot: 1, dmg: true, mods: dmgMods, post: tl.pD, pal: 'monster'}, tl.dStart, tl.tD, tl.impact);
  if (h.status.SLEEP) delete h.status.SLEEP;
  fx(magic ? {k: 'magic', u: h, col: ['#d8b8ff', '#3a1a6a']} : ranged ? {k: 'arrow', u: h} : {k: monsterStyle(f), u: h});
  const dealt = damage(h, d, null);
  addLog(`<span class="bad">${nameOf(f)} ${magic ? 'blasts' : 'hits'} ${esc(h.name)} for ${dealt}.${skin ? ` <span class="sys">Stone skin turns 1 damage aside.</span>` : ''}</span>`);
  const sp = f.special;
  let m;
  if ((m = sp.match(/(\d+)% chance to (shock|burn|poison)/i))) applyAil(h, m[2].toUpperCase(), +m[1]);
  else if (/inflict poison/i.test(sp)) applyAil(h, 'POISON', 33, {dice: (sp.match(/\((D\d+(?:\+\d+)?) per turn/) || [0, 'D3'])[1]});
  else if (/Poison \((D\d+(?:\+\d+)?) per turn/.test(sp)) applyAil(h, 'POISON', 100, {dice: RegExp.$1});
  else if (/hits cause Burn/i.test(sp)) applyAil(h, 'BURN', 100);
  if (/Life drain|heals itself for half/i.test(sp)) { const n = Math.floor(dealt / 2); f.hp = Math.min(f.max, f.hp + n); if (n) addLog(`<span class="heal">${nameOf(f)} drains ${n} HP.</span>`); }
  if (/Strength drain/i.test(sp) && !h.dead) { h.st.STR = Math.max(0, h.st.STR - 1); h.drained = (h.drained || 0) + 1; addLog(`<span class="bad">${esc(h.name)} feels weaker.</span>`); }
}
