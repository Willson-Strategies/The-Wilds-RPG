"""Builds the Player Booklet (docs/Player Booklet.pdf) from the game's own data.

    python3 docs/booklet/build.py

Weapons, armour, spells, prices, spellbook slots and class dice are read from data/game-data.js and
js/rules.js, so the booklet follows the game. The words are in this file. The level 10 figures
(typical stats and the "At a glance" chart) are in class-figures.json, taken from the balance app.
Needs Python's playwright with Chromium, like tests/check.py.
"""
import asyncio, html, json, math, re
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT_PDF = ROOT / 'docs' / 'Player Booklet.pdf'
OUT_HTML = HERE / 'booklet.html'   # kept for checking the layout in a browser; not committed
CLASSES = ['Fighter', 'Dwarf', 'Elf', 'Magic User', 'Cleric', 'Thief']
SLUG = lambda s: re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
E = html.escape
WORDS = 'no one two three four five six seven eight nine ten'.split()


# ---------- the game's data ----------
async def game_data():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        await pg.goto((ROOT / 'index.html').as_uri())   # loads every script; we only read the tables
        d = await pg.evaluate('JSON.stringify({DATA, ARMOUR, SPELLS, BOOKS, RANGED})')
        await b.close()
    return json.loads(d)


# ---------- words ----------
def ail(t):  # ailment names in capitals, in their colours
    return re.sub(r'\b(POISON|BURN|SHOCK)\b', r'<b class="ail \1">\1</b>', t)

