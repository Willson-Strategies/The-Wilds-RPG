# Working on Base Line: The Wilds

Paul Willson owns this game. He is not a programmer: he describes changes in plain English and approves them by merging pull requests. Write everything he will read (PR titles and descriptions, CHANGELOG entries, replies) in plain English, using the game's own terms (Roll needed, Double Strike, AC, ailment names in capitals: POISON, BURN, SHOCK).

## Who is asking
Others can work on the game through their own Claude (for example Tom, the environment artist). **Check who you are working for before steps 6 and 7 below.** If you can't tell from the conversation, ask: "Are you Paul, the game's owner?" Only Paul can update his Claude preview and his rules Doc. Everyone else gets their own preview, and their rule changes go to Paul for approval. **Only Paul merges.**

## Sources of truth
- **Rules:** the Google Doc "RPG Base line" (document ID `1fgjoYGUvLNO1Bpd_QkZl6RZtv53xsp7eQ6piq47E7lI`), owned by Paul.
- **Numbers:** classes, monsters and weapons in `data/game-data.js` mirror Paul's rules Sheet.
- **Paul's Claude preview:** the artifact at https://claude.ai/artifact/EmnebteMJBxZs6VJJmHbKK (a single page built by `tools/build.py`). It is in Paul's Claude account; only Paul's Claude can update it.
- **Public site:** GitHub Pages, served from `main` at https://willson-strategies.github.io/The-Wilds-RPG/

## How the code is laid out
- `index.html` loads `data/game-data.js`, `data/art.js`, `js/version.js`, then the files in `js/` **in a fixed order**. They are classic scripts sharing one global scope (no modules, no build step), so a file can use anything defined in an earlier file. Code that runs at load time must not call something from a later file. Keep the order in `index.html` when adding a file.
- Pictures are files in `art/`, listed in `data/art.js`. Sounds are in `audio/`.
- `S` is the saved game state; `S.battle` is the current fight. Quests save to localStorage.
- Battle visuals are queued with `fx()` at `FX_LEAD` ms after the action and played by `playFX()`. Game state changes immediately, so anything the player sees (HP numbers, status icons, log lines) must be timed to its effect, not to the click.

## For every change
1. Branch from an up-to-date `main`: `build-<N>-<short-name>`, where N is the next build number. Before starting, check the open pull requests: if another one already uses that number, take the next free one.
2. Bump `const BUILD` in `js/version.js` to N. Changes that don't touch the game itself (these instructions, the README, tests or tools) get no build number: name the branch `repo-<short-name>`, leave `js/version.js` alone and skip the CHANGELOG.
3. Make the change. Keep the existing style: compact code, short comments explaining why.
4. Run the checks on both versions. They need Python's playwright with Chromium:
   - `python3 tests/check.py`
   - `python3 tools/build.py && python3 tests/check.py dist`

   Add a check to `tests/check.py` when a change is easy to break again.
5. Add a short entry at the top of `CHANGELOG.md`: what changed for the player, and why if it matters.
6. **Rules.** If the change alters a rule in the Doc:
   - **Working for Paul:** update the Doc and say so in the pull request.
   - **Working for anyone else:** don't edit the Doc. List each rule change in the pull request under a heading **Rule changes for Paul to approve**, quoting the Doc's current wording and the proposed wording. When Paul merges, his Claude updates the Doc.
7. **Preview.** Run `python3 tools/build.py`, then publish `dist/index.html` as an artifact so the change can be played before it is merged:
   - **Working for Paul:** publish to Paul's preview URL above. The audio is already there; include it only if audio files changed.
   - **Working for anyone else:** publish a new artifact in their own account, titled "Base Line: The Wilds (preview)". On the first publish, include every file under `dist/audio/` as supporting files (published at `audio/...`), or the game will be silent. Reuse the same artifact for later changes by that person. Remind them to share it with Paul from the artifact's **Share** menu.
8. Commit, push, and open a pull request titled `Build N: <what changed>`, or a plain title for a repository-only change. In the description, include:
   - who asked for it
   - a plain-English summary
   - the preview link
   - what to try in game
   - any rule changes
   - anything Paul needs to decide
9. Never push straight to `main` or merge a pull request. Paul merges.

## Things to know
- The developer cheat gem (bottom-left of The Clerics tab) is deliberate, and is to be removed before release.
- British spelling (armour, colour).
