/* ---------------- battle screen ---------------- */
function screenBattle() { render(); resumeBattle(); }
/* A warning on the "Monsters approach" panel when something from a deeper area has wandered in. */
function strayWarn(B) {
  const s = B.foes.reduce((a, f) => Math.max(a, f.stray || 0), 0); if (!s) return '';
  return `<p class="stray-warn">${s >= 2 ? 'Something from far deeper in the wilds has strayed onto this ground. It does not belong here.' : 'One of them has wandered in from deeper country, and it looks tougher than the rest.'}</p>`;
}
function screenEncounter() {
  const B = S.battle, L = partyLeader(), n = B.foes.length;
  const what = n === 1 ? ['A single enemy draws near', 'Something moves on the road ahead. Alone, by the sound of it.']
    : n <= 3 ? ['A small group of enemies approaches', 'Shapes gather in the gloom ahead: a handful, no more.']
    : ['A horde of enemies approaches!', 'The ground trembles. Too many shadows to count are coming your way.'];
  $('#app').innerHTML = header() + `<div class="encounter parch panel">
    <div class="enc-art"><img src="${FULL[L.cls]}" alt=""></div>
    <div class="enc-text"><div class="kicker">${esc(region().name)} · ${fmtClock(S.clock)}</div>
      <h2>Monsters approach</h2><p class="enc-big">${B.intro ? B.intro[0] : what[0]}</p><p class="sub">${B.intro ? B.intro[1] : what[1]}</p>${strayWarn(B)}
      ${B.noFlee ? `<p>${esc(L.name)} draws steel. There is no running from this one.</p>
      <div class="row" style="gap:10px;margin-top:14px"><button class="btn red" id="eFight">Fight</button></div>`
      : `<p>${esc(L.name)} leads the party. Stand and fight, or try to slip away unseen?</p>
      <div class="row" style="gap:10px;margin-top:14px"><button class="btn red" id="eFight">Fight</button><button class="btn" id="eFlee">Flee</button></div>
      <p class="note" style="margin-top:10px">If the escape fails, the enemy is upon you and every one of them strikes first.</p>`}</div></div>`;
  $('#eFight').onclick = () => {
    const panel = $('.encounter'); if (panel.classList.contains('enc-go')) return;
    panel.classList.add('enc-go');
    panel.insertAdjacentHTML('beforeend', `<div class="enc-dim"></div><div class="enc-strike"></div><div class="enc-call">To battle!</div>`);
    encSlashSfx();
    setTimeout(() => { delete B.phase; addLog(`<span class="sys">The party stands its ground.</span>`); newRound(); save(); render(); window.scrollTo({top: 0}); }, 950);
  };
  if ($('#eFlee')) $('#eFlee').onclick = () => { if (tryFlee(L)) return; delete B.phase; B.firstStrike = true; addLog(`<span class="bad">The escape fails. The enemy is upon you and strikes first!</span>`); newRound(); save(); render(); };
}
let endTimer = null;
function render() {
  hidePreview();
  const B = S.battle; if (!B) return go();
  if (B.phase === 'encounter') return screenEncounter();
  // Until the last action's dice have landed and its blows have struck, the next turn can't be played and the
  // log holds back its new lines, so nothing runs ahead of what's on screen.
  const lockMs = fxLockMs(); if (lockMs) INPUT_LOCK = Math.max(INPUT_LOCK, Date.now() + lockMs);
  const locked = Date.now() < INPUT_LOCK;
  if (locked) { clearTimeout(LOCK_T); LOCK_T = setTimeout(() => { LOCK_T = null; if (S.battle && !S.battle.phase && $('.foes')) render(); }, INPUT_LOCK - Date.now() + 20); }
  if (LOG_SEEN === null) LOG_SEEN = B.logN || 0;
  const hideLog = locked ? Math.max(0, (B.logN || 0) - LOG_SEEN) : 0;
  if (!locked) LOG_SEEN = B.logN || 0;
  const lost = B.over === 'lose' || (B.over && S.party.every(h => h.dead));
  const cur = B.cur, h = !B.over && cur && cur.side === 'p' ? S.party[cur.i] : null;
  const targetFoe = !!h && (B.mode === 'melee' || B.mode === 'ranged' || (B.mode === 'spell' && ['foe'].includes(SPELLS[h.book[B.spell]].target)));
  const targetAlly = !!h && B.mode === 'spell' && SPELLS[h.book[B.spell]].target === 'ally';
  const foes = B.foes.map((f, i) => {
    const chips = Object.keys(f.status).filter(k => !NOT_CHIP.includes(k)).map(k => `<span class="chip ${k}${chipLate(f.status[k])}>${k}</span>`).join(' ');
    return `<button class="foe ${f.dead && !f.dyingFx ? 'dead' : ''} ${targetFoe && !f.dead ? 'targetable' : ''}" data-foe="${i}" ${targetFoe && !f.dead ? '' : 'tabindex="-1"'}>
      <div class="win">${MONS[f.name] ? `<img src="${MONS[f.name]}" alt="">` : `<div class="seal">${f.name[0]}</div>`}${f.dead && !f.dyingFx ? '' : stOverlay(f.status) + ailIcons(f.status)}</div>
      <div class="row" style="flex-wrap:nowrap"><div style="min-width:0"><div class="fn">${esc(f.label)}</div><div class="ft">Level ${f.lvl} ${f.type} · ${acBadge(foeAC(f), 'inl enemyac' + (foeAC(f) < f.ac ? ' lowered' : ''))}</div></div></div>
      <div class="bar2">${hpBar('m' + i, f.hp, f.max)}</div><div class="nums" style="font-family:var(--label);font-size:.66rem;color:var(--muted)">HP ${hpTxt('m' + i, f.hp, f.max)} / ${f.max}</div>
      ${chips ? `<div>${chips}</div>` : ''}</button>`;
  }).join('');
  let act = '';
  if (h && locked) act = `<div class="actions"><span class="who">${esc(h.name)}</span><span class="note">Waiting for the dice…</span></div>`;
  else if (h) {
    const spells = h.book.map((sp, j) => sp ? `<button data-cast="${j}" ${h.used[j] ? 'disabled' : ''}>${img(sp)} ${sp}${h.used[j] ? ' (spent)' : ''}</button>` : '').join('');
    act = `<div class="actions"><span class="who">${esc(h.name)}</span>
      ${h.equip.melee ? `<button class="btn ${B.mode === 'melee' ? 'red' : ''}" id="aMelee">${tipImg(h.equip.melee, h.equip.melee.shown || 0)} Attack</button>` : ''}
      ${h.equip.ranged ? `<button class="btn ${B.mode === 'ranged' ? 'red' : ''}" id="aRanged">${tipImg(h.equip.ranged, h.equip.ranged.shown || 0)} Shoot</button>` : ''}
      ${h.book.some(x => x) ? `<button class="btn ${B.mode === 'cast' || B.mode === 'spell' ? 'red' : ''}" id="aCast">Cast</button>` : ''}
      <button class="btn" id="aWait">Wait</button>
      ${B.noFlee ? '' : '<button class="btn" id="aFlee">Flee</button>'}
      ${B.mode === 'cast' ? `<div class="spellpick" style="flex-basis:100%">${spells}</div>` : ''}
      ${B.mode && B.mode !== 'cast' ? `<span class="note" style="color:var(--ink-soft);flex-basis:100%">${targetAlly ? 'Choose an ally from the party list.' : 'Choose a target.'}</span>` : ''}
    </div>`;
  } else act = `<div class="actions"><span class="note">${B.over ? (lost ? 'Your party falls…' : 'The last foe falls…') : 'The enemy moves…'}</span></div>`;
  $('#app').innerHTML = header() + `<div class="main"><div style="display:grid;gap:12px;min-width:0"><div class="parch panel"><h2>${B.boss === 'beastcamp' ? BOSS_TITLE : B.boss === 'warlord' ? WARLORD_TITLE : 'Battle · ' + region().name}</h2><p class="sub">Round ${B.round}. Monsters favour the front two of your party.</p>
    <div class="foes">${foes}</div>${act}</div>
    <div class="log" aria-live="polite">${B.log.slice(hideLog).map(l => `<div>${l}</div>`).join('')}</div></div>
    ${roster((x, i) => (cur && cur.side === 'p' && cur.i === i ? 'active ' : '') + (targetAlly && !x.dead ? 'targetable clickable' : ''))}</div>`;
  playFX();
  // A finished battle always gets its result screen, even after a reload, but only once every die and blow is done.
  if (B.over && !endTimer) {
    const wait = Math.max(1100, FX_BUSY - Date.now() + 700, INPUT_LOCK - Date.now() + 1300);
    endTimer = setTimeout(() => { endTimer = null; if (S.battle && S.battle.over) (lost ? defeat : victory)(); }, wait);
  }
  if (!h || locked) return;
  const done = () => { save(); nextTurn(); };
  if ($('#aMelee')) $('#aMelee').onclick = () => { B.mode = 'melee'; render(); };
  if ($('#aRanged')) $('#aRanged').onclick = () => { B.mode = 'ranged'; render(); };
  if ($('#aCast')) $('#aCast').onclick = () => { B.mode = 'cast'; render(); };
  if ($('#aFlee')) $('#aFlee').onclick = () => { if (!tryFlee(h)) done(); };
  $('#aWait').onclick = () => { addLog(`<span class="miss">${esc(h.name)} holds back.</span>`); done(); };
  document.querySelectorAll('[data-cast]').forEach(b => b.onclick = () => {
    const j = +b.dataset.cast, s = SPELLS[h.book[j]];
    if (s.target === 'all' || s.target === 'party') { castSpell(h, j, null); return done(); }
    B.mode = 'spell'; B.spell = j; render();
  });
  // Hovering (or press-and-hold on a touch screen) an enemy shows the odds for the hero whose turn it is.
  const preview = f => {
    if (B.mode === 'melee' || B.mode === 'ranged') return attackPreview(h, f, B.mode === 'ranged');
    if (B.mode === 'spell') return spellPreview(h, h.book[B.spell], f);
    const opts = [h.equip.melee || !h.equip.ranged ? attackPreview(h, f, false) : '', h.equip.ranged ? attackPreview(h, f, true) : ''].filter(Boolean);
    return opts.join('<hr>');
  };
  document.querySelectorAll('[data-foe]').forEach(b => {
    const f = B.foes[+b.dataset.foe]; if (f.dead) return;
    const show = () => showPreview(b, `<div class="pv-head">${esc(h.name)} <span class="note">vs</span> ${esc(f.label)}</div>${preview(f)}`);
    b.addEventListener('mouseenter', () => { if (!pvTouchy()) show(); });
    b.addEventListener('mouseleave', hidePreview);
    b.addEventListener('focus', () => { if (!pvTouchy()) show(); });
    b.addEventListener('blur', hidePreview);
    b.addEventListener('touchstart', () => { PV.lastTouch = Date.now(); clearTimeout(PV.hold); PV.hold = setTimeout(() => { PV.held = Date.now(); show(); if (navigator.vibrate) navigator.vibrate(8); }, 420); }, {passive: true});
    ['touchend', 'touchmove', 'touchcancel'].forEach(t => b.addEventListener(t, () => { PV.lastTouch = Date.now(); clearTimeout(PV.hold); if (PV.held) { clearTimeout(PV.hide); PV.hide = setTimeout(hidePreview, 2600); } }, {passive: true}));
  });
  document.querySelectorAll('[data-foe]').forEach(b => b.onclick = () => {
    if (PV.held && Date.now() - PV.held < 1500) { PV.held = 0; return; }   // a press-and-hold only peeks at the odds
    hidePreview();
    const f = B.foes[+b.dataset.foe]; if (f.dead || !targetFoe) return;
    if (B.mode === 'melee' || B.mode === 'ranged') heroAttack(h, f, B.mode === 'ranged');
    else castSpell(h, B.spell, f);
    done();
  });
  if (targetAlly) document.querySelectorAll('[data-hero]').forEach(c => c.onclick = () => { const x = S.party[+c.dataset.hero]; if (x.dead) return; castSpell(h, B.spell, x); done(); });
}
