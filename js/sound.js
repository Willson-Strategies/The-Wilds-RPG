/* ---------------- sound effects ----------------
   Impacts play on hits only, as the hit animation lands. Blades: swords, daggers, axes, spears (and arrows, softly).
   Blunt: maces, hammers, staffs, slings and fists. Monster hits use the sound that suits how they strike. */
const SFX_FILES = {blade: 'audio/sfx/blade.mp3', blunt: 'audio/sfx/blunt.mp3', fighter_grunt1: 'audio/sfx/fighter_grunt1.mp3', fighter_grunt2: 'audio/sfx/fighter_grunt2.mp3', fighter_grunt3: 'audio/sfx/fighter_grunt3.mp3',
  fighter_hurt1: 'audio/sfx/fighter_hurt1.mp3', fighter_hurt2: 'audio/sfx/fighter_hurt2.mp3', fighter_hurt3: 'audio/sfx/fighter_hurt3.mp3', fighter_hurt4: 'audio/sfx/fighter_hurt4.mp3', fighter_hurt5: 'audio/sfx/fighter_hurt5.mp3', fighter_hurt6: 'audio/sfx/fighter_hurt6.mp3',
  magic_missile: 'audio/sfx/magic_missile.mp3', fireball_cast: 'audio/sfx/fireball_cast.mp3', fireball_hit: 'audio/sfx/fireball_hit.mp3', dwarf_hurt1: 'audio/sfx/dwarf_hurt1.mp3', dwarf_grunt1: 'audio/sfx/dwarf_grunt1.mp3', dwarf_grunt2: 'audio/sfx/dwarf_grunt2.mp3', cleric_grunt1: 'audio/sfx/cleric_grunt1.mp3', cleric_grunt2: 'audio/sfx/cleric_grunt2.mp3', protect: 'audio/sfx/protect.mp3', undead_ward: 'audio/sfx/undead_ward.mp3', sleep: 'audio/sfx/sleep.mp3', lightning: 'audio/sfx/lightning.mp3', entangle: 'audio/sfx/entangle.mp3', mu_grunt1: 'audio/sfx/mu_grunt1.mp3', mu_grunt2: 'audio/sfx/mu_grunt2.mp3', elf_grunt1: 'audio/sfx/elf_grunt1.mp3', elf_grunt2: 'audio/sfx/elf_grunt2.mp3', thief_grunt1: 'audio/sfx/thief_grunt1.mp3', thief_grunt2: 'audio/sfx/thief_grunt2.mp3', mu_grunt3: 'audio/sfx/mu_grunt3.mp3', mu_grunt4: 'audio/sfx/mu_grunt4.mp3', mu_grunt5: 'audio/sfx/mu_grunt5.mp3', mu_grunt6: 'audio/sfx/mu_grunt6.mp3', mu_grunt7: 'audio/sfx/mu_grunt7.mp3', mu_grunt8: 'audio/sfx/mu_grunt8.mp3', mu_grunt9: 'audio/sfx/mu_grunt9.mp3', mu_grunt10: 'audio/sfx/mu_grunt10.mp3', mu_grunt11: 'audio/sfx/mu_grunt11.mp3', mu_grunt12: 'audio/sfx/mu_grunt12.mp3', mu_grunt13: 'audio/sfx/mu_grunt13.mp3', mu_grunt14: 'audio/sfx/mu_grunt14.mp3', mu_hurt1: 'audio/sfx/mu_hurt1.mp3', mu_hurt2: 'audio/sfx/mu_hurt2.mp3', mu_hurt3: 'audio/sfx/mu_hurt3.mp3', mu_hurt4: 'audio/sfx/mu_hurt4.mp3', mu_hurt5: 'audio/sfx/mu_hurt5.mp3', mu_hurt6: 'audio/sfx/mu_hurt6.mp3', mu_hurt7: 'audio/sfx/mu_hurt7.mp3', mu_hurt8: 'audio/sfx/mu_hurt8.mp3', mu_hurt9: 'audio/sfx/mu_hurt9.mp3', mu_hurt10: 'audio/sfx/mu_hurt10.mp3',
  heal1: 'audio/sfx/heal1.mp3', heal2: 'audio/sfx/heal2.mp3', heal3: 'audio/sfx/heal3.mp3', heal4: 'audio/sfx/heal4.mp3', heal5: 'audio/sfx/heal5.mp3', miss1: 'audio/sfx/miss1.mp3', miss2: 'audio/sfx/miss2.mp3'};
