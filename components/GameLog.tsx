'use client';

import { useEffect, useRef } from 'react';
import { type GameLog } from '@/lib/types';

const STYLE: Record<GameLog['type'], { text: string; icon: string }> = {
  action: { text: 'text-gray-700',    icon: '▶' },
  system: { text: 'text-indigo-600 font-semibold', icon: '—' },
  damage: { text: 'text-red-600',     icon: '💥' },
  death:  { text: 'text-gray-400 italic', icon: '💀' },
  effect: { text: 'text-purple-600',  icon: '✨' },
};

export function GameLogPanel({ logs }: { logs: GameLog[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-inner">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Battle Log</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-px" style={{ minHeight: 0 }}>
        {logs.slice(-60).map((log) => {
          const s = STYLE[log.type];
          return (
            <div key={log.id} className={`text-[10px] flex gap-1 items-start ${s.text}`}>
              <span className="flex-shrink-0 opacity-50 mt-px">{s.icon}</span>
              <span className="leading-relaxed">{log.message}</span>
            </div>
          );
        })}
        <div ref={ref} />
      </div>
    </div>
  );
}
