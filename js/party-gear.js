/* ---- party & gear (castle and camp) ---- */
function canEquip(h, name) {
  if (WPN[name]) return WPN[name].cls ? WPN[name].cls === h.cls : DATA.classes[h.cls].tiers.includes(WPN[name].tier);
  if (ARMOUR[name]) return ARMOUR[name].who.includes(h.cls);
  return false;
}
function partyGear() {
  return `<h2>Party &amp; Gear</h2><p class="sub">Equip one melee and one ranged weapon, armour and a shield. Learn scrolls and fill your spellbook. Drag a hero's card by any empty space to change the marching order: monsters favour the front two.</p>
  <div class="pcards">${S.party.map((h, i) => {
    const b = bookFor(h.cls, h.level);
    const slots = ['melee', 'ranged', 'armour', 'shield'].map(k => {
      const it = h.equip[k];
      const opts = S.inv.filter(x => itemKind(x.name) === k && canEquip(h, x.name));
      return `<div class="slot"><span class="lab">${k}</span>${it ? tipImg(it, it.shown || 0) + ' ' + it.name : '<span class="note">empty</span>'}
        <span style="margin-left:auto" class="row">${opts.length ? `<select data-eq="${i}:${k}" aria-label="Equip ${k} for ${esc(h.name)}"><option value="">Equip…</option>${opts.map(o => `<option value="${o.uid}">${o.name}</option>`).join('')}</select>` : ''}${it ? `<button class="btn small" data-uneq="${i}:${k}">Remove</button>` : ''}</span></div>`;
    }).join('');
    const scrolls = S.inv.filter(x => itemKind(x.name) === 'scroll' && canLearn(h.cls, x.name) && !h.known.includes(x.name));
    let book = '';
    if (!NO_MAGIC.includes(h.cls)) {
      book = `<h3>Spellbook · ${b[2]} slot${b[2] === 1 ? '' : 's'}${b[3] ? `, up to ${b[3]} level 2` : ''}</h3>
      ${b[2] ? `<div class="grid2">${h.book.map((sp, j) => `<div class="slot"><span class="lab">Slot ${j + 1}${h.used[j] ? ` <i class="spent">${h.used[j] === 2 ? 'spent: 16h rest' : 'spent: 8h rest'}</i>` : ''}</span>${sp ? `<span class="sp-ico" tabindex="0" data-tt="${esc(spellTip(h, sp))}">${img(sp)}</span>` : ''}
        <select data-bk="${i}:${j}" aria-label="Spell in slot ${j + 1} for ${esc(h.name)}" style="flex:1"><option value="">— empty —</option>${h.known.map(k => `<option value="${k}" ${k === sp ? 'selected' : ''}>${k}${SPELLS[k].lvl >= 2 && (h.spentL2 || []).includes(k) ? ' (spent)' : ''}</option>`).join('')}</select></div>`).join('')}</div>
      ${h.used.some(u => u === 2) ? '<p class="note">A spent level 2 spell needs 16 hours of rest (or a night at the inn). Until then you can put a level 1 spell in its slot instead, ready to cast.</p>' : ''}` : '<p class="note">No spell slots yet.</p>'}
      <p class="note">Known: ${h.known.length ? h.known.join(', ') : 'none'}.</p>
      ${scrolls.length ? `<div class="row">${scrolls.map(sc => `<button class="btn small" data-learn="${i}:${sc.uid}">Learn ${sc.name}</button>`).join('')}</div>` : ''}`;
    }
    return `<div class="pcard" data-pcard="${i}">
      <div class="row pc-head"><button class="portrait-btn" data-sheet="${i}" aria-label="Show ${esc(h.name)}'s full stats"><img class="head" alt="" src="${HEADS[h.cls]}"></button>
        <div style="min-width:0"><h3 style="margin:0">${esc(h.name)}</h3><div class="pc-sub">Level ${h.level} ${h.cls}</div></div>
        <span class="rank ${i < 2 ? 'front' : ''}">${i < 2 ? 'Front' : 'Rear'} · ${i + 1}</span>
        <span class="grip" aria-hidden="true" title="Drag to reorder"><svg viewBox="0 0 12 18"><g fill="currentColor"><circle cx="3" cy="3" r="1.6"/><circle cx="9" cy="3" r="1.6"/><circle cx="3" cy="9" r="1.6"/><circle cx="9" cy="9" r="1.6"/><circle cx="3" cy="15" r="1.6"/><circle cx="9" cy="15" r="1.6"/></g></svg></span></div>
      ${gearSummary(h)}
      <div class="statgrid" style="margin:8px 0">${STATS.map(s => statCell(s, h.st[s], h)).join('')}</div>
      <div class="grid2">${slots}</div>${book}</div>`;
  }).join('')}</div>`;
}
function wireSheets() {
  document.querySelectorAll('[data-sheet]').forEach(b => b.onclick = () => heroSheet(+b.dataset.sheet));
  if (!S.battle) document.querySelectorAll('.roster .hero').forEach(c => { c.classList.add('clickable'); c.title = 'Show full stats'; c.onclick = () => heroSheet(+c.dataset.hero); });
}
function wireGear() {
  wireSheets();
  document.querySelectorAll('[data-eq]').forEach(s => s.onchange = () => {
    const [i, k] = s.dataset.eq.split(':'), h = S.party[+i], u = +s.value; if (!u) return;
    const ix = S.inv.findIndex(x => x.uid === u); if (ix < 0) return;
    const it = S.inv.splice(ix, 1)[0]; if (h.equip[k]) S.inv.push(h.equip[k]); h.equip[k] = it; save(); go();
  });
  document.querySelectorAll('[data-uneq]').forEach(b => b.onclick = () => { const [i, k] = b.dataset.uneq.split(':'), h = S.party[+i]; if (h.equip[k]) { S.inv.push(h.equip[k]); h.equip[k] = null; } save(); go(); });
  wirePartyDrag();
  document.querySelectorAll('[data-learn]').forEach(b => b.onclick = () => { const [i, u] = b.dataset.learn.split(':').map(Number); const ix = S.inv.findIndex(x => x.uid === u); if (ix < 0) return; S.party[i].known.push(S.inv[ix].name); S.inv.splice(ix, 1); save(); go(); });
  document.querySelectorAll('[data-bk]').forEach(s => s.onchange = () => {
    const [i, j] = s.dataset.bk.split(':').map(Number), h = S.party[i], sp = s.value || null;
    const b = bookFor(h.cls, h.level);
    const next = h.book.slice(); next[j] = sp;
    const l2 = next.filter(x => x && SPELLS[x].lvl === 2);
    if (l2.length > b[3]) { flash(`${h.name}'s spellbook can only hold ${b[3]} level 2 spell${b[3] === 1 ? '' : 's'} now.`); return go(); }
    if (h.cls === 'Elf' && l2.some(x => SPELLS[x].list !== 'MU')) { flash("The Elf's level 2 slot can only hold Magic User spells."); return go(); }
    const was = h.used[j], spentL2 = (h.spentL2 || []).includes(sp);
    if (sp && SPELLS[sp].lvl >= 2 && spentL2) h.used[j] = 2;             // a spent level 2 spell stays spent until a 16-hour rest
    else if (was === 2 && sp && SPELLS[sp].lvl === 1) h.used[j] = false;  // swap in a level 1 spell instead, ready to cast
    else h.used[j] = was || false;                                       // otherwise a spent slot stays spent
    h.book = next; save(); go();
  });
}
/* Drag a hero card by its empty space to reorder the party. Mouse: press and move. Touch: press and hold briefly,
   then drag (a quick swipe still scrolls the page). The card follows the pointer; the others make way as it passes. */
