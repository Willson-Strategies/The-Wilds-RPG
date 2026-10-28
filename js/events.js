/* ---------------- road events ----------------
   On the Old Road, Explore first rolls a D100: 1-20 the slain bandit (once per game), 21-40 a piece of
   Old Road lore. Anything else, or a used-up event, means the road brings a fight as usual. */
const ROAD_LORE = [
  'A toppled milestone, its carving worn almost smooth: CASTLE · XII LEAGUES. Beneath it, scratched in a shaking hand: <i>Do not stop after dark.</i>',
  'An iron gibbet creaks above the road. The crows took whoever hung there long ago. A brass plate, green with age, reads: <i>FOR THE CRIME OF LEAVING.</i>',
  'A roadside shrine to a saint whose face has been chiselled away. Fresh candles burn in the niche, though there is no one for miles in any direction.',
  'Wagon ruts as deep as graves cut through the mud. The caravans stopped running this road the winter the castle shut its gates. Nobody in the castle will say why.',
  'A neat cairn of small skulls (rats, dogs, something with too many teeth) stands at the crossroads. A warning, or an offering. The stones are warm to the touch.',
  'A pair of boots stands in the middle of the road, laces tied, toes pointing back towards the castle. There are no tracks leading away from them.',
  'The road bends, and bends again. A split milestone you are sure you passed an hour ago leans in the ditch, its carving worn to nothing.',
  'You pass a burnt-out cart, its axle snapped. An hour later you pass a burnt-out cart, its axle snapped. The ruts in the mud say it is the same one. The sun says it cannot be.',
  'A crow watches from a gallows tree as you pass beneath it. Some time later you pass beneath another gallows tree, and the same crow watches you again, head tilted, as if it knows the joke.',
  '{L} is a keen navigator, but the rest of the party still has a feeling that they have been here before.',
];
// Bramblewood lore. FREE entries appear in any order; once all of them have been seen, the STORY entries follow in order.
// Each entry is a list of paragraphs. {L} becomes the party leader's name; {BRIDGE} becomes the line about heroes
// below level 3 who won't trust the old bridge (left out if nobody is below level 3).
const WOOD_LORE_FREE = [
  ['You discover a small shrine built at the base of a split oak. Antlers have been arranged in a circle around a flat stone, while feathers, carved wooden charms and bundles of dried herbs hang from the branches above.',
   'There is no gold or treasure here. Instead, someone has left small offerings of berries, fresh water and carefully cleaned animal bones.',
   'The shrine appears to have been tended recently. A set of large footprints circles it, but none cross the little clearing itself.',
   'You remember the beastmen gathering you glimpsed earlier. Perhaps their clans honour the forest in their own way, despite the cruelty of those who prey upon travellers.',
   'You leave the offerings undisturbed. If you are to find allies in this world, it may help to understand what its people consider sacred before deciding what is worth fighting over.'],
  ['You come upon a narrow stream crossed by a low stone bridge. Moss has covered much of its surface, and roots have split several of the stones, but the structure remains sturdy enough to cross.',
   '{BRIDGE}',
   'The bridge is clearly older than the trees surrounding it. Faint carvings run along its sides, depicting figures carrying spears, baskets and bundles of grain. One figure appears to have the head of a wolf.',
   'On the far bank, the remains of a road continue into the forest before disappearing beneath a wall of brambles.',
   'Someone once maintained a proper route through these woods. The carvings suggest that humans and beastmen may have shared this region, or at least traded with one another, in a time long before the road was abandoned.',
   '{L} wonders what changed between them, and whether that history might offer a clue to the alliances the Duke hopes you will secure.'],
  ['A colossal oak stands beside the path, its trunk wider than a cottage and its branches stretching far above the canopy. Deep grooves have been carved into the bark, forming rows of symbols that resemble claw marks, circles and branching lines.',
   'Some are recent. Others have almost disappeared beneath layers of new growth.',
   'Near the base, you find a cluster of stones arranged around a hollow in the roots. Inside lies a collection of small objects: a rusted buckle, a child\'s wooden toy, a broken spearhead and a smooth stone marked with a simple handprint.',
   'The objects seem to have been left by different people over many years. Perhaps this tree marks a boundary, commemorates the dead, or serves as a meeting place for those who live within the forest.',
   'You cannot decipher its meaning, but you suspect that the tree has witnessed more of Bramblewood\'s history than any living creature could remember.'],
  ['You find a quiet pool fed by a narrow stream. Deer tracks lead to the water\'s edge, and the mud is marked by the prints of smaller animals. The water is still enough to reflect the canopy above.',
   'A large set of antlers lies half-submerged near the bank. They are old and weathered, though their points remain remarkably sharp. Nearby, you find a few edible berries and a cluster of mushrooms growing on a fallen log.',
   'You can refill your water supplies and gather what you recognise, but you remain cautious. A place used by so many animals is also likely to attract predators.'],
  // {FIGHT}: the scroll stops here for an unavoidable battle (see WOOD_FIGHTS); the lines after it are shown on victory.
  ['A pale shape lies half-buried beneath the roots of an ancient oak. At first, you mistake it for the remains of a deer, but the rusted mail and shattered helmet tell a different story. The skeleton clutches the remnants of a sword, its fingers tangled in creeping roots.',
   'As you approach, the bones begin to twitch. The dead warrior drags itself upright, its empty eye sockets fixed upon you. It makes no sound as it raises its broken weapon.',
   '{FIGHT}',
   'Whatever battle claimed this soldier, it did not grant them the mercy of a final rest. Once the bones lie still again, you notice that the rusted armour bears a faded crest you do not recognise.'],
];
const WOOD_FIGHTS = {'f:4': {foes: ['Skeleton', 'Skeleton', 'Skeleton', 'Skeleton', 'Skeleton'], gold: [100, 280]}};
// Ordered story entries, played one after another once every free entry has been seen.
const WOOD_LORE_STORY = [
  ['The wind dies, and for a brief moment the forest becomes completely still. You can hear only your own breathing and the soft creak of branches overhead. It is almost peaceful.'],
  ['A narrow opening between the brambles appears to offer a quicker route through the trees. The passage is cramped and catches at your clothing, but it eventually leads back to the main trail without incident.'],
  ['You notice a small stack of stones beside the trail, carefully balanced one atop another. Someone has been marking their route through the forest, though you cannot tell how long ago they passed this way.'],
  ['You find a bush heavy with dark purple berries along the trail. They look tempting, but the bitter smell warns you against eating them without knowing what they are. The local wildlife seems to avoid them too.'],
  ['A heavy branch lies across the path, its bark slick with rain. You spend a few moments dragging it aside, revealing muddy tracks beneath the leaves. Whatever passed through here did so recently.'],
  ['From a rise above the forest, you finally gain a clear view of the rocky ridge. Through gaps in the canopy, you can make out several dark openings scattered along its face. Every one is concealed by thick growth, and each appears to have been left untouched for many years.',
   'You spot movement between the trees below. A small group of beastmen crosses the track, carrying bundles of wood and hunting gear. They stop briefly near one of the pillars, where their leader places a hand against the stone before leading the others away.',
   'They do not look like raiders. They look like people following a familiar route, one whose purpose they have no intention of explaining to an outsider.',
   'You think again of the Duke\'s command to seek allies. Perhaps the clans of Bramblewood are not simply hostile creatures to be overcome. Perhaps they are guarding a history, a territory, or a danger that outsiders have never understood.'],
  ['You wait for the beastmen to move off before investigating the ridge. As you approach the rocky ridge again, you notice something strange about the vines covering the cave entrances. They do not grow in the same way as the brambles elsewhere in the forest. Their stems overlap in deliberate layers, and their roots disappear into cracks that seem to follow the outline of the stonework.',
   'The entrance remains sealed. You would need proper tools, considerable effort, or perhaps assistance from someone who knows the forest to clear it.',
   'You are left with the uncomfortable impression that the vines are not simply reclaiming an abandoned doorway. Someone, or something, has been trying to keep it closed.',
   'Perhaps Marmillian the sage would know how to get past these vines?'],
];
const WOOD_LORE_LAST = 's:' + (WOOD_LORE_STORY.length - 1);   // the sealed caves: seeing this sets up the Bramblewood boss on the way home
function woodLoreHtml(key, after) {
  const [kind, i] = key.split(':'), all = (kind === 'f' ? WOOD_LORE_FREE : WOOD_LORE_STORY)[+i] || [], cut = all.indexOf('{FIGHT}');
  const paras = cut < 0 ? (after ? [] : all) : after ? all.slice(cut + 1) : all.slice(0, cut);
  const L = partyLeader(), low = S.party.filter(h => !h.dead && h.level < 3).map(h => esc(h.name));
  const who = low.length > 1 ? low.slice(0, -1).join(', ') + ' and ' + low[low.length - 1] : low[0];
  return paras.map(t => t === '{BRIDGE}' ? (low.length ? `<i>${who} ${low.length > 1 ? 'say they don’t' : 'says they don’t'} feel safe crossing the bridge.</i>` : '') : t.replace('{L}', esc(L.name)))
    .filter(Boolean).map((t, k) => `<p${k ? '' : ' class="lead"'}>${t}</p>`).join('');
}
function nextWoodLore() {   // the next unseen entry: free ones at random, then the story in order; null when all are told
  const seen = S.woodLore || [];
  const free = WOOD_LORE_FREE.map((_, i) => 'f:' + i).filter(k => !seen.includes(k));
  if (free.length) return free[Math.floor(Math.random() * free.length)];
  return WOOD_LORE_STORY.map((_, i) => 's:' + i).find(k => !seen.includes(k)) || null;
}
// Small caches of coin hidden along the Old Road: three can be found, 10% are already empty.
const STASH_TEXT = [
  ['Something in the Brush', 'Something glints in the brush beside the road. Pushing the thorns aside, you find a small wooden chest, its hinges green with age.'],
  ['Under the Old Oak', 'Beneath a fallen oak, wedged between its roots, sits a strongbox wrapped in rotted sacking. Someone hid this with care, and never came back for it.'],
  ['A Disturbed Cairn', 'A cairn of stones by the roadside has been picked at. Under the topmost rocks lies a little iron-banded coffer, its lid held shut with twine.'],
];
function explore() {
  S.events = S.events || {};
  const roll = S.region === 'road' || S.region === 'wood' ? R(100) : 100;
  if (roll <= 20 && !S.events.bandit && S.region === 'road') { S.events.bandit = true; passTime(15); S.event = {id: 'bandit'}; save(); return screenEvent(); }
  S.uniquesFound = S.uniquesFound || [];
  if (S.region === 'wood') {
    const k = roll > 20 && roll <= 60 ? nextWoodLore() : null;   // 40% of Bramblewood explores, while there is lore left to tell
    // Every entry told and the party still out here: 40% of explores, they feel they are being followed (until they go home to Marmillian)
    if (!k && roll > 20 && roll <= 60 && S.events.woodBossDue && !S.events.woodHome) { passTime(15); S.event = {id: 'followed'}; save(); return screenEvent(); }
    if (k) { S.woodLore = S.woodLore || []; S.woodLore.push(k); if (k === WOOD_LORE_LAST) S.events.woodBossDue = true; passTime(20); S.event = {id: 'woodlore', k}; save(); return screenEvent(); }
    const m = Math.max(1, S.nextEnc - S.clock); passTime(m); return startBattle();
  }
  S.loreEver = [...new Set([...(S.loreEver || []), ...(S.loreSeen || [])])];   // lore seen before this was tracked still counts
  // Boss: the Beastman encampment. Once 7 different Old Road lore entries have been seen and a hero is level 2+, 15% of explores.
  if (S.region === 'road' && !S.events.beastcamp && (S.loreEver || []).length >= 7 && S.party.some(h => h.level >= 2) && R(100) <= 15) { passTime(15); S.event = {id: 'beastcamp'}; save(); return screenEvent(); }
  if (roll > 40 && roll <= 48 && !S.events.chest && !S.uniquesFound.includes("Beggar's Guile") && S.party.some(h => h.cls === 'Thief')) { passTime(10); S.event = {id: 'chest'}; save(); return screenEvent(); }
  if (roll > 48 && roll <= 58 && (S.events.stash || 0) < 3) { passTime(10); S.event = {id: 'stash', v: S.events.stash || 0}; save(); return screenEvent(); }
  if (roll > 20 && roll <= 40) {
    S.loreSeen = S.loreSeen || [];
    if (S.loreSeen.length >= ROAD_LORE.length) S.loreSeen = [];
    const left = ROAD_LORE.map((_, i) => i).filter(i => !S.loreSeen.includes(i)), n = left[Math.floor(Math.random() * left.length)];
    S.loreSeen.push(n); S.loreEver = S.loreEver || []; if (!S.loreEver.includes(n)) S.loreEver.push(n); passTime(20); S.event = {id: 'lore', n}; save(); return screenEvent();
  }
  const m = Math.max(1, S.nextEnc - S.clock); passTime(m); startBattle();
}
/* Event text is written out on a scroll by a quill (about 90 letters a second), and Skip, or a click on
   the scroll, finishes it at once. The choices appear once the writing is done. */
