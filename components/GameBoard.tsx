'use client';

import { useReducer, useEffect, useState } from 'react';
import { gameReducer } from '@/lib/engine';
import { getCard } from '@/lib/cards';
import { type GameState, type PlayerId, type SelectionType } from '@/lib/types';
import { Card } from '@/components/Card';
import { HeroCard } from '@/components/HeroCard';
import { GameLogPanel } from '@/components/GameLog';
import { MulliganScreen } from '@/components/MulliganScreen';
import { GameOverScreen } from '@/components/GameOverScreen';

/* Wolf token card def (not in cards.ts, generated in engine) */
const WOLF_DEF = {
  id: 'wolf_token', name: '🐺 Wolf', cost: 0, type: 'minion' as const,
  rarity: 'Common' as const, atk: 2, hp: 2, deck: 'B' as const,
  effects: [] as any[], description: '2/2 Wolf Token', flavor: '',
};

const INITIAL_STATE: GameState = {
  phase: 'start', activePlayer: 'player', round: 1, turnNumber: 1,
  mulliganSelectedIndices: [],
  playerHero: { hp: 20, maxHp: 20, weapon: null, heroAbilityUsedThisTurn: false },
  playerHand: [], playerDeck: [], playerField: [], playerGraveyard: [],
  playerAether: 0, playerMaxAether: 0,
  aiHero: { hp: 20, maxHp: 20, weapon: null, heroAbilityUsedThisTurn: false },
  aiHand: [], aiDeck: [], aiField: [], aiGraveyard: [],
  aiAether: 0, aiMaxAether: 0,
  spellsCastThisTurn: 0, selectionPending: null,
  selectedCardIndex: null, selectedMinionId: null,
  logs: [], winner: null, winReason: '', aiThinking: false,
};

/* Which pending types target enemies / friends / heroes */
const ENEMY_TARGET_TYPES: SelectionType[] = [
  'spell_target_any', 'spell_target_enemy', 'nullbind_enemy',
  'nullbind_1dmg', 'remove_bulwark', 'play_deal_1', 'arkaner_schwur',
];
const FRIENDLY_TARGET_TYPES: SelectionType[] = [
  'spell_target_friendly', 'give_surge', 'eisenmut', 'give_venombrand',
];
const HERO_TARGET_TYPES: SelectionType[] = [
  'spell_target_any', 'spell_target_enemy', 'play_deal_1', 'arkaner_schwur',
];

