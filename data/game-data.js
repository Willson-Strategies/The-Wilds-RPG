/* Classes, monsters and weapons: the numbers from the rules Sheet. */
const DATA = {
 "classes": {
  "Fighter": {
   "caps": {
    "DEX": 20
   },
   "base": [
    "D3+1",
    "D3+1",
    "D6+1",
    "0",
    "0",
    "D3+1"
   ],
   "levelup": [
    "D3+1",
    "D3",
    "D3",
    "D6",
    "0",
    "0",
    "+1"
   ],
   "tiers": [
    "Basic",
    "Light",
    "Standard",
    "Advanced",
    "Superior",
    "Legendary"
   ]
  },
  "Dwarf": {
   "caps": {
    "STR": 20
   },
   "base": [
    "D3+1",
    "D3+1",
    "D6+2",
    "0",
    "0",
    "0"
   ],
   "levelup": [
    "D3+2",
    "D3",
    "D3",
    "D6+1",
    "0",
    "0",
    "0-1"
   ],
   "tiers": [
    "Basic",
    "Light",
    "Standard",
    "Advanced",
    "Superior"
   ]
  },
  "Elf": {
   "caps": {},
   "base": [
    "D3",
    "D3",
    "D6+1",
    "D6",
    "D6",
    "D3"
   ],
   "levelup": [
    "D3",
    "1-2",
    "1-2",
    "D6",
    "D3+1",
    "D3+1",
    "+1"
   ],
   "tiers": [
    "Basic",
    "Light",
    "Standard"
   ]
  },
  "Magic User": {
   "caps": {
    "STR": 18,
    "WIS": 20
   },
   "base": [
    "D3",
    "D3",
    "D6",
    "D3",
    "D12",
    "D3+1"
   ],
   "levelup": [
    "D4",
    "0-1",
    "0-2",
    "0-2",
    "D3",
    "D6+1",
    "+1"
   ],
   "tiers": [
    "Basic"
   ]
  },
  "Cleric": {
   "caps": {
    "STR": 20,
    "DEX": 20,
    "INT": 20
   },
   "base": [
    "D3+1",
    "D3+1",
    "D6+1",
    "D12",
    "D3",
    "D3+1"
   ],
   "levelup": [
    "D3",
    "1-2",
    "1-2",
    "D6",
    "D6+1",
    "D3",
    "D3"
   ],
   "tiers": [
    "Basic",
    "Light"
   ]
  },
  "Thief": {
   "caps": {},
   "base": [
    "D3+1",
    "D6+2",
    "D6",
    "D6",
    "D6",
    "D6+1"
   ],
   "levelup": [
    "D4",
    "0-2",
    "D3+1",
    "0-2",
    "D3",
    "D3",
    "D6+1"
   ],
   "tiers": [
    "Basic"
   ]
  }
 },
 "weapons": [
  {
   "name": "Staff",
   "tier": "Basic",
   "hit": 0,
   "dmg": "+D2",
   "price": 1,
   "note": ""
  },
  {
   "name": "Dagger",
   "tier": "Basic",
   "hit": 1,
   "dmg": "+D2",
   "price": 5,
   "note": ""
  },
  {
   "name": "Sling",
   "tier": "Basic",
   "hit": 0,
   "dmg": "+D2",
   "price": 3,
   "note": "Range 5"
  },
  {
   "name": "Spear",
   "tier": "Light",
   "hit": 2,
   "dmg": "+D2",
   "price": 10,
   "note": ""
  },
  {
   "name": "Mace",
   "tier": "Light",
   "hit": 1,
   "dmg": "+D3",
   "price": 10,
   "note": "+50% damage to undead"
  },
  {
   "name": "Axe",
   "tier": "Standard",
   "hit": 1,
   "dmg": "+D3",
   "price": 12,
   "note": ""
  },
  {
   "name": "Sword",
   "tier": "Standard",
   "hit": 2,
   "dmg": "+D3+1",
   "price": 20,
   "note": ""
  },
  {
   "name": "Hammer",
   "tier": "Standard",
   "hit": 1,
   "dmg": "+D6",
   "price": 20,
   "note": "+50% damage to undead"
  },
  {
   "name": "Bow",
   "tier": "Standard",
   "hit": 1,
   "dmg": "+D2",
   "price": 50,
   "note": "Range 8"
  },
  {
   "name": "Scimitar",
   "tier": "Advanced",
   "hit": 2,
   "dmg": "+D6+2",
   "price": 150,
   "note": ""
  },
  {
   "name": "Morning Star",
   "tier": "Advanced",
   "hit": 0,
   "dmg": "+D12+3",
   "price": 175,
   "note": "+50% damage to undead"
  },
  {
   "name": "Sabre",
   "tier": "Advanced",
   "hit": 3,
   "dmg": "+D6+3",
   "price": 300,
   "note": ""
  },
  {
   "name": "Arming Sword",
   "tier": "Advanced",
   "hit": 2,
   "dmg": "+D12+1",
   "price": 425,
   "note": ""
  },
  {
   "name": "Warhammer",
   "tier": "Superior",
   "hit": 3,
   "dmg": "+D20+2",
   "price": 680,
   "note": "+50% damage to undead"
  },
  {
   "name": "Broad Sword",
   "tier": "Superior",
   "hit": 3,
   "dmg": "+D12+6",
   "price": 750,
   "note": ""
  },
  {
   "name": "Ashfang",
   "tier": "Legendary",
   "hit": 4,
   "dmg": "D12+12",
   "price": 3500,
   "note": "15% chance to burn"
  },
  {
   "name": "Stormcleaver",
   "tier": "Legendary",
   "hit": 4,
   "dmg": "D20+8",
   "price": 3750,
   "note": "10% chance to shock"
  },
  {
   "name": "Oathbreaker",
   "tier": "Legendary",
   "hit": 4,
   "dmg": "D6+15",
   "price": 4500,
   "note": "20% chance to poison"
  }
 ],
 "monsters": [
  {
   "lvl": 1,
   "name": "Swarm of Rats",
   "type": "Beast",
   "hp": 9,
   "ac": 8,
   "hit": 1,
   "hitMissing": false,
   "dmg": "D4+1",
   "dmgAvg": 3.5,
   "attacks": 1,
   "special": "",
   "boss": false
  },
  {
   "lvl": 1,
   "name": "Winged Viper",
   "type": "Beast",
   "hp": 5,
   "ac": 7,
   "hit": 0,
   "hitMissing": false,
   "dmg": "D3",
   "dmgAvg": 2.0,
   "attacks": 1,
   "special": "",
   "boss": false
  },
  {
   "lvl": 1,
   "name": "Bone Collector",
   "type": "Undead",
   "hp": 6,
   "ac": 11,
   "hit": 3,
   "hitMissing": false,
   "dmg": "D3",
   "dmgAvg": 2.0,
   "attacks": 1,
   "special": "Undead.",
   "boss": false
  },
  {
   "lvl": 1,
   "name": "Poison Dart Lizard",
   "type": "Beast",
   "hp": 7,
   "ac": 9,
   "hit": 1,
   "hitMissing": false,
   "dmg": "D4",
   "dmgAvg": 2.5,
   "attacks": 1,
   "special": "Poison dart: 5% chance to POISON on a hit.",
   "boss": false
  },
  {
   "lvl": 1,
   "name": "Young Beastman",
   "type": "Beast",
   "hp": 7,
   "ac": 9,
   "hit": 2,
   "hitMissing": false,
   "dmg": "D4",
   "dmgAvg": 2.5,
   "attacks": 1,
   "special": "",
   "boss": false
  },
  {
   "lvl": 1,
   "name": "Beastman",
   "type": "Beast",
   "hp": 10,
   "ac": 10,
   "hit": 2,
   "hitMissing": false,
   "dmg": "D3+1",
   "dmgAvg": 3.0,
   "attacks": 1,
   "special": "",
   "boss": false
  },
  {
   "lvl": 2,
   "name": "Giant Boar",
   "type": "Beast",
   "hp": 16,
   "ac": 9,
   "hit": 2,
   "hitMissing": false,
   "dmg": "D4+3",
   "dmgAvg": 5.5,
   "attacks": 1,
   "special": "Charge: on its first turn its attack deals +D4.",
   "boss": false
  },
  {
   "lvl": 2,
   "name": "Bandit",
   "type": "Humanoid",
   "hp": 10,
   "ac": 12,
   "hit": 4,
   "hitMissing": false,
   "dmg": "D4+1",
   "dmgAvg": 3.5,
   "attacks": 1,
   "special": "",
   "boss": false
  },
  {
   "lvl": 2,
   "name": "Skeleton",
   "type": "Undead",
   "hp": 7,
   "ac": 9,
   "hit": 2,
   "hitMissing": false,
   "dmg": "D3+2",
   "dmgAvg": 4.0,
   "attacks": 1,
   "special": "Ranged bow attack. Undead, so Undead Ward and Undead Abyss work on it.",
   "boss": false
  },
  {
   "lvl": 3,
   "name": "Bugbear",
   "type": "Humanoid",
   "hp": 23,
   "ac": 9,
   "hit": 2,
   "hitMissing": false,
   "dmg": "2D6",
   "dmgAvg": 7.0,
   "attacks": 1,
   "special": "",
   "boss": false
  },
  {
   "lvl": 3,
   "name": "Giant Scorpion",
   "type": "Beast",
   "hp": 14,
   "ac": 12,
   "hit": 4,
   "hitMissing": false,
   "dmg": "D4+2",
   "dmgAvg": 4.5,
   "attacks": 1,
   "special": "Each attack has a chance to inflict poison (D3 per turn for 3 turns) on a hit.",
   "boss": false
  },
  {
   "lvl": 3,
   "name": "Cult Fanatic",
   "type": "Humanoid",
   "hp": 10,
   "ac": 9,
   "hit": 2,
   "hitMissing": false,
   "dmg": "D4+3",
   "dmgAvg": 5.5,
   "attacks": 1,
   "special": "Heals one ally for D6 instead of attacking (twice per fight).",
   "boss": false
  },
  {
   "lvl": 4,
   "name": "Zombie",
   "type": "Undead",
   "hp": 29,
   "ac": 9,
   "hit": 3,
   "hitMissing": false,
   "dmg": "2D6+2",
   "dmgAvg": 9.0,
   "attacks": 1,
   "special": "Slow: acts every other round when not next to a character. Undead.",
   "boss": false
  },
  {
   "lvl": 4,
   "name": "Dire Wolf",
   "type": "Beast",
   "hp": 18,
   "ac": 13,
   "hit": 5,
   "hitMissing": false,
   "dmg": "D4+3",
   "dmgAvg": 5.5,
   "attacks": 1,
   "special": "Pack tactics: +1 to hit for each other wolf next to the target.",
   "boss": false
  },
  {
   "lvl": 4,
   "name": "Ghoul",
   "type": "Undead",
   "hp": 14,
   "ac": 10,
   "hit": 3,
   "hitMissing": false,
   "dmg": "D4+4",
   "dmgAvg": 6.5,
   "attacks": 1,
   "special": "Paralysing claw: 20% chance to shock, Undead.",
   "boss": false
  },
  {
   "lvl": 5,
   "name": "Ogre",
   "type": "Giant",
   "hp": 36,
   "ac": 9,
   "hit": 3,
   "hitMissing": false,
   "dmg": "2D6+4",
   "dmgAvg": 11.0,
   "attacks": 1,
   "special": "Sweep: its attack hits two adjacent characters.",
   "boss": false
  },
  {
   "lvl": 5,
   "name": "Shadow",
   "type": "Undead",
   "hp": 22,
   "ac": 13,
   "hit": 5,
   "hitMissing": false,
   "dmg": "2D6",
   "dmgAvg": 7.0,
   "attacks": 1,
   "special": "Strength drain: each hit lowers the target's STR by 1 until the party rests. Undead.",
   "boss": false
  },
  {
   "lvl": 5,
   "name": "Hell Hound",
   "type": "Fiend",
   "hp": 17,
   "ac": 10,
   "hit": 3,
   "hitMissing": false,
   "dmg": "2D6+1",
   "dmgAvg": 8.0,
   "attacks": 1,
   "special": "Fire breath: 5x5 area, its damage to each character (once per fight). Immune to fire.",
   "boss": false
  },
  {
   "lvl": 5,
   "name": "Orc War Chief",
   "type": "Humanoid",
   "hp": 83,
   "ac": 13,
   "hit": 4,
   "hitMissing": false,
   "dmg": "D6+6",
   "dmgAvg": 9.5,
   "attacks": 2,
   "special": "Two attacks per turn.",
   "boss": false
  },
  {
   "lvl": 6,
   "name": "Troll",
   "type": "Giant",
   "hp": 43,
   "ac": 10,
   "hit": 4,
   "hitMissing": false,
   "dmg": "2D6+6",
   "dmgAvg": 13.0,
   "attacks": 1,
   "special": "Regenerates 3 HP each turn.",
   "boss": false
  },
  {
   "lvl": 6,
   "name": "Gnoll",
   "type": "Humanoid",
   "hp": 26,
   "ac": 14,
   "hit": 6,
   "hitMissing": false,
   "dmg": "2D6+1",
   "dmgAvg": 8.0,
   "attacks": 2,
   "special": "Rampage: attacks twice per turn.",
   "boss": false
  },
  {
   "lvl": 6,
   "name": "Wight",
   "type": "Undead",
   "hp": 20,
   "ac": 11,
   "hit": 4,
   "hitMissing": false,
   "dmg": "D6+6",
   "dmgAvg": 9.5,
   "attacks": 1,
   "special": "Life drain: heals itself for half the damage it deals. Undead.",
   "boss": false
  },
  {
   "lvl": 7,
   "name": "Minotaur",
   "type": "Monstrosity",
   "hp": 50,
   "ac": 10,
   "hit": 4,
   "hitMissing": false,
   "dmg": "D10+9",
   "dmgAvg": 14.5,
   "attacks": 1,
   "special": "Gore: 30% chance to shock",
   "boss": false
  },
  {
   "lvl": 7,
   "name": "Wyvern",
   "type": "Dragon",
   "hp": 31,
   "ac": 14,
   "hit": 6,
   "hitMissing": false,
   "dmg": "D6+6",
   "dmgAvg": 9.5,
   "attacks": 1,
   "special": "Tail sting: Poison (D3+1 per turn for 3 turns) on a hit.",
   "boss": false
  },
  {
   "lvl": 7,
   "name": "Drow",
   "type": "Humanoid",
   "hp": 23,
   "ac": 11,
   "hit": 4,
   "hitMissing": false,
   "dmg": "2D6+4",
   "dmgAvg": 11.0,
   "attacks": 1,
   "special": "Casts Lightning Bolt once per fight; otherwise ranged magic attacks.",
   "boss": false
  },
  {
   "lvl": 8,
   "name": "Stone Golem",
   "type": "Construct",
   "hp": 56,
   "ac": 15,
   "hit": 5,
   "hitMissing": false,
   "dmg": "D10+11",
   "dmgAvg": 16.5,
   "attacks": 1,
   "special": "Immune to sleep tangle, shock and poison",
   "boss": false
  },
  {
   "lvl": 8,
   "name": "Manticore",
   "type": "Monstrosity",
   "hp": 35,
   "ac": 14,
   "hit": 7,
   "hitMissing": false,
   "dmg": "D6+7",
   "dmgAvg": 10.5,
   "attacks": 1,
   "special": "Tail spikes: ranged attack against two different targets.",
   "boss": false
  },
  {
   "lvl": 8,
   "name": "Banshee",
   "type": "Undead",
   "hp": 26,
   "ac": 12,
   "hit": 5,
   "hitMissing": false,
   "dmg": "D8+8",
   "dmgAvg": 12.5,
   "attacks": 1,
   "special": "Wail: 5x5 area, 30% chance each character falls asleep for 1 turn. Undead.",
   "boss": false
  },
  {
   "lvl": 9,
   "name": "Fire Giant",
   "type": "Giant",
   "hp": 63,
   "ac": 11,
   "hit": 5,
   "hitMissing": false,
   "dmg": "D12+12",
   "dmgAvg": 18.5,
   "attacks": 1,
   "special": "Burning blade: hits cause Burn, Immune to fire.",
   "boss": false
  },
  {
   "lvl": 9,
   "name": "Vampire Spawn",
   "type": "Undead",
   "hp": 39,
   "ac": 14,
   "hit": 7,
   "hitMissing": false,
   "dmg": "D8+7",
   "dmgAvg": 11.5,
   "attacks": 1,
   "special": "Life drain like the Wight, and evades 15% of non-magical hits. Undead.",
   "boss": false
  },
  {
   "lvl": 9,
   "name": "Medusa",
   "type": "Monstrosity",
   "hp": 29,
   "ac": 12,
   "hit": 5,
   "hitMissing": false,
   "dmg": "D8+9",
   "dmgAvg": 13.5,
   "attacks": 1,
   "special": "Petrifying gaze: 5x5 area, 25% chance each character is shocked",
   "boss": false
  },
  {
   "lvl": 10,
   "name": "Young Red Dragon",
   "type": "Dragon",
   "hp": 70,
   "ac": 12,
   "hit": 6,
   "hitMissing": false,
   "dmg": "D20+10",
   "dmgAvg": 20.5,
   "attacks": 1,
   "special": "Fire breath once per fight: 5x5 area, fire damage reduced by 50%",
   "boss": false
  },
  {
   "lvl": 10,
   "name": "Vampire",
   "type": "Undead",
   "hp": 43,
   "ac": 19,
   "hit": 8,
   "hitMissing": false,
   "dmg": "2D6+6",
   "dmgAvg": 13.0,
   "attacks": 2,
   "special": "Attacks twice per turn, life drain. Undead.",
   "boss": false
  },
  {
   "lvl": 10,
   "name": "Night Hag",
   "type": "Fiend",
   "hp": 32,
   "ac": 13,
   "hit": 6,
   "hitMissing": false,
   "dmg": "2D6+8",
   "dmgAvg": 15.0,
   "attacks": 1,
   "special": "Nightmare: 5x5 area, its damage to each character plus 25% chance of Sleep.",
   "boss": false
  },
  {
   "lvl": 10,
   "name": "Lich",
   "type": "Undead",
   "hp": 161,
   "ac": 15,
   "hit": 7,
   "hitMissing": false,
   "dmg": "2D6+11",
   "dmgAvg": 18.0,
   "attacks": 2,
   "special": "Casts Lightning Bolt and Entangle each fight, Immune to Sleep and Entangle. Undead.",
   "boss": false
  },
  {
   "lvl": 4,
   "name": "Beastman Warlord",
   "type": "Beast",
   "hp": 110,
   "ac": 13,
   "hit": 5,
   "hitMissing": false,
   "dmg": "D8+3",
   "dmgAvg": 7.5,
   "attacks": 1,
   "special": "Swing: before each attack roll a D8; on 7-8 he swings instead, dealing D3 to every character (flat 55% chance to hit each, regardless of AC). Fury: +1 damage below half HP. Immune to Sleep and Entangle.",
   "boss": true
  },
  {
   "lvl": 4,
   "name": "Goblin",
   "type": "Humanoid",
   "hp": 14,
   "ac": 11,
   "hit": 4,
   "hitMissing": false,
   "dmg": "D6+2",
   "dmgAvg": 5.5,
   "attacks": 1,
   "special": "Prologue only: scales the castle walls in the opening battle.",
   "boss": false
  },
  {
   "lvl": 4,
   "name": "Orc",
   "type": "Humanoid",
   "hp": 34,
   "ac": 12,
   "hit": 5,
   "hitMissing": false,
   "dmg": "D8+3",
   "dmgAvg": 7.5,
   "attacks": 1,
   "special": "Prologue only: the hulking orc at the castle gate in the opening battle.",
   "boss": false
  },
  {
   "lvl": 5,
   "name": "Giant Orc",
   "type": "Giant",
   "hp": 40,
   "ac": 12,
   "hit": 5,
   "hitMissing": false,
   "dmg": "2D6+2",
   "dmgAvg": 9.0,
   "attacks": 1,
   "special": "Sweep: its attack hits two adjacent characters. Prologue only: the courtyard battle.",
   "boss": false
  }
 ],
 "drops": {
  "1-2": {
   "Staff": 15,
   "Dagger": 13,
   "Sling": 17,
   "Spear": 23,
   "Mace": 22,
   "Axe": 3,
   "Sword": 3,
   "Hammer": 2,
   "Bow": 2,
   "Scimitar": 0,
   "Morning Star": 0,
   "Sabre": 0,
   "Arming Sword": 0,
   "Warhammer": 0,
   "Broad Sword": 0,
   "Ashfang": 0,
   "Stormcleaver": 0,
   "Oathbreaker": 0
  },
  "3-4": {
   "Staff": 7,
   "Dagger": 6,
   "Sling": 7,
   "Spear": 20,
   "Mace": 19,
   "Axe": 10,
   "Sword": 8,
   "Hammer": 8,
   "Bow": 5,
   "Scimitar": 3,
   "Morning Star": 3,
   "Sabre": 2,
   "Arming Sword": 2,
   "Warhammer": 0,
   "Broad Sword": 0,
   "Ashfang": 0,
   "Stormcleaver": 0,
   "Oathbreaker": 0
  },
  "5-6": {
   "Staff": 5,
   "Dagger": 2,
   "Sling": 3,
   "Spear": 7,
   "Mace": 7,
   "Axe": 11,
   "Sword": 9,
   "Hammer": 9,
   "Bow": 6,
   "Scimitar": 9,
   "Morning Star": 9,
   "Sabre": 7,
   "Arming Sword": 6,
   "Warhammer": 5,
   "Broad Sword": 5,
   "Ashfang": 0,
   "Stormcleaver": 0,
   "Oathbreaker": 0
  },
  "7-9": {
   "Staff": 0,
   "Dagger": 0,
   "Sling": 0,
   "Spear": 3,
   "Mace": 2,
   "Axe": 8,
   "Sword": 6,
   "Hammer": 6,
   "Bow": 4,
   "Scimitar": 11,
   "Morning Star": 10,
   "Sabre": 8,
   "Arming Sword": 6,
   "Warhammer": 15,
   "Broad Sword": 15,
   "Ashfang": 2,
   "Stormcleaver": 2,
   "Oathbreaker": 2
  },
  "10": {
   "Staff": 0,
   "Dagger": 0,
   "Sling": 0,
   "Spear": 0,
   "Mace": 0,
   "Axe": 5,
   "Sword": 4,
   "Hammer": 4,
   "Bow": 2,
   "Scimitar": 9,
   "Morning Star": 9,
   "Sabre": 7,
   "Arming Sword": 6,
   "Warhammer": 20,
   "Broad Sword": 19,
   "Ashfang": 5,
   "Stormcleaver": 5,
   "Oathbreaker": 5
  }
 },
 "loot": [
  [
   1,
   2,
   1,
   5,
   8,
   1,
   12
  ],
  [
   3,
   4,
   1,
   4,
   8,
   1,
   42
  ],
  [
   5,
   6,
   1,
   2,
   7,
   15,
   76
  ],
  [
   7,
   9,
   2,
   2,
   7,
   35,
   168
  ],
  [
   10,
   10,
   2,
   1,
   6,
   80,
   245
  ]
 ],
 "tierClasses": {
  "Basic": [
   "Fighter",
   "Dwarf",
   "Elf",
   "Magic User",
   "Cleric",
   "Thief"
  ],
  "Light": [
   "Fighter",
   "Dwarf",
   "Elf",
   "Cleric"
  ],
  "Standard": [
   "Fighter",
   "Dwarf",
   "Elf"
  ],
  "Advanced": [
   "Fighter",
   "Dwarf"
  ],
  "Superior": [
   "Fighter",
   "Dwarf"
  ],
  "Legendary": [
   "Fighter"
  ]
 }
};
