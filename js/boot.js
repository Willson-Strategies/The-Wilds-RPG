/* ---------------- boot ---------------- */
function start(data) {
  if (data && data.S) { S = data.S; uid = data.uid || 1000; QUEST = data.quest || data.S.quest || null; if (QUEST) { save(); return go(); } S = null; }   // no quest number: back to the quest list rather than play unsaved
  screenTitle();
}
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