DOUBLE = ('Double Strike', 'Roll a D20 before each melee attack. On a natural 20 you strike twice.')
TEXT = {
 'Fighter': dict(
  tag='Master of every blade, last to fall', role='Front-line warrior', style='Simple and direct',
  intro='The Fighter is a professional warrior, trained with every weapon in the armoury. Where others rely on spells or tricks, the Fighter trusts steel and a thick hide, standing at the front to take the blows meant for their friends.',
  good=['Hits harder and more often than any other hero', 'The only class able to wield <b>Legendary</b> blades', 'Very tough, with HP that keeps climbing every level', 'Easy to play: pick the best weapon and charge'],
  bad=['Cannot use magic of any kind', 'No way to heal, so relies on the Cleric and potions', 'Fights one enemy at a time, so large groups wear it down', 'Dexterity tops out at 20, so armour does most of the defending'],
  abilities=[DOUBLE, ('Weapon master', 'The only class that can wield every weapon, right up to Legendary blades.')],
  arms='Can wield any weapon and wear any armour.'),
 'Dwarf': dict(
  tag='Stubborn as stone, twice as hard to break', role='Front-line defender', style='Steady and forgiving',
  intro='Dwarves are born to the forge and the mountain hall. Short, broad and stubborn, a Dwarf shrugs off blows that would fell a taller warrior and answers with a heavy hammer or axe.',
  good=['The toughest hero of all, with the most HP of any class', 'Wields almost every weapon, up to Superior warhammers and broad swords', 'Hits often, thanks to steady Dexterity growth', 'Forgiving to play: very hard to knock down'],
  bad=['Cannot use magic of any kind', 'Cannot wield Legendary weapons', 'Strength tops out at 20, so hits a little softer than a Fighter', 'Gruff and charmless: Charisma barely grows'],
  abilities=[DOUBLE, ('Stoneborn', 'Gains the biggest HP roll of any class each level: {hp} plus the Constitution bonus.'),
             ('Stone skin', 'A 3% chance to reduce non-magical attack damage by 1, rising 1% a level to 12%. Never reduces a hit below 1.')],
  arms='Can wear any armour and carry a shield, but cannot wield Legendary weapons.'),
 'Elf': dict(
  tag='Blade in one hand, spell in the other', role='Spellblade', style='Flexible, grows into its power',
  intro='Elves walk between two worlds: trained with sword and bow, yet touched by old magic. An Elf starts as a nimble skirmisher and, from level 3, begins to weave spells from both the arcane and holy traditions.',
  good=['Learns spells from both the Magic User and Cleric lists', 'Strong area magic and crowd control in later levels', 'Good HP for a spellcaster', 'Can fight from range with a bow'],
  bad=['No spells until level 3, and only a few slots before level 10', 'Light weapon damage, limited to Standard weapons', 'Adds only half its Intelligence or Wisdom bonus to spells', 'Defence and accuracy trail the warriors'],
  abilities=[DOUBLE, ('Twin traditions', 'Spell slots open at level 3 and grow to {slots} by level 10: {l1w} level 1 slots and {l2w} level 2 slot. Can use Magic User and Cleric spells, but cannot use level 2 Cleric spells.')],
  arms='Can wear up to chain mail armour and carry a shield, but cannot use Advanced, Superior or Legendary weapons.'),
 'Magic User': dict(
  tag='Words of power, a body of paper', role='Spellcaster', style='Powerful but fragile',
  intro='The Magic User has traded the sword for the spellbook. Years of study let them hurl bolts of force, fire and lightning, or send enemies to sleep. Their spells never miss, but they must be protected.',
  good=['The strongest spell damage in the game, and spells always hit', 'Fireball and Lightning Bolt strike whole groups', 'Sleep and Entangle take enemies out of the fight', 'Starts ready to cast, with two Magic Missiles'],
  bad=['Very low HP: a few good blows will bring them down', 'Basic weapons only, and barely hurts with them', 'One cast per spellbook slot, then must rest', 'Must buy or find scrolls to learn new spells'],
  abilities=[('Arcane knowledge', 'Starts with Magic Missile in both of its 2 slots. Grows to {slots} slots by level 10, with level 2 spells from level {l2from}. Each slot is one cast per rest.'),
             ('Magic mastery', 'Can learn all Magic User spells.')],
  arms='Can only use Basic weapons and cannot wear armour or carry a shield, although some rare magic armour may exist…'),
 'Cleric': dict(
  tag='Faith as a shield, healing in their hands', role='Healer and protector', style='Supportive',
  intro='The Cleric is a warrior of faith who keeps the party standing. With mace and prayer they mend wounds, cure POISON and curses, and shield allies from harm. Against the undead, their faith becomes a weapon.',
  good=['By far the best healer, and can heal the whole party at once', 'Protects allies and cures every ailment', 'Holy spells hit the undead hard', 'Sturdy for a spellcaster, with good HP'],
  bad=['Light weapon damage, limited to Basic and Light weapons', 'No area damage, so swarms are a problem', 'Damage spells only work against the undead', 'Cannot cast Magic User spells'],
  abilities=[DOUBLE, ('Prayers', 'Starts with Undead Ward and Cure Light Wounds. Grows to {slots} slots by level 10, with up to {l2} level 2 spells.'),
             ('Holy spells', 'Can learn all Cleric spells.'),
             ('Field medic', 'While the Cleric is alive, the whole party heals D3+1 HP per hour of camp rest instead of D3.')],
  arms='Can wear up to chain mail armour but cannot carry a shield. Can only wield Basic and Light weapons.'),
 'Thief': dict(
  tag='Quick hands, quicker feet', role='Skirmisher', style='Tricky, rewards luck',
  intro='The Thief survives on speed, cunning and a little luck. Hard to pin down and quick with a dagger, they slip past blows that would land on anyone else and strike where it hurts most.',
  good=['The hardest hero to hit, and dodges some attacks entirely', 'Rolls of 15 or more always hit and crit', 'Strikes twice far more often than anyone else', 'Highest Charisma, great for shops and encounters'],
  bad=['Very low HP, so cannot trade blows for long', 'Basic weapons only, so each hit is small', 'No spells until level 6, and only a few after', 'Adds only half its Intelligence or Wisdom bonus to spells'],
  abilities=[('Evasion', 'A 5% chance to dodge non-magical hits, rising 1% a level to 14%.'),
             ('Keen strikes', 'A natural 15 or higher always hits and crits.'),
             ('Quick hands', 'Double Strike on a 15+, not just a natural 20.'),
             ('Light fingers', 'Only a party with a Thief can open the trapped chests found on the road.'),
             ('Dabbler', 'Spell slots from level 6, from either spell list.')],
  arms='Can only wear leather armour and cannot carry a shield. Can only wield Basic weapons.'),
}
STAT_ROWS = [('STR', 'Strength', 'Extra damage with weapons'), ('DEX', 'Dexterity', 'Hitting more often, harder to hit'),
             ('CON', 'Constitution', 'Extra HP every level'), ('WIS', 'Wisdom', 'Stronger healing spells'),
             ('INT', 'Intelligence', 'Stronger damage spells'), ('CHA', 'Charisma', 'Shop prices and encounters')]
