/* ---------------- dice and rules ---------------- */
const R = (n) => Math.floor(Math.random() * n) + 1;
function roll(expr) {
  if (expr === undefined || expr === null) return 0;
  let e = String(expr).trim().replace(/^\+/, '');
  let m = e.match(/^(\d+)-(\d+)$/);
  if (m) return +m[1] + Math.floor(Math.random() * (+m[2] - +m[1] + 1));
  if (/^-?\d+$/.test(e)) return +e;
  m = e.match(/^(\d*)D(\d+)([+-]\d+)?$/i);
  if (!m) return 0;
  let n = +(m[1] || 1), t = 0;
  for (let i = 0; i < n; i++) t += R(+m[2]);
  return t + (+(m[3] || 0));
}
const STATS = ['STR', 'DEX', 'CON', 'WIS', 'INT', 'CHA'];
const strDmg = s => s < 8 ? 0 : s <= 12 ? 1 : s <= 14 ? 2 : s <= 17 ? 3 : s <= 19 ? 4 : s === 20 ? 5 : s <= 23 ? 6 : s === 24 ? 7 : 8;
const dexHit = s => s < 8 ? 0 : s <= 12 ? 1 : s <= 17 ? 2 : s <= 20 ? 3 : s <= 24 ? 4 : 5;
const dexAC = s => s < 13 ? 0 : s <= 15 ? 1 : s <= 19 ? 2 : s <= 23 ? 3 : 4;
const conHP = s => s < 8 ? 0 : s <= 12 ? 1 : s <= 15 ? 2 : s <= 17 ? roll('D6+2') : s <= 19 ? roll('2D6') : s === 20 ? roll('D12+1') : s <= 24 ? roll('D12+2') : roll('D12+3');
const wisHeal = s => s < 8 ? 0 : s <= 12 ? 1 : s <= 15 ? roll('D3+1') : s <= 17 ? roll('D3+3') : s <= 19 ? roll('D6+2') : s === 20 ? roll('D6+3') : s <= 24 ? roll('D6+4') : roll('D6+5');
const intDmg = s => s < 8 ? 0 : s <= 12 ? 1 : s <= 15 ? roll('D3+2') : s <= 17 ? roll('D3+4') : s <= 19 ? roll('D6+4') : s === 20 ? roll('D6+5') : s <= 24 ? roll('D6+6') : roll('D6+7');
const NO_MAGIC = ['Fighter', 'Dwarf'];
const HYBRID = ['Elf', 'Thief'];
const XP_MON = {1:10,2:20,3:35,4:55,5:80,6:115,7:160,8:220,9:300,10:400};
const XP_CUM = [0, 0, 50, 170, 430, 850, 1450, 2500, 4200, 6850, 11850];
const UNLOCK = {Basic:1, Light:2, Standard:3, Advanced:5, Superior:6, Legendary:8};
const RANGED = ['Sling', 'Bow'];
const ARMOUR = {
  'Leather Armour': {ac:2, move:0, price:25, from:1, who:['Fighter','Dwarf','Elf','Cleric','Thief'], wear:[0,0,0,0,1,1]},
  'Chain Mail': {ac:4, move:1, price:350, from:3, who:['Fighter','Dwarf','Elf','Cleric'], wear:[0,0,0,0,1,2]},
  'Plate Mail': {ac:6, move:2, price:1575, from:5, who:['Fighter','Dwarf'], wear:[0,0,0,0,1,2]},
  'Shield': {ac:1, move:0, price:26, from:1, who:['Fighter','Dwarf','Elf'], wear:[0,0,0,0,0,1], shield:true},
};
const WPN = Object.fromEntries(DATA.weapons.map(w => [w.name, w]));
const WEAR_W = [[0,0],[0,0],[0,0],[0,1],[1,1],[1,2]]; // [to hit, damage] penalties by hours
const SPELLS = {
  'Magic Missile': {list:'MU', lvl:1, price:250, kind:'dmg', dice:'D6+1', target:'foe', desc:'D6+1 magic damage to one enemy.'},
  'Fireball': {list:'MU', lvl:1, price:750, kind:'dmg', dice:'D8', target:'foe', splash:true, ail:['BURN',10], halfInt:true, desc:"D8 plus half the caster's INT bonus to the chosen enemy; every other enemy takes half that. 10% chance each to BURN."},
  'Sleep': {list:'MU', lvl:1, price:500, kind:'ctl', status:'SLEEP', base:[40,15], turns:2, target:'foe', desc:'Puts one enemy to sleep for 2 turns.'},
  'Advanced Magic Missile': {list:'MU', lvl:2, price:1000, kind:'dmg', dice:'D6+8', target:'foe', desc:'D6+8 magic damage to one enemy.'},
  'Lightning Bolt': {list:'MU', lvl:2, price:2500, kind:'dmg', dice:'D12+4', target:'all', ail:['SHOCK',10], sparks:true, desc:'D12+4 to every enemy, 10% to SHOCK, then 5 sparks.'},
  'Entangle': {list:'MU', lvl:2, price:2500, kind:'ctl', status:'ENTANGLED', base:[50,10], turns:3, target:'foe', desc:'Binds one enemy fast for 3 turns.'},
  'Undead Ward': {list:'CL', lvl:1, price:250, kind:'dmg', dice:'D6+2', target:'foe', undead:true, self:'D3', desc:'D6+2 to one undead; costs the caster D3 HP.'},
  'Cure Light Wounds': {list:'CL', lvl:1, price:500, kind:'heal', dice:'D6', target:'ally', desc:'Heals one ally for D6.'},
  'Protection against Evil': {list:'CL', lvl:1, price:500, kind:'ward', target:'ally', desc:'One ally takes 50% less damage for 2 turns.'},
  'Cure Ailment': {list:'CL', lvl:1, price:250, kind:'cure', target:'ally', desc:'Cures all ailments on one ally.'},
  'Undead Abyss': {list:'CL', lvl:2, price:1000, kind:'dmg', dice:'D12+3', target:'foe', undead:true, self:'D3+1', desc:'D12+3 to one undead; costs the caster D3+1 HP.'},
  'Cure Serious Wounds': {list:'CL', lvl:2, price:1250, kind:'heal', dice:'D12+6', target:'ally', desc:'Heals one ally for D12+6.'},
  'Cure All': {list:'CL', lvl:2, price:1500, kind:'heal', dice:'D6+2', target:'party', desc:'Heals every ally for D6+2.'},
};
const BOOKS = {
  'Magic User': [[1,1,2,0],[2,3,3,0],[4,4,4,0],[5,6,5,1],[7,9,6,2],[10,10,7,2]],
  'Cleric': [[1,1,2,0],[2,3,4,0],[4,4,4,0],[5,6,5,1],[7,8,6,2],[9,9,8,2],[10,10,10,4]],
  'Elf': [[3,4,1,0],[5,6,2,0],[7,8,3,0],[9,9,4,0],[10,10,6,1]],
  'Thief': [[6,7,1,0],[8,9,2,0],[10,10,3,0]],
};
const canLearn = (cls, sp) => NO_MAGIC.includes(cls) ? false : HYBRID.includes(cls) ? true : (cls === 'Magic User' ? SPELLS[sp].list === 'MU' : SPELLS[sp].list === 'CL');
const bookFor = (cls, L) => (BOOKS[cls] || []).find(b => L >= b[0] && L <= b[1]) || [0, 0, 0, 0];
// Starting purse: 5 GP per hero, plus a Charisma bonus of up to 5 GP each.
const CHA_GOLD = [0, 1, 2, 2, 3, 4, 5];
const chaGold = h => CHA_GOLD[Math.min(CHA_GOLD.length - 1, Math.max(0, h.st.CHA))];
const startGold = party => party.reduce((a, h) => a + 5 + chaGold(h), 0);
const CLASS_ICON = {Fighter:'Sword', Dwarf:'Axe', Elf:'Bow', 'Magic User':'Magic Missile', Cleric:'Cure Light Wounds', Thief:'Dagger'};
const STARTING_GEAR = {Fighter:['*Sword','Sling'], Dwarf:['*Axe','Sling'], Elf:['*Spear','Sling'], 'Magic User':['Staff',null], Cleric:['Staff','Sling'], Thief:['Dagger','Sling']};
const STARTING_SPELLS = {'Magic User':['Magic Missile','Magic Missile'], Cleric:['Undead Ward','Cure Light Wounds']};
const REGIONS = [
  {id:'road', name:'The Old Road', lvl:1, kind:'wild', blurb:'Rutted tracks where rats and goblins prey on travellers.'},
  {id:'wood', name:'Bramblewood', lvl:2, kind:'wild', blurb:'Thorned woods full of boar, bandits and restless bones.'},
  {id:'fen', name:'Blackwater Fen', lvl:3, kind:'wild', blurb:'A sucking marsh where spiders nest and cultists gather.'},
  {id:'barrow', name:'The Barrow Caves', lvl:4, kind:'cave', blurb:'Burial tunnels crawling with the hungry dead.'},
  {id:'hills', name:'Ogre Hills', lvl:5, kind:'wild', blurb:'Wind-scoured hills ruled by brutes and shadows.'},
  {id:'bridge', name:'Troll Bridge Gorge', lvl:6, kind:'wild', blurb:'A gorge of trolls, gnolls and draining wights.'},
  {id:'maze', name:'The Horned Labyrinth', lvl:7, kind:'cave', blurb:'Twisting halls stalked by bull-headed horrors.'},
  {id:'crags', name:'The Shattered Crags', lvl:8, kind:'wild', blurb:'Broken peaks guarded by stone and spike.'},
  {id:'ember', name:'Embervale', lvl:9, kind:'wild', blurb:'Ash fields beneath the halls of fire giants.'},
  {id:'spine', name:"The Dragon's Spine", lvl:10, kind:'cave', blurb:'Lairs of dragons, hags and worse.'},
];
const BOSSES = ['Orc War Chief', 'Lich', 'Beastman Warlord'];
