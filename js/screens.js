/* ---------------- screens ---------------- */
let draft = null;
function screenTitle() {
  leaveQuest();
  let last = 0; try { last = +localStorage.getItem('baseline_last') || 0; } catch (e) {}
  const rows = Array.from({length: QUESTS}, (_, k) => {
    const n = k + 1, d = readQuest(n);
    return `<div class="slotrow ${d ? '' : 'empty'} ${d && n === last ? 'last' : ''}"><div class="slot-n">${n}</div><div class="slot-info">${d ? questSummary(d) : '<div class="slot-meta">No quest yet</div>'}</div><div class="slot-btns">
      ${d ? `<button class="btn small red" data-q-go="${n}">Continue</button><button class="btn small" data-q-del="${n}">Abandon</button>` : `<button class="btn small" data-q-new="${n}">Begin a new quest</button>`}</div></div>`;
  }).join('');
  $('#app').innerHTML = `<header class="bar"><h1>Base Line</h1><div class="meta"><span>A grim little prototype</span><span>Build ${BUILD}</span></div></header>
  <div class="parch panel" style="max-width:760px">
    <h2>The Wilds Await</h2>
    <p class="lead">Four souls set out from the last castle in a dying land. Beyond its walls lie rat-choked roads, haunted barrows and worse. Raise your party, arm them, and see how far into the dark they can go before the dark comes for them.</p>
    <p class="note">You can keep up to five quests going at once, each with its own party. Every quest saves itself as you play and carries on exactly where you left it; there is no going back.</p>
    <div class="slots">${rows}</div>
  </div>`;
  document.querySelectorAll('[data-q-go]').forEach(b => b.onclick = () => playQuest(+b.dataset.qGo));
  document.querySelectorAll('[data-q-new]').forEach(b => b.onclick = () => { QUEST = +b.dataset.qNew; S = null; draft = defaultDraft(); screenCreate(); });
  document.querySelectorAll('[data-q-del]').forEach(b => b.onclick = () => {
    if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'Sure? Gone for good'; b.classList.add('red'); setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'Abandon'; b.classList.remove('red'); } }, 3000); return; }
    try { localStorage.removeItem(questKey(+b.dataset.qDel)); } catch (e) {} screenTitle();
  });
}
/* The game rolls every starting stat; the player never does. Each new quest rolls a fresh party, and on that
   screen each slot remembers its rolls for every class, so switching class back and forth is not a reroll. */
let DRAFT_ST = {};
function defaultDraft() {
  const picks = [['Fighter', 'Aldric'], ['Cleric', 'Mother Hesk'], ['Magic User', 'Velis'], ['Thief', 'Corvin']];
  DRAFT_ST = {};
  const party = picks.map(([c, n]) => makeHero(c, n));
  party.forEach((h, i) => { DRAFT_ST[i + '|' + h.cls] = h.st; });
  return party;
}
function screenCreate() {
  const classes = Object.keys(DATA.classes);
  $('#app').innerHTML = `<header class="bar"><h1>Base Line</h1><div class="meta"><span>Raise your party</span></div></header>
  <div class="parch panel">
    <h2>Raise Your Party</h2><p class="sub">Choose four heroes. Fate has already rolled each one's stats with their class's dice.</p>
    <div class="grid2">${draft.map((h, i) => `<div class="slot" style="display:grid;gap:6px;align-items:start">
      <div class="row"><img class="head" alt="" src="${HEADS[h.cls]}"><input type="text" id="nm${i}" value="${esc(h.name)}" aria-label="Name of hero ${i + 1}" style="flex:1;min-width:0"></div>
      <select id="cl${i}" aria-label="Class of hero ${i + 1}">${classes.map(c => `<option ${c === h.cls ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <div class="statgrid">${STATS.map(s => statCell(s, h.st[s], h)).join('')}</div>
      <div class="row"><span class="note">HP ${h.max} · ${acBadge(heroAC(h), 'inl')} · Purse ${5 + chaGold(h)} GP</span></div></div>`).join('')}</div>
    <p class="note" style="margin-top:12px">Each hero brings 5 GP, plus up to 5 more for a winning way with merchants (Charisma). Party purse: <b>${startGold(draft)} GP</b>.</p>
    <div class="row" style="margin-top:8px"><button class="btn red" id="begin">Enter the castle</button><button class="btn" id="back">Back</button></div>
  </div>`;
  draft.forEach((h, i) => {
    // Each slot keeps the stats fate rolled for each class, so switching class back and forth is not a reroll.
    $('#cl' + i).onchange = e => {
      const c = e.target.value, key = i + '|' + c; DRAFT_ST[i + '|' + draft[i].cls] = draft[i].st;
      draft[i] = makeHero(c, $('#nm' + i).value || c, DRAFT_ST[key]); DRAFT_ST[key] = draft[i].st; screenCreate();
    };
    $('#nm' + i).oninput = e => { draft[i].name = e.target.value; };
  });
  $('#back').onclick = () => (S ? go() : screenTitle());   // a quest only exists once its party sets out
  $('#begin').onclick = () => {
    draft.forEach(h => Object.values(h.equip).forEach(it => { if (it && it.starter) { it.name = starterName(h.name, it.starter); regStarter(it); } }));
    S = {party: draft, gold: startGold(draft), inv: [], clock: 8 * 60, loc: 'castle', region: 'road', visited: ['road'], nextEnc: 0, log: [], battle: null, wildHours: 0, quest: QUEST, b79: true, b80: true};
    beginPrologue();   // every new quest opens on the night the orcs came (Build 119)
    save(); go(); window.scrollTo({top: 0});
  };
}
function go() {
  stopTimers(); registerStarters(); hidePreview();
  if (S && S.loc === 'castle' && !S.battle && S.events && S.events.warlordWon && !S.events.metMarmillian) { screenCastle(); return marmillianScene(); }
  if (forceCampOnce()) return screenEvent();
  if (S.prologue && !S.battle) return screenPrologue();
  if (S.battle) return screenBattle();
  if (S.event && S.loc === 'wild') return screenEvent();
  if (S.loc === 'castle') return screenCastle();
  if (S.loc === 'camp') return screenCamp();
  return screenWild();
}
