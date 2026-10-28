/* ---------------- state ---------------- */
let S = null;
let uid = 1;
const newItem = (name) => ({uid: uid++, name, wear: 0, shown: 0});
/* Unique weapons: found only as loot. One class each, sell 500 GP, polish 150 GP. */
const UNIQUES = {
  "Gorewarden's Axe": {base: 'Axe', cls: 'Dwarf', hit: 2, dmg: '+D20', critOn: 16, note: 'Unique. A hit on a roll of 16 or higher also deals critical damage.'},
  "Beggar's Guile": {base: 'Dagger', cls: 'Thief', hit: 2, dmg: '+D3+1', note: 'Unique. 30% chance to poison on a hit.'},
  "Warrior's Blade": {base: 'Arming Sword', cls: 'Fighter', hit: 2, dmg: '+D6+4', parry: 10, note: 'Unique. 10% chance to parry an incoming melee hit.'},
  'Magus Staff': {base: 'Staff', cls: 'Magic User', hit: 3, dmg: '+D3', proc: [10, ['SHOCK', 'BURN']], note: "Unique. 10% chance on a hit to SHOCK or BURN until the end of the enemy's next turn."},
  'Elven Spear': {base: 'Spear', cls: 'Elf', hit: 3, dmg: '+D6', proc: [5, ['SHOCK', 'BURN', 'POISON']], note: "Unique. 5% chance on a hit to SHOCK, BURN or POISON until the end of the enemy's next turn."},
};
Object.entries(UNIQUES).forEach(([n, u]) => { WPN[n] = Object.assign({}, WPN[u.base], u, {name: n, tier: 'Unique', price: 1500, sell: 500}); ICON[n] = ICON[u.base]; });
const UNIQUE_RE = new RegExp(Object.keys(UNIQUES).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
/* Starting weapons: a weaker, named copy of a shop weapon ("Aldric's Sword"). */
const STARTER = {Sword: {hit: 1, dmg: '+2'}, Axe: {hit: 0, dmg: '+D2'}, Spear: {hit: 1, dmg: '+1'}};
const starterName = (hero, type) => `${hero}'s ${type}`;
function regStarter(it) {
  if (!it || !it.starter) return;
  WPN[it.name] = Object.assign({}, WPN[it.starter], STARTER[it.starter], {name: it.name, price: 6, note: 'Starting weapon'});
  ICON[it.name] = ICON[it.starter];
}
function newStarter(type, hero) { const it = Object.assign(newItem(starterName(hero, type)), {starter: type}); regStarter(it); return it; }
function registerStarters() { if (!S) return; S.party.forEach(h => Object.values(h.equip).forEach(regStarter)); (S.inv || []).forEach(regStarter); }
function itemKind(name) {
  if (WPN[name]) return RANGED.includes(name) ? 'ranged' : 'melee';
  if (ARMOUR[name]) return ARMOUR[name].shield ? 'shield' : 'armour';
  if (SPELLS[name]) return 'scroll';
  return 'misc';
}
function rollStats(cls) {
  const c = DATA.classes[cls], st = {};
  STATS.forEach((s, i) => { st[s] = Math.min(capOf(cls, s), Math.max(0, roll(c.base[i]))); });
  return st;
}
const capOf = (cls, s) => (DATA.classes[cls].caps || {})[s] || 25;
function makeHero(cls, name, given) {
  const st = given ? {...given} : rollStats(cls);
  const g = STARTING_GEAR[cls];
  const h = {id: uid++, name, cls, level: 1, xp: 0, st, hp: 0, max: 0, equip: {melee: g[0] ? (g[0][0] === '*' ? newStarter(g[0].slice(1), name) : newItem(g[0])) : null, ranged: g[1] ? newItem(g[1]) : null, armour: null, shield: null},
    known: [...new Set(STARTING_SPELLS[cls] || [])], book: [...(STARTING_SPELLS[cls] || [])], used: [], status: {}, dead: false};
  h.max = 4 + st.CON; h.hp = h.max;
  fixBook(h);
  return h;
}
function fixBook(h) {
  const b = bookFor(h.cls, h.level), n = b[2];
  while (h.book.length < n) h.book.push(null);
  h.book.length = n;
  h.used = h.book.map((_, i) => h.used[i] || false);
}
const avgLevel = () => Math.round(S.party.reduce((a, h) => a + h.level, 0) / S.party.length);
const maxLevel = () => Math.max(...S.party.map(h => h.level));
const wearH = it => it ? Math.min(5, Math.floor(it.wear)) : 0;
// Below 45% durability (wear 2.75+), gear is weakened and wears 25% faster from every source.
const FAST_WEAR = 2.75;
const addWear = (it, amt) => { if (it) it.wear = Math.min(5, it.wear + amt * (it.wear >= FAST_WEAR ? 1.25 : 1)); };
function heroAC(h) {
  let ac = 10 + dexAC(h.st.DEX) + (h.status && h.status.RANGE ? 2 : 0);   // shooting from range: +2 AC until the hero's next turn
  for (const k of ['armour', 'shield']) { const it = h.equip[k]; if (it) { const a = ARMOUR[it.name]; ac += a.ac - a.wear[wearH(it)]; } }
  return ac;
}
const heroMove = h => (h.cls === 'Thief' ? 8 : 7) - (h.equip.armour ? ARMOUR[h.equip.armour.name].move : 0);
function weaponHit(h, it) { return dexHit(h.st.DEX) + (WPN[it.name].hit || 0) - WEAR_W[wearH(it)][0]; }