AXES = [('hp', 'Toughness'), ('def', 'Defence'), ('acc', 'Accuracy'), ('wpn', 'Weapon damage'),
        ('mag', 'Magic'), ('heal', 'Healing'), ('aoe', 'Area damage'), ('ctl', 'Control')]
BANDS = [('up', 'Weak', '#8e2f17'), ('warn', 'Fair', '#a97a12'), ('ok', 'Strong', '#4f9a52'), ('op', 'Exceptional', '#1f5a34')]
BAND_COL = {k: c for k, _, c in BANDS}

SPELL_TEXT = {
 'Magic Missile': ("Darts of pure force leap from the caster's fingertips and never stray from their mark.", '{dice} magic damage to one target.', '{dice} to one enemy'),
 'Fireball': ('A spark swells into a roaring sphere of flame that bursts among the enemy ranks.',
              "{dice} magic fire damage, plus half the caster's INT bonus, to the chosen enemy. Every other enemy takes half of that. Each enemy hit has a {ailp}% chance to BURN.",
              '{dice} + half INT to one, half to the rest, may BURN'),
 'Sleep': ('A whispered lullaby drags the mind into a heavy, dreamless slumber.',
           'One target sleeps for {turns} turns. Chance: {b0}% +1% per INT vs level 5 and below, {b1}% +1% per INT vs level 6+, never above 85%. Sleepers are 15% easier to hit; non-magical damage wakes them. May not be effective on the strongest of foes.',
           'Puts one enemy to sleep'),
 'Advanced Magic Missile': ('The darts of a master: brighter, heavier, and every bit as unerring.', '{dice} magic damage to one target.', '{dice} to one enemy'),
 'Lightning Bolt': ("The sky's fury is called down in a blinding fork that leaps from foe to foe.",
                    '{dice} magic lightning damage to every enemy, each with a {ailp}% chance to SHOCK. Then 5 sparks strike the enemies for a quarter of the damage rolled (sparks cannot SHOCK).',
                    '{dice} to every enemy and sparks, may SHOCK'),
 'Entangle': ('Grasping roots and thorned vines burst from the ground to bind the enemy fast.',
              'One target is entangled for {turns} turns. Chance: {b0}% +1% per INT vs level 5 and below, {b1}% +1% per INT vs level 6+, never above 85%. Entangled targets are 25% easier to hit; damage does not free them. May not be effective on the strongest of foes.',
              'Binds one enemy fast'),
 'Undead Ward': ('A blinding word of faith that burns through the rotten flesh of the restless dead.', '{dice} magic damage to one undead enemy. The Cleric also takes {self} damage.', '{dice} to one undead'),
 'Cure Light Wounds': ('A gentle prayer that knits torn skin and stems the bleeding.', 'Heals one target for {dice}.', 'Heals one for {dice}'),
 'Protection against Evil': ('A ward of pale light settles over an ally, turning aside the blows meant for them.', 'One target takes 50% less damage from all sources for 2 turns.', 'Halves damage to one ally'),
 'Cure Ailment': ('Holy water and a whispered rite to purge whatever festers within.', 'Cures all negative ailments (POISON, BURN, SHOCK, sleep, entangle and the rest) and gives 25% resistance to all of them for 2 turns.', 'Cures all ailments'),
 'Undead Abyss': ('The Cleric tears open the dark and casts the dead back into it, at a price.', '{dice} magic damage to one undead enemy. The Cleric also takes {self} damage.', '{dice} to one undead'),
 'Cure Serious Wounds': ('A fervent invocation that drags the dying back from the brink.', 'Heals one target for {dice}.', 'Heals one for {dice}'),
 'Cure All': ('A circle of radiant light washes over every companion at once.', 'Heals every ally for {dice}.', 'Heals every ally for {dice}'),
}
BOOK_TEXT = {
 'Magic User': dict(title="The Magic User's Spellbook", tag='Seven pages of power, earned one level at a time', liber='Liber Arcanum',
   example=['Magic Missile', 'Magic Missile', 'Sleep', 'Fireball', 'Lightning Bolt', 'Entangle', 'Fireball'], rows=[[2, 2], [2, 1]],
   learn='You can learn every Magic User spell. Buy scrolls in the shop or find them as loot; there is no limit to how many you know.',
   slots='Choose which spells fill your slots to suit the fight ahead.', doubles='You begin with Magic Missile in both of your first two slots.',
   last=('Always hits.', 'Spells never miss. Damage spells add your Intelligence bonus.')),
 'Cleric': dict(title="The Cleric's Spellbook", tag='Ten prayers to mend the living and unmake the dead', liber='Liber Sanctus',
   example=['Cure Light Wounds', 'Undead Ward', 'Protection against Evil', 'Cure Ailment', 'Cure Serious Wounds',
            'Cure All', 'Cure Light Wounds', 'Undead Ward', 'Undead Abyss', 'Cure Serious Wounds'], rows=[[3, 2], [3, 2]],
   learn='You can learn every Cleric spell. Buy scrolls in the shop or find them as loot; there is no limit to how many you know.',
   slots='Choose which prayers fill your slots to suit the fight ahead.', doubles='You begin with Undead Ward and Cure Light Wounds.',
   last=('Always lands.', 'Spells never miss. Healing adds your Wisdom bonus; spells against the undead add your Intelligence bonus.')),
}


