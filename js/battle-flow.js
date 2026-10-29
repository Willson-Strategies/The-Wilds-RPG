/* ---- keeping the fight moving ----
   A monster's turn runs on a timer. If anything goes wrong during it, the error is noted in the log and the
   fight carries on rather than freezing; a watchdog also restarts a monster turn that never fired (e.g. after a reload). */
let MON_T = null, MON_PENDING = false, TURN_SEEN = 0;
function reportErr(e) {
  try { console.error(e); localStorage.setItem('baseline_lasterr', `${new Date().toISOString()} ${e && e.message}\n${e && e.stack}`); } catch (x) {}
  try { addLog(`<span class="sys">(A hiccup in the fight was skipped: ${esc(String(e && e.message || e))})</span>`); } catch (x) {}
}
function scheduleMonster(i, delay) {
  clearTimeout(MON_T); MON_PENDING = true; TURN_SEEN = Date.now();
  MON_T = setTimeout(() => { MON_PENDING = false; runMonster(i); }, delay);
}
function runMonster(i) {
  const B = S.battle; if (!B || B.over || !B.cur || B.cur.side !== 'm' || B.cur.i !== i) return;
  try { monsterAct(i); }
  catch (e) { reportErr(e); FX_LEAD = 0; try { finishMonster(); } catch (e2) { reportErr(e2); try { nextTurn(); } catch (e3) { reportErr(e3); } } }
}
function resumeBattle() {
  const B = S.battle; if (!B || B.over || B.phase) return;
  FXQ = []; FX_LEAD = 0; B.mode = null;
  const q = B.cur, u = q && (q.side === 'p' ? S.party[q.i] : B.foes[q.i]);
  if (!q || !u || u.dead) { try { nextTurn(); } catch (e) { reportErr(e); } return; }
  if (q.side === 'm' && !MON_PENDING) scheduleMonster(q.i, 700);
}
setInterval(() => {   // watchdog
  const B = S && S.battle;
  if (!B || B.over || !B.cur || B.cur.side !== 'm' || MON_PENDING) { TURN_SEEN = Date.now(); return; }
  if (Date.now() - TURN_SEEN > 5000 && document.querySelector('.foe')) { TURN_SEEN = Date.now(); resumeBattle(); }
}, 1500);
function monsterAct(i) {
  const B = S.battle, f = B.foes[i];
  if (!B || f.dead) return nextTurn();
  f.turn++; ATK_BASE = 0;
  const sp = f.special;
  // once-per-fight area attacks
  if (/5x5 area/.test(sp) && !f.used.area && Math.random() < .5) {
    f.used.area = true;
    addLog(`<span class="crit">${nameOf(f)} unleashes ${(sp.split(':')[0] || 'its power').toLowerCase()}!</span>`);
    S.party.filter(h => !h.dead).forEach(h => {
      fx(/Fire breath/.test(sp) ? {k: 'hellfire', u: h} : {k: 'magic', u: h, col: f.type === 'Undead' ? ['#b8f0b0', '#1e3c1e'] : ['#d8b8ff', '#3a1a6a']});
      if (/its damage to each character/.test(sp) || /Fire breath/.test(sp)) { const d = damage(h, roll(f.dmg), null); addLog(`<span class="bad">${esc(h.name)} takes ${d}.</span>`); }
      let m = sp.match(/(\d+)% chance (?:each character (?:falls asleep|is shocked)|of Sleep)/i);
      if (m) applyAil(h, /shock/i.test(m[0]) ? 'SHOCK' : 'SLEEP', +m[1], {turns: 1});
    });
    return finishMonster();
  }
  if (/Heals one ally/.test(sp) && (f.used.heal || 0) < 2) {
    const hurt = B.foes.filter(x => !x.dead && x.hp < x.max * .6);
    if (hurt.length) { healSfx(); const x = hurt[0]; const n0 = x.hp; const n = roll('D6'); x.hp = Math.min(x.max, x.hp + n); fx({k: 'castglow', u: f}); FX_LEAD = HEAL_AT; fx({k: 'heal', u: x}); fx({k: 'num', u: x, d: x.hp - n0, pct: x.hp / x.max * 100, col: 'heal', heal: true}); FX_LEAD = 0; f.used.heal = (f.used.heal || 0) + 1; addLog(`<span class="heal">${nameOf(f)} chants; ${nameOf(x)} heals ${n}.</span>`); return finishMonster(); }
  }
  if (/Casts Lightning Bolt/.test(sp) && !f.used.bolt && Math.random() < .5) {
    f.used.bolt = true;
    addLog(`<span class="crit">${nameOf(f)} hurls a Lightning Bolt!</span>`);
    const chain = chainOrder(f, S.party.filter(h => !h.dead));
    FX_LEAD = 0; fx({k: 'bolt', u: chain[0], from: f, chain});
    chain.forEach((h, n) => { FX_LEAD = BOLT_HIT + n * BOLT_STEP; fx({k: 'magic', u: h, col: SPELL_COL['Lightning Bolt']}); const d = damage(h, roll(f.dmg), null); addLog(`<span class="bad">${esc(h.name)} takes ${d}.</span>`); if (!h.dead) applyAil(h, 'SHOCK', 10); });
    FX_LEAD = 0;
    return finishMonster();
  }
  if (f.name === 'Beastman Warlord') {
    if (R(8) >= 7) {   // Swing: D3 to every living hero, a flat 55% each, whatever their AC
      addLog(`<span class="crit">${nameOf(f)} sweeps his great axe through the whole party!</span>`);
      FX_LEAD = 0; fx({k: 'charge', u: f, to: S.party.find(h => !h.dead)}); FX_LEAD = CHARGE;
      S.party.filter(h => !h.dead).forEach(h => {
        if (R(100) <= 55) { fx({k: 'crush', u: h}); const d = damage(h, roll('D3'), null); addLog(`<span class="bad">The swing catches ${esc(h.name)} for ${d}.</span>`); }
        else { fx({k: 'miss', u: h}); addLog(`<span class="miss">${esc(h.name)} ducks under the swing.</span>`); }
      });
      FX_LEAD = 0; return finishMonster();
    }
    const h = pickHero(); if (h) monsterAttack(f, h, f.hp < f.max / 2 ? '1' : null);   // Fury: +1 damage below half HP
    return finishMonster();
  }
  for (let a = 0; a < f.attacks; a++) {
    const h = pickHero(); if (!h) break;
    if (/Tail spikes/.test(sp)) { monsterAttack(f, h); const others = S.party.filter(x => !x.dead && x !== h); if (others.length) monsterAttack(f, others[Math.floor(Math.random() * others.length)]); continue; }
    monsterAttack(f, h, (/Charge/.test(sp) && f.turn === 1) ? 'D4' : null);
    if (/Sweep/.test(sp)) { const j = S.party.indexOf(h), o = S.party[j + 1] || S.party[j - 1]; if (o && !o.dead) monsterAttack(f, o); }
  }
  finishMonster();
}
function finishMonster() { save(); if (checkEnd()) return; nextTurn(); }
function checkEnd() {
  const B = S.battle; if (!B || B.over) return true;
  if (B.foes.every(f => f.dead)) { B.over = 'win'; render(); return true; }
  if (S.party.every(h => h.dead)) { B.over = 'lose'; render(); return true; }   // render waits for the last dice and blows, then shows defeat
  return false;
}
function victory() {
  if (!S.battle) return;
  const B = S.battle, gains = Object.fromEntries(S.party.map(h => [h.id, 0]));
  const before = S.party.map(h => ({lvl: h.level, xp: h.xp}));
  const avg = avgLevel();
  B.kills.forEach(k => {
    const xp = XP_MON[k.lvl] || 10;
    S.party.forEach(h => {
      let share = k.by === h.id ? .8 : (k.by ? .2 / 3 : .25);
      share *= 1 + .125 * Math.max(0, avg - h.level);
      if (h.fellInBattle) share *= .1;   // heroes who fell in this battle earn only 10% of their share
      gains[h.id] += xp * share;
    });
  });
  const lines = [];
  S.party.forEach(h => { const g = Math.round(gains[h.id]); h.xp += g; lines.push(`${esc(h.name)} +${g} XP`); });
  const ups = [];
  S.party.forEach(h => { while (h.level < 10 && h.xp >= XP_CUM[h.level + 1]) ups.push(levelUp(h)); });
  // loot
  let gold = 0; const found = [];
  B.kills.forEach(k => {
    const row = DATA.loot.find(r => k.lvl >= r[0] && k.lvl <= r[1]);
    for (let n = 0; n < row[2]; n++) {
      const d = R(10);
      if (d <= row[3]) continue;
      if (d <= row[4]) { gold += row[5] + Math.floor(Math.random() * (row[6] - row[5] + 1)); continue; }
      const it = rollItem(k.lvl); if (it) { found.push(it); S.inv.push(newItem(it)); }
    }
  });
  S.gold += gold;
  if (S.dev && S.dev.freeSpells) restoreSpells();   // developer cheat: spells refresh after every battle
  S.party.forEach(h => { if (h.drained) { h.st.STR += h.drained; h.drained = 0; } ['SLEEP', 'ENTANGLED', 'SHOCK', 'WARD', 'RESIST', 'RANGE'].forEach(k => delete h.status[k]); });
  const res = `<div class="sys">Victory. ${lines.join(' · ')}</div>${gold ? `<div class="hit">Found ${gold} GP.</div>` : ''}${found.length ? `<div class="hit">Found: ${found.join(', ')}.</div>` : ''}${ups.map(u => `<div class="crit">${u}</div>`).join('')}`;
  let bossTxt = '';
  S.events = S.events || {};
  if (B.boss === 'warlord') {
    S.events.warlordWon = true;
    const w = DATA.drops['5-6']; let t = R(100), pickW = 'Scimitar'; for (const [n, v] of Object.entries(w)) { if ((t -= v) <= 0) { pickW = n; break; } }
    S.inv.push(newItem(pickW)); found.push(pickW);
    bossTxt = `<p style="margin-top:8px">The Warlord falls at last, and the forest seems to breathe out. Among his gear you find a fine weapon: <b>${esc(pickW)}</b>. With the trail clear, you make for the castle. Marmillian will want to hear about the ridge.</p>`;
  }
  if (B.reward) {
    const g = B.reward[0] + Math.floor(Math.random() * (B.reward[1] - B.reward[0] + 1)); S.gold += g; gold += g;
    bossTxt = `<div class="lore-after">${woodLoreHtml(B.loreKey, true)}</div><p>Among the bones and roots you find <b>${g} gold pieces</b>.</p>`;
  }
  if (B.boss === 'beastcamp' && S.events.beastcamp) bossTxt = `<p style="margin-top:8px">The camp is cleared again. You already carry the Beastmen's map.</p>`;
  else if (B.boss === 'beastcamp') {
    S.gold += 437; S.events.beastcamp = true; gold += 437;
    bossTxt = `<p style="margin-top:8px">Among the Beastmen's belongings you find a hoard of <b>437 gold pieces</b>, and a crude map scratched onto boar hide. It shows a path through the thorns to <b>Bramblewood</b>. The caravan can now take you there.</p>`;
  }
  S.lastResult = res; S.battle = null; scheduleEnc(); save();
  const back = S.returning; S.returning = false;
  xpRise(before, () => modal(`<h2>Victory</h2>${bossTxt}<div style="display:grid;gap:4px">${lines.map(l => `<div>${l}</div>`).join('')}${gold ? `<div><b>${gold} GP</b> collected.</div>` : ''}${found.length ? `<div class="row">Loot: ${found.map(n => img(n) + ' ' + n).join(', ')}</div>` : ''}${ups.map(u => `<div><b>${u}</b></div>`).join('')}</div><div class="row" style="margin-top:12px"><button class="btn red" data-close>${back ? 'Continue to the castle' : 'Onward'}</button></div>`,
    () => { if (back) { S.loc = 'castle'; castleTab = 'square'; restAll(); } save(); go(); }));
}
/* Build 117 (Tom's feedback): after a win each hero's XP bar fills gradually instead of snapping. On a level up the
   bar flashes and the hero's card keeps a gold aura until the victory screen is closed. Then the result screen opens. */
