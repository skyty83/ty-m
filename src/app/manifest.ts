import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: '听域 TY Music',
    short_name: '听域 TY Music',
    description: '听榜单、找歌单、看歌词，随时随地听音乐',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b0b0b',
    theme_color: '#0b0b0b',
    lang: 'zh-CN',
    categories: ['music', 'entertainment'],
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: '榜单', url: '/charts', icons: [{ src: '/pwa-icon/192', sizes: '192x192' }] },
      { name: '搜索', url: '/search', icons: [{ src: '/pwa-icon/192', sizes: '192x192' }] },
      { name: '我的音乐', url: '/library', icons: [{ src: '/pwa-icon/192', sizes: '192x192' }] },
    ],
  };
}
