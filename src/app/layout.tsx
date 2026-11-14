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

// 일부 브라우저 확장(Bitdefender 등)이 hydration 전에 DOM 에 속성을 주입해 hydration 경고가 난다.
// React 가 hydrate 하기 전에 해당 속성을 제거하고, 이후 추가되는 것도 지운다.
const STRIP_EXTENSION_ATTRS = `(function(){
  var A=['bis_skin_checked','bis_register'];
  function clean(el){for(var i=0;i<A.length;i++){if(el.hasAttribute&&el.hasAttribute(A[i]))el.removeAttribute(A[i]);}}
  function sweep(root){A.forEach(function(a){root.querySelectorAll('['+a+']').forEach(function(n){n.removeAttribute(a);});});}
  new MutationObserver(function(ms){ms.forEach(function(m){if(m.type==='attributes')clean(m.target);else m.addedNodes.forEach(function(n){if(n.nodeType===1){clean(n);sweep(n);}});});})
    .observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:A});
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: STRIP_EXTENSION_ATTRS }} />
      </head>
      <body suppressHydrationWarning>
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
