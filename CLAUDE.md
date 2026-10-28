# Working on Base Line: The Wilds

Paul Willson owns this game. He is not a programmer: he describes changes in plain English and approves them by merging pull requests. Write everything he will read (PR titles and descriptions, CHANGELOG entries, replies) in plain English, using the game's own terms (Roll needed, Double Strike, AC, ailment names in capitals: POISON, BURN, SHOCK).

## Sources of truth
- **Rules:** the Google Doc "RPG Base line" (document ID `1fgjoYGUvLNO1Bpd_QkZl6RZtv53xsp7eQ6piq47E7lI`). When a change alters a rule, update the Doc too, and mention it in the PR.
- **Numbers:** classes, monsters and weapons in `data/game-data.js` mirror Paul's rules Sheet.
- **Claude preview:** the artifact at https://claude.ai/artifact/EmnebteMJBxZs6VJJmHbKK (a single page built by `tools/build.py`).
- **Public site:** GitHub Pages, served from `main` at https://willson-strategies.github.io/The-Wilds-RPG/

## How the code is laid out
- `index.html` loads `data/game-data.js`, `data/art.js`, `js/version.js`, then the files in `js/` **in a fixed order**. They are classic scripts sharing one global scope (no modules, no build step), so a file can use anything defined in an earlier file. Code that runs at load time must not call something from a later file. Keep the order in `index.html` when adding a file.
- Pictures are files in `art/`, listed in `data/art.js`. Sounds are in `audio/`.
- `S` is the saved game state; `S.battle` is the current fight. Quests save to localStorage.
- Battle visuals are queued with `fx()` at `FX_LEAD` ms after the action and played by `playFX()`. Game state changes immediately, so anything the player sees (HP numbers, status icons, log lines) must be timed to its effect, not to the click.

## For every change
1. Branch from an up-to-date `main`: `build-<N>-<short-name>`, where N is the next build number.
2. Bump `const BUILD` in `js/version.js` by one.
3. Make the change. Keep the existing style: compact code, short comments explaining why.
4. Run the checks on both versions. They need Python's playwright with Chromium:
   - `python3 tests/check.py`
   - `python3 tools/build.py && python3 tests/check.py dist`

   Add a check to `tests/check.py` when a change is easy to break again.
5. Add a short entry at the top of `CHANGELOG.md`: what changed for the player, and why if it matters.
6. Commit, push, and open a pull request titled `Build N: <what changed>`. In the description, give a plain-English summary, what to try in game, any rule or Doc change, and anything Paul needs to decide.
7. Publish the preview so Paul can try it before merging: run `python3 tools/build.py`, then publish `dist/index.html` to the artifact URL above. The audio is already on the artifact; include it only if audio files changed.
8. Never push straight to `main`. Paul merges.

## Things to know
- The developer cheat gem (bottom-left of The Clerics tab) is deliberate, and is to be removed before release.
- British spelling (armour, colour).
