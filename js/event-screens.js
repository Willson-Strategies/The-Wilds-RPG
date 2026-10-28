function screenEvent() {
  const E = S.event, L = partyLeader();
  if (E.id === 'chest') return screenChest();
  if (E.id === 'stash') return screenStash();
  if (E.id === 'beastcamp') return screenBeastcamp();
  if (E.id === 'warlord') return screenWarlord();
  if (E.id === 'followed') {
    $('#app').innerHTML = evShell('Deep in Bramblewood', `<p class="lead">You feel like you are being followed…</p>`, EV_ON); startScroll();
    return wireOnward(() => { S.event = null; });
  }
  if (E.id === 'woodlore') {
    const fight = WOOD_FIGHTS[E.k];
    $('#app').innerHTML = evShell('Deep in Bramblewood', woodLoreHtml(E.k), fight ? '<button class="btn red" id="evFight">Fight</button>' : EV_ON); startScroll();
    if (!fight) return wireOnward(() => { S.event = null; });
    $('#evFight').onclick = () => {   // no way round this one, and no fleeing once it starts
      const panel = document.querySelector('.encounter'); if (panel) panel.classList.add('enc-go');
      setTimeout(() => { S.event = null; startBattle(false, {foes: fight.foes, noFlee: true, direct: true, loreKey: E.k, reward: fight.gold}); }, 950);
    };
    return;
  }
  $('#app').innerHTML = E.id === 'bandit'
    ? evShell('A Slain Bandit', `<p class="lead">You come across the body of a recently slain bandit. Gold and jewels worth around 100 gold pieces lie scattered around his corpse.</p>
       <p>The wounds are deep and ragged. It doesn't look like other bandits did this. Something has scared the looters off, and the undergrowth nearby is trampled flat.</p>`,
       `<button class="btn red" id="evTake">Take the gold</button><button class="btn" id="evLeave">Leave it and move on</button>`)
    : evShell('Along the Old Road', `<p class="lead">${ROAD_LORE[E.n].replace('{L}', esc(L.name))}</p>`, EV_ON);
  startScroll();
  const done = () => { S.event = null; };
  if (E.id === 'bandit') {
    $('#evTake').onclick = () => {
      done(); S.gold += 100; S.lastResult = '<div class="hit">You pocket 100 GP from the bandit\'s body.</div>'; save();
      if (Math.random() < .5) startBattle(false, {foes: ['Giant Boar'], noFlee: true, intro: ['The killer returns!', 'A huge boar, tusks still red, bursts from the trampled undergrowth. It has come back for its kill, and for you.']});
      else { modal(`<h2>100 Gold</h2><p>You gather the gold and jewels and slip away before whatever did this comes back.</p><div class="row"><button class="btn red" data-close>Onward</button></div>`, () => go()); }
    };
    $('#evLeave').onclick = () => { done(); save(); explore(); };
  } else {
    $('#evOn').onclick = () => { done(); save(); explore(); };
    $('#evCamp').onclick = () => { done(); S.loc = 'camp'; S.rest = null; S.party.forEach(h => Object.values(h.equip).forEach(it => it && (it.shown = wearH(it)))); save(); go(); };
    $('#evHome').onclick = () => { done(); save(); go(); $('#home').click(); };
  }
}
/* A trapped chest on the Old Road (8% of explores, until opened). Opening it springs a blade trap on the whole
   party (3 damage each, never fatal) and yields the Thief's unique dagger, Beggar's Guile. */
function screenChest(opened) {
  const done = () => { S.event = null; };
  $('#app').innerHTML = !opened
    ? evShell('A Battered Chest', `<p class="lead">Half sunk in the mud at the roadside sits an iron-bound chest, its lock furred with rust. Whoever left it here left in a hurry, or never left at all.</p>
       <p>The lid is shut fast. Something inside shifts with a soft metallic clink when you nudge it with a boot.</p>`,
       `<button class="btn red" id="evOpen">Force it open</button><button class="btn" id="evLeave">Leave it and move on</button>`, roster())
    : evShell('A Trap!', `<p class="lead">The lock gives with a crack, and a ring of hidden blades springs out of the lid, slashing at everyone gathered round. Each hero takes 3 damage.</p>
       <p>Nestled in oiled rags at the bottom of the chest lies a slim, wicked dagger: <b class="uniq">Beggar's Guile</b>. A thief's blade, made for those who fight dirty. It has been added to your packs.</p>`, EV_ON, roster());
  startScroll();
  if (!opened) {
    $('#evOpen').onclick = () => {
      S.events.chest = true; S.uniquesFound = S.uniquesFound || []; S.uniquesFound.push("Beggar's Guile"); S.inv.push(newItem("Beggar's Guile"));
      const hit = S.party.map((h, i) => ({h, i})).filter(x => !x.h.dead), was = hit.map(x => x.h.hp);
      hit.forEach(x => { x.h.hp = Math.max(1, x.h.hp - 3); });
      save(); screenChest(true);
      hit.forEach(({h, i}, n) => setTimeout(() => {   // the trap: a big steel hit on every hero, all crying out at once
        fxOne({k: 'steel', side: 'p', i, big: true});
        fxOne({k: 'num', side: 'p', i, d: was[n] - h.hp, big: true, flash: true, col: 'hurt'});
        const bar = document.querySelector(`i[data-hpk="p${i}"]`); if (bar) setBar(bar, h.hp / h.max * 100);
      }, 250 + n * 40));
    };
    $('#evLeave').onclick = () => { done(); save(); explore(); };
  } else wireOnward(done);
}
