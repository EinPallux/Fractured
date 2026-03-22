'use client';

import { type GameState } from '@/lib/types';
import { getCard } from '@/lib/cards';
import { Card } from './Card';

interface Props {
  gs: GameState;
  onToggle: (i: number) => void;
  onConfirm: () => void;
}

export function MulliganScreen({ gs, onToggle, onConfirm }: Props) {
  const sel = gs.mulliganSelectedIndices;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xl w-full mx-4 flex flex-col gap-6">
        <div className="text-center">
          <div className="text-3xl font-black text-gray-800 mb-1">Opening Hand</div>
          <div className="text-gray-500 text-sm">
            Select up to <strong>3 cards</strong> to replace. Click to toggle.
          </div>
        </div>

        <div className="flex justify-center gap-3 flex-wrap">
          {gs.playerHand.map((cardId, i) => {
            const def = getCard(cardId);
            const isSel = sel.includes(i);
            return (
              <div key={i} className="relative" onClick={() => onToggle(i)}>
                <div className={`transition-all duration-150 ${isSel ? '-translate-y-2' : 'hover:-translate-y-1'}`}>
                  <Card def={def} isSelected={isSel} isPlayable size="hand" />
                </div>
                {isSel && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-md z-10">
                    <span className="text-white font-black text-xs">✕</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center text-xs text-gray-400">
          {sel.length}/3 cards selected for replacement
        </div>

        <button
          onClick={onConfirm}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl transition-all duration-150 text-base shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
        >
          {sel.length > 0
            ? `Replace ${sel.length} card${sel.length > 1 ? 's' : ''} & Start`
            : 'Keep all cards & Start'}
        </button>
      </div>
    </div>
  );
}