// Male heroes share each other's grunts, re-pitched so every class keeps its own voice: Dwarf lowest, then Fighter, Cleric, Elf, Thief.
// A class's own recordings play at their natural pitch; borrowed ones play at the class's pitch (playback rate).
const VOICE_PITCH = {Dwarf: .8, Fighter: .9, Cleric: 1, Elf: 1.1, Thief: 1.2};
const OWN_GRUNTS = {Fighter: ['fighter_grunt1', 'fighter_grunt2', 'fighter_grunt3'], Dwarf: ['dwarf_grunt1', 'dwarf_grunt2'], Cleric: ['cleric_grunt1', 'cleric_grunt2'], Elf: ['elf_grunt1', 'elf_grunt2'], Thief: ['thief_grunt1', 'thief_grunt2']};
const BORROW = {Dwarf: ['fighter_grunt1', 'fighter_grunt2', 'cleric_grunt1', 'elf_grunt2'], Fighter: ['dwarf_grunt1', 'cleric_grunt2', 'elf_grunt1', 'thief_grunt1'], Cleric: ['fighter_grunt3', 'dwarf_grunt2', 'elf_grunt2', 'thief_grunt2'],
  Elf: ['fighter_grunt1', 'dwarf_grunt1', 'cleric_grunt1', 'thief_grunt2'], Thief: ['fighter_grunt2', 'dwarf_grunt2', 'cleric_grunt2', 'elf_grunt1']};
const GRUNTS = {'Magic User': Array.from({length: 14}, (_, i) => ['mu_grunt' + (i + 1), 1])};
for (const c in OWN_GRUNTS) GRUNTS[c] = [...OWN_GRUNTS[c].map(n => [n, 1]), ...BORROW[c].map(n => [n, VOICE_PITCH[c]])];
const MALE_HURTS = ['fighter_hurt1', 'fighter_hurt2', 'fighter_hurt3', 'fighter_hurt4', 'fighter_hurt5', 'fighter_hurt6', 'dwarf_hurt1'];   // shared by every male hero
const HURTS = {Fighter: MALE_HURTS, Dwarf: MALE_HURTS, Cleric: MALE_HURTS, Elf: MALE_HURTS, Thief: MALE_HURTS, 'Magic User': Array.from({length: 10}, (_, i) => 'mu_hurt' + (i + 1))};   // played when a hero takes damage or falls
const IMPACT_SFX = {slash: ['blade', 1], blunt: ['blunt', 1], arrow: ['blade', .55],
  claw: ['blade', .9], steel: ['blade', 1], rend: ['blade', 1], jaws: ['blade', .9], hellfire: ['blade', .8],
  necro: ['blunt', .85], crush: ['blunt', 1], stone: ['blunt', 1]};
const SFX_BUF = {};
function loadSfx() { for (const [k, url] of Object.entries(SFX_FILES)) fetch(url).then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => AC.decodeAudioData(b, ok, no))).then(buf => { SFX_BUF[k] = buf; }).catch(() => {}); }
function playSfx(name, vol = 1, rate = 1) {
  if (!AC || AC.state !== 'running' || !SFX_BUF[name]) return;
  const src = AC.createBufferSource(), g = AC.createGain();
  src.buffer = SFX_BUF[name]; src.playbackRate.value = rate * (.95 + Math.random() * .1);   // tiny pitch wobble so repeats don't sound identical
  g.gain.value = vol; src.connect(g); g.connect(sfxBus); src.start();
}
function hurtCry(h, fell) { const list = HURTS[h.cls]; if (list) playSfx(list[R(list.length) - 1], fell ? 1 : .85); }
const HEALS = ['heal1', 'heal2', 'heal3', 'heal4', 'heal5'], MISSES = ['miss1', 'miss2'];
const pick = list => list[R(list.length) - 1];
function healSfx() { playSfx(pick(HEALS), .8); }
function grunt(h) { const list = GRUNTS[h.cls]; if (list) { const [n, rate] = pick(list); playSfx(n, .9, rate); } }

/* Unique weapon names glow ember orange wherever they appear. */
(function () {
  const paint = root => {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode: t => (UNIQUE_RE.lastIndex = 0, UNIQUE_RE.test(t.data) && !(t.parentElement && t.parentElement.closest('.uniq,script,style,textarea,option'))) ? 1 : 2});
    const hits = []; while (tw.nextNode()) hits.push(tw.currentNode);
    hits.forEach(t => { const span = document.createElement('span'); UNIQUE_RE.lastIndex = 0; span.innerHTML = esc(t.data).replace(UNIQUE_RE, m => `<span class="uniq">${esc(m)}</span>`); t.replaceWith(...span.childNodes); });
  };
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) paint(n); else if (n.nodeType === 3 && n.parentNode) paint(n.parentNode); }))).observe(document.body, {childList: true, subtree: true});
})();
