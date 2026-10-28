# Base Line: The Wilds

A browser RPG built on **Base Line**, Paul Willson's homebrew tabletop rules. Raise a party of four, set out from the castle, explore the wilds, fight with dice you can watch roll, and work through the story of the Old Road and Bramblewood.

**Play it:** https://willson-strategies.github.io/The-Wilds-RPG/

Nothing to install. It runs in any modern browser on a computer or phone. Each player's five quest slots save automatically in their own browser.

## What's in here

| Folder | What it holds |
| --- | --- |
| `index.html` | The page itself. It loads the stylesheet and the scripts in order. |
| `css/style.css` | All the styling. |
| `js/` | The game, one file per area: `battle-engine.js` (attacks, spells, ailments), `dice.js`, `castle.js`, `party-gear.js`, `events.js`, `bosses.js` and so on. |
| `data/game-data.js` | Classes, monsters and weapons: the numbers from the rules Sheet. |
| `data/art.js` | Where each picture lives. |
| `art/` | Item and spell icons (with wear stages), class portraits, full-body art, monsters, camp scenes. |
| `audio/` | Music and sound effects. |
| `tests/check.py` | Automatic checks run before every change. |
| `tools/build.py` | Bundles everything into one page for the Claude preview. |

## Rules

The rules are written up in the Google Doc **"RPG Base line"**. The Doc is the source of truth; the game follows it, and rule changes are made in both.

## How changes are made

1. A change is described in plain English (for example "make Sleep last 3 turns").
2. Claude makes it on its own branch, bumps the build number, runs the checks and opens a **pull request** describing what changed and why.
3. Paul reviews it and clicks **Merge**. The website updates within a minute or two.

Every build is in [CHANGELOG.md](CHANGELOG.md), and every change can be seen line by line in the repository's history.
