export type CardType = 'minion' | 'spell' | 'weapon';
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
export type EffectKey =
  | 'surge'
  | 'bulwark'
  | 'venombrand'
  | 'lifebond'
  | 'execution_mark'
  | 'nullbind'
  | 'blade_dance'
  | 'spell_cast_atk'      // Arkanfunke Lehrling
  | 'play_deal_1'         // Flammenwirkerin Lira
  | 'draw_1'              // Weisheitskonstrukt
  | 'nullbind_enemy'      // Frostkanalisierer
  | 'death_1_dmg_all'     // Funkenphönix
  | 'give_venombrand'     // Runenmeister Eldrath
  | 'sternenruferin'      // 2 dmg draw if kill
  | 'draw2_discard1'      // Aetherladung
  | 'deal_1_any'          // Funkenstoß
  | 'deal_2_any'          // Elementarer Riss
  | 'nullbind_1dmg'       // Sternenfrost
  | 'flammenflut'         // 1 dmg all enemies
  | 'give_surge'          // Energieschwall / Wilder Ansturm
  | 'arkaner_schwur'      // 3 dmg heal 1
  | 'remove_bulwark'      // Bannkreis / Schildbrecherin
  | 'deal_5_any'          // Kometenbruch
  | 'weapon_extra_1_random' // Funkenstab
  | 'weapon_execution_mark' // Runenklinge
  | 'weapon_lifebond'     // Prismafokus
  | 'berserker_hurt'      // +1 ATK when hurt
  | 'kriegshorn'          // +1 ATK team turn
  | 'summon_wolf'         // Eisenwolf Bestienmeister
  | 'eisenmut'            // +2 HP target
  | 'blutgebrüll'         // 3 dmg hero takes 1
  | 'weapon_ally_atk'     // Wolfsherz Klinge
  | 'deal_2_any_b'        // Sturmhieb
  | 'sturmhieb';          // alias

export interface CardDef {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  rarity: Rarity;
  atk?: number;
  hp?: number;
  durability?: number; // for weapons
  effects: EffectKey[];
  flavor: string;
  description: string;
  deck: 'A' | 'B';
}

