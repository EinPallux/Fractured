'use client';

import { type PlayerId } from '@/lib/types';

export function GameOverScreen({ winner, reason, onRestart }: {
  winner: PlayerId; reason: string; onRestart: () => void;
}) {
  const win = winner === 'player';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className={[
        'rounded-3xl shadow-2xl p-10 max-w-sm w-full mx-4 text-center border-4',
        win
          ? 'bg-gradient-to-b from-amber-50 to-yellow-100 border-amber-400'
          : 'bg-gradient-to-b from-slate-100 to-gray-200 border-slate-400',
      ].join(' ')}>
        <div className="text-7xl mb-4 animate-bounce">{win ? '🏆' : '💀'}</div>
        <div className={`text-4xl font-black mb-2 ${win ? 'text-amber-700' : 'text-gray-700'}`}>
          {win ? 'Victory!' : 'Defeated'}
        </div>
        <div className="text-gray-500 text-sm mb-8 leading-relaxed">{reason}</div>
        <button
          onClick={onRestart}
          className={[
            'w-full py-3 rounded-xl font-black text-white text-lg transition-all duration-150',
            'hover:scale-105 active:scale-95 shadow-lg',
            win ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-600 hover:bg-slate-700',
          ].join(' ')}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
