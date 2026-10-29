/* ---------------- prologue (Build 119) ----------------
   Every new quest opens on the night the orcs came. The party you raised fights one tutorial battle as level 5
   veterans of the Duke's guard (3 Goblins and an Orc, level 4), with windows that explain the battle screen,
   TO HIT and damage. Afterwards the party is put back exactly as it was raised, at level 1, and the quest begins.
   S.prologue = {stage, keep: the raised party, l5: the level 5 party (for a retry), tips: windows already seen}. */
const PRO_FOES = ['Goblin', 'Goblin', 'Goblin', 'Orc'];
const PRO_SPELL = {'Magic User': 'Magic Missile', Elf: 'Magic Missile', Thief: 'Magic Missile', Cleric: 'Cure Light Wounds'};
function beginPrologue() {
  const keep = JSON.stringify(S.party);
  S.party.forEach(h => {   // level 5 for this one fight, spellbooks filled with spells they can use against orcs
    while (h.level < 5) levelUp(h);
    h.xp = XP_CUM[5]; h.hp = h.max;
    if (PRO_SPELL[h.cls]) { h.book = h.book.map(s => s && SPELLS[s].undead ? PRO_SPELL[h.cls] : s || PRO_SPELL[h.cls]); if (!h.known.includes(PRO_SPELL[h.cls])) h.known.push(PRO_SPELL[h.cls]); }
    h.used = h.book.map(() => false);
  });
  S.prologue = {stage: 0, keep, l5: JSON.stringify(S.party), tips: []};
}
function endPrologue() {
  S.party = JSON.parse(S.prologue.keep); S.prologue = null; S.battle = null;
  S.loc = 'castle'; castleTab = 'square'; S.lastResult = ''; save(); go();
}
/* ---- the scenes ---- */
const PRO_SCENES = [
  {title: 'The Night of the Storm', art: 'storm', text: `<p class="lead">Rain hammers the castle so hard you can barely see the far side of the courtyard. Thunder rolls over the battlements, and every flash of lightning turns the world white for a heartbeat.</p>
    <p>In the stables the horses are whinnying and stamping, kicking at their stalls. They have smelt something on the wind.</p>`, btn: 'Go on'},
  {title: 'The Duke', art: 'duke', text: `<p class="lead">The Duke stands on the steps above the courtyard, his cloak streaming in the wind, shouting to a group of his elite guard over the storm.</p>
    <p>"Orcs! A war band, out of the dark, and almost at the castle! Too many to count. If they take the gate, we will surely be overrun!"</p>
    <p>His guard draw steel. So do you.</p>`, btn: 'Run for the gate'},
  {title: 'The Main Gate', art: 'gate', text: `<p class="lead">You run for the main gate, boots sliding on the wet stones, and find you are already too late. Ladders and ropes hang from the walls, and orcs and goblins are swarming up them.</p>
    <p>Some lose their grip and fall screaming to their deaths. But three goblins drop from the wall and rush towards you, and behind them comes a hulking orc.</p>
    <p>You raise your weapons.</p>`, btn: 'Raise your weapons'},
  {title: 'Dawn', art: 'dawn', text: `<p class="lead">The last of them falls, and the gate holds. By dawn the storm has blown itself out, and the bodies of orcs and goblins lie in heaps beneath the walls.</p>
    <p>The Duke finds you among them, his cloak torn and his sword notched. "The castle stands," he says, "but it will not stand alone a second time. Somewhere out in the wilds there must be allies. Find them."</p>
    <p class="note">The prologue is over. Your heroes now begin their quest as they were raised, at level 1.</p>`, btn: 'Enter the castle'},
];
function screenPrologue() {
  const P = S.prologue, sc = PRO_SCENES[P.stage];
  $('#app').innerHTML = `<header class="bar"><h1>Base Line</h1><div class="meta"><span>Prologue</span><span>${P.stage === 3 ? 'Dawn' : 'Night'}</span></div><button class="btn small" id="musicbtn" style="margin-left:auto" aria-pressed="${musicOn}">♪ Sound ${musicOn ? 'on' : 'off'}</button><button class="btn small" id="questsbtn">Quests</button></header>
  <div class="pro parch panel"><div class="pro-stage pro-${sc.art}">${proArt(sc.art)}<canvas class="pro-rain"></canvas><div class="pro-flash"></div></div>
    <div class="scroll" id="evScroll"><h2>${sc.title}</h2><div class="type">${sc.text}</div><button class="ev-skip" id="evSkip">Skip</button></div>
    <div class="row ev-acts" style="gap:10px;margin-top:14px"><button class="btn red" id="proNext">${sc.btn}</button>${P.stage < 3 ? '<button class="btn" id="proSkip">Skip the prologue</button>' : ''}</div></div>`;
  proSky(P.stage);
  startScroll();
  if ($('#proSkip')) $('#proSkip').onclick = () => {
    const b = $('#proSkip'); if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'Sure? Skip to the castle'; return; }
    endPrologue();
  };
  $('#proNext').onclick = () => {
    if (P.stage === 3) return endPrologue();
    if (P.stage === 2) { const st = $('.pro-stage'); st.classList.add('pro-go'); proThunder(.9, 0); setTimeout(proBattle, 900); return; }
    P.stage++; save(); screenPrologue(); window.scrollTo({top: 0});
  };
}
function proBattle() { startBattle(false, {foes: PRO_FOES, noFlee: true, direct: true, boss: 'prologue'}); }
function prologueWon() {
  tutClear(); S.battle = null; S.prologue.stage = 3; save();
  modal(`<h2>The Gate Holds</h2><p>The orc crashes to the cobbles and does not rise. Along the walls, the rest of the war band breaks and flees into the storm.</p><div class="row"><button class="btn red" data-close>Onward</button></div>`, () => go());
}
function prologueLost() {
  tutClear(); S.battle = null; S.party = JSON.parse(S.prologue.l5); save();
  modal(`<h2>Not Yet</h2><p>You go down beneath the goblins' blades, but the Duke's guard drag you back behind their shields and pour wine down your throats. The gate still stands, just. The orc is coming again.</p><div class="row"><button class="btn red" data-close>Raise your weapons</button></div>`, () => proBattle());
}
/* The battle and its result screens go to the prologue's own endings while it lasts. */
const _victory = victory, _defeat = defeat;
victory = function () { return S && S.battle && S.battle.boss === 'prologue' ? prologueWon() : _victory.apply(this, arguments); };
defeat = function () { return S && S.battle && S.battle.boss === 'prologue' ? prologueLost() : _defeat.apply(this, arguments); };

