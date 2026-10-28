/* ---- Boss: the Old Road Beastman Encampment (4 Young Beastmen, 2 Beastmen; no fleeing) ----
   Beating it pays 437 GP and a map that opens Bramblewood, the only way to reach it. Lose, and the camp is still out
   there: it can turn up again on a later explore, with a shorter telling now the party knows what waits. */
const BOSS_TITLE = 'The Old Road Beastman Encampment';
const BEAST_FOES = ['Young Beastman', 'Young Beastman', 'Young Beastman', 'Young Beastman', 'Beastman', 'Beastman'];
function screenBeastcamp() {
  S.events = S.events || {};
  const E = S.event, again = (S.events.beastTries || 0) > 0;
  const text = again
    ? `<p class="lead">Woodsmoke again, and the reek of scorched boar. The fire by the roadside is burning just as before, and this time you know exactly who is watching it.</p><p>A branch snaps in the dark beyond the light. They have been waiting for you.</p>`
    : `<p class="lead">You come across a fire still burning by the roadside, a half-eaten boar turning on a spit above it. There is no sign of anyone nearby.</p>
       <p>You wonder how much noise you have made getting this far along the Old Road. Looking back, you can no longer see the castle at all. The long road has left you tired, your senses dulled.</p>
       <p><i>Snap.</i></p><p>You are being ambushed. It's a family of Beastmen!</p>`;
  $('#app').innerHTML = evShell('Along the Old Road', text, `<button class="btn red" id="evFight">Fight</button>`).replace('<div class="encounter parch panel">', `<div class="boss-banner${E.revealed ? ' shown' : ''}">${BOSS_TITLE}</div><div class="encounter parch panel">`);
  const reveal = (instant) => {
    E.revealed = true; save();   // the music turns with the reveal (see musicFor)
    const h2 = document.querySelector('#evScroll h2'), ban = document.querySelector('.boss-banner'), acts = document.querySelector('.ev-acts');
    if (h2) { h2.textContent = BOSS_TITLE; h2.classList.add('boss-title'); }
    if (instant) { if (ban) ban.classList.add('shown'); if (acts) acts.classList.add('show'); return; }
    setTimeout(() => ban && ban.classList.add('shown'), 250);
    setTimeout(() => acts && acts.classList.add('show'), 1100);   // the only way forward
  };
  startScroll(!!E.revealed, () => reveal(!!E.revealed));
  $('#evFight').onclick = () => {
    S.events.beastTries = (S.events.beastTries || 0) + 1;
    const panel = document.querySelector('.encounter'); if (panel) panel.classList.add('enc-go');
    // the scene stays live until the battle exists, so the ambush music never drops out between them
    setTimeout(() => { S.event = null; startBattle(false, {foes: BEAST_FOES, noFlee: true, boss: 'beastcamp', direct: true}); }, 950);
  };
}
/* ---- Boss: the Beastman Warlord (Bramblewood, on the way home after the sealed caves) ---- */
const WARLORD_TITLE = 'The Beastman Warlord';
function screenWarlord() {
  S.events = S.events || {};
  const E = S.event, again = (S.events.warlordTries || 0) > 0;
  const text = again
    ? `<p class="lead">The trail home bends, and there he is again, the great axe planted in the path. He has waited for you.</p><p>He does not roar. He never has.</p>`
    : `<p class="lead">The feeling that has dogged your steps for days finally takes shape. As the trail bends towards home, a figure steps out from between the trees and plants a great axe in the path ahead.</p>
       <p>He is taller than any beastman you have seen. Charms and small bones hang from his antlers, and old scars cross his hide like the marks on the great oak. He does not roar. He simply watches you, the way a man watches a fire he means to put out.</p>
       <p>Whatever you saw at the ridge, he means for none of it to reach the castle.</p>`;
  $('#app').innerHTML = evShell('On the Trail Home', text, `<button class="btn red" id="evFight">Fight</button>`).replace('<div class="encounter parch panel">', `<div class="boss-banner${E.revealed ? ' shown' : ''}">${WARLORD_TITLE}</div><div class="encounter parch panel">`);
  const reveal = instant => {
    E.revealed = true; save();
    const h2 = document.querySelector('#evScroll h2'), ban = document.querySelector('.boss-banner'), acts = document.querySelector('.ev-acts');
    if (h2) { h2.textContent = WARLORD_TITLE; h2.classList.add('boss-title'); }
    if (instant) { if (ban) ban.classList.add('shown'); if (acts) acts.classList.add('show'); return; }
    setTimeout(() => ban && ban.classList.add('shown'), 250);
    setTimeout(() => acts && acts.classList.add('show'), 1100);
  };
  startScroll(!!E.revealed, () => reveal(!!E.revealed));
  $('#evFight').onclick = () => {
    S.events.warlordTries = (S.events.warlordTries || 0) + 1;
    const panel = document.querySelector('.encounter'); if (panel) panel.classList.add('enc-go');
    setTimeout(() => { S.event = null; startBattle(false, {foes: ['Beastman Warlord'], noFlee: true, boss: 'warlord', direct: true}); }, 950);
  };
}
/* ---- Marmillian the sage: met at the castle after the Warlord falls; unlocks the Beastman Caves ---- */
function marmillianScene() {
  const el = modal(`<h2>Marmillian the Sage</h2>
    <p class="lead">Word of your return reaches the old tower before you do. Marmillian receives you among stacks of crumbling books, a cold pipe clamped in his teeth, and listens without interrupting as you describe the ridge, the layered vines and the warlord who tried to stop you.</p>
    <p>"Those are no weeds," he says at last. "That is a binding. Old work, and patient. The clans did not seal those caves to hide something from you. They sealed them to keep something in."</p>
    <p>He takes your map and marks a path along the ridge with a careful hand. "If you mean to go in, go knowing what you are opening."</p>
    <p class="note">The Beastman Caves are now known to the caravan.</p>
    <div class="row"><button class="btn red" data-close>Thank him and leave</button></div>`, () => go());
  S.events.metMarmillian = true; S.events.woodHome = true; S.events.cavesKnown = true; S.events.woodDormant = true; save();
  return el;
}
