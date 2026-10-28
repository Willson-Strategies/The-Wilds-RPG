/* ---------------- real-time wear ----------------
   Gear wears only while the player is actually playing in the wilderness or caves
   (exploring or fighting there; not in camp or the castle, and not while the tab is hidden).
   Full wear (Ruined) takes 10 real hours of such play. */
const WEAR_FULL_HOURS = 10;
let wearClock = Date.now();
setInterval(() => {
  const now = Date.now(), dt = Math.min(15, (now - wearClock) / 1000); wearClock = now;
  if (!S || document.hidden || S.loc !== 'wild') return;
  const add = dt / 3600 * (5 / WEAR_FULL_HOURS);
  S.party.forEach(h => Object.values(h.equip).forEach(it => addWear(it, add)));
  S.playWild = (S.playWild || 0) + dt;
  save();
}, 5000);
document.addEventListener('visibilitychange', () => { wearClock = Date.now(); });