# ---------- helpers ----------
def icon(name):
    return f'<span class="ico"><img src="../../art/items/{SLUG(name)}-0.png" alt=""></span>'

def dash(s):  # "0-1" -> "0–1"
    return re.sub(r'(\d)-(\d)', r'\1–\2', s)

def head(kicker, title, tag):
    return f'''<header class="hd"><div class="kick">{kicker}</div><h1>{E(title)}</h1><div class="tagline">{E(tag)}</div><div class="rule"><i></i></div></header>'''

def page(n, body, cls=''):
    return f'<section class="page {cls}" style="--bg:url(assets/parchment-{n:02d}.jpg)"><div class="frame"></div><div class="in">{body}</div></section>'

def who(classes, all_word='Everyone'):
    return all_word if len(classes) == len(CLASSES) else ', '.join(classes)

def radar_label(k, v):
    r = round(v + 1e-9)
    if k == 'hp': return f'{r} HP'
    if k == 'def': return f'+{r} AC' if r else 'No bonus'
    if k == 'acc': return f'+{r} to hit'
    if not v: return 'None'
    if k == 'wpn': return f'{r} per swing'
    if k == 'mag': return f'+{r} spell damage'
    if k in ('heal', 'aoe'): return f'{r} per cast'
    return f'{v:.1f} turns'