const xpFrac = (L, xp) => L >= 10 ? 1 : Math.max(0, Math.min(1, (xp - XP_CUM[L]) / (XP_CUM[L + 1] - XP_CUM[L])));
function xpRise(before, done) {
  const FILL = 1100, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let longest = 0;
  S.party.forEach((h, i) => {
    const card = document.querySelector(`.hero[data-hero="${i}"]`), bar = card && card.querySelector('.bar2.xp i'), b = before[i];
    if (!bar || reduce) return;
    const nums = card.querySelector('.nums > span:last-child'), cl = card.querySelector('.cl');
    const gain = h.xp - b.xp, ups = h.level - b.lvl, t0 = 250 + i * 160;
    const set = (pct, ms) => { bar.style.transition = ms ? `width ${ms}ms cubic-bezier(.35,.6,.3,1)` : 'none'; bar.style.width = pct * 100 + '%'; };
    const count = (from, to, ms) => { const s0 = performance.now(); const tick = () => { const k = Math.min(1, (performance.now() - s0) / ms); if (nums) nums.textContent = `XP ${Math.round(from + (to - from) * k)}${h.level < 10 ? ' / ' + XP_CUM[h.level + 1] : ''}`; if (k < 1) requestAnimationFrame(tick); }; tick(); };
    set(xpFrac(b.lvl, b.xp), 0);
    if (gain > 0) setTimeout(() => { const r = bar.getBoundingClientRect(); fxAt('fx-xpgain', r.left + scrollX + r.width / 2, r.top + scrollY - 8, 0, 0, '', `+${gain} XP`); }, t0);
    let t = t0;
    if (!ups) { setTimeout(() => { set(xpFrac(h.level, h.xp), FILL); count(b.xp, h.xp, FILL); }, t); t += FILL; }
    else {
      setTimeout(() => { set(1, FILL * .8); count(b.xp, XP_CUM[b.lvl + 1], FILL * .8); }, t); t += FILL * .8;
      setTimeout(() => {
        card.classList.add('lvlup'); bar.parentNode.classList.add('flash'); levelSound();
        if (cl) cl.innerHTML = cl.innerHTML.replace(/Level \d+/, 'Level ' + h.level);
      }, t); t += 700;
      setTimeout(() => { set(0, 0); requestAnimationFrame(() => { set(xpFrac(h.level, h.xp), FILL * .8); count(XP_CUM[h.level], h.xp, FILL * .8); }); }, t); t += FILL * .8;
    }
    longest = Math.max(longest, t);
  });
  setTimeout(done, longest ? longest + 450 : 0);
}
function levelSound() {
  if (!AC || AC.state !== 'running') return;
  const t = AC.currentTime + .01;
  [523, 659, 784, 1047].forEach((f, k) => { const o = AC.createOscillator(), g = AC.createGain(), at = t + k * .09;
    o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(.12, at + .02); g.gain.exponentialRampToValueAtTime(.0001, at + .7);
    o.connect(g); g.connect(sfxBus); o.start(at); o.stop(at + .72); });
}
/* fleeing: only the party leader (front-most living hero) can try */
const partyLeader = () => S.party.find(h => !h.dead);
function fleeChance() {
  const live = S.party.filter(h => !h.dead), foes = S.battle.foes.filter(f => !f.dead);
  const dex = live.reduce((a, h) => a + h.st.DEX, 0) / live.length;
  const lvl = foes.reduce((a, f) => a + f.lvl, 0) / foes.length;
  const c = Math.max(60, Math.min(75, 67 + 1.5 * (dex - (2 + 1.7 * lvl))));
  // Ambushed parties are pinned down: the same formula squeezed into 25-33%.
  return Math.round(S.battle.ambush ? 25 + (c - 60) * 8 / 15 : c);
}
function tryFlee(h) {
  if (S.battle.noFlee) return false;
  if (R(100) > fleeChance()) { addLog(`<span class="miss">${esc(h.name)} looks for a way out, but the enemy cuts off the retreat.</span>`); return false; }
  const B = S.battle; B.over = 'fled';
  S.party.forEach(x => { if (x.drained) { x.st.STR += x.drained; x.drained = 0; } ['SLEEP', 'ENTANGLED', 'SHOCK', 'WARD', 'RESIST'].forEach(k => delete x.status[k]); });
  S.lastResult = `<div class="sys">The party fled from battle.</div>`; S.battle = null; scheduleEnc(); save();
  const back = S.returning; S.returning = false;
  modal(`<h2>Escaped</h2><p>${esc(h.name)} spots a gap and the party breaks away, leaving the fight behind. No experience or loot is won from a battle you flee.</p><div class="row"><button class="btn red" data-close>${back ? 'Continue to the castle' : 'Onward'}</button></div>`,
    () => { if (back) { S.loc = 'castle'; castleTab = 'square'; restAll(); } save(); go(); });
  return true;
}
function rollItem(lvl) {
  const it = rollBaseItem(lvl);
  // 7% of item drops become a unique weapon: level 3+ monsters, a class in the party can use it, once per game.
  if (it && lvl >= 3 && R(100) <= 7) {
    S.uniquesFound = S.uniquesFound || [];
    const opts = Object.keys(UNIQUES).filter(n => !S.uniquesFound.includes(n) && S.party.some(h => h.cls === UNIQUES[n].cls));
    if (opts.length) { const n = opts[Math.floor(Math.random() * opts.length)]; S.uniquesFound.push(n); return n; }
  }
  return it;
}
function rollBaseItem(lvl) {
  const d = R(10);
  if (d <= 3) return null;
  if (d <= 7) {
    const band = lvl <= 2 ? '1-2' : lvl <= 4 ? '3-4' : lvl <= 6 ? '5-6' : lvl <= 9 ? '7-9' : '10';
    const w = DATA.drops[band]; let t = R(100);
    for (const [n, v] of Object.entries(w)) { if ((t -= v) <= 0) return n; }
    return 'Dagger';
  }
  if (d <= 9) { const opts = lvl <= 2 ? ['Leather Armour', 'Shield'] : lvl <= 5 ? ['Leather Armour', 'Shield', 'Chain Mail'] : ['Chain Mail', 'Shield', 'Plate Mail']; return opts[Math.floor(Math.random() * opts.length)]; }
  const sp = Object.keys(SPELLS).filter(n => SPELLS[n].lvl === 1 || lvl >= 5);
  return sp[Math.floor(Math.random() * sp.length)];
}
function levelUp(h) {
  const c = DATA.classes[h.cls];
  h.level++;
  STATS.forEach((s, i) => { h.st[s] = Math.min(capOf(h.cls, s), h.st[s] + roll(c.levelup[i + 1])); });
  const gain = Math.max(1, roll(c.levelup[0]) + conHP(h.st.CON));
  h.max += gain; h.hp += gain;
  fixBook(h);
  return `${esc(h.name)} reaches level ${h.level}! (+${gain} HP)`;
}
function defeat() {
  // Party wipe: lose half the gold (rounded up); equipped weapons lose 5% durability, armour and shields 10%.
  const lost = Math.ceil(S.gold / 2);
  S.party.forEach(h => ['melee', 'ranged', 'armour', 'shield'].forEach(k => { addWear(h.equip[k], k === 'melee' || k === 'ranged' ? .25 : .5); }));
  if (S.battle && S.battle.loreKey && S.woodLore) S.woodLore = S.woodLore.filter(k => k !== S.battle.loreKey);   // the dead soldier waits to be met again
  S.gold -= lost; S.battle = null; S.loc = 'castle'; castleTab = 'temple'; S.returning = false;
  S.party.forEach(h => { h.status = {}; if (h.drained) { h.st.STR += h.drained; h.drained = 0; } });
  S.lastResult = '';
  save();
  modal(`<h2>The Party Has Fallen</h2><p>A passing caravan finds your broken party and carries them back to the castle. Thieves have picked over the bodies: <b>${lost} GP</b> is gone, and your gear has taken a beating (weapons −5% durability, armour and shields −10%). The clerics will raise the fallen.</p><div class="row"><button class="btn red" data-close>Return to the castle</button></div>`, () => go());
}
