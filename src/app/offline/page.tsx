import { WifiOff } from 'lucide-react';

export const metadata = { title: '离线' };

export default function Offline() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface shadow-card">
        <WifiOff className="h-7 w-7 text-sub" />
      </span>
      <h1 className="text-2xl font-bold">网络连接已断开</h1>
      <p className="max-w-sm text-sm text-sub">在线音乐需要网络才能播放。请检查网络后重试，收藏和播放记录都保存在这台设备上，不会丢失。</p>
      {/* 离线页需要整页刷新, 不用 Link */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-bg press">重新加载</a>
    </div>
  );
}
