'use client';

import { type CardDef, type EffectKey } from '@/lib/cards';
import { type MinionState } from '@/lib/types';

interface CardProps {
  def: CardDef;
  minionState?: MinionState;
  isSelected?: boolean;
  isPlayable?: boolean;
  isTargetable?: boolean;
  isAttacker?: boolean;
  onClick?: () => void;
  size?: 'hand' | 'field';
}

const RARITY_BORDER: Record<string, string> = {
  Common:    'border-slate-300',
  Rare:      'border-blue-400',
  Epic:      'border-purple-500',
  Legendary: 'border-amber-500',
  Mythic:    'border-rose-500',
};

const RARITY_BG: Record<string, string> = {
  Common:    'from-slate-50 to-slate-100',
  Rare:      'from-blue-50 to-blue-100',
  Epic:      'from-purple-50 to-purple-100',
  Legendary: 'from-amber-50 to-yellow-100',
  Mythic:    'from-rose-50 to-pink-100',
};

const RARITY_DOT: Record<string, string> = {
  Common:    '#94a3b8',
  Rare:      '#60a5fa',
  Epic:      '#a78bfa',
  Legendary: '#f59e0b',
  Mythic:    '#f43f5e',
};

const TYPE_ICON: Record<string, string> = {
  minion: '⚔️',
  spell:  '✨',
  weapon: '🗡️',
};

interface EffectBadge { label: string; color: string }
const EFFECT_BADGES: Partial<Record<EffectKey, EffectBadge>> = {
  surge:          { label: 'SURGE',       color: 'bg-yellow-400 text-yellow-900' },
  bulwark:        { label: 'BULWARK',     color: 'bg-blue-500 text-white' },
  venombrand:     { label: 'VENOMBRAND',  color: 'bg-green-600 text-white' },
  lifebond:       { label: 'LIFEBOND',    color: 'bg-rose-400 text-white' },
  execution_mark: { label: 'EXEC MARK',   color: 'bg-red-600 text-white' },
  blade_dance:    { label: 'BLADE DANCE', color: 'bg-cyan-500 text-white' },
};

/* Deterministic color from card id */
function cardHue(id: string, salt = 37) {
  return id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * salt % 360;
}

/* Tiny generated card art */
function CardArt({ def, compact }: { def: CardDef; compact?: boolean }) {
  const h1 = cardHue(def.id, 37);
  const h2 = cardHue(def.id, 73);
  const h3 = cardHue(def.id, 111);
  const seed = def.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-t-lg ${compact ? 'h-10' : 'h-14'}`}
      style={{ background: `linear-gradient(135deg, hsl(${h1},55%,72%), hsl(${h2},45%,62%))` }}
    >
      <svg viewBox="0 0 80 56" className="w-full h-full opacity-75" preserveAspectRatio="xMidYMid slice">
        <circle cx={15 + seed % 25} cy={12 + seed % 15} r={14 + seed % 10}
          fill={`hsla(${h3},65%,55%,0.45)`} />
        <circle cx={55 + seed % 20} cy={28 + seed % 18} r={10 + seed % 8}
          fill={`hsla(${(h3+120)%360},60%,60%,0.40)`} />
        <circle cx={35 + seed % 15} cy={40 + seed % 12} r={16 + seed % 7}
          fill={`hsla(${(h3+240)%360},55%,58%,0.35)`} />
        <text x="40" y="34" textAnchor="middle" fontSize={compact ? 14 : 18} style={{ userSelect:'none' }}>
          {TYPE_ICON[def.type]}
        </text>
      </svg>
      {/* Cost crystal */}
      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">
        {def.cost}
      </div>
      {/* Rarity dot */}
      <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full shadow-sm"
        style={{ background: RARITY_DOT[def.rarity] ?? '#94a3b8' }} />
    </div>
  );
}

/* ===== FIELD CARD (minion on board) ===== */
function FieldCard({ def, minionState, isSelected, isAttacker, isTargetable, onClick }: CardProps) {
  const m = minionState!;
  const atk = m.atk + m.tempAtkBonus;
  const hp = m.hp;
  const maxHp = m.maxHp;
  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const hpColor = hpPct > 60 ? 'bg-green-500' : hpPct > 30 ? 'bg-yellow-500' : 'bg-red-500';

  // Collect active badge effects
  const badges: EffectBadge[] = [];
  def.effects.forEach(eff => {
    const b = EFFECT_BADGES[eff];
    if (b) badges.push(b);
  });
  // Dynamic badges from state overrides
  if (m.hasBulwark && !def.effects.includes('bulwark'))       badges.push({ label: 'BULWARK',    color: 'bg-blue-500 text-white' });
  if (m.hasVenombrand && !def.effects.includes('venombrand')) badges.push({ label: 'VENOMBRAND', color: 'bg-green-600 text-white' });
  if (m.hasSurge && !def.effects.includes('surge'))           badges.push({ label: 'SURGE',      color: 'bg-yellow-400 text-yellow-900' });
  if (m.venomBranded)  badges.push({ label: '☠ DOOMED',      color: 'bg-green-900 text-green-200' });
  if (m.hasNullbind)   badges.push({ label: 'NULLBOUND',      color: 'bg-gray-500 text-white' });

  return (
    <div
      onClick={onClick}
      className={[
        'relative w-[78px] h-[110px] rounded-xl border-2 flex flex-col overflow-hidden cursor-pointer',
        'transition-all duration-150 shadow-md bg-gradient-to-b',
        RARITY_BG[def.rarity] ?? RARITY_BG.Common,
        RARITY_BORDER[def.rarity] ?? RARITY_BORDER.Common,
        isSelected   ? 'ring-4 ring-amber-400 scale-110 shadow-amber-200 shadow-lg -translate-y-1' : '',
        isAttacker   ? 'ring-2 ring-amber-300 scale-105 hover:scale-110' : 'hover:scale-105',
        isTargetable ? 'ring-4 ring-red-400 scale-105 animate-pulse shadow-red-200 shadow-lg' : '',
        m.hasNullbind ? 'opacity-50 grayscale' : '',
        m.hasAttackedThisTurn && !isSelected ? 'opacity-70' : '',
      ].join(' ')}
      title={`${def.name}\n${def.description || ''}${m.hasNullbind ? '\n[NULLBOUND – cannot act]' : ''}`}
    >
      {/* Art */}
      <CardArt def={def} compact />

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-0.5 px-0.5 py-0.5">
          {badges.slice(0, 2).map((b, i) => (
            <span key={i} className={`text-[7px] font-black px-0.5 py-px rounded leading-none ${b.color}`}>
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Name */}
      <div className="px-1 text-[9px] font-bold text-gray-700 truncate flex-1 flex items-end pb-0.5 leading-tight">
        {def.name.length > 14 ? def.name.slice(0, 13) + '…' : def.name}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-1 pb-0.5">
        <span className="text-orange-600 font-black text-sm leading-none">{atk}</span>
        <div className="flex-1 mx-1">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${hpColor}`}
              style={{ width: `${hpPct}%` }} />
          </div>
        </div>
        <span className="text-red-600 font-black text-sm leading-none">{hp}</span>
      </div>
    </div>
  );
}

