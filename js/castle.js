/* ---- castle ---- */
let castleTab = 'square';
function screenCastle() {
  const tabs = [['square', 'Castle square'], ['inn', 'The Inn'], ['arms', 'Weapon & Armour Shop'], ['magic', 'Magic Shop'], ['smith', 'Blacksmith'], ['temple', 'The Clerics'], ['caravan', 'The Caravan'], ['party', 'Party & gear']];
  let body = '';
  if (castleTab === 'square') body = `<h2>Within the Castle Walls</h2><p class="lead">The castle still has plenty of stock of basic weapons and armour, and its smiths will craft finer wares given time. Some weapons, armour and spells can only be found in the wilderness. Be sure to stock up before heading out.</p>
    <p class="note">Spell slots are only restored by rest: a night at the inn here, or by a campfire in the wild (8 hours for level 1 spells, 16 hours for level 2).</p>
    <div class="row"><button class="btn red" data-go="caravan">Set out</button></div>`;
  if (castleTab === 'arms') body = shopArms();
  if (castleTab === 'magic') body = shopMagic();
  if (castleTab === 'smith') body = shopSmith();
  if (castleTab === 'temple') body = `<h2>The Clerics</h2><p>The temple's clerics tend to every pilgrim who returns from the wilds. Your party is restored to full health, ailments are cleansed and fallen companions are raised, all free of charge. Raising the fallen takes the night, so the whole party rests here and wakes with every spell restored.</p>
    <button class="btn red" id="pray">Receive the clerics' blessing</button>
    <button id="devgem" class="devgem" title="Developer cheat" aria-label="Developer cheat: double XP, 10,000 gold and free spells"><svg viewBox="0 0 12 12" width="12" height="12"><path d="M3 1h6l2.5 3L6 11 .5 4z" fill="#3fa9a0"/><path d="M3 1h6l2.5 3h-11z" fill="#8fe0d6"/><path d="M6 11 3.6 4h4.8z" fill="#2a7f78"/><path d="M3 1h6l2.5 3L6 11 .5 4z" fill="none" stroke="#123c38" stroke-width=".7"/></svg></button>`;
  if (castleTab === 'caravan') body = `<h2>The Caravan</h2><p class="sub">Merchant caravans will carry you to any place you have visited before. Walk to new places from the nearest one you know.</p>
    <div class="regions">${REGIONS.map((r, i) => {
      const ok = S.visited.includes(r.id) || (r.id === 'wood' ? !!(S.events && S.events.beastcamp) : i > 0 && S.visited.includes(REGIONS[i - 1].id));   // Bramblewood needs the Beastmen's map
      return `<button class="region" data-reg="${r.id}" ${ok ? '' : 'disabled'}><b>${r.name}</b><small>Level ${r.lvl} ${r.kind === 'cave' ? 'caves' : 'wilderness'}${S.visited.includes(r.id) ? '' : r.id === 'wood' && !ok ? ' · the way is unknown' : ' · unexplored'}</small><div style="font-size:.88rem">${r.blurb}</div></button>`;
    }).join('')}</div>`;
  if (castleTab === 'party') body = partyGear();
  if (castleTab === 'inn') body = `<h2>The Inn</h2><p>Behind the castle walls the party can sleep without a watch. A night at the inn takes 8 hours and is always safe: no ambushes, and every hero wakes at full health with every spell slot restored. With a warm hearth, candlelight and a table to study at, even level 2 spells are ready after a single night, unlike in the wilds.</p>
    <p class="note">${S.party.some(h => h.used.some(u => u)) ? 'Some of your spell slots are spent.' : 'Every spell slot is ready.'}</p>
    <button class="btn red" id="sleep">Sleep at the inn (8 hours)</button>`;
  $('#app').innerHTML = header() + `<div class="main"><div class="parch panel">
    <div class="row" style="margin-bottom:10px">${tabs.map(([k, l]) => `<button class="btn small ${castleTab === k ? 'red' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>${body}</div>${roster()}</div>`;
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { castleTab = b.dataset.tab; screenCastle(); });
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { castleTab = b.dataset.go; screenCastle(); });
  if ($('#devgem')) $('#devgem').onclick = () => {   // developer cheat: every hero's XP x2, +10,000 GP, spells refresh after every battle from now on (this quest)
    const ups = [];
    S.party.forEach(h => { h.xp = h.xp * 2; while (h.level < 10 && h.xp >= XP_CUM[h.level + 1]) ups.push(levelUp(h)); });
    S.gold += 10000; S.dev = Object.assign(S.dev || {}, { freeSpells: true }); restoreSpells(); save(); screenCastle();
    modal(`<h2>Developer Cheat</h2><p>Every hero's experience is doubled and <b>10,000 GP</b> is added. Spell slots are now restored after every battle in this quest, with no rest needed.</p>${ups.map(u => `<p>${u}</p>`).join('')}<div class="row"><button class="btn" data-close>Close</button></div>`, () => screenCastle());
  };
  // Raising a fallen hero takes the night: the party rests at the temple as at the inn (8 hours, every spell slot restored).
  if ($('#pray')) $('#pray').onclick = () => {
    const raised = S.party.filter(h => h.dead);
    S.party.forEach(h => { h.dead = false; h.hp = h.max; h.status = {}; });
    if (!raised.length) { save(); return screenCastle(); }
    S.clock += 480; restoreSpells(); save();
    const names = raised.map(h => esc(h.name)), who = names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
    modal(`<h2>Rest at the Temple</h2><p>The clerics labour over ${who} for eight long hours, until at last breath returns${raised.length === 1 ? '' : ' to them all'}. The rest of the party sleeps in the temple's quiet halls.</p><p>You wake at ${fmtClock(S.clock)}. Every hero is back to full health and every spell slot is restored.</p><div class="row"><button class="btn" data-close>Close</button></div>`, () => screenCastle());
  };
  if ($('#sleep')) $('#sleep').onclick = () => { S.clock += 480; restoreSpells(); S.party.forEach(h => { if (!h.dead) h.hp = h.max; }); save(); modal(`<h2>A Night at the Inn</h2><p>You wake at ${fmtClock(S.clock)}, rested. Every hero is back to full health and every spell slot is restored.</p><div class="row"><button class="btn" data-close>Close</button></div>`, () => screenCastle()); };
  document.querySelectorAll('[data-reg]').forEach(b => b.onclick = () => { S.region = b.dataset.reg; if (!S.visited.includes(S.region)) S.visited.push(S.region); S.loc = 'wild'; scheduleEnc(); save(); go(); });
  wireShops(); wireGear();
}
function sellPrice(name) { if (WPN[name] && WPN[name].sell) return WPN[name].sell; const p = WPN[name] ? WPN[name].price : ARMOUR[name] ? ARMOUR[name].price : SPELLS[name] ? SPELLS[name].price : 0; return Math.max(1, Math.floor(p * .15)); }
function shopArms() {
  const L = maxLevel();
  const ws = DATA.weapons.filter(w => UNLOCK[w.tier] <= L);
  const as = Object.entries(ARMOUR).filter(([, a]) => a.from <= L);
  return `<h2>Weapon &amp; Armour Shop</h2><p class="sub">New stock is crafted as your fame grows.</p>
  <div class="tw"><table class="t"><thead><tr><th>Item</th><th>Type</th><th class="n">Hit</th><th>Damage / AC</th><th>Who</th><th class="n">Price</th><th></th></tr></thead><tbody>
  ${ws.map(w => `<tr><td>${img(w.name)} ${w.name}</td><td>${RANGED.includes(w.name) ? 'Ranged' : 'Melee'}</td><td class="n">+${w.hit}</td><td>${w.dmg}${w.note ? ' · <span class="note">' + ail(w.note.replace(/chance to (\w+)/, (m, a) => 'chance to ' + a.toUpperCase())) + '</span>' : ''}</td><td class="note">${DATA.tierClasses[w.tier].length === 6 ? 'Everyone' : DATA.tierClasses[w.tier].join(', ')}</td><td class="n">${w.price} GP</td><td><button class="btn small" data-buy="${esc(w.name)}" ${S.gold < w.price ? 'disabled' : ''}>Buy</button></td></tr>`).join('')}
  ${as.map(([n, a]) => `<tr><td>${img(n)} ${n}</td><td>${a.shield ? 'Shield' : 'Armour'}</td><td class="n">—</td><td>+${a.ac} AC</td><td class="note">${a.who.join(', ')}</td><td class="n">${a.price} GP</td><td><button class="btn small" data-buy="${esc(n)}" ${S.gold < a.price ? 'disabled' : ''}>Buy</button></td></tr>`).join('')}
  </tbody></table></div>${sellList()}`;
}
function shopMagic() {
  const L = maxLevel();
  const sp = Object.entries(SPELLS).filter(([, s]) => s.lvl === 1 || L >= 5);
  return `<h2>The Magic Shop</h2><p class="sub">Scrolls to learn. Give a scroll to a hero on the Party &amp; gear tab to learn it.</p>
  <div class="tw"><table class="t"><thead><tr><th>Scroll</th><th>List</th><th class="n">Lvl</th><th>Effect</th><th class="n">Price</th><th></th></tr></thead><tbody>
  ${sp.map(([n, s]) => `<tr><td>${img(n)} ${n}</td><td class="note">${s.list === 'MU' ? 'Magic User' : 'Cleric'}</td><td class="n">${s.lvl}</td><td>${ail(s.desc)}</td><td class="n">${s.price} GP</td><td><button class="btn small" data-buy="${esc(n)}" ${S.gold < s.price ? 'disabled' : ''}>Buy</button></td></tr>`).join('')}
  </tbody></table></div>`;
}
function sellList() {
  if (!S.inv.length) return '<p class="note" style="margin-top:8px">Your pack is empty. Items you buy or find wait here until someone equips them.</p>';
  return `<h3>Sell from your pack (15%)</h3><div class="row">${S.inv.map(it => `<button class="btn small" data-sell="${it.uid}">${tipImg(it, wearH(it))} ${it.name} · ${sellPrice(it.name)} GP</button>`).join('')}</div>`;
}
function shopSmith() {
  const items = [];
  S.party.forEach(h => Object.values(h.equip).forEach(it => it && items.push([h, it])));
  S.inv.forEach(it => items.push([null, it]));
  const price = n => Math.max(1, Math.floor((WPN[n] ? WPN[n].price : ARMOUR[n] ? ARMOUR[n].price : 0) * .1));
  return `<h2>The Blacksmith</h2><p class="sub">Weeks in the wild leave blades chipped and mail rusted. Worn gear fights worse; the smith restores it for a tenth of its price.</p>
  <div class="tw"><table class="t"><thead><tr><th>Item</th><th>Carried by</th><th class="n">Durability</th><th>Penalty</th><th class="n">Price</th><th></th></tr></thead><tbody>
  ${items.filter(([, it]) => itemKind(it.name) !== 'scroll').map(([h, it]) => { const w = wearH(it); const pen = WPN[it.name] ? (WEAR_W[w][0] || WEAR_W[w][1] ? `−${WEAR_W[w][0]} hit, −${WEAR_W[w][1]} dmg` : 'none') : (ARMOUR[it.name].wear[w] ? `−${ARMOUR[it.name].wear[w]} AC` : 'none'); const penX = it.wear >= FAST_WEAR && it.wear < 5 ? (pen === 'none' ? 'wears 25% faster' : pen + ', wears 25% faster') : pen;
    return `<tr><td>${tipImg(it, w)} ${it.name}</td><td>${h ? esc(h.name) : 'Pack'}</td><td class="n">${DUR[w]} (${Math.round(100 - it.wear / 5 * 100)}%)</td><td>${penX}</td><td class="n">${price(it.name)} GP</td><td><button class="btn small" data-polish="${it.uid}" ${it.wear < .05 || S.gold < price(it.name) ? 'disabled' : ''}>Polish</button></td></tr>`; }).join('')}
  </tbody></table></div>`;
}
function findItem(u) {
  for (const h of S.party) for (const k in h.equip) if (h.equip[k] && h.equip[k].uid === u) return h.equip[k];
  return S.inv.find(i => i.uid === u);
}
function wireShops() {
  document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
    const n = b.dataset.buy, p = WPN[n] ? WPN[n].price : ARMOUR[n] ? ARMOUR[n].price : SPELLS[n].price;
    if (S.gold < p) return; S.gold -= p; S.inv.push(newItem(n)); save(); go();
  });
  document.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => {
    const u = +b.dataset.sell, i = S.inv.findIndex(x => x.uid === u); if (i < 0) return;
    S.gold += sellPrice(S.inv[i].name); S.inv.splice(i, 1); save(); go();
  });
  document.querySelectorAll('[data-polish]').forEach(b => b.onclick = () => {
    const it = findItem(+b.dataset.polish); if (!it) return;
    const p = Math.max(1, Math.floor((WPN[it.name] ? WPN[it.name].price : ARMOUR[it.name].price) * .1));
    if (S.gold < p) return; S.gold -= p; it.wear = 0; it.shown = 0; save(); go();
  });
}
