'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
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
    <div role="alert" className="rise fixed inset-x-0 z-50 flex justify-center px-4 bottom-[calc(var(--player-h)+var(--nav-h)+env(safe-area-inset-bottom)+20px)] lg:bottom-[calc(var(--player-h)+40px)]">
      <button onClick={clearError} className="flex max-w-md items-center gap-2.5 border-l-4 border-pop bg-ink py-3 pl-3.5 pr-4 text-sm font-medium text-bg">
        <AlertCircle className="h-4 w-4 shrink-0 text-pop" />
        <span className="min-w-0 truncate">{error}，换一首试试</span>
      </button>
    </div>
  );
}
