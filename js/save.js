/* ---------------- persistence ---------------- */
/* ---- quests: up to 5 separate games, each numbered 1-5 and autosaved continuously. There is no manual save,
   so a death or a bad level-up can't be undone by reloading; each quest simply carries on where it was left. */
const QUESTS = 5, questKey = n => 'baseline_quest_' + n;
let QUEST = null;   // the quest being played
function save() { if (S && !QUEST && S.quest) QUEST = S.quest; if (!S || !QUEST) return; S.quest = QUEST; try { localStorage.setItem(questKey(QUEST), JSON.stringify({S, uid, quest: QUEST, savedAt: Date.now()})); localStorage.setItem('baseline_last', QUEST); } catch (e) {} }
function readQuest(n) { try { const d = JSON.parse(localStorage.getItem(questKey(n)) || 'null'); return d && d.S ? d : null; } catch (e) { return null; } }
(function migrate() {   // the old single autosave becomes quest 1; anything saved in the old slots fills the next empty quests
  try {
    const old = [localStorage.getItem('baseline_save_v1'), ...[1, 2, 3, 4, 5].map(n => localStorage.getItem('baseline_slot_' + n))].filter(Boolean);
    for (const raw of old) { const free = [1, 2, 3, 4, 5].find(n => !localStorage.getItem(questKey(n))); if (!free) break; const d = JSON.parse(raw); if (d && d.S) localStorage.setItem(questKey(free), JSON.stringify({S: d.S, uid: d.uid || 1000, quest: free, savedAt: d.savedAt || Date.now()})); }
    localStorage.removeItem('baseline_save_v1'); [1, 2, 3, 4, 5].forEach(n => localStorage.removeItem('baseline_slot_' + n));
  } catch (e) {}
})();
window.claude?.hot?.snapshot?.(() => ({S, uid, quest: QUEST}));