/* ===== HAND CARD ===== */
function HandCard({ def, isSelected, isPlayable, isTargetable, onClick }: CardProps) {
  const badges: EffectBadge[] = def.effects.reduce<EffectBadge[]>((acc, eff) => {
    const b = EFFECT_BADGES[eff];
    if (b) acc.push(b);
    return acc;
  }, []);

  return (
    <div
      onClick={onClick}
      className={[
        'relative flex flex-col rounded-xl border-2 overflow-hidden cursor-pointer shadow-md bg-gradient-to-b',
        RARITY_BG[def.rarity] ?? RARITY_BG.Common,
        RARITY_BORDER[def.rarity] ?? RARITY_BORDER.Common,
        isSelected   ? 'ring-4 ring-amber-400 shadow-amber-200 shadow-lg' : '',
        isPlayable && !isSelected ? 'hover:shadow-lg hover:border-indigo-400' : '',
        isTargetable ? 'ring-4 ring-rose-400 animate-pulse' : '',
        !isPlayable && !isTargetable ? 'opacity-60' : '',
      ].join(' ')}
      style={{ width: '86px', minHeight: '128px' }}
    >
      <CardArt def={def} />

      <div className="flex flex-col flex-1 px-1.5 pt-0.5 pb-1 gap-0.5">
        {/* Name */}
        <div className="text-[10px] font-black text-gray-800 leading-tight">
          {def.name}
        </div>

        {/* Effect badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {badges.map((b, i) => (
              <span key={i} className={`text-[7px] font-black px-0.5 py-px rounded leading-none ${b.color}`}>
                {b.label}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {def.description && (
          <div className="text-[8px] text-gray-500 italic leading-tight flex-1">
            {def.description}
          </div>
        )}

        {/* Stats */}
        {def.type === 'minion' && (
          <div className="flex justify-between pt-0.5">
            <span className="text-orange-600 font-black text-xs">{def.atk}⚔</span>
            <span className="text-red-600 font-black text-xs">{def.hp}♥</span>
          </div>
        )}
        {def.type === 'weapon' && (
          <div className="flex justify-between pt-0.5">
            <span className="text-orange-600 font-black text-xs">{def.atk}⚔</span>
            <span className="text-blue-600 font-black text-xs">{def.durability}🛡</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== EXPORT ===== */
export function Card(props: CardProps) {
  if (props.size === 'field' && props.minionState) {
    return <FieldCard {...props} />;
  }
  return <HandCard {...props} />;
}