export const CARD_DEFS: CardDef[] = [
  // ===== DECK A: Aetherflare Dominion =====
  {
    id: 'arkanfunke_lehrling',
    name: 'Arkanfunke Lehrling',
    cost: 1, type: 'minion', rarity: 'Common', atk: 1, hp: 2, deck: 'A',
    effects: ['spell_cast_atk'],
    flavor: 'Ein junger Magier, dessen Funken ständig die Luft erfüllen.',
    description: 'Spell Cast: +1 ATK this turn',
  },
  {
    id: 'flammenwirkerin_lira',
    name: 'Flammenwirkerin Lira',
    cost: 2, type: 'minion', rarity: 'Common', atk: 2, hp: 2, deck: 'A',
    effects: ['play_deal_1'],
    flavor: 'Ihre Finger brennen ständig.',
    description: 'Battlecry: Deal 1 damage to any target',
  },
  {
    id: 'aetherflimmer_sprite',
    name: 'Aetherflimmer Sprite',
    cost: 1, type: 'minion', rarity: 'Common', atk: 1, hp: 1, deck: 'A',
    effects: ['surge'],
    flavor: 'Ein kleiner Wirbel aus Energie.',
    description: 'Surge',
  },
  {
    id: 'weisheitskonstrukt',
    name: 'Weisheitskonstrukt',
    cost: 3, type: 'minion', rarity: 'Rare', atk: 2, hp: 4, deck: 'A',
    effects: ['draw_1'],
    flavor: 'Konstrukt sammelt Wissen.',
    description: 'Battlecry: Draw 1 card',
  },
  {
    id: 'frostkanalisierer',
    name: 'Frostkanalisierer',
    cost: 3, type: 'minion', rarity: 'Rare', atk: 3, hp: 2, deck: 'A',
    effects: ['nullbind_enemy'],
    flavor: 'Sein Atem friert Zeit.',
    description: 'Battlecry: Nullbind an enemy minion',
  },
  {
    id: 'kristallomant',
    name: 'Kristallomant',
    cost: 4, type: 'minion', rarity: 'Rare', atk: 2, hp: 5, deck: 'A',
    effects: ['lifebond'],
    flavor: 'Kristalle pulsieren.',
    description: 'Lifebond',
  },
  {
    id: 'funkenphönix',
    name: 'Funkenphönix',
    cost: 4, type: 'minion', rarity: 'Epic', atk: 3, hp: 3, deck: 'A',
    effects: ['death_1_dmg_all'],
    flavor: 'Aus Funken geboren.',
    description: 'Death: Deal 1 damage to all enemies',
  },
  {
    id: 'runenmeister_eldrath',
    name: 'Runenmeister Eldrath',
    cost: 5, type: 'minion', rarity: 'Epic', atk: 4, hp: 4, deck: 'A',
    effects: ['give_venombrand'],
    flavor: 'Runen sind seine Waffen.',
    description: 'Battlecry: Give a friendly minion Venombrand',
  },
  {
    id: 'aethergolem',
    name: 'Aethergolem',
    cost: 6, type: 'minion', rarity: 'Epic', atk: 5, hp: 6, deck: 'A',
    effects: ['bulwark'],
    flavor: 'Wandelnde Energie.',
    description: 'Bulwark',
  },
  {
    id: 'sternenruferin_mira',
    name: 'Sternenruferin Mira',
    cost: 5, type: 'minion', rarity: 'Legendary', atk: 2, hp: 5, deck: 'A',
    effects: ['sternenruferin'],
    flavor: 'Sterne antworten.',
    description: 'Attack: Deal 2 damage; draw a card if target dies',
  },
  {
    id: 'prismischer_bewahrer',
    name: 'Prismischer Bewahrer',
    cost: 3, type: 'minion', rarity: 'Rare', atk: 1, hp: 6, deck: 'A',
    effects: ['bulwark'],
    flavor: 'Schild aus Licht.',
    description: 'Bulwark',
  },
  {
    id: 'magus_der_stuerme',
    name: 'Magus der Stürme',
    cost: 6, type: 'minion', rarity: 'Legendary', atk: 4, hp: 5, deck: 'A',
    effects: ['blade_dance'],
    flavor: 'Klingen im Sturm.',
    description: 'Blade Dance',
  },
  // Deck A Spells
  {
    id: 'aetherladung',
    name: 'Aetherladung',
    cost: 1, type: 'spell', rarity: 'Common', deck: 'A',
    effects: ['draw2_discard1'],
    flavor: 'Energie ist flüchtig.',
    description: 'Draw 2 cards, discard 1',
  },
  {
    id: 'funkenstoss',
    name: 'Funkenstoß',
    cost: 1, type: 'spell', rarity: 'Common', deck: 'A',
    effects: ['deal_1_any'],
    flavor: 'Funke entfacht Feuer.',
    description: 'Deal 1 damage to any target',
  },
  {
    id: 'elementarer_riss',
    name: 'Elementarer Riss',
    cost: 2, type: 'spell', rarity: 'Common', deck: 'A',
    effects: ['deal_2_any'],
    flavor: 'Spalt zur Feuerebene.',
    description: 'Deal 2 damage to any target',
  },
  {
    id: 'sternenfrost',
    name: 'Sternenfrost',
    cost: 2, type: 'spell', rarity: 'Rare', deck: 'A',
    effects: ['nullbind_1dmg'],
    flavor: 'Kälte stoppt Magie.',
    description: 'Nullbind an enemy + deal 1 damage to it',
  },
  {
    id: 'flammenflut',
    name: 'Flammenflut',
    cost: 3, type: 'spell', rarity: 'Rare', deck: 'A',
    effects: ['flammenflut'],
    flavor: 'Funkenregen.',
    description: 'Deal 1 damage to all enemy minions',
  },
  {
    id: 'energieschwall',
    name: 'Energieschwall',
    cost: 3, type: 'spell', rarity: 'Rare', deck: 'A',
    effects: ['give_surge'],
    flavor: 'Energie fließt schnell.',
    description: 'Give a friendly minion Surge',
  },
  {
    id: 'arkaner_schwur',
    name: 'Arkaner Schwur',
    cost: 4, type: 'spell', rarity: 'Epic', deck: 'A',
    effects: ['arkaner_schwur'],
    flavor: 'Eid aus Licht.',
    description: 'Deal 3 damage to any target; heal your hero for 1',
  },
  {
    id: 'bannkreis',
    name: 'Bannkreis',
    cost: 2, type: 'spell', rarity: 'Common', deck: 'A',
    effects: ['remove_bulwark'],
    flavor: 'Linie im Sand.',
    description: 'Remove Bulwark from an enemy minion',
  },
  {
    id: 'kometenbruch',
    name: 'Kometenbruch',
    cost: 5, type: 'spell', rarity: 'Legendary', deck: 'A',
    effects: ['deal_5_any'],
    flavor: 'Ein Stern fällt.',
    description: 'Deal 5 damage to any target',
  },
  // Deck A Weapons
  {
    id: 'funkenstab',
    name: 'Funkenstab',
    cost: 2, type: 'weapon', rarity: 'Rare', atk: 1, durability: 2, deck: 'A',
    effects: ['weapon_extra_1_random'],
    flavor: 'Stab voller Funken.',
    description: 'Extra: Deal 1 damage to a random enemy',
  },
  {
    id: 'runenklinge',
    name: 'Runenklinge',
    cost: 3, type: 'weapon', rarity: 'Epic', atk: 2, durability: 2, deck: 'A',
    effects: ['weapon_execution_mark'],
    flavor: 'Runen schneiden tief.',
    description: 'Execution Mark',
  },
  {
    id: 'prismafokus',
    name: 'Prismafokus',
    cost: 4, type: 'weapon', rarity: 'Legendary', atk: 1, durability: 3, deck: 'A',
    effects: ['weapon_lifebond'],
    flavor: 'Bündelt Licht.',
    description: 'Hero Lifebond',
  },
  {
    id: 'sturmschneider',
    name: 'Sturmschneider',
    cost: 5, type: 'weapon', rarity: 'Mythic', atk: 3, durability: 2, deck: 'A',
    effects: ['surge'],
    flavor: 'Klinge voller Blitz.',
    description: 'Surge',
  },

  // ===== DECK B: Ironfang Vanguard =====
  {
    id: 'stahlfaust_rekrut',
    name: 'Stahlfaust Rekrut',
    cost: 1, type: 'minion', rarity: 'Common', atk: 2, hp: 1, deck: 'B',
    effects: [],
    flavor: 'Motivierter Rekrut.',
    description: '',
  },
  {
    id: 'wolfshoehlenwelpe',
    name: 'Wolfshöhlenwelpe',
    cost: 1, type: 'minion', rarity: 'Common', atk: 1, hp: 2, deck: 'B',
    effects: ['surge'],
    flavor: 'Gefährlich neugierig.',
    description: 'Surge',
  },
  {
    id: 'eisensturm_grunzer',
    name: 'Eisensturm Grunzer',
    cost: 2, type: 'minion', rarity: 'Common', atk: 2, hp: 3, deck: 'B',
    effects: [],
    flavor: 'Laut und stolz.',
    description: '',
  },
  {
    id: 'klingenhauer',
    name: 'Klingenhauer',
    cost: 2, type: 'minion', rarity: 'Common', atk: 1, hp: 2, deck: 'B',
    effects: ['blade_dance'],
    flavor: 'Schneidet alles.',
    description: 'Blade Dance',
  },
  {
    id: 'blutrachen_wolf',
    name: 'Blutrachen Wolf',
    cost: 3, type: 'minion', rarity: 'Rare', atk: 3, hp: 2, deck: 'B',
    effects: ['execution_mark'],
    flavor: 'Spürt Schwäche.',
    description: 'Execution Mark',
  },
  {
    id: 'schildbrecherin',
    name: 'Schildbrecherin',
    cost: 3, type: 'minion', rarity: 'Rare', atk: 3, hp: 3, deck: 'B',
    effects: ['remove_bulwark'],
    flavor: 'Zerstört Mauern.',
    description: 'Battlecry: Remove Bulwark from an enemy minion',
  },
  {
    id: 'eisenwacht_spaeer',
    name: 'Eisenwacht Späher',
    cost: 2, type: 'minion', rarity: 'Common', atk: 1, hp: 4, deck: 'B',
    effects: ['bulwark'],
    flavor: 'Schild aus Stahl.',
    description: 'Bulwark',
  },
  {
    id: 'frostfell_waschbaer',
    name: 'Frostfell Waschbär',
    cost: 2, type: 'minion', rarity: 'Rare', atk: 1, hp: 1, deck: 'B',
    effects: ['venombrand'],
    flavor: 'Süß aber tödlich.',
    description: 'Venombrand',
  },
  {
    id: 'berserker_nordmark',
    name: 'Berserker der Nordmark',
    cost: 4, type: 'minion', rarity: 'Rare', atk: 4, hp: 3, deck: 'B',
    effects: ['berserker_hurt'],
    flavor: 'Schmerz nährt Wut.',
    description: 'When this takes damage: +1 ATK',
  },
  {
    id: 'kriegshorn_rufer',
    name: 'Kriegshorn Rufer',
    cost: 4, type: 'minion', rarity: 'Epic', atk: 3, hp: 4, deck: 'B',
    effects: ['kriegshorn'],
    flavor: 'Horn des Krieges.',
    description: 'Your turn: All friendly minions get +1 ATK',
  },
  {
    id: 'eisenwolf_bestienmeister',
    name: 'Eisenwolf Bestienmeister',
    cost: 5, type: 'minion', rarity: 'Epic', atk: 4, hp: 4, deck: 'B',
    effects: ['summon_wolf'],
    flavor: 'Rudel folgt.',
    description: 'Battlecry: Summon a 2/2 Wolf',
  },
  {
    id: 'felsbrecher_oger',
    name: 'Felsbrecher Oger',
    cost: 5, type: 'minion', rarity: 'Rare', atk: 5, hp: 5, deck: 'B',
    effects: [],
    flavor: 'Schlägt hart zu.',
    description: '',
  },
  {
    id: 'eisenklauen_stampfer',
    name: 'Eisenklauen Stampfer',
    cost: 4, type: 'minion', rarity: 'Rare', atk: 3, hp: 6, deck: 'B',
    effects: ['bulwark'],
    flavor: 'Panzer auf Beinen.',
    description: 'Bulwark',
  },
  {
    id: 'runenblut_krieger',
    name: 'Runenblut Krieger',
    cost: 6, type: 'minion', rarity: 'Legendary', atk: 5, hp: 4, deck: 'B',
    effects: ['lifebond'],
    flavor: 'Magisches Blut.',
    description: 'Lifebond',
  },
  {
    id: 'titanenschlund_baer',
    name: 'Titanenschlund Bär',
    cost: 7, type: 'minion', rarity: 'Legendary', atk: 6, hp: 6, deck: 'B',
    effects: ['surge'],
    flavor: 'Berg aus Fell.',
    description: 'Surge',
  },
  // Deck B Spells
  {
    id: 'wilder_ansturm',
    name: 'Wilder Ansturm',
    cost: 2, type: 'spell', rarity: 'Common', deck: 'B',
    effects: ['give_surge'],
    flavor: 'Knurren vor Angriff.',
    description: 'Give a friendly minion Surge',
  },
  {
    id: 'sturmhieb',
    name: 'Sturmhieb',
    cost: 3, type: 'spell', rarity: 'Common', deck: 'B',
    effects: ['deal_2_any'],
    flavor: 'Rohe Kraft.',
    description: 'Deal 2 damage to any target',
  },
  {
    id: 'eisenmut',
    name: 'Eisenmut',
    cost: 2, type: 'spell', rarity: 'Rare', deck: 'B',
    effects: ['eisenmut'],
    flavor: 'Wille aus Stahl.',
    description: 'Give a friendly minion +2 HP',
  },
  {
    id: 'blutgebrüll',
    name: 'Blutgebrüll',
    cost: 4, type: 'spell', rarity: 'Rare', deck: 'B',
    effects: ['blutgebrüll'],
    flavor: 'Zorn fordert Preis.',
    description: 'Deal 3 damage to enemy hero; your hero takes 1 damage',
  },
  {
    id: 'runengrab_sigill',
    name: 'Runengrab Sigill',
    cost: 3, type: 'spell', rarity: 'Epic', deck: 'B',
    effects: ['nullbind_enemy'],
    flavor: 'Siegel der Stille.',
    description: 'Nullbind an enemy minion',
  },
  // Deck B Weapons
  {
    id: 'eisenbeisser',
    name: 'Eisenbeißer',
    cost: 1, type: 'weapon', rarity: 'Common', atk: 1, durability: 2, deck: 'B',
    effects: [],
    flavor: 'Roh geschmiedet.',
    description: '',
  },
  {
    id: 'kriegsspeer',
    name: 'Kriegsspeer der Hochebenen',
    cost: 2, type: 'weapon', rarity: 'Rare', atk: 2, durability: 1, deck: 'B',
    effects: ['surge'],
    flavor: 'Schnell wie Wind.',
    description: 'Surge',
  },
  {
    id: 'klingenbaron_axt',
    name: 'Klingenbaron Axt',
    cost: 3, type: 'weapon', rarity: 'Rare', atk: 3, durability: 2, deck: 'B',
    effects: [],
    flavor: 'Zerstört mit Stil.',
    description: '',
  },
  {
    id: 'wolfsherz_klinge',
    name: 'Wolfsherz Klinge',
    cost: 4, type: 'weapon', rarity: 'Epic', atk: 2, durability: 3, deck: 'B',
    effects: ['weapon_ally_atk'],
    flavor: 'Herz eines Wolfs.',
    description: 'On attack: +1 ATK to all friendly minions this turn',
  },
  {
    id: 'sturmbrecher_hammer',
    name: 'Sturmbrecher Hammer',
    cost: 5, type: 'weapon', rarity: 'Mythic', atk: 4, durability: 2, deck: 'B',
    effects: ['weapon_execution_mark'],
    flavor: 'Hammer des Donners.',
    description: 'Execution Mark',
  },
];

export const DECK_A_IDS = CARD_DEFS.filter(c => c.deck === 'A').map(c => c.id);
export const DECK_B_IDS = CARD_DEFS.filter(c => c.deck === 'B').map(c => c.id);

export function getCard(id: string): CardDef {
  const card = CARD_DEFS.find(c => c.id === id);
  if (!card) throw new Error(`Card not found: ${id}`);
  return card;
}
