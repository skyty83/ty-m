# 听域 TY Music (ty-m)

vod-site 음악 메뉴 API(`/api/music`, `/api/music/stream`)를 사용하는 Next.js 16 PWA 음악 사이트. UI는 중국어.

## 개발

```bash
npm install
npm run dev            # http://localhost:3000 (개발 모드에서는 서비스 워커 미등록)
```

## 배포

> **Vercel(AWS)에서는 쿠워(kuwo) 차트/검색 API가 클라우드 IP 차단으로 연결되지 않습니다.**
> AWS 가 아닌 서버(국내 VPS, NAS, 자체 서버 등)에서 운영하세요.

### Docker

```bash
docker build -t ty-m .
docker run -d --name ty-m -p 3000:3000 --restart unless-stopped ty-m
```

### Node + PM2 (Docker 없이)

```bash
npm ci && npm run build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
pm2 start ecosystem.config.cjs
```

PWA(설치, 서비스 워커)는 HTTPS 에서만 동작하므로 Nginx/Caddy 등으로 TLS 를 붙이세요.

## 구성

- 화면: 发现 / 榜单 / 搜索 / 我的, 상세 `/list/{chart|album|artist|playlist}/{id}`
- 플레이어: 재생 목록, 반복/셔플, 동기화 가사, Media Session(잠금화면 제어), 세션 복원
- PWA: `app/manifest.ts`, `public/sw.js`, 동적 아이콘 `/pwa-icon/*`, 오프라인 페이지
- 디자인: 모노크롬 + 라임 포인트, 직각 지오메트리, 라이트/다크 자동
