# Changelog

Newest first. One short entry per build: what changed for the player, and why when it matters.
Rule changes are also made in the "RPG Base line" Google Doc. The repository history has every line-by-line change.

## Build 117 · 29 Oct 2026
- **Dice with drama** (Tom's feedback). Each die rolls, then every modifier appears under it with where it comes from (the weapon's picture, the DEX, STR or INT icon, or the monster's face), flies into the die and adds to the number. The to-hit die then shows the AC it had to reach and HIT or MISS. Weapons with no damage dice (most starting weapons) show a round damage token that adds up the same way. Dice are bigger, roll more slowly, and the screen darkens behind them while they roll.
- Damage spells roll and add up their dice before the spell flies.
- **No more flat weapon damage.** The Staff, Dagger, Spear, Bow and Sling roll a D2 (+1 and +0 before), the Mace a D3 (was +2), and the starting weapons roll too: the Fighter's Sword a D3, the Elf's Spear a D2. A D2 is rolled on a d4 marked 1, 2, 1, 2. The rules Doc is updated to match.
- A hero with no weapon and no spells can no longer attack bare-handed: they can only wait or flee.
- A monster (or hero) brought down by the second blow of a Double Strike no longer greys out while the dice are still adding up; its card and ailment icons stay until the killing blow lands.
- After a win, each hero's XP bar fills gradually. On a level up the bar flashes, a chime plays, and the card glows gold until the victory screen is closed.

## Build 116 · 28 Oct 2026
- **Moved to GitHub.** The game is split from one large file into folders (`js/`, `css/`, `data/`, `art/`, `audio/`), with automatic checks (`tests/check.py`) and a bundler for the Claude preview (`tools/build.py`). No change to gameplay.

## Build 115 · 28 Oct 2026
- POISON, BURN and SHOCK icons appear on a card only when the hit that caused them lands, together with their effect. Before, they showed up as soon as the player clicked, even during a missed first swing of a Double Strike.

## Build 114 · 28 Oct 2026
- **Strays from deeper areas.** Each encounter: 2% for a single monster from 2 levels above the area (always alone); otherwise 5% for one monster from the next level up (half the time alone, half mixed into a normal group). The "Monsters approach" panel warns the party.

## Builds 104–113 · 27 Oct 2026 · Party & Gear clean-up
- Each hero has their own card. Drag a card by its empty space to change the marching order (Front 1–2, Rear 3–4).
- Each card shows AC, HP, then **To hit D20+X** and **Damage** for melee and ranged. Hover or tap any of them, or a stat box, to see where the numbers come from.
- Stat icons: STR crossed swords, DEX feather, CON heart, WIS candle, INT head giving off magic, CHA mask. Each stat has a tooltip with a line of lore.
- The character sheet (click a portrait) shows the stats and **Character Abilities** for each class.
- Spellbook tooltips show each spell's damage or healing roll, including the INT or WIS bonus.
- Movement is hidden everywhere for now (still kept in the rules).
- Sleep and Entangle lower AC by 15% and 25%, as the Doc says (the game had used a flat −3 and −5).

## Builds 99–103 · 27 Oct 2026 · Combat polish
- Raising a fallen hero at the Clerics takes 8 hours: the party rests and every spell slot is restored.
- The to-hit die caption shows the total and the AC it needs, e.g. "+3 = 6 vs (shield) 9".
- A slash sound plays with the red strike when the party chooses to fight.
- "DOUBLE STRIKE!" appears above the first blow of a double strike, like "CRITICAL HIT!".

## Builds 95–98 · 27 Oct 2026 · Dice
- The d20 rolls first; the damage die rolls only if the attack will deal damage; then the attacker lunges and the blow lands.
- Dice roll a little slower, differently every time, with a rattle sound, and stay on screen longer.
- Each class rolls its own colour of d20; damage dice stay in the red family. Monsters roll charred, sooty dice.
- The next turn waits until the dice and blows have finished, and victory or defeat only shows after the last die.

## Builds 87–94 · 27 Oct 2026 · Clearer combat
- AC shows as a shield icon everywhere, with tooltips.
- The game rolls every hero's starting stats; there is no reroll button.
- Hovering an enemy shows **Roll needed** on a d20, damage as dice plus bonuses, crit and Double Strike chances, and ailment chances.
- Placeholder dice appear for every attack and damage roll.

## Builds 82–86 · 16 Oct 2026
- Five quest slots that save continuously, with no manual saving.
- Bramblewood: lore entries 1–12, "being followed" scenes, the Beastman Warlord boss and Marmillian the Sage.
- Monster AC −15% across the board; ranged attacks give +2 AC until the hero's next turn; resting and ambush odds reworked.
- A developer cheat gem in the Clerics tab (double XP, 10,000 GP, free spells). Remove before release.

## Up to 15 Oct 2026
- The Old Road boss (Beastman Encampment), hidden caches, the trapped chest, road lore written out by a quill.
- Spell animations and sounds, class grunts and injury cries, item wear, initiative, fleeing, uniques.
- Balance passes on Sleep, Fireball, Lightning Bolt, Magic User damage and level-up HP.