function wirePartyDrag() {
  const list = document.querySelector('.pcards'); if (!list) return;
  const busy = el => el.closest('button,select,input,textarea,a,option,label,.tipper,[data-sheet],[data-tt]');
  let d = null, pend = null, hold = null, raf = 0;
  const cards = () => [...list.querySelectorAll('.pcard')];
  const begin = (card, clientY) => {
    d = {card, startPage: clientY + scrollY, lastClient: clientY, before: cards().map(c => c.dataset.pcard).join()};
    card.classList.add('dragging'); document.body.classList.add('pdragging');
    const loop = () => { if (!d) return;
      const edge = 70, y = d.lastClient;
      const sp = v => Math.min(14, Math.ceil(v / 5));   // gentle edge scrolling, capped
      if (y < edge) scrollBy(0, -sp(edge - Math.max(0, y))); else if (y > innerHeight - edge) scrollBy(0, sp(Math.min(innerHeight, y) - innerHeight + edge));
      place(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  };
  const place = () => {
    const {card} = d, pageY = d.lastClient + scrollY;
    const others = cards().filter(c => c !== card);
    let target = null;
    for (const c of others) { const r = c.getBoundingClientRect(); if (d.lastClient < r.top + r.height / 2) { target = c; break; } }
    const now = card.nextElementSibling === target || (!target && !card.nextElementSibling);
    if (!now) { const old = card.offsetTop; list.insertBefore(card, target); d.startPage += card.offsetTop - old; }
    card.style.transform = `translateY(${pageY - d.startPage}px)`;
  };
  const end = () => {
    if (!d) return;
    cancelAnimationFrame(raf);
    const {card, before} = d; d = null; document.body.classList.remove('pdragging');
    card.classList.remove('dragging'); card.classList.add('settling'); card.style.transform = '';
    const order = cards().map(c => +c.dataset.pcard);
    setTimeout(() => { card.classList.remove('settling'); if (order.join() !== before) { S.party = order.map(i => S.party[i]); save(); go(); } }, 180);
  };
  list.querySelectorAll('.pcard').forEach(card => {
    card.addEventListener('mousedown', e => { if (e.button !== 0 || busy(e.target)) return; e.preventDefault(); pend = {card, y: e.clientY}; });
    card.addEventListener('touchstart', e => {
      if (busy(e.target) || e.touches.length > 1) return;
      const y = e.touches[0].clientY; clearTimeout(hold);
      pend = {card, y, touch: true};
      hold = setTimeout(() => { if (pend && pend.card === card) { begin(card, pend.y); pend = null; if (navigator.vibrate) navigator.vibrate(10); } }, 320);
    }, {passive: true});
  });
  const onMove = (clientY, ev) => {
    if (d) { d.lastClient = clientY; if (ev && ev.cancelable) ev.preventDefault(); return; }
    if (!pend) return;
    if (Math.abs(clientY - pend.y) > 6) { if (pend.touch) { clearTimeout(hold); pend = null; return; } begin(pend.card, pend.y); d.lastClient = clientY; pend = null; }
  };
  const stop = () => { clearTimeout(hold); pend = null; end(); };
  if (!window.__pdragWired) {   // document-level listeners are added once and look up the current list each time
    window.__pdragWired = true;
    document.addEventListener('mousemove', e => PDRAG.move(e.clientY, e));
    document.addEventListener('touchmove', e => PDRAG.move(e.touches[0].clientY, e), {passive: false});
    ['mouseup', 'touchend', 'touchcancel'].forEach(t => document.addEventListener(t, () => PDRAG.stop()));
  }
  PDRAG.move = onMove; PDRAG.stop = stop;
}
const PDRAG = {move: () => {}, stop: () => {}};
/* Breakdown tooltips: any element with data-tt shows its HTML on hover or focus, or on tap on a touch screen. */
(function () {
  const tip = document.createElement('div'); tip.className = 'tip tt'; tip.hidden = true; document.body.appendChild(tip);
  let hideT = null, lastTouch = 0;
  const show = el => {
    tip.innerHTML = el.getAttribute('data-tt'); tip.hidden = false; clearTimeout(hideT);
    const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    const x = Math.min(innerWidth - tw - 8, Math.max(8, r.left + r.width / 2 - tw / 2));
    let y = r.top - th - 8; if (y < 8) y = r.bottom + 8;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  };
  const hide = () => { tip.hidden = true; };
  const at = e => e.target.closest && e.target.closest('[data-tt]');
  document.addEventListener('mouseover', e => { if (Date.now() - lastTouch < 800) return; const el = at(e); if (el) show(el); });
  document.addEventListener('mouseout', e => { if (at(e)) hide(); });
  document.addEventListener('focusin', e => { const el = at(e); if (el) show(el); });
  document.addEventListener('focusout', e => { if (at(e)) hide(); });
  document.addEventListener('touchstart', e => { lastTouch = Date.now(); const el = at(e); if (el) { show(el); hideT = setTimeout(hide, 3500); } else hide(); }, {passive: true});
  addEventListener('scroll', hide, {passive: true});
})();
let flashMsg = '';
function flash(m) { flashMsg = m; setTimeout(() => { flashMsg = ''; }, 50); alertBox(m); }
function alertBox(m) { modal(`<h2>Not possible</h2><p>${esc(m)}</p><div class="row"><button class="btn" data-close>Close</button></div>`); }
function modal(html, onClose) {
  const el = document.createElement('div'); el.className = 'modal'; el.innerHTML = `<div class="parch panel">${html}</div>`;
  document.body.appendChild(el);
  el.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { el.remove(); onClose && onClose(); });
  return el;
}
