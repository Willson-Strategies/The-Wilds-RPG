function restAll() { S.party.forEach(h => { if (h.status) { delete h.status.WARD; } }); }
function restoreSpells() { S.party.forEach(h => { h.used = h.used.map(() => false); h.spentL2 = []; }); }
let restTimer = null, fireTimer = null;
function stopTimers() { if (restTimer) clearInterval(restTimer); if (fireTimer) clearInterval(fireTimer); restTimer = fireTimer = null; }
// Ambush chance per hour of rest. Hours 1-7 are a quarter of the old curve; the hour that completes 8 hours or 16 hours
// is always safe; from hour 9 the chance climbs as before (5% + 0.5% an hour, max 20%).
// After an ambush before hour 8, the party's next rest is safe up to hour 8 (until they leave camp).
function ambushChance(hour) {
  if (hour <= 0 || hour === 8 || hour === 16) return 0;
  if (S.safeRest && hour < 8) return 0;
  const base = Math.min(20, 5 + 0.5 * (hour - 1));
  return hour < 8 ? base * .25 : base;
}
function screenCamp() {
  stopTimers();
  const R0 = S.rest;
  const resting = !!(R0 && R0.on);
  $('#app').innerHTML = header() + `<div class="main"><div class="parch panel">
    <h2>Camp</h2><p class="sub">The fire is low and the night is long. Gear does not wear while you are in camp.</p>
    <img class="campscene" id="fire" alt="A warrior sits by a campfire, gnawing a drumstick from a chicken roasting on a spit." src="${CAMP[0]}">
    <div style="margin:12px 0;display:grid;gap:6px">
      ${resting ? `<div class="resting" aria-live="polite">Resting… ${R0.hours} hour${R0.hours === 1 ? '' : 's'}</div>
        <div class="risk">${R0.hours >= 16 ? 'The fire is dead. You cannot see your own hands.' : R0.hours >= 11 ? 'The embers are dying and the dark presses in.' : R0.hours >= 6 ? 'The night grows long. Something out there is watching the fire.' : R0.hours >= 3 ? 'Every hour by the fire draws more eyes from the dark.' : 'Keep your weapons close. Resting here is never safe.'}</div>`
      : R0 && R0.ask ? `<div class="resting">${R0.ask} hours have passed.</div><p>${R0.ask === 8 ? 'Level 1 spells are restored. Level 2 spells need 16 hours of rest.' : R0.ask === 16 ? 'Every spell slot is restored.' : 'The party has rested long.'} Keep resting by the fire? The dark grows more dangerous with every hour.</p>`
      : `<p>Each hour of rest heals every living hero D3 HP (D3+1 while a Cleric in the party is alive to tend the wounds). Eight hours of rest restores level 1 spells; sixteen hours restores level 2 spells too. The longer you rest, the more likely something finds you, and an ambush always strikes first.</p>`}
      <div class="row">${resting ? '<button class="btn red" id="stoprest">Break off the rest</button>' : R0 && R0.ask ? '<button class="btn red" id="more">Keep resting</button><button class="btn" id="wake">Wake the party</button>' : '<button class="btn red" id="rest">Rest by the fire</button><button class="btn" id="leave">Break camp</button>'}</div>
      ${R0 && R0.log && R0.log.length ? `<div class="log">${R0.log.map(l => `<div>${l}</div>`).join('')}</div>` : ''}
    </div>
    ${resting ? '' : partyGear()}</div>${roster()}</div>`;
  const dark = h => 1 - 0.96 * Math.min(1, (h || 0) / 16);
  const fireEl = $('#fire'), hrs = R0 ? R0.hours : 0;
  fireEl.style.filter = `brightness(${dark(Math.max(0, hrs - 1))})`;
  requestAnimationFrame(() => requestAnimationFrame(() => { fireEl.style.filter = `brightness(${dark(hrs)})`; }));
  let fi = 0;
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) fireTimer = setInterval(() => { const el = $('#fire'); if (!el) return stopTimers(); fi = (fi + 1) % CAMP.length; el.src = CAMP[fi]; }, 220);
  if (resting) {
    // Once nobody needs healing, the hours fly by (the party is only waiting for spells); ambush rolls still happen every hour.
    const whole = S.party.every(h => h.dead || h.hp >= h.max);
    restTimer = setInterval(restTick, whole ? 450 : 2200);
    wireSheets();
    $('#stoprest').onclick = () => { S.rest.on = false; save(); screenCamp(); };
  } else if (R0 && R0.ask) {
    $('#more').onclick = () => { delete R0.ask; R0.on = true; save(); screenCamp(); };
    $('#wake').onclick = () => { delete R0.ask; R0.log.unshift('<span class="sys">The party rises from the fire.</span>'); save(); screenCamp(); };
    wireGear();
  } else {
    $('#rest').onclick = () => { S.rest = {on: true, hours: 0, log: []}; save(); screenCamp(); };
    $('#leave').onclick = () => { stopTimers(); S.rest = null; delete S.safeRest; S.loc = 'wild'; scheduleEnc(); save(); go(); };
    wireGear();
  }
}
function restTick() {
  const R0 = S.rest; if (!R0 || !R0.on || S.loc !== 'camp') return stopTimers();
  R0.hours++; S.clock += 60;   // camp time: no wear
  const tend = S.party.some(h => !h.dead && h.cls === 'Cleric') ? 'D3+1' : 'D3';   // Cleric's Field medic
  const healed = S.party.filter(h => !h.dead && h.hp < h.max).map(h => { const n = Math.min(h.max - h.hp, roll(tend)); h.hp += n; return `${esc(h.name)} +${n}`; });
  R0.log.unshift(`<span class="heal">Hour ${R0.hours}: ${healed.length ? healed.join(', ') : 'everyone is already whole'}.</span>`);
  // 8 hours restores level 1 spells; level 2 spells need 16 hours.
  if (R0.hours === 8) delete S.safeRest;
  if (R0.hours === 8) { S.party.forEach(h => { h.used = h.used.map((u, j) => u === 2 || (u && h.book[j] && SPELLS[h.book[j]].lvl >= 2) ? 2 : false); }); R0.log.unshift('<span class="sys">A full night\'s rest: level 1 spells are restored. Level 2 spells need 16 hours.</span>'); }
  if (R0.hours === 16) { S.party.forEach(h => { h.used = h.used.map(() => false); h.spentL2 = []; }); R0.log.unshift('<span class="sys">Sixteen hours by the fire: level 2 spells are restored. Every spell slot is ready.</span>'); }
  const chance = ambushChance(R0.hours), d = R(1000) / 10;
  if (d <= chance) {
    R0.on = false; R0.log.unshift(`<span class="bad">Hour ${R0.hours}: a twig snaps in the dark. Ambush!</span>`);
    if (R0.hours < 8) S.safeRest = true;   // having seen off an early ambush, the next rest is quiet until hour 8
    stopTimers(); save(); startBattle(true); return;
  }
  const allWhole = S.party.every(h => h.dead || h.hp >= h.max);
  const casters = S.party.some(h => h.used.some(u => u));
  // Nothing left to gain (everyone whole, no spent slots): the rest simply ends. Otherwise ask every 8 hours.
  if (allWhole && !casters) { R0.on = false; R0.log.unshift('<span class="sys">The party is rested and ready.</span>'); }
  else if (R0.hours % 8 === 0) { R0.on = false; R0.ask = R0.hours; }
  save(); screenCamp();
}
