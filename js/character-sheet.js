/* ---------------- averages for the character sheet ---------------- */
function avgDice(expr) {
  let e = String(expr || 0).trim().replace(/^\+/, ''); let m;
  if ((m = e.match(/^(\d+)-(\d+)$/))) return (+m[1] + +m[2]) / 2;
  if (/^-?\d+$/.test(e)) return +e;
  if ((m = e.match(/^(\d*)D(\d+)([+-]\d+)?$/i))) return (+(m[1] || 1)) * (+m[2] + 1) / 2 + (+(m[3] || 0));
  return 0;
}
const AVG_CON = s => s < 8 ? 0 : s <= 12 ? 1 : s <= 15 ? 2 : s <= 17 ? 5.5 : s <= 19 ? 7 : s === 20 ? 7.5 : s <= 24 ? 8.5 : 9.5;
const AVG_WIS = s => s < 8 ? 0 : s <= 12 ? 1 : s <= 15 ? 3 : s <= 17 ? 5 : s <= 19 ? 5.5 : s === 20 ? 6.5 : s <= 24 ? 7.5 : 8.5;
const AVG_INT = s => s < 8 ? 0 : s <= 12 ? 1 : s <= 15 ? 4 : s <= 17 ? 6 : s <= 19 ? 7.5 : s === 20 ? 8.5 : s <= 24 ? 9.5 : 10.5;
const DICE_CON = s => s < 8 ? '+0' : s <= 12 ? '+1' : s <= 15 ? '+2' : s <= 17 ? '+D6+2' : s <= 19 ? '+2D6' : s === 20 ? '+D12+1' : s <= 24 ? '+D12+2' : '+D12+3';
const DICE_WIS = s => s < 8 ? '+0' : s <= 12 ? '+1' : s <= 15 ? '+D3+1' : s <= 17 ? '+D3+3' : s <= 19 ? '+D6+2' : s === 20 ? '+D6+3' : s <= 24 ? '+D6+4' : '+D6+5';
const DICE_INT = s => s < 8 ? '+0' : s <= 12 ? '+1' : s <= 15 ? '+D3+2' : s <= 17 ? '+D3+4' : s <= 19 ? '+D6+4' : s === 20 ? '+D6+5' : s <= 24 ? '+D6+6' : '+D6+7';
function hitOdds(bonus, ac, keenFrom, critFrom = 21) {
  let hit = 0, crit = 0;
  const kf = keenFrom === true ? 15 : typeof keenFrom === 'number' ? keenFrom : 21;
  for (let n = 1; n <= 20; n++) {
    const keen = n >= kf;
    if (n === 20 || keen) { hit++; crit++; continue; }
    if (n !== 1 && n + bonus >= ac) { hit++; if (n >= critFrom) crit++; }
  }
  return {hit: hit / 20, crit: crit / 20};
}
function weaponLine(h, it, foe) {
  if (!it) return null;
  const w = WPN[it.name], pen = WEAR_W[wearH(it)];
  const toHit = dexHit(h.st.DEX) + (w.hit || 0) - pen[0];
  const per = Math.max(1, avgDice(w.dmg) + strDmg(h.st.STR) - pen[1]);
  const undead = /undead/.test(w.note) && foe && foe.type === 'Undead' ? 1.5 : 1;
  const o = foe ? hitOdds(toHit, foe.ac, h.cls === 'Thief', w.critOn || 21) : null;
  const dbl = RANGED.includes(it.name) ? 0 : (h.cls === 'Thief' ? .3 : .05);
  const exp = o ? ((o.hit - o.crit) * per * undead + o.crit * per * undead * 1.5) * (1 + dbl) : null;
  return {name: it.name, toHit, dice: `${w.dmg}${strDmg(h.st.STR) ? ' + ' + strDmg(h.st.STR) + ' STR' : ''}${pen[1] ? ' − ' + pen[1] + ' wear' : ''}`, per, o, exp, dbl, note: w.note};
}
const pct = x => Math.round(x * 100) + '%';
function lastFoes() { return (S.lastFoes && S.lastFoes.length) ? S.lastFoes : [DATA.monsters.find(m => m.lvl === region().lvl)].filter(Boolean).map(m => ({name: m.name, type: m.type, lvl: m.lvl, ac: m.ac, hit: m.hit || 0, dmg: m.dmg, attacks: m.attacks || 1, special: m.special || ''})); }
let sheetFoe = 0;
/* What makes each class different, for the character sheet (Build 112). Numbers follow the hero's current level. */
const TIER_WORDS = {Basic: 'Basic', Light: 'Light', Standard: 'Standard', Advanced: 'Advanced', Superior: 'Superior', Legendary: 'Legendary'};
function classAbilities(h) {
  const L = h.level, b = bookFor(h.cls, h.level), tiers = DATA.classes[h.cls].tiers, top = tiers[tiers.length - 1];
  const slots = b[2] ? `${b[2]} spell slot${b[2] === 1 ? '' : 's'} at level ${L}${b[3] ? `, up to ${b[3]} for level 2 spells` : ''}.` : 'No spell slots yet; they come with later levels.';
  const out = {
    Fighter: [
      ['Master of arms', 'The only class that can wield Legendary weapons, and can wear any armour and a shield.'],
      ['Double Strike', 'A natural 20 on a separate D20 before each melee attack means two attacks instead of one (5%).'],
    ],
    Dwarf: [
      ['Stone skin', `Each time a non-magical attack damages the Dwarf, a ${stoneSkin(h)}% chance to take 1 less (rises by 1% a level, to 12% at level 10). Never below 1, and no help against magic or ailments.`],
      ['Heavy arms', 'Can wield weapons up to Superior and wear any armour and a shield.'],
      ['Double Strike', 'A natural 20 on a separate D20 before each melee attack means two attacks instead of one (5%).'],
    ],
    Elf: [
      ['Two traditions', 'Learns spells from both the Magic User and Cleric lists, with half the INT and WIS bonus. A level 2 slot can only hold Magic User spells.'],
      ['Spellbook', slots],
      ['Elven arms', 'Can wield weapons up to Standard and wear up to chain mail with a shield.'],
      ['Double Strike', 'A natural 20 on a separate D20 before each melee attack means two attacks instead of one (5%).'],
    ],
    Cleric: [
      ['Field medic', 'While the Cleric lives, every hour of rest heals each living hero D3+1 HP instead of D3.'],
      ['Healer\'s calling', 'Casts Cleric spells with the full WIS bonus to healing.'],
      ['Spellbook', slots],
      ['Armour of faith', 'Can wear up to chain mail, but no shield. Wields Basic and Light weapons.'],
    ],
    'Magic User': [
      ['Arcane study', 'Casts Magic User spells, adding her INT bonus to spell damage, and her INT to the chance of Sleep and Entangle.'],
      ['Spellbook', slots],
      ['Unarmoured', 'Cannot wear armour or a shield (rare magic armour may exist). Wields Basic weapons only.'],
    ],
    Thief: [
      ['Evasion', `Each time a non-magical attack would hit, a ${4 + L}% chance it misses instead (5% at level 1, rising by 1% a level to 14% at level 10).`],
      ['Keen strikes', 'A natural roll of 15 or higher always hits and is a critical hit, whatever the target\'s AC.'],
      ['Double Strike', 'A Thief strikes twice on 15 or higher on the separate D20 rolled before each melee attack (30%).'],
      ['Light fingers', 'Only a party with a Thief can open the trapped chests found on the road.'],
      ['Two traditions', 'Learns spells from both the Magic User and Cleric lists, with half the INT and WIS bonus.'],
      ['Spellbook', slots],
      ['Light armour', 'Can wear leather armour only, and no shield. Wields Basic weapons.'],
    ],
  };
  return out[h.cls] || [];
}
function heroSheet(i) {
  const h = S.party[i], foes = lastFoes(), f = foes[Math.min(sheetFoe, foes.length - 1)];
  const ac = heroAC(h), b = bookFor(h.cls, h.level);
  const bonusRow = s => ({STR: `+${strDmg(h.st.STR)} weapon damage`, DEX: `+${dexHit(h.st.DEX)} to hit, +${dexAC(h.st.DEX)} AC`, CON: `${DICE_CON(h.st.CON)} HP each level`,
    WIS: NO_MAGIC.includes(h.cls) ? 'No magic' : `${DICE_WIS(h.st.WIS)} healing${HYBRID.includes(h.cls) ? ' (half)' : ''}`, INT: NO_MAGIC.includes(h.cls) ? 'No magic' : `${DICE_INT(h.st.INT)} spell damage${HYBRID.includes(h.cls) ? ' (half)' : ''}`, CHA: 'Shops and encounters'})[s];
  const wl = ['melee', 'ranged'].map(k => weaponLine(h, h.equip[k], f)).filter(Boolean);
  let foeBlock = '';
  if (f) {
    const fo = hitOdds(f.hit, ac, false);
    const evade = h.cls === 'Thief' ? (4 + h.level) / 100 : 0;
    const pHit = fo.hit * (1 - evade), fAvg = avgDice(f.dmg);
    const skinP = stoneSkin(h) / 100;
    const incoming = f.attacks * fo.hit * (fAvg - (fAvg > 1 ? skinP : 0)) * (1 - evade) * (h.status.WARD ? .5 : 1);
    foeBlock = `<h3>Against ${esc(f.name)} <span class="note" style="text-transform:none;letter-spacing:0">(level ${f.lvl} ${f.type}, AC ${f.ac}, +${f.hit} to hit, ${f.dmg} damage${f.attacks > 1 ? ' ×' + f.attacks : ''})</span></h3>
    ${foes.length > 1 ? `<div class="row" style="margin-bottom:6px">${foes.map((x, j) => `<button class="btn small ${j === Math.min(sheetFoe, foes.length - 1) ? 'red' : ''}" data-sf="${j}">${esc(x.name)}</button>`).join('')}</div>` : ''}
    <div class="tw"><table class="t"><thead><tr><th>Attack</th><th class="n">To hit</th><th class="n">Chance to hit</th><th class="n">Crit</th><th>Damage per hit</th><th class="n">Avg per action</th></tr></thead><tbody>
    ${wl.map(x => `<tr><td>${img(x.name, 0)} ${x.name}${x.dbl ? `<div class="note">${pct(x.dbl)} chance to strike twice</div>` : ''}</td><td class="n">+${x.toHit}</td><td class="n"><b>${pct(x.o.hit)}</b></td><td class="n">${pct(x.o.crit)}</td><td>${x.dice} <span class="note">(avg ${x.per.toFixed(1)})</span></td><td class="n"><b>${x.exp.toFixed(1)}</b></td></tr>`).join('') || '<tr><td colspan="6" class="note">No weapon equipped.</td></tr>'}
    ${h.book.filter((x, j) => x && SPELLS[x].kind === 'dmg').map(sp => { const s = SPELLS[sp]; const ok = !s.undead || f.type === 'Undead'; const avg = avgDice(s.dice) + AVG_INT(h.st.INT) * (HYBRID.includes(h.cls) ? .5 : 1) * (s.halfInt ? .5 : 1); return `<tr><td>${img(sp)} ${sp}</td><td class="n">—</td><td class="n"><b>${ok ? '100%' : 'No effect'}</b></td><td class="n">—</td><td>${s.dice} ${DICE_INT(h.st.INT)}${HYBRID.includes(h.cls) ? ' (half)' : ''}</td><td class="n"><b>${ok ? avg.toFixed(1) : '0'}</b></td></tr>`; }).join('')}
    </tbody></table></div>
    <div class="tw" style="margin-top:6px"><table class="t"><tbody>
      <tr><td>Chance ${esc(f.name)} hits ${esc(h.name)}</td><td class="n"><b>${pct(pHit)}</b>${evade ? ` <span class="note">(after ${pct(evade)} Evasion)</span>` : ''}</td></tr>
      <tr><td>Its damage per hit</td><td class="n">${f.dmg} <span class="note">(avg ${fAvg.toFixed(1)})</span></td></tr>
      <tr><td>Expected damage to ${esc(h.name)} each of its turns</td><td class="n"><b>${incoming.toFixed(1)}</b></td></tr>
      <tr><td>Hits ${esc(h.name)} can take from full health</td><td class="n"><b>${Math.max(1, Math.ceil(h.max / Math.max(1, fAvg)))}</b></td></tr>
    </tbody></table></div>`;
  }
  const el = modal(`<div class="row" style="gap:14px;align-items:center"><img class="head" style="width:84px;height:84px" alt="" src="${HEADS[h.cls]}"><div><h2 style="margin:0">${esc(h.name)}</h2><p class="sub" style="margin:0">Level ${h.level} ${h.cls} · ${h.xp} XP${h.level < 10 ? ' (next level at ' + XP_CUM[h.level + 1] + ')' : ''}</p></div><button class="btn" style="margin-left:auto" data-close>Close</button></div>
    <h3 style="margin-top:12px">Stats</h3><table class="t"><tbody>${STATS.map(s => `<tr><td class="sgrow"><span class="sgi">${STAT_SVG[s]}</span><b>${s}</b></td><td class="n">${h.st[s]}<span class="note"> / ${capOf(h.cls, s)}</span></td><td class="note">${bonusRow(s)}</td></tr>`).join('')}</tbody></table>
    <h3 style="margin-top:14px">Character Abilities</h3>
    <div class="abil">${classAbilities(h).map(([n, d]) => `<div class="ab"><b>${n}</b><span>${d}</span></div>`).join('')}</div>`);
  el.querySelectorAll('[data-sf]').forEach(bt => bt.onclick = () => { sheetFoe = +bt.dataset.sf; el.remove(); heroSheet(i); });
}
/* A weapon's damage as one expression: its dice plus STR, less any wear (D6+1 with STR +3 reads D6+4). */
function comboDmg(h, it) {
  const w = WPN[it.name], pen = WEAR_W[wearH(it)], dp = diceParts(w.dmg), flat = dp.mod + strDmg(h.st.STR) - pen[1];
  const expr = dp.n ? `${dp.n > 1 ? dp.n : ''}D${dp.sides}${flat ? (flat > 0 ? '+' : '−') + Math.abs(flat) : ''}` : String(Math.max(1, flat));
  return {expr, avg: Math.max(1, avgDice(w.dmg) + strDmg(h.st.STR) - pen[1])};
}
/* One line of a breakdown tooltip: label (with an optional icon) and its value. */
const ttRow = (label, val) => `<div class="tt-row"><span>${label}</span><b>${val}</b></div>`;
function gearSummary(h) {
  const wpn = k => {
    const it = h.equip[k], lab = `<span class="lab">${k === 'melee' ? 'Melee' : 'Ranged'}</span>`;
    if (!it) return `<div class="gs-w">${lab}<span class="note">none</span></div>`;
    const w = WPN[it.name], pen = WEAR_W[wearH(it)], dex = dexHit(h.st.DEX), wh = w.hit || 0, str = strDmg(h.st.STR);
    const toHit = dex + wh - pen[0], c = comboDmg(h, it), plus = n => signed(n) || '+0';
    // Hover (or tap) either value to see where its bonuses come from.
    const hitTip = `<div class="tt-h">To hit: D20${toHit ? signed(toHit) : ''}</div>${ttRow(`${statIco('DEX')}`, plus(dex))}${ttRow(`${img(it.name, it.shown || 0, 'ico ttico')} ${esc(it.name)}`, plus(wh))}${pen[0] ? ttRow('Wear', '−' + pen[0]) : ''}<div class="tt-n">Hits when the total equals or beats the target's AC.</div>`;
    const dmgTip = `<div class="tt-h">Damage: ${c.expr}</div>${ttRow(`${img(it.name, it.shown || 0, 'ico ttico')} ${esc(it.name)}`, String(w.dmg).replace(/^\+/, ''))}${ttRow(`${statIco('STR')}`, plus(str))}${pen[1] ? ttRow('Wear', '−' + pen[1]) : ''}${/undead/.test(w.note || '') ? '<div class="tt-n">+50% against the undead.</div>' : ''}<div class="tt-n">A hit always deals at least 1.</div>`;
    return `<div class="gs-w">${lab}<span class="gs-k">To hit</span><b class="gs-hit" tabindex="0" data-tt="${esc(hitTip)}">D20${toHit ? signed(toHit) : ''}</b><span class="gs-k">Damage</span><b class="gs-dmg" tabindex="0" data-tt="${esc(dmgTip)}">${c.expr}</b></div>`;
  };
  // AC with a breakdown tooltip, like To hit and Damage: base 10, DEX, armour, shield (less wear), and the +2 at range.
  const ac = heroAC(h), dexA = dexAC(h.st.DEX), plus = n => signed(n) || '+0';
  const gearAC = k => { const it = h.equip[k]; if (!it) return ''; const a = ARMOUR[it.name], worn = a.wear[wearH(it)];
    return ttRow(`${img(it.name, it.shown || 0, 'ico ttico')} ${esc(it.name)}`, '+' + a.ac) + (worn ? ttRow(`${esc(it.name)} wear`, '−' + worn) : ''); };
  const acTip = `<div class="tt-h">Armour Class: ${ac}</div>${ttRow('Base', '10')}${ttRow(statIco('DEX'), plus(dexA))}${gearAC('armour')}${gearAC('shield')}${h.status && h.status.RANGE ? ttRow('At range', '+2') : ''}<div class="tt-n">The higher the armour class, the harder your character is to hit.</div>`;
  return `<div class="gsum"><div class="gs-def"><span class="acb ink gs-ac" tabindex="0" data-tt="${esc(acTip)}">${SHIELD_SVG}<b>${ac}</b></span><span class="gs-hp">HP <b>${Math.max(0, h.hp)} / ${h.max}</b></span></div>${wpn('melee')}${wpn('ranged')}</div>`;
}
