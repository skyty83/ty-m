'use client';

import { useEffect } from 'react';
import { usePlayer } from './PlayerProvider';

// 播放出错时的短暂提示 (全屏播放器打开时由播放器内联显示)
export default function Toast() {
  const { error, clearError, fullOpen } = usePlayer();
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 5000);
    return () => clearTimeout(t);
  }, [error, clearError]);
  if (!error || fullOpen) return null;
  return (
    <div role="alert" className="fixed inset-x-0 z-[46] flex justify-center px-4 bottom-[calc(var(--player-h)+env(safe-area-inset-bottom)+24px)]">
      <button onClick={clearError} className="flex max-w-md items-center gap-2.5 rounded-full bg-ink py-2.5 pl-2 pr-4 text-sm font-bold text-paper shadow-lift">
        <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-accent px-2.5 text-xs font-bold text-onaccent">错误</span>
        <span className="min-w-0 truncate">{error}，换一首试试</span>
      </button>
    </div>
  );
}