def radar(fig):
    W, H, cx, cy, R = 430, 292, 215, 148, 96
    pt = lambda i, f: (cx + math.cos(-math.pi / 2 + i * math.pi / 4) * R * f, cy + math.sin(-math.pi / 2 + i * math.pi / 4) * R * f)
    s = f'<svg class="radar" viewBox="0 0 {W} {H}">'
    for f in (.25, .5, .75, 1):
        ring = ' '.join('%.1f,%.1f' % pt(i, f) for i in range(8))
        s += f'<polygon points="{ring}" fill="{"rgba(120,90,40,.07)" if f == 1 else "none"}" stroke="#a38a5c" stroke-opacity=".55" stroke-width="{1.2 if f == 1 else .7}"/>'
    for i, (k, _) in enumerate(AXES):
        x, y = pt(i, 1); c = BAND_COL[fig[k]['band']]
        s += f'<line x1="{cx}" y1="{cy}" x2="{x:.1f}" y2="{y:.1f}" stroke="{c}" stroke-width="1.8"/>'
    poly = ' '.join('%.1f,%.1f' % pt(i, max(.04, fig[k]['scale'])) for i, (k, _) in enumerate(AXES))
    s += f'<polygon points="{poly}" fill="#6b4a22" fill-opacity=".28" stroke="#5a3b1a" stroke-width="2.2" stroke-linejoin="round"/>'
    for i, (k, label) in enumerate(AXES):
        c = BAND_COL[fig[k]['band']]
        x, y = pt(i, max(.04, fig[k]['scale']))
        s += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.6" fill="{c}" stroke="#f3e6c6" stroke-width="1.6"/>'
        lx, ly = pt(i, 1.24)
        a = 'middle' if abs(lx - cx) < 8 else 'start' if lx > cx else 'end'
        if a != 'middle': lx += -8 if a == 'end' else 8
        s += f'<text x="{lx:.1f}" y="{ly - 5:.1f}" text-anchor="{a}" class="rl">{label}</text>'
        s += f'<text x="{lx:.1f}" y="{ly + 9:.1f}" text-anchor="{a}" class="rv" fill="{c}">{radar_label(k, fig[k]["value"])}</text>'
    return s + '</svg>'

def book_slots(G, cls):
    """Unlock level of each slot, in order, and whether it may hold a level 2 spell."""
    out, have, l2 = [], 0, 0
    for L in range(1, 11):
        b = next((b for b in G['BOOKS'][cls] if b[0] <= L <= b[1]), None)
        if not b: continue
        new, newl2 = b[2] - have, b[3] - l2
        for j in range(new): out.append([L, j >= new - newl2])
        have, l2 = b[2], b[3]
    return out


# ---------- pages ----------
def class_page(G, F, n, cls):
    T, C, fig = TEXT[cls], G['DATA']['classes'][cls], F[cls]
    base, lvl, caps = C['base'], C['levelup'], C['caps']
    b10 = book_slots(G, cls) if cls in G['BOOKS'] else []
    fmtv = dict(hp=lvl[0], slots=len(b10), l2=sum(x[1] for x in b10), l1=len(b10) - sum(x[1] for x in b10),
                l2w=WORDS[sum(x[1] for x in b10)], l1w=WORDS[len(b10) - sum(x[1] for x in b10)],
                l2from=next((x[0] for x in b10 if x[1]), ''))
    good = ''.join(f'<li>{g}</li>' for g in T['good'])
    bad = ''.join(f'<li>{ail(b)}</li>' for b in T['bad'])
    abil = ''.join(f'<h4>{E(a)}</h4><p>{E(t.format(**fmtv))}</p>' for a, t in T['abilities'])
    intro = ail(E(T['intro']))
    rows = ''
    for i, (k, name, note) in enumerate(STAT_ROWS):
        st, up = base[i], lvl[i + 1]
        none = st == '0' and up == '0'
        cap = caps.get(k, 25)
        lim = '—' if none else (f'<b class="cap">{cap}</b>' if cap < 25 else str(cap))
        typ = round(fig['typical'][k])   # Python rounds halves to even, as the old booklet did
        rows += f'<tr><th>{name} <i>{note}</i></th><td>{dash(st)}</td><td>{dash(up)}</td><td>{typ}</td><td>{lim}</td></tr>'
    rows += f'<tr class="hp"><th>Hit Points <i>How much damage you can take</i></th><td>4 + CON</td><td>{lvl[0]} + CON bonus</td><td>{round(fig["typical"]["HP"])}</td><td>—</td></tr>'
    legend = ''.join(f'<span><i style="background:{c}"></i>{w}</span>' for _, w, c in BANDS)
    body = head('Character class', 'The ' + cls, T['tag']) + f'''
<div class="hero">
  <div class="side"><div class="arch"><img src="assets/{SLUG(cls)}.webp" alt=""></div>
    <dl><dt>Role</dt><dd>{T['role']}</dd><dt>Play style</dt><dd>{T['style']}</dd></dl></div>
  <div class="main"><p class="intro"><span class="drop">{intro[0]}</span>{intro[1:]}</p>
    <div class="cols"><div><h3 class="g">Strengths</h3><ul class="good">{good}</ul></div><div><h3 class="b">Struggles</h3><ul class="bad">{bad}</ul></div></div></div>
</div>
<hr>
<div class="mid">
  <div class="glance"><h2>At a glance <i>a typical level 10 {cls}</i></h2>{radar(fig['radar'])}<div class="legend">{legend}</div></div>
  <div class="abil"><h2>Abilities</h2>{abil}<h2 class="arms">Weapons and armour</h2><p>{E(T['arms'])}</p></div>
</div>
<hr>
<h2>Stats and growth</h2>
<table class="stats"><thead><tr><th>Stat</th><th>Starts</th><th>Per level</th><th>Typical at<br>level 10</th><th>Limit</th></tr></thead><tbody>{rows}</tbody></table>
<p class="foot">Dice show what you roll. “0–1” means roll to gain nothing or one point. Typical at level 10 shows an average hero; yours may roll higher or lower. The Limit is the highest a stat can ever reach.</p>'''
    return page(n, body, 'cls ' + SLUG(cls))