const QUILL_SVG = '<svg viewBox="0 0 44 44"><path d="M4 41C10 30 18 18 30 8c4-3 9-5 12-6-1 4-3 9-7 13C24 26 13 34 4 41z" fill="#f2ead8" stroke="#6a5438" stroke-width="1"/><path d="M5 40C14 30 24 19 40 4" stroke="#8a7458" stroke-width="1" fill="none"/><path d="M12 33l-4-2M16 29l-5-2M20 25l-5-3M24 21l-5-3M28 17l-4-3M32 13l-3-3M18 31l3 4M22 27l4 3M26 23l4 3M30 19l4 2" stroke="#b8a888" stroke-width=".8"/><path d="M4 41l3-5 2 2z" fill="#1a120a"/></svg>';
function evShell(title, paras, acts, extraRight = '') {
  const L = partyLeader();
  return header() + `<div class="${extraRight ? 'main' : ''}"><div><div class="encounter parch panel"><div class="enc-art"><img src="${FULL[L.cls]}" alt=""></div><div class="enc-text"><div class="kicker">${esc(region().name)} · ${fmtClock(S.clock)}</div>
    <div class="scroll" id="evScroll"><h2>${title}</h2><div class="type">${paras}</div><button class="ev-skip" id="evSkip">Skip</button></div>
    <div class="row ev-acts" style="gap:10px;margin-top:14px">${acts}</div></div></div></div>${extraRight}</div>`;
}
let TYPE_RAF = null;
function startScroll(instant, onDone) {
  cancelAnimationFrame(TYPE_RAF);
  const sc = $('#evScroll'); if (!sc) return;
  const box = sc.querySelector('.type'), acts = document.querySelector('.ev-acts'), skip = $('#evSkip');
  const nodes = [], walk = n => n.childNodes.forEach(c => c.nodeType === 3 ? (c.data.trim() && nodes.push([c, c.data])) : walk(c));
  walk(box);
  const quill = document.createElement('div'); quill.className = 'quill'; quill.innerHTML = QUILL_SVG; quill.style.opacity = 0; sc.appendChild(quill);   // hidden until it starts writing
  const mark = document.createElement('span');
  let i = 0, j = 0, fin = false, acc = 0, rest = 0, f = 0, lift = 0;
  const finish = () => {
    if (fin) return; fin = true; cancelAnimationFrame(TYPE_RAF);
    nodes.forEach(([n, t, g]) => { n.data = t; if (g) g.remove(); }); mark.remove(); quill.classList.add('done');
    if (skip) skip.remove(); if (onDone) onDone(); else if (acts) acts.classList.add('show');
  };
  if (instant) return finish();
  nodes.forEach(x => { const g = document.createElement('span'); g.className = 'ghost'; g.textContent = x[1]; x[0].after(g); x[0].data = ''; x.push(g); });   // unwritten text keeps its place, so lines don't jump
  // The nib scribbles in little loops while it writes, lifts off the page between words, and rests at commas and full stops.
  const place = () => {
    const a = mark.getBoundingClientRect(), b = sc.getBoundingClientRect(), writing = rest === 0;
    lift += ((writing ? 0 : 7) - lift) * .25;
    const dx = writing ? Math.sin(f * .85) * 3.2 + Math.sin(f * .31) * 1.2 : 0, dy = writing ? Math.cos(f * .85) * 3.6 + Math.sin(f * .47) * 1.5 : 0;
    const rot = writing ? Math.sin(f * .6) * 7 + Math.sin(f * .23) * 3 : -6;
    quill.style.left = (a.left - b.left - 3 + dx) + 'px'; quill.style.top = (a.top - b.top - 30 + dy - lift) + 'px'; quill.style.transform = `rotate(${rot.toFixed(1)}deg)`; quill.style.opacity = '';
  };
  const fleck = () => { const a = mark.getBoundingClientRect(), b = sc.getBoundingClientRect(), d = document.createElement('i'); d.className = 'ink-dot'; d.style.left = (a.left - b.left + (Math.random() - .5) * 8) + 'px'; d.style.top = (a.top - b.top + a.height * (.3 + Math.random() * .6)) + 'px'; sc.appendChild(d); setTimeout(() => d.remove(), 1700); };
  const step = () => {
    if (!sc.isConnected) return;
    f++;
    if (rest > 0) rest--;
    else {
      acc += .75; let burst = Math.floor(acc); acc -= burst;   // 0.75 letters a frame, about 45 a second
      for (let k = 0; k < burst && i < nodes.length && !rest; k++) {
        const [n, t, g] = nodes[i]; const ch = t[j]; n.data = t.slice(0, ++j); g.textContent = t.slice(j); n.after(mark);
        if (j >= t.length) { g.remove(); i++; j = 0; }
        if (/[.!?]/.test(ch)) rest = 16; else if (/[,;:]/.test(ch)) rest = 8; else if (ch === ' ') { rest = 2; if (Math.random() < .25) fleck(); }
      }
    }
    place();
    if (i < nodes.length) TYPE_RAF = requestAnimationFrame(step); else setTimeout(finish, 120);
  };
  setTimeout(() => { if (!fin) TYPE_RAF = requestAnimationFrame(step); }, 380);   // let the scroll unroll first
  sc.onclick = finish;
  if (skip) skip.onclick = e => { e.stopPropagation(); finish(); };
}
const EV_ON = `<button class="btn red" id="evOn">Carry on</button><button class="btn" id="evCamp">Make camp</button><button class="btn" id="evHome">Return to the castle</button>`;
function wireOnward(done) {
  $('#evOn').onclick = () => { done(); save(); explore(); };
  $('#evCamp').onclick = () => { done(); S.loc = 'camp'; S.rest = null; S.party.forEach(h => Object.values(h.equip).forEach(it => it && (it.shown = wearH(it)))); save(); go(); };
  $('#evHome').onclick = () => { done(); save(); go(); $('#home').click(); };
}
function screenStash() {
  const E = S.event, [title, text] = STASH_TEXT[E.v % STASH_TEXT.length], done = () => { S.event = null; };
  if (E.gold === undefined) {
    $('#app').innerHTML = evShell(title, `<p class="lead">${text}</p>`, `<button class="btn red" id="evOpen">Open it</button><button class="btn" id="evLeave">Leave it and move on</button>`);
    startScroll();
    $('#evOpen').onclick = () => { S.events.stash = (S.events.stash || 0) + 1; E.gold = Math.random() < .1 ? 0 : 49 + R(118); S.gold += E.gold; save(); screenStash(); };
    $('#evLeave').onclick = () => { done(); save(); explore(); };
    return;
  }
  const res = E.gold ? `<p class="lead">Inside, wrapped in oilcloth, are coins and a few cheap trinkets worth <b>${E.gold} gold pieces</b>. Into the purse they go.</p>`
    : `<p class="lead">Empty. Someone got here first: only a few dead leaves and a bent nail remain.</p>`;
  $('#app').innerHTML = evShell(E.gold ? `${E.gold} Gold` : 'Nothing', res, EV_ON);
  startScroll(); wireOnward(done);
}