/* ---- the art: silhouettes against a stormy sky, lit by the lightning ---- */
const PK = '#07080c';
const proFig = {   // each drawn standing on (0,0), about 100 units tall, facing the viewer
  goblin: (c = PK) => `<g fill="${c}" stroke="${c}" stroke-linecap="round"><path d="M-8 0l3-22M8 0l-2-22" stroke-width="7"/><ellipse cx="0" cy="-38" rx="13" ry="17" transform="rotate(8 0 -38)"/>
    <path d="M-10-46l-12 20M10-48l16-18" stroke-width="6"/><path d="M26-66l10-26" stroke-width="3"/><circle cx="2" cy="-60" r="10"/><path d="M-6-63l-22-11 13 15zM10-63l22-11-13 15z"/><g fill="#e8c040" stroke="none"><circle cx="-2" cy="-62" r="1.6"/><circle cx="6" cy="-62" r="1.6"/></g></g>`,
  orc: (c = PK) => `<g fill="${c}" stroke="${c}" stroke-linecap="round"><path d="M-14 0l4-34M14 0l-4-34" stroke-width="13"/><path d="M-22-38h44l-4 10h-36z"/><ellipse cx="0" cy="-62" rx="30" ry="26"/>
    <circle cx="-30" cy="-78" r="11"/><path d="M-30-74l-10 34M30-76l18-30" stroke-width="12"/><path d="M44-104l-6-30 22-4 6 28z"/><circle cx="0" cy="-90" r="12"/><g fill="#d8401e" stroke="none"><circle cx="-4" cy="-92" r="1.8"/><circle cx="4" cy="-92" r="1.8"/></g></g>`,
  guard: (c = PK) => `<g fill="${c}" stroke="${c}" stroke-linecap="round"><path d="M-6 0l2-30M6 0l-2-30" stroke-width="7"/><path d="M-12-30h24l-3-36h-18z"/><circle cx="0" cy="-74" r="8"/><path d="M-9-76h18l-9-12z"/>
    <path d="M16-2v-104" stroke-width="3"/><path d="M13-106l3-10 3 10z"/><ellipse cx="-12" cy="-50" rx="10" ry="16"/></g>`,
  duke: (c = PK) => `<g fill="${c}" stroke="${c}" stroke-linecap="round"><path class="pro-cloak" d="M-10-78C-30-60-44-30-58 2l40-4 4-60z"/><path d="M-7 0l2-34M7 0l-1-34" stroke-width="8"/><path d="M-15-34h30l-4-44h-22z"/>
    <circle cx="0" cy="-86" r="9"/><path d="M-8-92l3-8 3 5 2-6 2 6 3-5 3 8z"/><path d="M12-74l18-24" stroke-width="7"/><path d="M28-96l16-46" stroke-width="3.5"/><path d="M24-98h12" stroke-width="3"/></g>`,
  horse: (c = PK) => `<path fill="${c}" d="M-26 0L-18 0L-14-30L-6-48L2-30L4 0L12 0L10-34L14-56L34-84L52-88L64-76L60-70L50-78L42-76L46-96L60-104L70-94L66-90L58-96L48-98L46-110L66-118L80-120L86-126L80-136L62-148L54-160L50-154L46-162L40-152L36-150L32-142L26-138L22-128L14-122L8-112L-4-98L-24-80L-34-66Q-52-58-62-20L-54-28L-50-18L-44-40L-38-48L-36-36L-26-20Z"/>`,
  horsehead: (c = PK) => `<path fill="${c}" d="M-30 0L-26-40Q-20-70 0-86L4-100L9-89L15-98L17-84L40-62L56-44L54-35L40-36L22-48L12-44L8-20L10 0Z M-22-46L-30-56L-24-60L-16-70L-20-74L-8-80Z"/>`,
};
const proAt = (x, y, s, inner, cls = '') => `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;
const crenel = (x0, x1, y, w = 14, gap = 12) => { let p = ''; for (let x = x0; x < x1; x += w + gap) p += `<rect x="${x}" y="${y - 12}" width="${w}" height="13"/>`; return p; };
function proCastle(x, y, s, lit) {
  const win = (wx, wy) => `<rect class="pro-win" x="${wx}" y="${wy}" width="5" height="9" fill="${lit}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${PK}"><rect x="-150" y="-110" width="300" height="110"/>${crenel(-150, 150, -110)}
    <rect x="-200" y="-170" width="60" height="170"/>${crenel(-200, -140, -170, 10, 7)}<path d="M-206-170h72l-36-46z"/>
    <rect x="140" y="-160" width="56" height="160"/>${crenel(140, 196, -160, 10, 7)}<path d="M134-160h68l-34-40z"/>
    <rect x="-46" y="-210" width="92" height="110"/>${crenel(-46, 46, -210, 12, 8)}<rect x="-10" y="-262" width="20" height="52"/><path d="M-14-262h28l-14-24z"/>
    <path d="M0-286v-22" stroke="${PK}" stroke-width="2"/><path class="pro-flag" d="M1-308l26 6-26 6z"/>
    ${win(-176, -140)}${win(162, -126)}${win(-20, -176)}${win(14, -176)}${win(-90, -70)}${win(80, -64)}${win(-2, -240)}</g>`;
}
function proArt(k) {
  const sky = k === 'dawn' ? ['#4b4a4c', '#8a7c68', '#b49c72'] : ['#020306', '#0b0f17', '#19202b'];
  const defs = `<defs><linearGradient id="pSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".6" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient>
    <pattern id="pStone" width="48" height="24" patternUnits="userSpaceOnUse"><rect width="48" height="24" fill="#191d26"/><path d="M0 .5h48M0 12.5h48M.5 0v12M24.5 12v12" stroke="#0e1117" stroke-width="1.5"/></pattern>
    <radialGradient id="pLamp"><stop offset="0" stop-color="#7a4a1c"/><stop offset=".7" stop-color="#2a170a"/><stop offset="1" stop-color="#0a0605"/></radialGradient><filter id="pBlur"><feGaussianBlur stdDeviation="10"/></filter><radialGradient id="pTorch"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".9"/><stop offset="1" stop-color="#ff7a20" stop-opacity="0"/></radialGradient></defs>`;
  const clouds = k === 'dawn' ? `<g filter="url(#pBlur)" opacity=".55" fill="#6d665e"><ellipse cx="160" cy="70" rx="240" ry="40"/><ellipse cx="760" cy="110" rx="300" ry="34"/></g>`
    : `<g class="pro-clouds" filter="url(#pBlur)" fill="#1d2431" opacity=".85"><ellipse cx="120" cy="30" rx="260" ry="60"/><ellipse cx="520" cy="10" rx="320" ry="70"/><ellipse cx="880" cy="40" rx="260" ry="60"/><ellipse cx="300" cy="90" rx="180" ry="26" fill="#283041"/><ellipse cx="760" cy="80" rx="160" ry="22" fill="#283041"/></g>`;
  let body = '';
  if (k === 'storm') body = `<path d="M0 410Q260 330 560 330T960 370V540H0z" fill="#0b0e14"/>${proCastle(600, 352, .95, '#d9953a')}
    <g fill="${PK}"><path d="M0 330h340l30 34v176H0z"/><path d="M-10 338l190-82 205 82z"/></g>
    <rect x="30" y="372" width="120" height="168" fill="url(#pLamp)"/><rect x="195" y="372" width="120" height="168" fill="url(#pLamp)"/>
    <circle class="pro-torch" cx="90" cy="392" r="5" fill="#ffc46a"/><circle class="pro-torch" cx="255" cy="392" r="5" fill="#ffc46a"/>
    ${proAt(84, 540, .95, `<g>${proFig.horse()}</g>`, 'pro-rear')}${proAt(250, 474, 1, `<g>${proFig.horsehead()}</g>`, 'pro-toss')}
    <rect x="195" y="470" width="120" height="70" fill="#120c08"/><path d="M195 470h120M195 500h120" stroke="#2a1a0e" stroke-width="3"/>
    <path d="M0 540h960v-22c-200 10-500-6-960 4z" fill="#05060a"/><ellipse cx="660" cy="522" rx="170" ry="7" fill="#9fb4d0" opacity=".12" class="pro-puddle"/>`;
  if (k === 'duke') body = `<rect x="0" y="182" width="960" height="358" fill="url(#pStone)"/><rect x="0" y="182" width="960" height="358" fill="#05070b" opacity=".35"/><g fill="#191d26">${crenel(0, 960, 182, 26, 18)}</g>
    <path d="M320 540l120-358h80l120 358z" fill="#0d1016"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(n => `<path d="M${436 - n * 15} ${196 + n * 44}h${88 + n * 30}" stroke="#262c38" stroke-width="5"/>`).join('')}
    ${[110, 850].map(x => `<rect x="${x - 4}" y="240" width="8" height="70" fill="${PK}"/><circle class="pro-torch" cx="${x}" cy="232" r="46" fill="url(#pTorch)"/><path class="pro-fire" d="M${x - 7} 242q7-26 7-26q7 26 7 26z" fill="#ffb347"/>`).join('')}
    <ellipse cx="480" cy="120" rx="150" ry="90" fill="#3a4458" opacity=".55" filter="url(#pBlur)"/>${proAt(480, 184, 1.05, proFig.duke())}
    ${[120, 220, 320, 640, 740, 840].map((x, i) => proAt(x, 548 - (i % 2) * 8, 1.5, proFig.guard())).join('')}`;
  if (k === 'gate') body = `<g fill="url(#pStone)"><rect x="0" y="170" width="960" height="370"/>${crenel(0, 960, 170, 30, 22)}</g><g fill="#12151c"><rect x="360" y="110" width="240" height="430"/>${crenel(360, 600, 110, 26, 16)}<rect x="320" y="90" width="60" height="450"/><rect x="580" y="90" width="60" height="450"/>${crenel(320, 380, 90, 12, 8)}${crenel(580, 640, 90, 12, 8)}</g>
    <rect x="0" y="170" width="960" height="370" fill="#05070b" opacity=".25"/>
    <path d="M410 540V330a70 70 0 0 1 140 0v210z" fill="#020203"/><g stroke="#151820" stroke-width="5">${[420, 444, 468, 492, 516, 540].map(x => `<path d="M${x} 300v240"/>`).join('')}<path d="M410 360h140M410 410h140M410 460h140M410 510h140"/></g>
    ${[110, 230, 720, 850].map((x, i) => `<g stroke="#1a1d24" stroke-width="5"><path d="M${x - 20} 540L${x + 14} 150M${x + 20} 540L${x + 54} 150"/>${Array.from({length: 12}, (_, n) => { const t = n / 12, y = 540 - t * 390; return `<path d="M${x - 20 + t * 34} ${y}h40"/>`; }).join('')}</g>
      ${proAt(x + 20 + 0.55 * 34, 330, .55 - (i % 2) * .08, i % 2 ? proFig.orc() : proFig.goblin(), 'pro-climb')}${proAt(x + 30, 230, .5, proFig.goblin(), 'pro-climb pro-climb2')}`).join('')}
    ${proAt(180, 160, .55, proFig.goblin(), 'pro-fall')}${proAt(800, 160, .6, proFig.orc(), 'pro-fall pro-fall2')}${proAt(650, 160, .5, proFig.goblin(), 'pro-fall pro-fall3')}
    <path d="M0 540h960v-40c-300 20-660 20-960 0z" fill="#161a22"/><ellipse cx="250" cy="528" rx="120" ry="5" fill="#9fb4d0" opacity=".14"/><ellipse cx="760" cy="522" rx="90" ry="4" fill="#9fb4d0" opacity=".14"/>
    <g class="pro-charge">${proAt(300, 520, 1.25, proFig.goblin())}${proAt(670, 524, 1.3, proFig.goblin())}${proAt(190, 548, 1.45, proFig.goblin())}${proAt(490, 556, 1.75, proFig.orc())}</g>`;
  if (k === 'dawn') body = `<path d="M0 400Q300 330 600 360T960 350V540H0z" fill="#2c2a2a"/>${proCastle(480, 392, 1.05, '#c08a3c')}
    ${[300, 560, 700].map((x, i) => `<path class="pro-smoke" style="animation-delay:${i * 1.3}s" d="M${x} 330q-30-50 0-110t-40-150" stroke="#4a4642" stroke-width="9" fill="none" opacity=".22" filter="url(#pBlur)"/>`).join('')}
    <path d="M0 540h960v-60c-260 26-640 20-960 4z" fill="#1d1b1b"/>${[90, 160, 790, 860, 230].map((x, i) => `<ellipse cx="${x}" cy="${508 + i % 2 * 10}" rx="26" ry="7" fill="#121010"/>`).join('')}`;
  return `<svg class="pro-svg" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}<rect width="960" height="540" fill="url(#pSky)"/>${clouds}${body}</svg>`;
}
/* Rain on a canvas over the scene, and lightning: a jagged bolt, a white flash, the scene lit up, thunder after. */
let PRO_RAF = null, PRO_BOLT = null;
function proRain(cv, o) {
  const ctx = cv.getContext('2d'), drops = [];
  const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; };
  size(); const N = o.n || 260;
  for (let i = 0; i < N; i++) drops.push({x: Math.random(), y: Math.random(), v: .9 + Math.random() * .7, l: .5 + Math.random() * .8});
  let last = performance.now(), sz = 0;
  const step = now => {
    if (!cv.isConnected) return;
    if (++sz % 60 === 0) size();
    const dt = Math.min(50, now - last) / 1000; last = now; const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H); ctx.strokeStyle = o.col || 'rgba(170,190,215,.42)'; ctx.lineWidth = Math.max(1, W / 900); ctx.beginPath();
    drops.forEach(d => { d.y += d.v * dt * 1.6; d.x -= d.v * dt * .25; if (d.y > 1) { d.y -= 1.05; d.x = Math.random() * 1.2; } if (d.x < -.05) d.x += 1.1;
      const x = d.x * W, y = d.y * H, len = d.l * H * .045; ctx.moveTo(x, y); ctx.lineTo(x - len * .16, y + len); });
    ctx.stroke();
    if (PRO_BOLT && PRO_BOLT.cv === cv) { const b = PRO_BOLT, a = Math.max(0, 1 - (now - b.t) / 260); if (!a) PRO_BOLT = null; else {
      ctx.strokeStyle = `rgba(235,240,255,${a})`; ctx.lineWidth = W / 300; ctx.shadowColor = '#a8c4ff'; ctx.shadowBlur = 18; ctx.beginPath(); b.pts.forEach(([x, y], i) => i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H)); ctx.stroke(); ctx.shadowBlur = 0; } }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function proStrike(cv, flashEl, litEl, big) {
  if (cv) { let x = .15 + Math.random() * .7, y = 0; const pts = [[x, y]]; while (y < .45 + Math.random() * .25) { y += .04 + Math.random() * .05; x += (Math.random() - .5) * .07; pts.push([x, y]); } PRO_BOLT = {cv, pts, t: performance.now()}; }
  if (flashEl) { flashEl.classList.remove('go'); void flashEl.offsetWidth; flashEl.classList.add('go'); }
  if (litEl) { litEl.classList.add('lit'); setTimeout(() => litEl.classList.remove('lit'), 140); setTimeout(() => litEl.classList.add('lit'), 220); setTimeout(() => litEl.classList.remove('lit'), 330); }
  proThunder(big ? 1 : .55 + Math.random() * .4, 250 + Math.random() * 1300);
}
let PRO_T = null;
function proSky(stage) {
  clearTimeout(PRO_T);
  const cv = $('.pro-rain'), st = $('.pro-stage'); if (!cv) return;
  if (stage === 3) return;   // dawn: the storm is over
  proRain(cv, {n: 300});
  const loop = first => { PRO_T = setTimeout(() => { if (!cv.isConnected) return; proStrike(cv, $('.pro-flash'), st, first); if (stage === 0 && Math.random() < .55) setTimeout(proNeigh, 900 + Math.random() * 1500); loop(); }, first ? 700 : 3500 + Math.random() * 5500); };
  loop(true);
  if (stage === 0) setTimeout(proNeigh, 2600);
}
/* ---- storm sounds, made in the browser: rain, thunder and frightened horses ---- */
let STORM = null;
function stormOn(level) {
  if (!AC || AC.state !== 'running') return;
  if (!STORM) {
    const len = 4, b = AC.createBuffer(1, AC.sampleRate * len, AC.sampleRate), d = b.getChannelData(0); let br = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; br = (br + .02 * w) / 1.02; d[i] = w * .6 + br * 3; }
    const src = AC.createBufferSource(); src.buffer = b; src.loop = true;
    const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
    const g = AC.createGain(); g.gain.value = 0; src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(sfxBus); src.start();
    STORM = {src, g, level: 0};
  }
  if (STORM.level !== level) { STORM.level = level; ramp(STORM.g, level, 1.5); }
}
function stormOff() { if (!STORM) return; const s = STORM; STORM = null; ramp(s.g, 0, 1.5); setTimeout(() => { try { s.src.stop(); } catch (e) {} }, 1700); }
function proThunder(power, delay) {
  if (!AC || AC.state !== 'running') return;
  const t = AC.currentTime + delay / 1000, dur = 2.5 + power * 2.5;
  const b = AC.createBuffer(1, AC.sampleRate * dur, AC.sampleRate), d = b.getChannelData(0); let br = 0;
  for (let i = 0; i < d.length; i++) { br = (br + .03 * (Math.random() * 2 - 1)) / 1.03; d[i] = br * 6 * (1 + .6 * Math.sin(i / AC.sampleRate * (3 + Math.random()))); }
  const src = AC.createBufferSource(); src.buffer = b;
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(1400 * power, t); lp.frequency.exponentialRampToValueAtTime(110, t + dur * .6);
  const g = AC.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.9 * power, t + .05); g.gain.setValueAtTime(.9 * power, t + .25);
  g.gain.exponentialRampToValueAtTime(.35 * power, t + .9); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(lp); lp.connect(g); g.connect(sfxBus); src.start(t); src.stop(t + dur);
}
function proNeigh() {   // a frightened whinny: a voice that leaps up and shudders down, through a horse-like throat
  if (!AC || AC.state !== 'running' || !S || !S.prologue || S.prologue.stage > 0) return;
  const t = AC.currentTime + .02, dur = 1.3 + Math.random() * .4, f0 = 380 + Math.random() * 120;
  const o = AC.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 2.6, t + .16); o.frequency.exponentialRampToValueAtTime(f0 * 1.9, t + .45); o.frequency.exponentialRampToValueAtTime(f0 * .8, t + dur);
  const vib = AC.createOscillator(), vg = AC.createGain(); vib.frequency.value = 11 + Math.random() * 4; vg.gain.value = f0 * .16; vib.connect(vg); vg.connect(o.frequency);
  const out = AC.createGain(); out.gain.setValueAtTime(.0001, t); out.gain.exponentialRampToValueAtTime(.2, t + .06); out.gain.setValueAtTime(.2, t + dur * .55); out.gain.exponentialRampToValueAtTime(.0001, t + dur);
  const trem = AC.createOscillator(), tg = AC.createGain(); trem.frequency.value = 22; tg.gain.value = .07; trem.connect(tg); tg.connect(out.gain);
  [[900, 4], [1800, 6], [2900, 8]].forEach(([f, q]) => { const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; o.connect(bp); bp.connect(out); });
  const pan = AC.createStereoPanner ? AC.createStereoPanner() : null; if (pan) { pan.pan.value = -.6 + Math.random() * .4; out.connect(pan); pan.connect(sfxBus); } else out.connect(sfxBus);
  [o, vib, trem].forEach(x => { x.start(t); x.stop(t + dur + .05); });
  for (let k = 0; k < 3 + R(3); k++) clack(t + dur + .15 + k * (.12 + Math.random() * .1), .5, 70 + Math.random() * 30, true);   // stamping hooves
}
/* The storm keeps going under the tutorial battle too, quieter, with the rain falling over the screen. */
setInterval(() => {
  const pro = S && S.prologue, inBattle = pro && S.battle && S.battle.boss === 'prologue';
  if (pro && S.prologue.stage < 3) stormOn(inBattle ? .1 : .3); else stormOff();
  let ov = document.getElementById('proRainOver');
  if (inBattle && !ov) { ov = document.createElement('canvas'); ov.id = 'proRainOver'; document.body.appendChild(ov); proRain(ov, {n: 160, col: 'rgba(150,170,200,.28)'}); }
  else if (!inBattle && ov) ov.remove();
  if (inBattle && Math.random() < .03 && !document.querySelector('.pro-tut')) { const f = document.createElement('div'); f.className = 'pro-flash pro-flash-page go'; document.body.appendChild(f); setTimeout(() => f.remove(), 900); proThunder(.6, 400 + Math.random() * 900); }
}, 500);

/* ---- the tutorial: windows that point at what's on screen ---- */
let TUT_EL = null, TUT_ATK = null, TUT_CAST = false;
const tutOn = () => S && S.prologue && S.battle && S.battle.boss === 'prologue' && !S.prologue.noTips;
const tutSeen = id => S.prologue.tips.includes(id);
const _heroAttack = heroAttack;
heroAttack = function (h, f, ranged) {   // the dice of the party's first blows give the tutorial its real numbers
  const n0 = FXQ.length, r = _heroAttack.apply(this, arguments);
  if (tutOn()) { const wn = (ranged ? h.equip.ranged : h.equip.melee).name, dice = FXQ.slice(n0).filter(e => e.k === 'dice'); const d20 = dice.find(e => e.sides === 20 && !e.dmg), dmg = dice.find(e => e.dmg);
    if (d20 && !TUT_ATK && !tutSeen('damage')) TUT_ATK = {h: h.name, f: f.label || f.name, w: wn, nat: d20.val, mods: d20.mods || [], ac: foeAC(f), hit: !d20.miss, dmg: dmg && {face: dmg.val, expr: String(WPN[wn].dmg).replace(/^\+/, ''), mods: dmg.mods || []}}; }
  return r;
};
const _castSpell = castSpell;
castSpell = function (h, slot) { if (tutOn() && SPELLS[h.book[slot]].kind === 'dmg') TUT_CAST = true; return _castSpell.apply(this, arguments); };
const tutSum = (start, mods) => `${start}${mods.map(m => ` ${m.txt.replace(/^([+−])/, '$1 ')}`).join('')}${mods.length ? ' = ' + mods[mods.length - 1].to : ''}`;
function tutNext() {   // the window that should show now, if any
  const B = S.battle, cur = B.cur, h = cur && cur.side === 'p' && !B.over ? S.party[cur.i] : null, T = [];
  if (TUT_ATK) {
    const a = TUT_ATK;
    if (!tutSeen('tohit')) T.push(['tohit', '.foes', 'TO HIT', `<p>Every attack starts with a d20. The hero's bonuses are added to the roll: their DEX, for a steady aim, and their weapon's own to-hit bonus. If the total equals or beats the enemy's AC, the blow lands.</p>
      <p class="tut-eg">${esc(a.h)} rolled <b>${tutSum(a.nat, a.mods)}</b> against the ${esc(a.f)}'s AC ${a.ac}: <b>${a.hit ? 'a hit' : 'a miss'}</b>.</p><p>A natural 20 always hits and is a critical hit. A natural 1 always misses.</p>`]);
    else if (tutSeen('damage') || !a.hit || !a.dmg) TUT_ATK = null;   // a miss: the damage window waits for the first hit
    else T.push(['damage', '.foes', 'Damage', `<p>When an attack hits, the weapon's damage die is rolled and the hero's STR bonus is added. The enemy loses that many HP, and falls when it reaches 0. A critical hit deals half as much again.</p>
      <p class="tut-eg">The ${esc(a.w)}'s ${a.dmg.expr} rolled <b>${tutSum(a.dmg.face, a.dmg.mods)}</b> damage.</p>`]);
  }
  if (TUT_CAST && !tutSeen('magic')) T.push(['magic', '.foes', 'Magic never misses', `<p>A damage spell skips the to-hit roll. Its damage dice are rolled straight away and the caster's INT bonus is added. Each spell in a spellbook can be cast once, then it is spent until the party rests.</p>`]);
  if (h && !B.mode) {
    if (!tutSeen('foes')) T.push(['foes', '.foes', 'Your enemies', `<p>Three goblins and an orc. Each card shows the enemy's level, its HP, and its AC: the number on the shield.</p><p>AC is armour class. The higher it is, the harder that enemy is to hit.</p>`]);
    else if (!tutSeen('party')) T.push(['party', '.roster', 'Your party', `<p>Your heroes, level 5 veterans of the Duke's guard for this one night. The glowing card is the hero whose turn it is.</p><p>Each card shows HP, AC, and the <b>To hit</b> and <b>Damage</b> of their weapons. Monsters favour the front two.</p>`]);
    else if (!tutSeen('actions')) T.push(['actions', '.actions', 'Choose an action', `<p><b>Attack</b> swings the hero's melee weapon. <b>Shoot</b> uses their ranged weapon from a distance, which gives +2 AC until their next turn. <b>Cast</b> opens their spellbook. <b>Wait</b> skips the turn.</p><p>There is no fleeing from this fight. ${h.equip.melee ? 'Choose <b>Attack</b>.' : 'Choose <b>Cast</b>.'}</p>`]);
  }
  if (h && (B.mode === 'melee' || B.mode === 'ranged') && !tutSeen('target')) T.push(['target', '.foe.targetable', 'Choose a target', `<p>Hover over an enemy (or press and hold on a phone) to see the odds before you strike. <b>Roll needed</b> is the lowest number the d20 must show to hit.</p><p>Then click the enemy to attack it.</p>`]);
  if (h && B.mode === 'cast' && !tutSeen('cast')) T.push(['cast', '.spellpick', 'The spellbook', `<p>Pick a spell, then its target. Spent spells are greyed out until the party rests.</p>`]);
  if (cur && cur.side === 'm' && !B.over && !tutSeen('enemy') && tutSeen('tohit')) T.push(['enemy', '.roster', "The enemy's turn", `<p>Monsters attack the same way: a d20 plus their own to-hit bonus, against your hero's AC. Armour, a shield and good DEX all make their blows miss more often.</p>`]);
  return T[0] || null;
}
function tutClear() { if (TUT_EL) TUT_EL.remove(); TUT_EL = null; TUT_ATK = null; TUT_CAST = false; }
function tutCheck() {
  if (TUT_EL && (!tutOn() || S.battle.over)) tutClear();
  if (!tutOn() || TUT_EL || Date.now() < INPUT_LOCK || !$('.foes')) return;
  const t = tutNext(); if (!t) return;
  const [id, sel, title, html] = t, target = document.querySelector(sel);
  const el = document.createElement('div'); el.className = 'pro-tut'; TUT_EL = el;
  el.innerHTML = `<div class="tut-block"></div><div class="tut-ring"></div><div class="tut-card parch panel"><h3>${title}</h3>${html}<div class="row"><button class="btn red" id="tutOk">Got it</button><button class="btn small" id="tutOff">Skip the tutorial</button></div></div>`;
  document.body.appendChild(el);
  const place = () => {
    const ring = el.querySelector('.tut-ring'), card = el.querySelector('.tut-card');
    if (!target || !target.isConnected) { ring.style.display = 'none'; card.style.cssText = 'left:50%;top:50%;transform:translate(-50%,-50%);position:fixed'; return; }
    const r = target.getBoundingClientRect(), pad = 6;
    Object.assign(ring.style, {left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px'});
    const cw = Math.min(380, innerWidth - 24), ch = card.offsetHeight, below = r.bottom + 14 + ch < innerHeight, above = r.top - 14 - ch > 0;
    card.style.width = cw + 'px';
    card.style.left = Math.max(12, Math.min(innerWidth - cw - 12, r.left + r.width / 2 - cw / 2)) + 'px';
    card.style.top = (below ? r.bottom + 14 : above ? r.top - 14 - ch : Math.max(12, innerHeight - ch - 12)) + 'px';
  };
  if (target) target.scrollIntoView({block: 'center', behavior: 'instant'});
  place(); requestAnimationFrame(place); el.onscroll = place; addEventListener('resize', place); el._place = place;
  const close = () => { el.remove(); removeEventListener('resize', place); TUT_EL = null; S.prologue.tips.push(id); if (id === 'damage') TUT_ATK = null; if (id === 'magic') TUT_CAST = false; save(); setTimeout(tutCheck, 60); };
  el.querySelector('#tutOk').onclick = close;
  el.querySelector('#tutOff').onclick = () => { S.prologue.noTips = true; tutClear(); save(); };
}
addEventListener('scroll', () => TUT_EL && TUT_EL._place && TUT_EL._place(), {passive: true});
/* While a window is open, or one is waiting for the dice to finish, the monsters hold their turn. */
const tutHold = () => tutOn() && (TUT_EL || tutNext());
const _runMonster = runMonster;
runMonster = function (i) { if (tutHold()) { scheduleMonster(i, 400); tutCheck(); return; } return _runMonster.apply(this, arguments); };
const _render = render;
render = function () { const r = _render.apply(this, arguments); tutCheck(); return r; };
setInterval(tutCheck, 500);   // in case the dice finish between renders