def spell_fmt(G, name):
    s = G['SPELLS'][name]
    return dict(dice=s.get('dice', ''), self=s.get('self', ''), turns=s.get('turns', ''), ailp=(s.get('ail') or ['', ''])[1],
                b0=(s.get('base') or ['', ''])[0], b1=(s.get('base') or ['', ''])[1])

def book_page(G, n, cls):
    B = BOOK_TEXT[cls]
    slots = book_slots(G, cls)
    cards = [f'''<div class="slot{' l2' if l2 else ''}"><span class="lv"><small>Level</small>{L}</span>{'<span class="l2t">✦ Level 2</span>' if l2 else ''}{icon(sp)}<b>{E(sp)}</b></div>'''
             for (L, l2), sp in zip(slots, B['example'])]
    it = iter(cards)
    pages = ''.join(f'<div class="bp"><div class="liber">{B["liber"]}</div>' + ''.join('<div class="srow">' + ''.join(next(it) for _ in range(k)) + '</div>' for k in half) + '</div>' for half in B['rows'])
    # growth chart: one stack of slots per level; level 2 slots in gold, new slots outlined darker
    chart, prev = '', 0
    for L in range(1, 11):
        b = next(b for b in G['BOOKS'][cls] if b[0] <= L <= b[1])
        chart += '<div class="bar">' + ''.join(f'<i class="{"g" if j >= b[2] - b[3] else ""}{" new" if j >= prev else ""}"></i>' for j in range(b[2])) + f'<span>{L}</span></div>'
        prev = b[2]
    rng = lambda b: str(b[0]) if b[0] == b[1] else f'{b[0]}–{b[1]}'
    bk = G['BOOKS'][cls]
    grow = f'''<table class="grow"><tr><th>Level</th>{''.join(f'<td>{rng(b)}</td>' for b in bk)}</tr><tr><th>Slots</th>{''.join(f'<td>{b[2]}</td>' for b in bk)}</tr><tr><th>✦ Level 2</th>{''.join(f'<td>{b[3] or "—"}</td>' for b in bk)}</tr></table>'''
    use = [('Learning.', B['learn']), ('Slots.', 'Only spells written into your spellbook slots can be cast. ' + B['slots']),
           ('Casting.', 'Each filled slot gives one cast. Once cast, that slot is spent until the party rests.'),
           ('Doubles.', 'The same spell may fill more than one slot. ' + B['doubles']),
           ('Level 2 spells.', 'Only slots marked ✦ may hold a level 2 spell.'), B['last']]
    lst = 'MU' if cls == 'Magic User' else 'CL'
    rows = ''.join(f'<tr><td class="ic">{icon(sp)}</td><th>{E(sp)}</th><td class="c">{s["lvl"]}</td><td class="fl">{E(SPELL_TEXT[sp][0])}</td><td>{ail(E(SPELL_TEXT[sp][1].format(**spell_fmt(G, sp))))}</td></tr>'
                   for sp, s in G['SPELLS'].items() if s['list'] == lst)
    body = head('Spellbook', B['title'], B['tag']) + f'''
<div class="book"><img src="assets/spellbook.webp" alt="">{pages}</div>
<div class="bkey"><span><i></i>Slot, with the level it unlocks</span><span><i class="g"></i>May hold a level 2 spell</span><em>Shown: an example level 10 {cls}</em></div>
<hr>
<div class="mid2">
  <div><h2>How the spellbook grows</h2><div class="chart">{chart}</div><div class="cap">Character level</div>{grow}</div>
  <div><h2>Using your spellbook</h2><ul class="use">{''.join(f'<li><b>{a}</b> {E(t)}</li>' for a, t in use)}</ul></div>
</div>
<hr>
<h2>{'Magic User' if lst == 'MU' else 'Cleric'} spells</h2>
<table class="spells"><thead><tr><th colspan="2">Spell</th><th class="c">Lvl</th><th>Description</th><th>Effect</th></tr></thead><tbody>{rows}</tbody></table>'''
    return page(n, body, 'bk' + (' cl' if cls == 'Cleric' else ''))

