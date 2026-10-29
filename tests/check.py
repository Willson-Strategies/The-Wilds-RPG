"""Browser checks for Base Line: The Wilds.

Usage:  python3 tests/check.py            # checks the source game (index.html)
        python3 tests/check.py dist       # checks the bundled Claude version (run tools/build.py first)

Needs Python's playwright with Chromium. Serves the folder over local HTTP (sound needs a real web server),
then plays through the parts most likely to break. Exits non-zero if any check fails.
"""
import asyncio, functools, http.server, json, os, sys, threading
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = sys.argv[1] if len(sys.argv) > 1 else '.'
SERVE = os.path.join(ROOT, TARGET)
FAILS = []

def check(name, ok, detail=''):
    print(('PASS ' if ok else 'FAIL ') + name + (f'  ({detail})' if detail else ''))
    if not ok: FAILS.append(name)

def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Quiet, directory=SERVE)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

async def new_quest(pg):
    await pg.click('[data-q-new]'); await pg.wait_for_timeout(200)
    await pg.click('#begin'); await pg.wait_for_timeout(300)

async def main():
    page = 'preview.html' if TARGET.rstrip('/') == 'dist' else 'index.html'
    srv = serve(); url = f'http://127.0.0.1:{srv.server_address[1]}/{page}'
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 900})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        missing = []; pg.on('response', lambda r: r.status >= 400 and missing.append(r.url))
        await pg.goto(url); await pg.wait_for_timeout(1200)

        build = await pg.evaluate("typeof BUILD !== 'undefined' ? BUILD : null")
        title = await pg.text_content('header.bar')
        check('title screen loads and shows the build', bool(build) and f'Build {build}' in title, f'Build {build}')

        await new_quest(pg)
        check('a new quest starts at the castle', await pg.evaluate("S && S.loc === 'castle'"))

        # every picture the game refers to must load
        bad = await pg.evaluate("""(async () => { const all = [...Object.values(ICON).flat(), ...Object.values(HEADS), ...Object.values(FULL), ...Object.values(MONS), ...CAMP];
          const r = await Promise.all(all.map(src => new Promise(ok => { const i = new Image(); i.onload = () => ok(null); i.onerror = () => ok(src); i.src = src; })));
          return {n: all.length, bad: r.filter(Boolean)}; })()""")
        check('every picture loads', not bad['bad'], f"{bad['n']} pictures, missing {bad['bad'][:3]}")

        # Party & Gear: cards render and drag reorders the party
        await pg.evaluate("castleTab = 'party'; screenCastle();"); await pg.wait_for_timeout(300)
        before = await pg.evaluate("S.party.map(h => h.name).join()")
        c0 = await pg.locator('.pcard').nth(0).bounding_box(); c1 = await pg.locator('.pcard').nth(1).bounding_box()
        x, y = c0['x'] + c0['width'] - 30, c0['y'] + 30
        await pg.mouse.move(x, y); await pg.mouse.down()
        for k in range(1, 21): await pg.mouse.move(x, y + (min(c1['y'] + c1['height'] * .75, 880) - y) * k / 20); await pg.wait_for_timeout(15)
        await pg.mouse.up(); await pg.wait_for_timeout(500)
        after = await pg.evaluate("S.party.map(h => h.name).join()")
        check('Party & Gear cards drag to reorder', before.split(',')[0] == after.split(',')[1], f'{before} -> {after}')

        # To-hit rule: force every d20 face through real attacks (heroes) and compare with the rules Doc
        r = await pg.evaluate("""(() => {
          const docDexHit = s => s < 8 ? 0 : s <= 12 ? 1 : s <= 17 ? 2 : s <= 20 ? 3 : s <= 24 ? 4 : 5;
          S.loc = 'wild'; startBattle(false, {foes: [DATA.monsters[0].name], direct: true});
          const real = Math.random; let q = []; Math.random = () => q.length ? q.shift() : .5;
          let n = 0, bad = 0;
          for (const h of S.party) for (const dex of [6, 12, 16, 20, 25]) for (const wn of ['Dagger', 'Sword', 'Sling']) {
            h.st.DEX = dex; const ranged = RANGED.includes(wn), it = newItem(wn); h.equip[ranged ? 'ranged' : 'melee'] = it;
            for (const m of [DATA.monsters[0], DATA.monsters[DATA.monsters.length - 1]]) {
              const f = makeFoe(m, 0); f.hp = f.max = 9999; S.battle.foes = [f];
              for (let nat = 1; nat <= 20; nat++) {
                q = ranged ? [(nat - .5) / 20] : [0, (nat - .5) / 20]; FXQ = []; const hp0 = f.hp;
                heroAttack(h, f, ranged); FXQ = []; delete h.status.RANGE;
                const hit = f.hp < hp0 || /twists away/.test(S.battle.log[0]);
                const bonus = docDexHit(dex) + (WPN[wn].hit || 0), keen = h.cls === 'Thief' && nat >= 15;
                n++; if (hit !== (nat !== 1 && (nat === 20 || keen || nat + bonus >= f.ac))) bad++;
              } } }
          Math.random = real; S.battle = null; return {n, bad}; })()""")
        check('to-hit rule matches the Doc', r['bad'] == 0, f"{r['n']} forced attacks, {r['bad']} wrong")

        # Build 117: the modifiers added to each die must add up to the real to-hit total and the damage dealt
        r = await pg.evaluate("""(() => {
          S.loc = 'wild'; startBattle(false, {foes: [DATA.monsters[0].name], direct: true});
          const h = S.party[0]; h.equip.melee = newItem('Sword'); h.st.STR = 16; h.st.DEX = 16;
          const f = makeFoe(DATA.monsters[0], 0); f.hp = f.max = 9999; f.ac = 2; S.battle.foes = [f];
          const last = d => d.mods && d.mods.length ? d.mods[d.mods.length - 1].to : d.val;
          let n = 0, bad = 0;
          for (let k = 0; k < 60; k++) {
            FXQ = []; const hp0 = f.hp; heroAttack(h, f, false); const dice = FXQ.filter(e => e.k === 'dice'); FXQ = [];
            dice.filter(d => !d.dmg).forEach(d => { n++; if (d.val !== 1 && last(d) !== d.val + weaponHit(h, h.equip.melee)) bad++; });
            const dd = dice.filter(d => d.dmg); if (dd.length && dd.reduce((a, d) => a + last(d), 0) !== hp0 - f.hp) bad++;
          }
          S.battle = null; return {n, bad}; })()""")
        check('dice modifiers add up to the real totals', r['bad'] == 0 and r['n'] > 0, f"{r['n']} rolls, {r['bad']} wrong")

        # Encounter mix: strays from deeper areas at 2% and 5%
        r = await pg.evaluate("""(() => { const reg = REGIONS[0], N = 40000; let up1 = 0, up2 = 0, bad = 0;
          for (let i = 0; i < N; i++) { const f = pickMonsters(reg);
            if (f.some(x => x.stray === 2)) { up2++; if (f.length !== 1) bad++; }
            if (f.some(x => x.stray === 1)) up1++;
            if (f.some(x => !x.stray && x.lvl > reg.lvl)) bad++; }
          return {up1: up1 / N * 100, up2: up2 / N * 100, bad}; })()""")
        check('stray monsters appear at about 2% and 5%', 1.6 < r['up2'] < 2.4 and 4.4 < r['up1'] < 5.6 and r['bad'] == 0, f"+2: {r['up2']:.2f}%, +1: {r['up1']:.2f}%")

        # A whole battle, clicking as fast as possible: no actions while dice roll, results only after the last die
        await pg.evaluate("""(() => { const w = DATA.weapons.find(w => /^D6/.test(w.dmg) && !RANGED.includes(w.name));
          S.party.forEach(h => { h.dead = false; h.hp = h.max; h.equip.melee = newItem(w.name); h.st.DEX = 20; h.st.STR = 18; });
          S.loc = 'wild'; startBattle(false, {foes: [DATA.monsters[0].name, DATA.monsters[1].name], direct: true});
          window.W = {clickWhileDice: 0, lastDie: 0, victoryAt: 0};
          const v = victory; victory = function () { W.victoryAt = performance.now(); W.dice = document.querySelectorAll('.fx-die').length; W.shownHP = [...document.querySelectorAll('[data-hpt^=m]')].map(x => x.textContent).join(); return v.apply(this, arguments); };
          setInterval(() => { const rolling = [...document.querySelectorAll('.fx-die')].filter(d => !d.classList.contains('settled')).length;
            if (document.querySelector('.fx-die')) W.lastDie = performance.now(); if (rolling && document.querySelector('#aMelee')) W.clickWhileDice++;}, 40); })()""")
        for _ in range(1500):   # dice add their modifiers slowly since Build 117
            if not await pg.evaluate("!!S.battle"): break
            if await pg.locator('#aMelee').count():
                try:
                    await pg.click('#aMelee', timeout=500)
                    t = pg.locator('.foe.targetable').first
                    if await t.count(): await t.click(timeout=500)
                except Exception: pass
            await pg.wait_for_timeout(40)
        await pg.wait_for_timeout(500)
        W = await pg.evaluate("W")
        check('a full battle can be won', W['victoryAt'] > 0)
        check('no action is possible while dice are rolling', W['clickWhileDice'] == 0, f"{W['clickWhileDice']} times")
        check('victory waits for the last die', W['victoryAt'] >= W['lastDie'] - 50 and W.get('dice', 1) == 0 and set((W.get('shownHP') or '0').split(',')) == {'0'},
              f"victory {round(W['victoryAt'] - W['lastDie'])} ms after the last die")

        # Build 117: a Double Strike whose second blow kills: the card must not grey out while dice are still adding up
        await pg.evaluate("""(() => { S.loc = 'wild'; S.party.forEach(h => { h.dead = false; h.hp = h.max; h.status = {}; });
          startBattle(false, {foes: [DATA.monsters[0].name], direct: true}); delete S.battle.phase;
          const f = S.battle.foes[0]; f.hp = 1; f.ac = 15; const h = S.party[0]; h.equip.melee = newItem('Sword');
          S.battle.cur = {side: 'p', i: 0}; S.battle.queue = [];
          const real = Math.random; let q = [.99, .06]; Math.random = () => q.length ? q.shift() : .99;
          heroAttack(h, f, false); Math.random = real; render();
          window.G = {early: 0}; const t = setInterval(() => { const card = document.querySelector('.foe[data-foe="0"]');
            if (card && card.classList.contains('dead') && document.querySelector('.fx-die:not(.judged)')) G.early++; }, 30);
          setTimeout(() => clearInterval(t), 12000); })()""")
        await pg.wait_for_timeout(12500)
        G = await pg.evaluate("({early: G.early, dead: S.battle ? S.battle.foes[0].dead : true, grey: !!document.querySelector('.foe.dead')})")
        check('a monster killed by a Double Strike greys out only after the dice add up', G['early'] == 0 and G['dead'], f"{G['early']} early moments")
        await pg.evaluate("S.battle = null")

        check('no script errors', not errs, '; '.join(errs[:3]))
        real_missing = [u for u in missing if 'fonts.g' not in u]
        check('no missing files', not real_missing, ', '.join(real_missing[:3]))
        await b.close()
    srv.shutdown()
    print(f'\n{"ALL PASSED" if not FAILS else str(len(FAILS)) + " FAILED"}')
    sys.exit(1 if FAILS else 0)

asyncio.run(main())
