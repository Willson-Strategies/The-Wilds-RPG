/* ---------------- rendering helpers ---------------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ail = t => String(t).replace(/\b(SHOCK|BURN|POISON)\b/g, m => `<span class="ail ${m}">${m}</span>`);
function img(name, stage = 0, cls = 'ico') { const a = ICON[name]; if (!a) return ''; return `<img class="${cls}" alt="" src="${a[Math.min(stage, a.length - 1)]}">`; }
const fmtClock = m => { const d = Math.floor(m / 1440) + 1, h = Math.floor(m % 1440 / 60), mi = m % 60; return `Day ${d}, ${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`; };
function header() {
  const loc = S.loc === 'castle' ? 'The Castle' : S.loc === 'camp' ? 'Camp, ' + region().name : region().name;
  return `<header class="bar"><h1>Base Line</h1><div class="meta"><span>${esc(loc)}</span><span>${fmtClock(S.clock)}</span><span>Gold <b>${S.gold} GP</b></span><span>Party level <b>${avgLevel()}</b></span></div><button class="btn small" id="musicbtn" style="margin-left:auto" aria-pressed="${musicOn}">♪ Sound ${musicOn ? 'on' : 'off'}</button><button class="btn small" id="questsbtn">Quests</button></header>`;
}
function askNewParty() {
  const el = modal(`<h2>Raise a New Party?</h2><p>Your current party, gold and gear will be lost for good.</p><div class="row"><button class="btn red" id="confirmnew">Start over</button><button class="btn" data-close>Keep playing</button></div>`);
  el.querySelector('#confirmnew').onclick = () => {
    el.remove(); stopTimers();
    try { localStorage.removeItem('baseline_save_v1'); } catch (e) {}
    S = null; draft = defaultDraft(); screenCreate();
  };
}
document.addEventListener('click', e => { if (e.target && e.target.id === 'questsbtn') { save(); leaveQuest(); screenTitle(); } });
function quietTimers() {   // stop anything that could act on the game in the background
  stopTimers(); clearTimeout(MON_T); MON_PENDING = false; cancelAnimationFrame(TYPE_RAF);
  FXQ = []; FX_LEAD = 0; for (const k in HPW) delete HPW[k]; for (const k in BARPEND) delete BARPEND[k];
  if (endTimer) { clearTimeout(endTimer); endTimer = null; }
  document.querySelectorAll('.modal').forEach(m => m.remove());
}
function leaveQuest() { quietTimers(); S = null; QUEST = null; }
function playQuest(n) { const d = readQuest(n); if (!d) return; quietTimers(); QUEST = n; S = d.S; uid = d.uid || 1000; save(); go(); }
// One-off (15 Oct test build): wind a quest back to the start of the Beastman camp scene, taking back the 437 GP hoard
// and the map, so the reworked fight can be played again. Runs once per quest and never again.
// One-off for quests started before build 80: as soon as the quest is free (no battle or scene in progress), it is taken
// to the Old Road and straight into the Beastman camp scene, wherever the party was. If the camp was already won,
// the 437 GP hoard and the map are taken back. Happens once per quest; quests started from build 80 never see it.
function forceCampOnce() {
  if (!S) return false;
  // Build 80 wrongly pulled level 1 quests into the camp too: send any of those home to the castle instead.
  if (S.forceCamp2 && !S.rescued81 && maxLevel() < 2 && ((S.event && S.event.id === 'beastcamp') || (S.battle && S.battle.boss === 'beastcamp'))) {
    S.rescued81 = true; S.event = null; S.battle = null; S.loc = 'castle'; castleTab = 'square'; save(); return false;
  }
  return false;   // the forced trip to the camp is retired; only the rescue above remains
}
function undoBossOnce() {
  S.events = S.events || {};
  if (S.b79 || S.undoBoss1 || !(S.events.beastcamp || S.events.beastTries > 0)) return;   // only older quests that have already fought the camp
  S.undoBoss1 = S.forceCamp1 = true;
  if (S.events.beastcamp) S.gold = Math.max(0, S.gold - 437);
  S.events.beastcamp = false; S.events.beastTries = 0;
  S.battle = null; S.loc = 'wild'; S.region = 'road'; S.event = {id: 'beastcamp'};
}
function questSummary(d) {
  const G = d.S, reg = (REGIONS.find(r => r.id === G.region) || REGIONS[0]).name, where = G.loc === 'castle' ? 'The Castle' : G.loc === 'camp' ? 'Camp, ' + reg : reg;
  const lv = G.party.map(h => `${esc(h.name)} <span class="note">${esc(h.cls)} ${h.level}</span>`).join(' · ');
  const when = new Date(d.savedAt).toLocaleString('en-GB', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
  return `<div class="slot-party">${lv}</div><div class="slot-meta">${esc(where)} · ${fmtClock(G.clock)} · ${G.gold} GP${G.battle ? ' · <b>in battle</b>' : ''}</div><div class="slot-when">Last played ${when}</div>`;
}
const DUR = ['Pristine', 'Scuffed', 'Worn', 'Chipped', 'Battered', 'Ruined'];
function itemTip(it) {
  const w = WPN[it.name], a = ARMOUR[it.name], st = wearH(it), dur = Math.round(100 - it.wear / 5 * 100);
  let stats = '', pen = 'None';
  if (w) {
    stats = `${RANGED.includes(it.name) ? 'Ranged' : 'Melee'} · ${w.tier}<br>To hit +${w.hit} · Damage ${w.dmg}${w.note ? '<br>' + ail(w.note.replace(/chance to (\w+)/, (m, x) => 'chance to ' + x.toUpperCase())) : ''}`;
    const p = WEAR_W[st]; if (p[0] || p[1]) pen = [p[0] ? `−${p[0]} to hit` : '', p[1] ? `−${p[1]} damage` : ''].filter(Boolean).join(', ');
  } else if (a) {
    stats = `${a.shield ? 'Shield' : 'Armour'} · +${a.ac} AC${a.move ? ` · −${a.move} movement` : ''}`;
    if (a.wear[st]) pen = `−${a.wear[st]} AC`;
  } else if (SPELLS[it.name]) { stats = `Scroll · ${SPELLS[it.name].list === 'MU' ? 'Magic User' : 'Cleric'} level ${SPELLS[it.name].lvl}<br>${ail(SPELLS[it.name].desc)}`; return `<b>${esc(it.name)}</b><div>${stats}</div>`; }
  if (it.wear >= FAST_WEAR && it.wear < 5) pen = pen === 'None' ? 'Wears 25% faster' : pen + '; wears 25% faster';
  const bar = `<div class="durbar"><i style="width:${dur}%;background:${dur > 60 ? '#6a8a3a' : dur > 30 ? '#a8780a' : '#8a2a14'}"></i></div>`;
  return `<b>${esc(it.name)}</b><div>${stats}</div><div style="margin-top:4px">Durability: <b>${DUR[st]}</b> (${dur}%)</div>${bar}<div>Effect: <b class="${pen === 'None' ? '' : 'pen'}">${pen}</b></div>${it.wear > 0.05 ? '<div class="note">The blacksmith can restore it.</div>' : ''}`;
}
const tipImg = (it, stage) => `<span class="tipper" tabindex="0" data-tip="${it.uid}">${img(it.name, stage)}</span>`;
(() => {
  const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; document.body.appendChild(tip);
  let hideT = null;
  const show = (el) => {
    const it = findItem(+el.dataset.tip); if (!it) return;
    tip.innerHTML = itemTip(it); tip.hidden = false;
    const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = Math.min(window.innerWidth - tw - 12, Math.max(12, r.left + r.width / 2 - tw / 2));
    let y = r.top - th - 8; if (y < 8) y = r.bottom + 8;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  };
  const hide = () => { tip.hidden = true; };
  // Phones fake mouse and focus events on every tap, so touch screens only get tooltips from a
  // deliberate press-and-hold, and never during battle.
  let lastTouch = 0, holdT = null;
  const touchy = () => Date.now() - lastTouch < 800;
  document.addEventListener('mouseover', e => { if (touchy()) return; const el = e.target.closest && e.target.closest('[data-tip]'); if (el) show(el); });
  document.addEventListener('mouseout', e => { if (touchy()) return; const el = e.target.closest && e.target.closest('[data-tip]'); if (el) hide(); });
  document.addEventListener('focusin', e => { if (touchy()) return; const el = e.target.closest && e.target.closest('[data-tip]'); if (el) show(el); });
  document.addEventListener('focusout', hide);
  const cancelHold = () => { clearTimeout(holdT); holdT = null; };
  document.addEventListener('touchstart', e => {
    lastTouch = Date.now(); hide(); cancelHold();
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (!el || S.battle) return;
    holdT = setTimeout(() => { show(el); clearTimeout(hideT); hideT = setTimeout(hide, 3000); }, 450);
  }, {passive: true});
  ['touchmove', 'touchend', 'touchcancel'].forEach(t => document.addEventListener(t, () => { lastTouch = Date.now(); cancelHold(); }, {passive: true}));
})();
function heroCard(h, i, extra = '') {
  const nxt = h.level >= 10 ? 1 : (h.xp - XP_CUM[h.level]) / (XP_CUM[h.level + 1] - XP_CUM[h.level]);
  const chips = Object.keys(h.status).filter(k => h.status[k] && !NOT_CHIP.includes(k)).map(k => `<span class="chip ${k}${chipLate(h.status[k])}>${k === 'WARD' ? 'Warded' : k === 'RANGE' ? 'At range +2 AC' : k}</span>`).join(' ');
  return `<div class="hero ${h.dead && !h.dyingFx ? 'dead' : ''} ${extra}" data-hero="${i}">
    <div class="pcol"><div class="pwrap"><img class="head" alt="" src="${HEADS[h.cls]}">${h.dead ? '' : stOverlay(h.status)}${ailIcons(h.status)}</div>${acBadge(heroAC(h), 'under' + (h.status && h.status.RANGE ? ' boosted' : ''))}</div>
    <div style="min-width:0"><div class="nm">${esc(h.name)} ${h.dead && !h.dyingFx ? '<span class="chip DOWN">Fallen</span>' : ''}</div>
      <div class="cl">Level ${h.level} ${h.cls} · ${acBadge(heroAC(h), 'inl')}</div></div>
    <div style="grid-column:1/-1;display:grid;gap:3px">
      <div class="bar2">${hpBar('p' + i, h.hp, h.max)}</div>
      <div class="nums"><span>HP ${hpTxt('p' + i, h.hp, h.max)} / ${h.max}</span><span>XP ${h.xp}${h.level < 10 ? ' / ' + XP_CUM[h.level + 1] : ''}</span></div>
      <div class="bar2 xp"><i style="width:${Math.min(100, nxt * 100)}%"></i></div>
      ${chips ? `<div>${chips}</div>` : ''}
      <div class="kit">${['melee', 'ranged', 'armour', 'shield'].map(k => h.equip[k] ? tipImg(h.equip[k], h.equip[k].shown || 0) : `<span class="empty" title="No ${k}"></span>`).join('')}</div>
    </div></div>`;
}
function roster(extraFor = () => '') { return `<aside class="roster">${S.party.map((h, i) => heroCard(h, i, extraFor(h, i))).join('')}</aside>`; }
const region = () => REGIONS.find(r => r.id === S.region) || REGIONS[0];
