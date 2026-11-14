# TY Music (ty-m)

基于 vod-site 音乐菜单 API (`/api/music`, `/api/music/stream`) 的 Next.js 16 PWA 音乐站。

```bash
npm install
npm run dev          # http://localhost:3000 (开发模式不注册 Service Worker)
npm run build && npm start   # PWA/离线功能需在生产模式下测试
```

- 发现: 排行榜 / 推荐歌单 / 最近播放
- 搜索: 单曲 · 专辑 · 歌手 · 歌单 (无限滚动, 搜索历史)
- 详情: `/list/{chart|album|artist|playlist}/{id}`
- 我的: 我喜欢 / 最近播放 (localStorage)
- 播放器: 队列、随机/循环、同步歌词、Media Session(锁屏控制)、会话恢复
- PWA: `app/manifest.ts`, `public/sw.js`, 动态生成图标 `/pwa-icon/*`
