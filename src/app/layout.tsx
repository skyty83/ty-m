import type { Metadata, Viewport } from 'next';
import { Geist, Noto_Sans_SC, Unbounded } from 'next/font/google';
import './globals.css';
import PlayerProvider from '@/components/PlayerProvider';
import PlayerBar from '@/components/PlayerBar';
import FullPlayer from '@/components/FullPlayer';
import Header from '@/components/Nav';
import Footer from '@/components/Footer';
import PwaClient from '@/components/PwaClient';
import Toast from '@/components/Toast';

// 与 vod-site 相同的字体组合: 拉丁/数字 Geist, 汉字 Noto Sans SC, 装饰性拉丁大字 Unbounded
const latin = Geist({ subsets: ['latin'], display: 'swap', variable: '--font-latin' });
const wide = Unbounded({ subsets: ['latin'], weight: ['600', '800'], display: 'swap', variable: '--font-wide' });
const body = Noto_Sans_SC({ subsets: ['latin'], weight: ['400', '500', '700', '900'], display: 'swap', variable: '--font-body', preload: false });

export const metadata: Metadata = {
  title: { default: '听域音乐 - 在线听歌', template: '%s - 听域音乐' },
  description: '排行榜、歌单、歌手一站搜索，同步歌词，随时随地听音乐',
  applicationName: '听域音乐',
  appleWebApp: { capable: true, title: '听域音乐', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  referrer: 'no-referrer',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f3' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0c' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// 일부 브라우저 확장(Bitdefender 등)이 hydration 전에 DOM 에 속성을 주입해 hydration 경고가 난다.
const STRIP_EXTENSION_ATTRS = `(function(){var A=['bis_skin_checked','bis_register'];function s(r){A.forEach(function(a){r.querySelectorAll('['+a+']').forEach(function(n){n.removeAttribute(a)})})}s(document);new MutationObserver(function(m){m.forEach(function(x){var t=x.target;if(t.removeAttribute)A.forEach(function(a){t.removeAttribute(a)})})}).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:A})})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${latin.variable} ${body.variable} ${wide.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: STRIP_EXTENSION_ATTRS }} />
      </head>
      <body className="flex min-h-dvh flex-col" suppressHydrationWarning>
        <PlayerProvider>
          <Header />
          <main className="flex-1 overflow-x-clip">{children}</main>
          <Footer />
          {/* 底部悬浮播放条占位 */}
          <div aria-hidden="true" className="h-[calc(var(--player-h)+env(safe-area-inset-bottom)+24px)]" />
          <PlayerBar />
          <FullPlayer />
          <Toast />
          <PwaClient />
        </PlayerProvider>
      </body>
    </html>
  );
}
