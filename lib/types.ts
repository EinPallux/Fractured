import type { CardDef } from './cards';

export type PlayerId = 'player' | 'ai';

export interface MinionState {
  instanceId: string;
  cardId: string;
  atk: number;
  hp: number;
  maxHp: number;
  hasSurge: boolean;
  hasBulwark: boolean;
  hasVenombrand: boolean;
  hasLifebond: boolean;
  hasExecutionMark: boolean;
  hasNullbind: boolean;
  hasBladeDance: boolean;
  hasAttackedThisTurn: boolean;
  justPlayed: boolean;
  venomBranded: boolean;
  tempAtkBonus: number;
  owner: PlayerId;
}

export interface WeaponState {
  cardId: string;
  atk: number;
  durability: number;
  hasExecutionMark: boolean;
  hasSurge: boolean;
  hasLifebond: boolean;
  hasAllyAtk: boolean;
  hasAttackedThisTurn: boolean;
  justEquipped: boolean;
}

export interface HeroState {
  hp: number;
  maxHp: number;
  weapon: WeaponState | null;
  heroAbilityUsedThisTurn: boolean;
}

export type GamePhase =
  | 'start'
  | 'player_turn'
  | 'ai_turn'
  | 'game_over';

export type SelectionType =
  | 'spell_target_any'
  | 'spell_target_enemy'
  | 'spell_target_friendly'
  | 'play_deal_1'
  | 'nullbind_enemy'
  | 'nullbind_1dmg'
  | 'give_venombrand'
  | 'give_surge'
  | 'remove_bulwark'
  | 'eisenmut'
  | 'draw2_discard1'
  | 'aetherladung_discard'
  | 'arkaner_schwur';

export interface SelectionPending {
  type: SelectionType;
  sourceCardId?: string;
  sourceInstanceId?: string;
  extraData?: Record<string, unknown>;
}

export interface GameLog {
  id: string;
  message: string;
  type: 'action' | 'system' | 'damage' | 'death' | 'effect';
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  activePlayer: PlayerId;
  round: number;
  turnNumber: number;
  mulliganSelectedIndices: number[];
  playerHero: HeroState;
  playerHand: string[];
  playerDeck: string[];
  playerField: MinionState[];
  playerGraveyard: string[];
  playerAether: number;
  playerMaxAether: number;
  aiHero: HeroState;
  aiHand: string[];
  aiDeck: string[];
  aiField: MinionState[];
  aiGraveyard: string[];
  aiAether: number;
  aiMaxAether: number;
  spellsCastThisTurn: number;
  selectionPending: SelectionPending | null;
  selectedCardIndex: number | null;
  selectedMinionId: string | null;
  logs: GameLog[];
  winner: PlayerId | null;
  winReason: string;
  aiThinking: boolean;
}

export type GameAction =
  | { type: 'START_GAME'; playerDeck: 'A' | 'B'; aiDeck: 'A' | 'B' }
  | { type: 'MULLIGAN_TOGGLE'; index: number }
  | { type: 'MULLIGAN_CONFIRM' }
  | { type: 'SELECT_HAND_CARD'; index: number }
  | { type: 'PLAY_CARD'; handIndex: number; targetId?: string }
  | { type: 'SELECT_MINION'; instanceId: string; owner: PlayerId }
  | { type: 'ATTACK_WITH_MINION'; attackerId: string; targetId: string; targetOwner: PlayerId }
  | { type: 'ATTACK_WITH_HERO'; targetId: string; targetOwner: PlayerId }
  | { type: 'USE_HERO_ABILITY' }
  | { type: 'SELECT_TARGET'; targetId: string; targetOwner: PlayerId | 'none' }
  | { type: 'DISCARD_CARD'; handIndex: number }
  | { type: 'END_TURN' }
  | { type: 'AI_ACTION' };
