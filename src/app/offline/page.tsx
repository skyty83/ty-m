import { WifiOff } from 'lucide-react';

export const metadata = { title: '离线' };

export default function Offline() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-card-2">
        <WifiOff className="h-7 w-7 text-sub" />
      </span>
      <h1 className="text-3xl font-black tracking-[-0.04em]">网络连接已断开</h1>
      <p className="max-w-sm text-sm text-sub">在线音乐需要网络才能播放。请检查网络后重试，收藏和播放记录都保存在这台设备上，不会丢失。</p>
      {/* 离线页需要整页刷新, 不用 Link */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-black text-onaccent">重新加载</a>
    </div>
  );
}
