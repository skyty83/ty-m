'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaClient() {
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(console.error);
    }
    const onBIP = (e: Event) => {
      e.preventDefault();
      try { if (localStorage.getItem('tym:install-dismissed')) return; } catch { /* */ }
      setInstallEvt(e as BIPEvent);
    };
    const onInstalled = () => setInstallEvt(null);
    const net = () => setOffline(!navigator.onLine);
    net();
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', net);
    window.addEventListener('offline', net);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', net);
      window.removeEventListener('offline', net);
    };
  }, []);

  return (
    <>
      {offline && (
        <div className="fixed inset-x-0 top-0 z-[65] bg-ink pb-1.5 pt-[calc(env(safe-area-inset-top)+6px)] text-center text-xs font-bold text-paper">
          网络已断开，在线播放暂不可用
        </div>
      )}
      {installEvt && (
        <div className="fixed inset-x-3 bottom-[calc(var(--player-h)+env(safe-area-inset-bottom)+24px)] z-[46] flex items-center gap-3 rounded-panel bg-card p-2 pl-3 shadow-lift ring-1 ring-line sm:left-auto sm:right-6 sm:w-[380px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon" alt="" className="h-10 w-10 rounded-[27%]" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">安装听域音乐到桌面</span>
            <span className="block text-xs text-sub">像 App 一样打开，支持锁屏控制</span>
          </span>
          <button
            onClick={async () => { await installEvt.prompt(); setInstallEvt(null); }}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-bold text-onaccent"
          >
            <Download className="h-4 w-4" />安装
          </button>
          <button
            onClick={() => { setInstallEvt(null); try { localStorage.setItem('tym:install-dismissed', '1'); } catch { /* */ } }}
            aria-label="关闭"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sub hover:bg-card-2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
