import type { Metadata, Viewport } from 'next';
import './globals.css';
import PlayerProvider from '@/components/PlayerProvider';
import PlayerBar from '@/components/PlayerBar';
import FullPlayer from '@/components/FullPlayer';
import { Sidebar, TabBar } from '@/components/Nav';
import PwaClient from '@/components/PwaClient';
import Toast from '@/components/Toast';

export const metadata: Metadata = {
  title: { default: '听域 TY Music', template: '%s - 听域' },
  description: '听榜单、找歌单、看歌词，随时随地听音乐',
  applicationName: '听域',
  appleWebApp: { capable: true, title: '听域', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f11' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <PlayerProvider>
          <div className="flex">
            <Sidebar />
            <main className="min-w-0 flex-1 pb-safe-player">{children}</main>
          </div>
          <PlayerBar />
          <TabBar />
          <FullPlayer />
          <Toast />
          <PwaClient />
        </PlayerProvider>
      </body>
    </html>
  );
}