def shops_page(G, n):
    D = G['DATA']
    tiers = {c: D['classes'][c]['tiers'] for c in CLASSES}
    wrows = ''
    for w in sorted(D['weapons'], key=lambda w: w['price']):
        ranged = w['name'] in G['RANGED']
        note = '+2 AC until your next turn' if ranged else w['note'].replace('undead', 'the undead') or '—'
        note = re.sub(r'chance to (\w+)', lambda m: 'chance to ' + m.group(1).upper(), note)
        wrows += f'''<tr><td class="ic">{icon(w['name'])}</td><th>{E(w['name'])}</th><td>{'Ranged' if ranged else 'Melee'}</td><td class="n">+{w['hit']}</td><td class="n">{w['dmg']}</td><td>{ail(note)}</td><td>{who([c for c in CLASSES if w['tier'] in tiers[c]])}</td><td class="gp">{w['price']} GP</td></tr>'''
    arows = ''.join(f'''<tr><td class="ic">{icon(a)}</td><th>{a}</th><td class="n">+{v['ac']}</td><td>{who(v['who'])}</td><td class="gp">{v['price']} GP</td></tr>''' for a, v in G['ARMOUR'].items())
    body = head('The city', 'Within the Castle Walls', 'Steel, leather and a warm hearth, for a price') + f'''
<p class="intro wide"><span class="drop">T</span>he castle still has plenty of stock of basic weapons and armour, and its smiths and armourers will craft finer wares given time. Some weapons, armour and spells cannot be bought at all: they lie out in the wilderness, waiting to be found. Be sure to stock up before heading out.</p>
<h2>The weapon shop <i>Every character can carry one melee and one ranged weapon</i></h2>
<table class="shop"><thead><tr><th colspan="2">Weapon</th><th>Type</th><th class="n">To<br>hit</th><th class="n">Damage</th><th>Special</th><th>Who can wield it</th><th class="gp">Price</th></tr></thead><tbody>{wrows}</tbody></table>
<h2>The armour shop <i>Armour and shields add to your AC</i></h2>
<table class="shop arm"><thead><tr><th colspan="2">Armour</th><th class="n">AC</th><th>Who can wear it</th><th class="gp">Price</th></tr></thead><tbody>{arows}</tbody></table>
<p class="foot">The Magic User cannot wear armour or carry a shield, although rare magic armour is rumoured to exist.</p>'''
    return page(n, body, 'city')

