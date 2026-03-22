'use client';

import { type HeroState } from '@/lib/types';

interface HeroCardProps {
  hero: HeroState;
  owner: 'player' | 'ai';
  deckLabel: 'A' | 'B';
  isTargetable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  aether?: number;
  maxAether?: number;
  canUseAbility?: boolean;
  onAbilityClick?: () => void;
}

const HERO_DATA = {
  A: {
    name: 'Archmage Solara',
    subtitle: 'Aetherflare Dominion',
    ability: 'Firebolt: Deal 1 damage',
    emoji: '🔮',
    gradient: 'from-indigo-100 to-purple-100',
    border: 'border-indigo-400',
    accentText: 'text-indigo-700',
    abilityColor: 'bg-indigo-600 hover:bg-indigo-700',
  },
  B: {
    name: 'Warlord Greystone',
    subtitle: 'Ironfang Vanguard',
    ability: 'Iron Will: Restore 2 HP',
    emoji: '⚔️',
    gradient: 'from-amber-100 to-orange-100',
    border: 'border-amber-500',
    accentText: 'text-amber-700',
    abilityColor: 'bg-amber-600 hover:bg-amber-700',
  },
};

export function HeroCard({
  hero, owner, deckLabel, isTargetable, isSelected,
  onClick, aether, maxAether, canUseAbility, onAbilityClick,
}: HeroCardProps) {
  const d = HERO_DATA[deckLabel];
  const hpPct = Math.max(0, (hero.hp / hero.maxHp) * 100);
  const hpColor = hpPct > 50 ? 'bg-green-500' : hpPct > 25 ? 'bg-yellow-500' : 'bg-red-500';
  const isDead = hero.hp <= 0;

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ minWidth: '130px' }}>
      {/* Aether gems — player only */}
      {owner === 'player' && maxAether !== undefined && (
        <div className="flex items-center gap-0.5 flex-wrap justify-center">
          {Array.from({ length: maxAether }).map((_, i) => (
            <div key={i} className={[
              'w-3.5 h-3.5 rounded-full border-2 transition-all duration-300',
              i < (aether ?? 0)
                ? 'bg-indigo-500 border-indigo-700 shadow-sm shadow-indigo-400'
                : 'bg-gray-100 border-gray-300',
            ].join(' ')} />
          ))}
          <span className="text-[10px] text-gray-400 ml-1">{aether}/{maxAether}</span>
        </div>
      )}

      {/* Card */}
      <div
        onClick={onClick}
        className={[
          'relative rounded-xl border-2 p-2.5 cursor-pointer w-full',
          'bg-gradient-to-b shadow-lg transition-all duration-150',
          d.gradient, d.border,
          isTargetable ? 'ring-4 ring-red-400 animate-pulse scale-105 shadow-red-300' : '',
          isSelected   ? 'ring-4 ring-amber-400 scale-105 shadow-amber-200' : '',
          !isTargetable && !isSelected ? 'hover:scale-105' : '',
        ].join(' ')}
      >
        {/* Emoji */}
        <div className="text-3xl text-center mb-1">{d.emoji}</div>

        {/* Name */}
        <div className={`text-xs font-black text-center leading-tight ${d.accentText}`}>{d.name}</div>
        <div className="text-[9px] text-gray-400 text-center mb-2">{d.subtitle}</div>

        {/* HP bar */}
        <div className="mb-1">
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="font-black text-gray-700">{hero.hp}</span>
            <span className="text-gray-400">/ {hero.maxHp} HP</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${hpColor}`}
              style={{ width: `${hpPct}%` }} />
          </div>
        </div>

        {/* Weapon */}
        {hero.weapon && (
          <div className="mt-1 rounded-lg bg-orange-50 border border-orange-300 px-1.5 py-1 text-[9px]">
            <div className="font-black text-orange-700">🗡 {hero.weapon.atk} ATK  🛡 {hero.weapon.durability}</div>
            {hero.weapon.hasExecutionMark && <div className="text-red-600 font-bold">EXEC MARK</div>}
            {hero.weapon.hasLifebond && <div className="text-rose-600 font-bold">LIFEBOND</div>}
            {hero.weapon.hasAttackedThisTurn && <div className="text-gray-400 italic">Exhausted</div>}
          </div>
        )}

        {/* AI aether */}
        {owner === 'ai' && maxAether !== undefined && (
          <div className="mt-1 flex gap-0.5 justify-center flex-wrap">
            {Array.from({ length: maxAether }).map((_, i) => (
              <div key={i} className={[
                'w-2.5 h-2.5 rounded-full border',
                i < (aether ?? 0) ? 'bg-indigo-400 border-indigo-500' : 'bg-gray-100 border-gray-200',
              ].join(' ')} />
            ))}
          </div>
        )}

        {/* Dead overlay */}
        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/70 rounded-xl">
            <span className="text-white text-2xl">💀</span>
          </div>
        )}
      </div>

      {/* Hero ability button — player only */}
      {owner === 'player' && onAbilityClick && (
        <button
          onClick={e => { e.stopPropagation(); onAbilityClick(); }}
          disabled={!canUseAbility}
          title={d.ability}
          className={[
            'w-full py-1 px-2 rounded-lg text-[10px] font-black border-2 transition-all duration-150',
            canUseAbility
              ? `text-white border-transparent ${d.abilityColor} hover:scale-105 active:scale-95 shadow`
              : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed',
          ].join(' ')}
        >
          ✨ Ability (1⚡)
          <div className="text-[8px] opacity-70 font-normal truncate">{d.ability}</div>
        </button>
      )}
    </div>
  );
}
