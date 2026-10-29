/* ---------------- music ----------------
   Castle: Sanctum of Iron · the Old Road (and its camp): The Long March · battles: The Old Road battle music.
   Tracks crossfade through Web Audio gain nodes (this also works on iPhones, where audio volume can't be set directly). */
const TRACKS = {castle: 'audio/castle.mp3', road: 'audio/road.mp3', battle: 'audio/battle.mp3', ambush: 'audio/ambush.mp3'};
let AC = null, master = null, curTrack = null, musicBus = null, sfxBus = null;
const musicTracks = {};
let musicOn = (() => { try { return localStorage.getItem('baseline_music') !== 'off'; } catch (e) { return true; } })();
const MUSIC_VOL = .55;
const ambushOK = () => { const t = musicTracks.ambush; return !!t && !t.a.error; };   // only falls back to the battle music if the track fails to load
function musicFor() { if (!S) return 'castle'; if (S.prologue && !S.battle) return 'none'; if ((S.battle && S.battle.boss && S.battle.boss !== 'prologue') || (S.event && (S.event.id === 'beastcamp' || S.event.id === 'warlord') && S.event.revealed)) return ambushOK() ? 'ambush' : 'battle'; if (S.battle) return 'battle'; return S.loc === 'castle' ? 'castle' : 'road'; }
function ensureAudio() {
  if (AC) return;
  const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
  AC = new Ctx(); master = AC.createGain(); master.gain.value = musicOn ? 1 : 0; master.connect(AC.destination);
  musicBus = AC.createGain(); musicBus.gain.value = MUSIC_VOL; musicBus.connect(master);
  sfxBus = AC.createGain(); sfxBus.gain.value = .9; sfxBus.connect(master);
  loadSfx();
  for (const [k, src] of Object.entries(TRACKS)) {
    const a = new Audio(src); a.loop = true; a.preload = 'auto';
    const g = AC.createGain(); g.gain.value = 0;
    try { AC.createMediaElementSource(a).connect(g); } catch (e) {}
    g.connect(musicBus); musicTracks[k] = {a, g};
  }
}
function ramp(g, to, secs) { const t = AC.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(to, t + secs); }
function setMusic(key) {
  if (!AC || key === curTrack) return;
  if (key === 'none') { if (curTrack) { const o = musicTracks[curTrack], was = curTrack; ramp(o.g, 0, 2); setTimeout(() => { if (curTrack !== was) o.a.pause(); }, 2150); } curTrack = 'none'; return; }   // the prologue's storm plays alone
  const fade = key === 'battle' || curTrack === 'battle' || key === 'ambush' ? 1.2 : 2.2;
  if (curTrack && curTrack !== 'none') { const o = musicTracks[curTrack], was = curTrack; ramp(o.g, 0, fade); setTimeout(() => { if (curTrack !== was) o.a.pause(); }, fade * 1000 + 150); }
  const n = musicTracks[key];
  if (key === 'battle' || (key === 'ambush' && curTrack !== 'battle')) n.a.currentTime = 0;   // every fight starts its music from the top; the castle and road pick up where they left off
  n.a.play().catch(() => {});
  ramp(n.g, 1, fade); curTrack = key;
}
function musicTick() { if (AC && AC.state === 'running') setMusic(musicFor()); }
const wake = () => { ensureAudio(); if (AC && AC.state !== 'running' && !document.hidden) AC.resume().then(musicTick).catch(() => {}); musicTick(); };
['pointerdown', 'keydown', 'touchend'].forEach(t => document.addEventListener(t, wake, {passive: true}));
document.addEventListener('visibilitychange', () => { if (!AC) return; if (document.hidden) AC.suspend(); else AC.resume().then(musicTick); });
setInterval(musicTick, 300);
function toggleMusic() {
  musicOn = !musicOn; try { localStorage.setItem('baseline_music', musicOn ? 'on' : 'off'); } catch (e) {}
  ensureAudio(); if (master) ramp(master, musicOn ? 1 : 0, .6);
  document.querySelectorAll('#musicbtn').forEach(b => { b.textContent = musicOn ? '♪ Sound on' : '♪ Sound off'; b.setAttribute('aria-pressed', musicOn); });
}
document.addEventListener('click', e => { if (e.target && e.target.id === 'musicbtn') toggleMusic(); });