def services_page(G, n):
    D = G['DATA']
    items = [(w['name'], w['price']) for w in sorted(D['weapons'], key=lambda w: w['price'])] + [(a, v['price']) for a, v in G['ARMOUR'].items()]
    smith = ''.join(f'<div>{icon(nm)}<b>{E(nm)}</b><span class="gp">{max(1, math.floor(p * .1))} GP</span></div>' for nm, p in items)
    srows = ''
    for sp, s in G['SPELLS'].items():
        mu = s['list'] == 'MU'
        srows += f'''<tr><td class="ic">{icon(sp)}</td><th>{E(sp)}</th><td class="fl">{'Magic User' if mu else 'Cleric'}</td><td class="c">{s['lvl']}</td><td class="ef">{ail(E(SPELL_TEXT[sp][2].format(**spell_fmt(G, sp))))}</td><td>{'Magic User' if mu else 'Cleric'}, Elf, Thief</td><td class="gp">{s['price']} GP</td></tr>'''
    body = head('The city', 'Services of the Castle', 'Mending, magic, mercy and the open road') + f'''
<h2>The blacksmith <i>Polishing and repairs restore worn gear to its best</i></h2>
<p>Weeks in the wild leave blades chipped and mail rusted, and worn gear fights worse. Bring it to the forge and the smith will polish and repair it for a tenth of its price.</p>
<div class="smith">{smith}</div>
<h2>The magic shop <i>Scrolls to learn and write into your spellbook</i></h2>
<table class="shop mag"><thead><tr><th colspan="2">Scroll</th><th>Spell list</th><th class="c">Lvl</th><th>Effect</th><th>Who can learn it</th><th class="gp">Price</th></tr></thead><tbody>{srows}</tbody></table>
<p class="foot">Rarer scrolls may appear on the shelves as your fame grows, and some are only ever found in the wilderness. The Elf's level 2 slot can only hold Magic User spells.</p>
<div class="three">
  <div><h2>The Clerics</h2><p>The temple's clerics tend to every pilgrim who returns from the wilds. Your party is restored to full health, ailments are cleansed and fallen companions are raised, all free of charge. Raising the fallen takes the night: the whole party rests at the temple and wakes with every spell restored.</p></div>
  <div><h2>The Caravan</h2><p>Merchant caravans leave the castle gates every day. Take one to any place you have visited before and skip the long walk back through the wilderness.</p></div>
  <div><h2>Selling</h2><p>Every shop will buy back anything you no longer need for 15% of its price. Better a few coins than dead weight in the pack.</p></div>
</div>'''
    return page(n, body, 'city svc')


CSS = (HERE / 'booklet.css').read_text()

async def main():
    G = await game_data()
    F = json.loads((HERE / 'class-figures.json').read_text())
    pages = [class_page(G, F, i + 1, c) for i, c in enumerate(CLASSES)]
    pages += [book_page(G, 7, 'Magic User'), book_page(G, 8, 'Cleric'), shops_page(G, 9), services_page(G, 10)]
    doc = f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>Base Line: The Wilds · Player Booklet</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
    OUT_HTML.write_text(doc)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        await pg.goto(OUT_HTML.as_uri())
        await pg.evaluate('document.fonts.ready')
        await pg.wait_for_timeout(300)
        over = await pg.evaluate('''[...document.querySelectorAll('.page')].map((p, i) => { const r = p.getBoundingClientRect(), last = [...p.querySelector('.in').children].pop().getBoundingClientRect();
            return {page: i + 1, spare_mm: +((r.bottom - last.bottom) / 3.7795).toFixed(1)}; })''')
        await pg.pdf(path=str(OUT_PDF), format='A4', print_background=True, margin={'top': '0', 'bottom': '0', 'left': '0', 'right': '0'})
        await b.close()
    for o in over:
        flag = '  <-- too long' if o['spare_mm'] < 9 else ''
        print(f"page {o['page']:2d}: {o['spare_mm']:5.1f} mm spare at the bottom{flag}")
    print('Wrote', OUT_PDF.relative_to(ROOT))

if __name__ == '__main__':
    asyncio.run(main())