export default function GameBoard() {
  const [gs, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [playerDeck, setPlayerDeck] = useState<'A' | 'B' | null>(null);
  const [showSelect, setShowSelect] = useState(true);

  /* AI turn */
  useEffect(() => {
    if (gs.phase === 'ai_turn' && gs.aiThinking) {
      const t = setTimeout(() => dispatch({ type: 'AI_ACTION' }), 1500);
      return () => clearTimeout(t);
    }
  }, [gs.phase, gs.aiThinking, gs.round]);

  const startGame = (deck: 'A' | 'B') => {
    setPlayerDeck(deck);
    setShowSelect(false);
    dispatch({ type: 'START_GAME', playerDeck: deck, aiDeck: deck === 'A' ? 'B' : 'A' });
  };

  const restart = () => { setShowSelect(true); setPlayerDeck(null); };

  /* ── Derived state ── */
  const pending = gs.selectionPending;
  const isTargeting   = !!pending && pending.type !== 'aetherladung_discard';
  const isDiscarding  = pending?.type === 'aetherladung_discard';
  const isPlayerTurn  = gs.phase === 'player_turn';

  const minionCanAttack = (id: string) => {
    const m = gs.playerField.find(m => m.instanceId === id);
    return !!m && isPlayerTurn && !m.hasAttackedThisTurn && !m.hasNullbind && !(m.justPlayed && !m.hasSurge);
  };
  const heroCanAttack = isPlayerTurn && !!gs.playerHero.weapon &&
    !gs.playerHero.weapon.hasAttackedThisTurn &&
    !(gs.playerHero.weapon.justEquipped && !gs.playerHero.weapon.hasSurge);

  const somethingSelected = !!gs.selectedMinionId || heroCanAttack;

  /* ── Handlers ── */
  const clickHandCard = (i: number) => {
    if (!isPlayerTurn) return;
    if (isDiscarding) { dispatch({ type: 'DISCARD_CARD', handIndex: i }); return; }
    if (isTargeting) return;
    dispatch({ type: 'SELECT_HAND_CARD', index: i });
  };

  const clickPlayerMinion = (id: string) => {
    if (!isPlayerTurn) return;
    if (isTargeting && pending && FRIENDLY_TARGET_TYPES.includes(pending.type)) {
      dispatch({ type: 'SELECT_TARGET', targetId: id, targetOwner: 'player' });
      return;
    }
    if (isTargeting) return;
    dispatch({ type: 'SELECT_MINION', instanceId: id, owner: 'player' });
  };

  const clickAiMinion = (id: string) => {
    if (!isPlayerTurn) return;
    if (isTargeting && pending && ENEMY_TARGET_TYPES.includes(pending.type)) {
      dispatch({ type: 'SELECT_TARGET', targetId: id, targetOwner: 'ai' }); return;
    }
    if (isTargeting) return;
    if (gs.selectedMinionId) {
      dispatch({ type: 'ATTACK_WITH_MINION', attackerId: gs.selectedMinionId, targetId: id, targetOwner: 'ai' });
    } else if (heroCanAttack) {
      dispatch({ type: 'ATTACK_WITH_HERO', targetId: id, targetOwner: 'ai' });
    }
  };

  const clickAiHero = () => {
    if (!isPlayerTurn) return;
    if (isTargeting && pending && HERO_TARGET_TYPES.includes(pending.type)) {
      dispatch({ type: 'SELECT_TARGET', targetId: 'hero', targetOwner: 'ai' }); return;
    }
    if (isTargeting) return;
    if (gs.selectedMinionId) {
      dispatch({ type: 'ATTACK_WITH_MINION', attackerId: gs.selectedMinionId, targetId: 'hero', targetOwner: 'ai' });
    } else if (heroCanAttack) {
      dispatch({ type: 'ATTACK_WITH_HERO', targetId: 'hero', targetOwner: 'ai' });
    }
  };

  const cancelPending = () => {
    // Dispatch a no-op select to clear things – engine ignores unknown instanceId
    dispatch({ type: 'SELECT_MINION', instanceId: '', owner: 'player' });
  };

  if (showSelect) return <DeckSelect onSelect={startGame} />;

  const aiDeckLabel: 'A' | 'B' = playerDeck === 'A' ? 'B' : 'A';

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100"
      style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Overlays */}
      {gs.phase === 'start' && (
        <MulliganScreen gs={gs}
          onToggle={i => dispatch({ type: 'MULLIGAN_TOGGLE', index: i })}
          onConfirm={() => dispatch({ type: 'MULLIGAN_CONFIRM' })} />
      )}
      {gs.phase === 'game_over' && gs.winner && (
        <GameOverScreen winner={gs.winner} reason={gs.winReason} onRestart={restart} />
      )}

      {/* ═══════════ MAIN AREA ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0 p-2 gap-1.5 overflow-hidden">

        {/* ── HUD bar ── */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-white/80 rounded-xl border border-gray-200 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-black text-gray-800 tracking-tight text-sm">⚡ FRACTURED</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Round {gs.round}</span>
          </div>

          {/* Status banner */}
          {isTargeting && (
            <div className="flex items-center gap-2 bg-amber-50 border-2 border-amber-400 rounded-lg px-3 py-1">
              <span className="text-[11px] font-black text-amber-700 animate-pulse">⚡ SELECT A TARGET</span>
              <button onClick={cancelPending} className="text-gray-400 hover:text-gray-700 text-[10px] underline">Cancel</button>
            </div>
          )}
          {isDiscarding && (
            <div className="bg-rose-50 border-2 border-rose-400 rounded-lg px-3 py-1">
              <span className="text-[11px] font-black text-rose-700 animate-pulse">🗑 CHOOSE A CARD TO DISCARD</span>
            </div>
          )}
          {!isTargeting && !isDiscarding && gs.selectedMinionId && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg px-3 py-1">
              <span className="text-[11px] font-black text-amber-600">⚔ SELECT ATTACK TARGET</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
              gs.phase === 'player_turn' ? 'bg-indigo-100 text-indigo-700'
              : gs.phase === 'ai_turn'   ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-500'
            }`}>
              {gs.phase === 'player_turn' ? '⚡ Your Turn'
               : gs.phase === 'ai_turn'  ? '🤖 AI Thinking…'
               : ''}
            </span>
            <button
              onClick={() => { if (isPlayerTurn && !isTargeting && !isDiscarding) dispatch({ type: 'END_TURN' }); }}
              disabled={!isPlayerTurn || isTargeting || isDiscarding}
              className={`px-4 py-1.5 rounded-lg font-black text-sm transition-all duration-150 ${
                isPlayerTurn && !isTargeting && !isDiscarding
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              End Turn →
            </button>
          </div>
        </div>

        {/* ── AI ZONE ── */}
        <div className="flex items-stretch gap-3 bg-red-50/50 border border-red-200/80 rounded-xl p-2 flex-shrink-0" style={{ minHeight: '155px' }}>
          {/* AI hero */}
          <HeroCard
            hero={gs.aiHero} owner="ai" deckLabel={aiDeckLabel}
            aether={gs.aiAether} maxAether={gs.aiMaxAether}
            isTargetable={isTargeting && !!pending && HERO_TARGET_TYPES.includes(pending.type)}
            onClick={clickAiHero}
          />

          {/* AI stats */}
          <div className="flex flex-col justify-center gap-1 text-[10px] text-gray-400 min-w-[60px]">
            <div>✋ {gs.aiHand.length} cards</div>
            <div>📚 {gs.aiDeck.length} deck</div>
            <div>⚰ {gs.aiGraveyard.length} grave</div>
          </div>

          {/* AI field */}
          <div className="flex-1 flex items-center justify-center gap-2 flex-wrap">
            {gs.aiField.length === 0
              ? <span className="text-gray-300 text-xs italic">No minions</span>
              : gs.aiField.map(m => {
                  const def = m.cardId === 'wolf_token' ? WOLF_DEF : getCard(m.cardId);
                  const isEnemyTarget = isTargeting && !!pending && ENEMY_TARGET_TYPES.includes(pending.type);
                  const isAttackable  = !isTargeting && somethingSelected;
                  return (
                    <Card key={m.instanceId} def={def} minionState={m} size="field"
                      isTargetable={isEnemyTarget || isAttackable}
                      onClick={() => clickAiMinion(m.instanceId)} />
                  );
                })}
          </div>

          {/* AI hand backs */}
          <div className="flex flex-col items-end justify-center gap-1">
            <div className="flex gap-0.5 flex-wrap justify-end" style={{ maxWidth: '80px' }}>
              {Array.from({ length: Math.min(gs.aiHand.length, 8) }).map((_, i) => (
                <div key={i} className="w-6 h-9 bg-slate-700 border border-slate-600 rounded-md shadow-sm" />
              ))}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 px-6 flex-shrink-0">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Battlefield</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        </div>

        {/* ── PLAYER ZONE ── */}
        <div className="flex items-stretch gap-3 bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-2 flex-shrink-0" style={{ minHeight: '155px' }}>
          {/* Player hero */}
          <HeroCard
            hero={gs.playerHero} owner="player" deckLabel={playerDeck ?? 'A'}
            aether={gs.playerAether} maxAether={gs.playerMaxAether}
            canUseAbility={isPlayerTurn && gs.playerAether >= 1 && !gs.playerHero.heroAbilityUsedThisTurn && !isTargeting && !isDiscarding}
            onAbilityClick={() => dispatch({ type: 'USE_HERO_ABILITY' })}
            isSelected={heroCanAttack && !gs.selectedMinionId}
          />

          {/* Player field */}
          <div className="flex-1 flex items-center justify-center gap-2 flex-wrap">
            {gs.playerField.length === 0
              ? <span className="text-gray-300 text-xs italic">No minions</span>
              : gs.playerField.map(m => {
                  const def = m.cardId === 'wolf_token' ? WOLF_DEF : getCard(m.cardId);
                  const isSelected = gs.selectedMinionId === m.instanceId;
                  const canAtk = minionCanAttack(m.instanceId);
                  const isFriendlyTarget = isTargeting && !!pending && FRIENDLY_TARGET_TYPES.includes(pending.type);
                  return (
                    <Card key={m.instanceId} def={def} minionState={m} size="field"
                      isSelected={isSelected}
                      isAttacker={canAtk && !isSelected && !isTargeting}
                      isTargetable={isFriendlyTarget}
                      onClick={() => clickPlayerMinion(m.instanceId)} />
                  );
                })}
          </div>

          {/* Deck / grave */}
          <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0">
            <div className="flex flex-col items-center">
              <div className="w-12 bg-gradient-to-b from-slate-700 to-slate-900 border-2 border-slate-600 rounded-lg flex items-center justify-center text-white font-black text-base shadow-lg"
                style={{ height: '64px' }}>
                {gs.playerDeck.length}
              </div>
              <div className="text-[9px] text-gray-400 mt-0.5">Deck</div>
            </div>
            <div className="text-[9px] text-gray-400">⚰ {gs.playerGraveyard.length}</div>
          </div>
        </div>

        {/* ── HAND ── */}
        <div className="flex-shrink-0 overflow-hidden">
          <div className="flex items-end justify-center gap-2 px-4 py-2 min-h-[148px] overflow-x-auto">
            {gs.playerHand.length === 0
              ? <span className="text-gray-400 text-sm italic self-center">No cards in hand</span>
              : gs.playerHand.map((cardId, i) => {
                  const def = getCard(cardId);
                  const isSel   = gs.selectedCardIndex === i;
                  const canPlay = isPlayerTurn && def.cost <= gs.playerAether && !isTargeting && !isDiscarding;
                  return (
                    <div key={`${cardId}-${i}-${gs.round}`}
                      className={`flex-shrink-0 transition-all duration-150 cursor-pointer
                        ${isSel ? '-translate-y-4' : canPlay ? 'hover:-translate-y-2' : ''}`}
                      onClick={() => clickHandCard(i)}>
                      <Card def={def} size="hand"
                        isSelected={isSel} isPlayable={canPlay}
                        isTargetable={isDiscarding} />
                    </div>
                  );
                })}
          </div>
          {/* Hint text */}
          <div className="text-center text-[10px] text-gray-400 pb-1 h-4">
            {isDiscarding ? '🗑 Click a card to discard it'
             : isTargeting ? '⚡ Click a valid target on the board'
             : gs.selectedMinionId ? '⚔ Click an enemy minion or hero to attack — or click another friendly minion'
             : isPlayerTurn ? 'Click a card to play · Select a minion or use weapon to attack'
             : ''}
          </div>
        </div>
      </div>

      {/* ═══════════ LOG PANEL ═══════════ */}
      <div className="w-52 flex-shrink-0 p-2">
        <GameLogPanel logs={gs.logs} />
      </div>
    </div>
  );
}

/* ── Deck selection screen ── */
function DeckSelect({ onSelect }: { onSelect: (d: 'A' | 'B') => void }) {
  const decks = [
    {
      id: 'A' as const,
      name: 'Aetherflare Dominion',
      hero: 'Archmage Solara',
      emoji: '🔮',
      tagline: 'Master the arcane.',
      desc: 'Command magical constructs and devastate enemies with powerful spells. Protect your field with Bulwark and drain life with Lifebond.',
      ability: '🔮 Firebolt – Deal 1 damage to any target',
      tags: ['Spells', 'Lifebond', 'Bulwark', 'Venombrand'],
      grad: 'linear-gradient(135deg,#4338ca,#7c3aed)',
      border: '#818cf8',
    },
    {
      id: 'B' as const,
      name: 'Ironfang Vanguard',
      hero: 'Warlord Greystone',
      emoji: '⚔️',
      tagline: 'Crush without mercy.',
      desc: 'Overwhelm with Surge attackers and ferocious wolves. Execute weakened foes and deal massive weapon damage with the power of iron.',
      ability: '🛡 Iron Will – Restore 2 HP',
      tags: ['Surge', 'Execution Mark', 'Weapons', 'Aggro'],
      grad: 'linear-gradient(135deg,#b45309,#c2410c)',
      border: '#fbbf24',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8"
      style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b,#0f172a)', fontFamily: "'Inter',sans-serif" }}>

      <div className="text-center">
        <div className="text-7xl font-black text-white tracking-tighter mb-1"
          style={{ textShadow: '0 0 60px rgba(99,102,241,0.7)' }}>
          ⚡ FRACTURED
        </div>
        <div className="text-indigo-300 font-bold tracking-[0.3em] uppercase text-sm">
          Clash of Borders
        </div>
      </div>

      <div className="text-indigo-200 text-sm text-center opacity-80">
        Choose your hero — the AI plays the opposing deck
      </div>

      <div className="flex gap-6 flex-wrap justify-center">
        {decks.map(d => (
          <button key={d.id} onClick={() => onSelect(d.id)}
            className="w-72 p-6 rounded-2xl text-white text-left transition-all duration-200 hover:scale-105 active:scale-100"
            style={{ background: d.grad, border: `2px solid ${d.border}`, boxShadow: `0 20px 60px ${d.border}33` }}>
            <div className="text-5xl mb-2">{d.emoji}</div>
            <div className="text-xl font-black mb-0.5">{d.name}</div>
            <div className="text-xs opacity-60 mb-1">Hero: {d.hero}</div>
            <div className="text-sm opacity-70 italic mb-1">{d.tagline}</div>
            <div className="text-xs opacity-80 leading-relaxed mb-3">{d.desc}</div>
            <div className="text-xs opacity-60 mb-3 border-t border-white/20 pt-2">{d.ability}</div>
            <div className="flex flex-wrap gap-1.5">
              {d.tags.map(t => (
                <span key={t} className="text-[10px] font-black bg-white/20 rounded-full px-2 py-0.5">{t}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="text-indigo-400/60 text-xs text-center max-w-sm leading-relaxed">
        25-card decks · 5 starting cards · Mulligan up to 3 · Reduce enemy to 0 HP to win
      </div>
    </div>
  );
}
