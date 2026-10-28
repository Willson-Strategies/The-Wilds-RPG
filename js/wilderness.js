/* ---- wilderness and camp ---- */
function scheduleEnc() {
  const r = region(); let [a, b] = r.kind === 'cave' ? [3, 5] : [6, 9];
  let gap = a + Math.floor(Math.random() * (b - a + 1));
  if (avgLevel() >= r.lvl + 2) gap *= 2;
  S.nextEnc = S.clock + gap;
}
function passTime(min, wild = true) {
  S.clock += min;
}
function screenWild() {
  const r = region();
  $('#app').innerHTML = header() + `<div class="main"><div class="parch panel">
    <h2>${r.name}</h2><p class="sub">Level ${r.lvl} ${r.kind === 'cave' ? 'caves' : 'wilderness'}</p>
    <p class="lead">${r.blurb} ${r.kind === 'cave' ? 'Things move in the dark here, and they find you quickly.' : 'Every mile of road could hide an ambush.'}</p>
    <div class="row" style="margin-top:12px">
      <button class="btn red" id="explore">Explore</button>
      <button class="btn" id="camp">Make camp</button>
      <button class="btn" id="home">Return to the castle</button>
    </div>
    <p class="note" style="margin-top:10px">Exploring moves the clock on until something finds you. Gear slowly wears for every real hour you spend playing out here; camp and the castle pause it. Hover over a weapon or armour to check its durability.</p>
    ${S.lastResult ? `<div class="log" style="margin-top:10px">${S.lastResult}</div>` : ''}
  </div>${roster()}</div>`;
  wireSheets();
  $('#explore').onclick = explore;
  $('#camp').onclick = () => { S.loc = 'camp'; S.rest = null; S.party.forEach(h => Object.values(h.equip).forEach(it => it && (it.shown = wearH(it)))); save(); go(); };
  $('#home').onclick = () => {
    passTime(30);
    // After the sealed caves (lore entry 12), the Beastman Warlord blocks the way home from Bramblewood until he is beaten.
    if (S.region === 'wood' && S.events && S.events.woodBossDue && !S.events.warlordWon) { S.returning = true; S.event = {id: 'warlord'}; save(); return screenEvent(); }
    if (Math.random() < .5) { S.returning = true; startBattle(); return; }
    S.loc = 'castle'; castleTab = 'square'; restAll(); S.lastResult = ''; save(); go();
  };
}
