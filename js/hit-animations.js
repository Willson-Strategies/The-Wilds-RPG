function recoil(el, big) { el.classList.remove('fx-shake', 'fx-shake-big'); void el.offsetWidth; el.classList.add(big ? 'fx-shake-big' : 'fx-shake'); }
function fxOne(e) {
  if (e.k === 'miss' && !e.spell) playSfx(pick(MISSES), e.side === 'p' ? .7 : .8);
  if (IMPACT_SFX[e.k]) playSfx(IMPACT_SFX[e.k][0], IMPACT_SFX[e.k][1] * (e.side === 'p' ? .85 : 1));
  const win = e.side === 'm' ? document.querySelector(`.foe[data-foe="${e.i}"] .win`) : document.querySelector(`.hero[data-hero="${e.i}"] .pwrap`);
  if (!win) return;
  const r = win.getBoundingClientRect(), x = r.left + scrollX + r.width / 2, y = r.top + scrollY + r.height / 2;
  const sc = Math.max(r.width / 208, .58);
  const hurt = () => win.insertAdjacentHTML('beforeend', '<div class="fx-hurt"></div>');
  const sparks = (n, c, size, up) => { for (let k = 0; k < n; k++) { const a = up ? -Math.PI / 2 + (Math.random() - .5) * 1.6 : Math.random() * Math.PI * 2, dist = size * (.45 + Math.random() * .45); fxAt('fx-spark', x + (up ? (Math.random() - .5) * size * .5 : 0), y, 0, 0, `--c:${c};--dx:${Math.cos(a) * dist}px;--dy:${Math.sin(a) * dist}px`); } };
  const shards = (n, c, size, len, th) => { for (let k = 0; k < n; k++) fxAt('fx-shard', x, y, 0, 0, `--c:${c};--a:${Math.random() * 360}deg;--len:${len}px;--th:${th}px;--d:${size * .55}px`); };
  switch (e.k) {
    /* ---- spell projectiles ---- */
    case 'missile': case 'fireball': {
      const src = unitEl(e.from); if (!src) break;
      const a = src.getBoundingClientRect(), x0 = a.left + scrollX + a.width / 2, y0 = a.top + scrollY + a.height / 2;
      if (e.k === 'missile') {
        playSfx('magic_missile', .9);
        const n = e.volley || 1;
        for (let k = 0; k < n; k++) {   // a volley: each missile on its own arc, landing one after another
          const arc = n === 1 ? .45 : (k % 2 ? -1 : 1) * (.25 + .18 * Math.ceil(k / 2)), jx = n === 1 ? 0 : (Math.random() - .5) * r.width * .35, jy = n === 1 ? 0 : (Math.random() - .5) * r.height * .35;
          flyOrb('fx-orb mm', x0, y0, x + jx, y + jy, 80 + k * 70, MM_HIT - 80, n === 1 ? 18 : 14, '#c9a2ff', arc);
          if (k < n - 1) setTimeout(() => { fxAt('fx-boom', x + jx, y + jy, 46 * sc, 46 * sc, '--c:#e6d4ff;--c2:#5a2a9a'); recoil(win); }, MM_HIT + k * 70);
        }
      }
      else {
        playSfx('fireball_cast', .9); setTimeout(() => playSfx('fireball_hit', 1), FB_HIT - 20);
        const orb = fxAt('fx-orb fb conj', x0, y0, 0, 0, `--s:${Math.max(30, a.width * .4)}px`);
        const embers = setInterval(() => { const ang = Math.random() * Math.PI * 2, d = 40 + Math.random() * 40; fxAt('fx-ember in', x0 + Math.cos(ang) * d, y0 + Math.sin(ang) * d, 0, 0, `--dx:${-Math.cos(ang) * d}px;--dy:${-Math.sin(ang) * d}px`); }, 45);
        setTimeout(() => { clearInterval(embers); orb.remove(); flyOrb('fx-orb fb', x0, y0, x, y, 0, FB_HIT - FB_LAUNCH, 34, '#ff9a30', .9, true); }, FB_LAUNCH);
      }
      return;
    }
    case 'stars': {   // Sleep: whimsical stars drift lazily from the caster to the target
      const src = unitEl(e.from); if (!src) break;
      playSfx('sleep', .9);
      const [x0, y0, a] = centre(src);
      for (let k = 0; k < 8; k++) {
        const s = (12 + Math.random() * 12) * Math.max(sc, .7), wait = k * 70, dur = SLEEP_HIT - wait - 60 - Math.random() * 120;
        flyEl('fx-star', STAR_SVG(s), x0 + (Math.random() - .5) * a.width * .4, y0 + (Math.random() - .5) * a.height * .4, x + (Math.random() - .5) * r.width * .45, y + (Math.random() - .5) * r.height * .45, wait, dur,
          {lazy: true, arc: (Math.random() - .5) * 1.4, wob: 18 + Math.random() * 16, wobF: 2 + Math.random() * 2, style: `animation-duration:${1.2 + Math.random()}s`, every: 70,
           trail: (px, py) => fxAt('fx-glit', px, py, 0, 0, `--c:${Math.random() < .5 ? '#c8d0ff' : '#ffe9a8'};--dx:${(Math.random() - .5) * 10}px;--dy:${8 + Math.random() * 14}px`)});
      }
      return;
    }
    case 'bolt': {   // Lightning Bolt: jolts from the caster through every target in turn, flashing as it goes
      const src = unitEl(e.from); if (!src) break;
      let [px, py] = centre(src);
      setTimeout(() => playSfx('lightning', 1), Math.max(0, BOLT_HIT - 140));
      fxAt('fx-screen', 0, 0, 0, 0, `animation-delay:${BOLT_HIT - 40}ms;opacity:0`);
      (e.chain || [e.u]).forEach((u, n) => {
        const w2 = winOf(u); if (!w2) return;
        const [tx, ty] = centre(w2), at = BOLT_HIT + n * BOLT_STEP - 120;
        boltLine(px, py, tx, ty, 2.6 * Math.max(sc, .7), Math.max(0, at));
        setTimeout(() => { w2.insertAdjacentHTML('beforeend', '<div class="fx-tint SHOCK"></div>'); recoil(w2, true); fxAt('fx-boom', tx, ty, 90 * sc, 90 * sc, '--c:#e8f2ff;--c2:#1c3566'); }, at + 120);
        px = tx; py = ty;
      });
      return;
    }
    case 'spark': {  // a stray spark arcing between enemies after a bolt
      const src = unitEl(e.from) || win, [x0, y0] = centre(src);
      boltLine(x0, y0, x, y, 1.4 * Math.max(sc, .7), 0);
      fxAt('fx-boom', x, y, 50 * sc, 50 * sc, '--c:#e8f2ff;--c2:#1c3566'); recoil(win);
      return;
    }
    case 'vines': {  // Entangle: a web of vines lashes out and wraps the target, shedding leaves
      const src = unitEl(e.from); if (!src) break;
      const [x0, y0] = centre(src), dx = x - x0, dy = y - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
      playSfx('entangle', 1);
      let paths = '';
      [-1, -.35, .4, 1].forEach((b, i) => {
        const bend = b * len * .22, cx = (x0 + x) / 2 + nx * bend, cy = (y0 + y) / 2 + ny * bend, ex = x + (Math.random() - .5) * r.width * .4, ey = y + (Math.random() - .5) * r.height * .4;
        const d = `M${x0.toFixed(0)} ${y0.toFixed(0)}Q${cx.toFixed(0)} ${cy.toFixed(0)} ${ex.toFixed(0)} ${ey.toFixed(0)}`;
        paths += `<path d="${d}" stroke="#25501c" stroke-width="${5 * Math.max(sc, .7)}" style="--len:${len * 1.4}px;animation-delay:${i * 40}ms"/><path d="${d}" stroke="#7ec050" stroke-width="${1.8 * Math.max(sc, .7)}" style="--len:${len * 1.4}px;animation-delay:${i * 40}ms"/>`;
      });
      fxAt('fx-vine', 0, 0, 0, 0, `--dur:${ENT_HIT - 120}ms;--life:${ENT_HIT + 700}ms`, `<svg width="1" height="1" style="overflow:visible">${paths}</svg>`);
      setTimeout(() => {   // the vines close around the portrait like a net
        const rw = r.width / 2, rh = r.height / 2; let web = '';
        for (let k = 0; k < 6; k++) {
          const a0 = Math.random() * Math.PI * 2, a1 = a0 + Math.PI * (.7 + Math.random() * .6), rx = rw * (.7 + Math.random() * .4), ry = rh * (.7 + Math.random() * .4);
          const d = `M${(x + Math.cos(a0) * rx).toFixed(0)} ${(y + Math.sin(a0) * ry).toFixed(0)}Q${(x + Math.cos((a0 + a1) / 2) * rx * .2).toFixed(0)} ${(y + Math.sin((a0 + a1) / 2) * ry * .2).toFixed(0)} ${(x + Math.cos(a1) * rx).toFixed(0)} ${(y + Math.sin(a1) * ry).toFixed(0)}`;
          web += `<path d="${d}" stroke="#25501c" stroke-width="${4.5 * Math.max(sc, .7)}" style="--len:${r.width * 2}px;animation-delay:${k * 35}ms"/><path d="${d}" stroke="#7ec050" stroke-width="${1.6 * Math.max(sc, .7)}" style="--len:${r.width * 2}px;animation-delay:${k * 35}ms"/>`;
        }
        fxAt('fx-vine', 0, 0, 0, 0, '--dur:.28s;--life:1.1s', `<svg width="1" height="1" style="overflow:visible">${web}</svg>`);
        for (let k = 0; k < 14; k++) { const ang = Math.random() * Math.PI * 2, d = r.width * (.4 + Math.random() * .5); fxAt('fx-leaf', x + Math.cos(ang) * rw * .5, y + Math.sin(ang) * rh * .5, 0, 0, `--s:${(9 + Math.random() * 8) * Math.max(sc, .7)}px;--r:${Math.random() * 360}deg;--spin:${(Math.random() - .5) * 720}deg;--dx:${Math.cos(ang) * d}px;--dy:${Math.sin(ang) * d * .6 + 40 + Math.random() * 40}px;animation-delay:${k * 18}ms`); }
        recoil(win);
      }, ENT_HIT - 80);
      return;
    }
    case 'skull': {  // Undead Ward: a holy skull; Undead Abyss: a skull from the abyss that opens a vortex
      const src = unitEl(e.from); if (!src) break;
      const [x0, y0] = centre(src), s = (e.abyss ? 52 : 42) * Math.max(sc, .75);
      flyEl('fx-skull ' + (e.abyss ? 'abyss' : 'holy'), SKULL_SVG(s, e.abyss), x0, y0, x, y, 0, SKULL_HIT, {arc: .5, wob: 10, wobF: 4, every: 30,
        trail: (px, py) => e.abyss ? fxAt('fx-smoke', px, py, s * .7, s * .7, `--dy:${-10 - Math.random() * 20}px`) : fxAt('fx-glit', px, py, 0, 0, `--c:#ffd36a;--dx:${(Math.random() - .5) * 18}px;--dy:${(Math.random() - .5) * 18}px`)});
      setTimeout(() => {
        if (e.abyss) { fxAt('fx-vortex', x, y, r.width * 1.1, r.width * 1.1); for (let k = 0; k < 12; k++) { const a = Math.random() * Math.PI * 2, d = r.width * (.5 + Math.random() * .4); fxAt('fx-in', x, y, 0, 0, `--s:${8 + Math.random() * 10}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;animation-delay:${k * 30}ms`); } }
        else { fxAt('fx-ring', x, y, r.width, r.width, '--c:#ffe08a;--bw:4px'); sparks(14, '#ffd36a', r.width, false); }
      }, SKULL_HIT - 20);
      return;
    }
    case 'charge': {  // wind-up: the attacker draws back trembling as power gathers, then lunges at its target
      const card = win.closest('.foe,.hero') || win, tEl = unitEl(e.to); if (!tEl) break;
      const [tx, ty] = centre(tEl), dx = tx - x, dy = ty - y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, px = -uy, py = ux;
      const hero = e.side === 'p', col = hero ? '#ffd890' : '#ff8a6a', back = hero ? 5 : 8, lunge = hero ? 16 : 22;
      const T = (a, b, s = 1) => `translate(${(a).toFixed(1)}px,${(b).toFixed(1)}px) scale(${s})`;
      const frames = [{transform: 'none', filter: 'none', offset: 0}];
      for (let k = 1; k <= 5; k++) { const j = (k % 2 ? 1 : -1) * (1 + k * .4), pull = back * k / 5;   // trembling, sliding back
        frames.push({transform: T(-ux * pull + px * j, -uy * pull + py * j, 1 + k * .006), filter: `brightness(${1 + k * .05}) drop-shadow(0 0 ${k * 2}px ${col})`, offset: k * .11}); }
      frames.push({transform: T(ux * lunge, uy * lunge, 1.04), filter: `brightness(1.3) drop-shadow(0 0 10px ${col})`, offset: .66});   // the lunge, as the blow lands
      frames.push({transform: 'none', filter: 'none', offset: 1});
      card.style.zIndex = 5; card.animate(frames, {duration: CHARGE / .66, easing: 'linear'}).onfinish = () => { card.style.zIndex = ''; };
      for (let k = 0; k < 8; k++) { const a = Math.random() * Math.PI * 2, d = 26 + Math.random() * 24; fxAt('fx-ember in', x + Math.cos(a) * d, y + Math.sin(a) * d, 0, 0, `--c:${col};--dx:${-Math.cos(a) * d}px;--dy:${-Math.sin(a) * d}px;animation-delay:${k * 22}ms`); }
      if (e.cry && S.party[e.i]) setTimeout(() => grunt(S.party[e.i]), CHARGE - 140);
      return;
    }
    case 'castglow':  // a soft glow around a caster as a blessing leaves their hands
      fxAt('fx-cglow', x, y, r.width * 1.3, r.width * 1.3);
      for (let k = 0; k < 6; k++) fxAt('fx-glit', x + (Math.random() - .5) * r.width * .6, y + r.height * .3, 0, 0, `--c:#ffe08a;--dx:${(Math.random() - .5) * 20}px;--dy:${-r.height * (.4 + Math.random() * .4)}px;animation-delay:${k * 40}ms`);
      return;
    case 'heal': {   // Cures: a warm golden-green glow with rising motes and crosses
      win.insertAdjacentHTML('beforeend', '<div class="fx-tint HEAL"></div>');
      fxAt('fx-ring', x, y, r.width * (e.big ? 1.15 : .9), r.width * (e.big ? 1.15 : .9), '--c:#ffe9a0;--bw:3px');
      const n = e.big ? 16 : 9;
      for (let k = 0; k < n; k++) {
        const px = x + (Math.random() - .5) * r.width * .8, py = y + r.height * (.15 + Math.random() * .3);
        if (k % 3 === 0) fxAt('fx-plus', px, py, 0, 0, `--fs:${(14 + Math.random() * 10) * Math.max(sc, .7)}px;--dx:${(Math.random() - .5) * 14}px;--dy:${-r.height * (.5 + Math.random() * .4)}px;animation-delay:${k * 45}ms`, '+');
        else fxAt('fx-glit', px, py, 0, 0, `--c:${k % 2 ? '#ffe08a' : '#a8e890'};--dx:${(Math.random() - .5) * 16}px;--dy:${-r.height * (.5 + Math.random() * .5)}px;animation-delay:${k * 45}ms`);
      }
      return;
    }
    case 'cleanse': {  // Cure Ailment: a cool, bright band sweeps up the portrait and washes the ailments away
      win.insertAdjacentHTML('beforeend', '<div class="fx-tint CLEAN"></div>');
      fxAt('fx-sweep', x, y + r.height / 2 - 15, r.width * 1.1, 30, `--h:${r.height}px`);
      for (let k = 0; k < 12; k++) fxAt('fx-glit', x + (Math.random() - .5) * r.width * .9, y + (Math.random() - .2) * r.height * .5, 0, 0, `--c:#cfe6ff;--dx:${(Math.random() - .5) * 30}px;--dy:${-20 - Math.random() * r.height * .5}px;animation-delay:${200 + k * 30}ms`);
      return;
    }
    case 'ward':     // Protection against Evil: a golden dome closes over the hero
      fxAt('fx-dome', x, y, r.width * 1.12, r.height * 1.12);
      win.insertAdjacentHTML('beforeend', '<div class="fx-tint WARD"></div>');
      setTimeout(() => fxAt('fx-ring', x, y, r.width * 1.3, r.width * 1.3, '--c:#ffe08a;--bw:3px'), 300);
      return;
    case 'tag':      // a short word over a portrait: Asleep, Entangled, Resisted, Cleansed...
      fxAt('fx-tag', x, y - r.height * .1, 0, 0, `--c:${e.col || '#e8dcc0'}`, esc(e.text));
      if (e.zzz) for (let k = 0; k < 3; k++) fxAt('fx-zzz', x + r.width * .15, y - r.height * .1, 0, 0, `--fs:${(18 + k * 6) * Math.max(sc, .7)}px;--dx:${20 + k * 14}px;--dy:${-40 - k * 22}px;animation-delay:${k * 220}ms;opacity:0`, 'z');
      return;
    /* ---- heroes hitting monsters ---- */
    case 'slash': {
      const size = [70, 92, 116, 140, 166, 200][e.tier] * sc, flip = Math.random() < .5, rot = (Math.random() * 50 - 25) + 'deg';
      fxAt('fx-slash', x, y, 0, 0, `--rot:${rot}`, slashSVG(size, SLASH_GLOW[e.tier], e.tier >= 5 ? '#ffe3c0' : '#fffaf0', flip));
      if (e.legendary) setTimeout(() => fxAt('fx-slash', x, y, 0, 0, `--rot:${rot}`, slashSVG(size * .85, SLASH_GLOW[5], '#ffe3c0', !flip)), 90);
      hurt(); break;
    }
    case 'blunt': {
      const size = [70, 86, 104, 124, 146, 170][e.tier] * sc, c = e.tier >= 4 ? '#f0b050' : '#e8dcc0';
      fxAt('fx-boom', x, y, size * .8, size * .8, `--c:${e.tier >= 4 ? '#ffd890' : '#fff0d0'};--c2:rgba(190,140,80,.55)`);
      fxAt('fx-ring', x, y, size, size, `--c:${c};--bw:${3 + e.tier}px`);
      shards(7 + e.tier, c, size, 16 + e.tier * 5, 3 + e.tier * .6);
      hurt(); break;
    }
    case 'arrow':
      fxAt('fx-arrow', x, y - 1, 0, 0, `--rot:${-155 + Math.random() * 30}deg;margin-left:-120px`);
      setTimeout(() => { fxAt('fx-ring', x, y, 46 * sc, 46 * sc, '--c:#e8dcc0;--bw:2px'); hurt(); }, 140);
      break;
    case 'magic': {
      const [c, c2] = e.col || SPELL_COL['Magic Missile'], fire = c === SPELL_COL.Fireball[0], size = (e.small ? (fire ? 90 : 60) : fire ? 180 : 110) * sc;
      fxAt('fx-boom', x, y, size, size, `--c:${c};--c2:${c2}`);
      if (fire) { fxAt('fx-ring', x, y, size * 1.1, size * 1.1, `--c:${c};--bw:${e.small ? 3 : 6}px`); sparks(e.small ? 8 : 18, '#ff7a20', size, true); }
      sparks(e.small ? 5 : 10, c, size);
      recoil(win, !e.small && fire);
      break;
    }
    /* ---- monsters hitting heroes, one look per monster type ---- */
    case 'claw': {   // Beast: three raking claw marks
      const size = 120 * sc, rot = (Math.random() * 30 - 15) + 'deg', flip = Math.random() < .5;
      [-1, 0, 1].forEach((o, n) => setTimeout(() => fxAt('fx-slash', x + o * size * .16, y - o * size * .16, 0, 0, `--rot:${rot}`, slashSVG(size * .8, '#b02a1a', '#f6e6d6', flip)), n * 45));
      hurt(); break;
    }
    case 'steel':    // Humanoid: a hard steel cut
      fxAt('fx-slash', x, y, 0, 0, `--rot:${Math.random() * 40 - 20}deg`, slashSVG(130 * sc * (e.big ? 1.9 : 1), '#c9d2dc', '#ffffff', Math.random() < .5));
      hurt(); break;
    case 'necro': {  // Undead: grave-cold necrotic burst
      const size = 120 * sc;
      fxAt('fx-boom', x, y, size, size, '--c:#b8f0b0;--c2:rgba(30,60,30,.85)');
      for (let k = 0; k < 7; k++) fxAt('fx-wisp', x + (Math.random() - .5) * size * .6, y + size * .1, size * .35, size * .35, `--dy:${-size * (.5 + Math.random() * .4)}px;animation-delay:${k * 40}ms`);
      hurt(); break;
    }
    case 'crush': {  // Giant: a ground-shaking blow
      const size = 170 * sc;
      fxAt('fx-boom', x, y, size * .9, size * .9, '--c:#fff0d0;--c2:rgba(120,80,40,.6)');
      fxAt('fx-ring', x, y, size, size, '--c:#d8c8a8;--bw:7px');
      shards(12, '#c8b48c', size, 26, 5);
      hurt(); recoil(win, true); break;
    }
    case 'hellfire': { // Fiend: a gout of hellfire
      const size = 130 * sc;
      fxAt('fx-boom', x, y, size, size, '--c:#ffcf70;--c2:rgba(180,30,10,.8)');
      sparks(12, '#ff7a20', size, true);
      hurt(); break;
    }
    case 'rend': {   // Monstrosity: crossed rending gashes
      const size = 140 * sc, rot = (Math.random() * 20 - 10) + 'deg';
      fxAt('fx-slash', x, y, 0, 0, `--rot:${rot}`, slashSVG(size, '#7a0d0d', '#ffd2c2', false));
      setTimeout(() => fxAt('fx-slash', x, y, 0, 0, `--rot:${rot}`, slashSVG(size, '#7a0d0d', '#ffd2c2', true)), 80);
      hurt(); break;
    }
    case 'jaws': {   // Dragon: snapping jaws
      const w = 130 * sc;
      fxAt('fx-jaw top', x, y, 0, 0, `--from:${-w * .55}px;--to:${-w * .2}px`, fangs(w, true));
      fxAt('fx-jaw bot', x, y, 0, 0, `--from:${w * .55}px;--to:${w * .2}px`, fangs(w, false));
      setTimeout(() => { fxAt('fx-ring', x, y, w * .5, w * .5, '--c:#ff9a50;--bw:3px'); hurt(); }, 150);
      break;
    }
    case 'stone': {  // Construct: shattering stone
      const size = 140 * sc;
      fxAt('fx-ring', x, y, size, size, '--c:#9a9a92;--bw:6px');
      for (let k = 0; k < 10; k++) { const a = Math.random() * Math.PI * 2, d = size * (.4 + Math.random() * .4); fxAt('fx-rock', x, y, 0, 0, `--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--s:${(6 + Math.random() * 8) * Math.max(sc, .6)}px;--r:${Math.random() * 360}deg`); }
      hurt(); recoil(win, true); break;
    }
    /* ---- BURN, SHOCK and POISON taking hold ---- */
    case 'ail': {
      if (e.reveal) { const card = e.side === 'm' ? document.querySelector(`.foe[data-foe="${e.i}"]`) : document.querySelector(`.hero[data-hero="${e.i}"]`); const ic = card && card.querySelector(`.ailic[data-ail="${e.kind}"]`); if (ic) ic.classList.remove('ail-wait'); }
      const size = Math.max(r.width, 60), half = size / 2;
      win.insertAdjacentHTML('beforeend', `<div class="fx-tint ${e.kind}"></div>`);
      if (e.kind === 'BURN') for (let k = 0; k < 12; k++) fxAt('fx-flame', x + (Math.random() - .5) * size * .8, y + half * .6, 0, 0, `--s:${(10 + Math.random() * 14) * Math.max(sc, .6)}px;--dy:${-size * (.45 + Math.random() * .45)}px;animation-delay:${k * 35}ms`);
      if (e.kind === 'SHOCK') for (let k = 0; k < 4; k++) { const pts = []; let px = (Math.random() - .5) * size * .6, py = -half; for (let j = 0; j < 6; j++) { pts.push(`${px.toFixed(0)},${py.toFixed(0)}`); px += (Math.random() - .5) * size * .35; py += size / 5; } fxAt('fx-bolt', x, y, 0, 0, `animation-delay:${k * 70}ms`, `<svg width="1" height="1" style="overflow:visible"><polyline points="${pts.join(' ')}" fill="none" stroke="#cfe6ff" stroke-width="${2.2 * Math.max(sc, .6)}" stroke-linejoin="bevel" filter="drop-shadow(0 0 3px #6aa8ff)"/></svg>`); }
      if (e.kind === 'POISON') for (let k = 0; k < 10; k++) fxAt('fx-bubble', x + (Math.random() - .5) * size * .7, y + half * .5, 0, 0, `--s:${(6 + Math.random() * 9) * Math.max(sc, .6)}px;--dy:${-size * (.4 + Math.random() * .5)}px;animation-delay:${k * 45}ms`);
      break;
    }
    case 'num': case 'miss': {
      const kind = e.k === 'miss' ? 'miss' : e.crit ? 'crit' : (e.col || 'hit');
      const rise = r.height / 2 + (e.side === 'p' ? 18 : 26);
      fxAt('fx-num ' + (e.crit ? 'crit ' : '') + (e.dbl ? 'dbl ' : '') + (e.k === 'miss' ? 'miss ' : '') + (e.side === 'p' && !e.big ? 'small' : ''), x, y, 0, 0, `--c:${NUM_COL[kind] || NUM_COL.hit};--rise:${rise}px`,
        `${e.dbl ? '<i>Double Strike!</i>' : ''}${e.crit ? '<i>Critical hit!</i>' : ''}<b>${e.k === 'miss' ? (e.label || 'Miss') : e.heal ? '+' + e.d : e.d}</b>`);
      if (e.heal) break;
      if (e.k === 'num' && e.d > 0) recoil(win, e.crit);   // every hit makes the portrait recoil
      if (e.k === 'num' && e.d > 0 && e.side === 'p' && S.party[e.i]) hurtCry(S.party[e.i], e.pct === 0);
      if (e.k === 'num' && e.pct === 0) { const u = e.side === 'm' ? S.battle && S.battle.foes[e.i] : S.party[e.i]; setTimeout(() => { if (u) delete u.dyingFx; const card = win.closest('.foe,.hero'); if (card && card.isConnected) card.classList.add('dead'); }, 280); }   // as the HP bar empties
      if (e.crit || e.flash) win.insertAdjacentHTML('beforeend', '<div class="fx-flash"></div>');
      break;
    }
  }
}
/* BURN, SHOCK and POISON badges with turns left, bottom-left of a portrait */
const AIL_SVG = {
  BURN: '<svg viewBox="0 0 16 16"><path d="M8 1c1 3 4 4.5 4 8.2A4 4 0 0 1 4 9.5C4 7.3 5.6 6.4 6 4.6c.9 1 1 2.2.8 3.1C8.4 6.6 8.6 4 8 1z" fill="#ffb24a" stroke="#3a0802" stroke-width=".8"/></svg>',
  SHOCK: '<svg viewBox="0 0 16 16"><path d="M9.5 1 3.5 9h3.6L5.8 15l6.7-8.6H8.8L9.5 1z" fill="#d6e8ff" stroke="#0b1838" stroke-width=".8"/></svg>',
  POISON: '<svg viewBox="0 0 16 16"><path d="M8 1.5c2.2 3.2 4.3 5.6 4.3 8.2a4.3 4.3 0 0 1-8.6 0C3.7 7.1 5.8 4.7 8 1.5z" fill="#8fe08f" stroke="#082a0c" stroke-width=".8"/><circle cx="6.6" cy="10" r="1.2" fill="#d8ffd8"/></svg>',
};
const ailIcons = st => { const ks = ['BURN', 'SHOCK', 'POISON'].filter(k => st && st[k]); return ks.length ? `<div class="ailbar">${ks.map(k => `<span class="ailic ${k}${st[k].at > Date.now() ? ' ail-wait' : ''}" data-ail="${k}" title="${k}: ${st[k].turns} turn${st[k].turns === 1 ? '' : 's'} left">${AIL_SVG[k]}<b>${st[k].turns}</b></span>`).join('')}</div>` : ''; };
const NOT_CHIP = ['BURN', 'SHOCK', 'POISON'];
setInterval(() => document.querySelectorAll('.ailic.ail-wait').forEach(ic => { const card = ic.closest('[data-foe],[data-hero]'); if (!card || !S || !S.battle) return ic.classList.remove('ail-wait');
  const u = card.dataset.foe !== undefined ? S.battle.foes[+card.dataset.foe] : S.party[+card.dataset.hero], st = u && u.status[ic.dataset.ail];
  if (!st || !st.at || st.at + 600 < Date.now()) ic.classList.remove('ail-wait'); }), 250);   // safety net if the effect never played
const chipLate = x => { const d = Math.max(0, ((x && x.at) || 0) - Date.now()); return d ? ` st-late" style="animation-delay:${d}ms"` : '"'; };
