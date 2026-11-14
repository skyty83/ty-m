// next/og(ImageResponse) 아이콘: vod-site 와 같은 둥근 라임 사각형 + 검정 이퀄라이저 바
export function BrandMark({ size, maskable = false }: { size: number; maskable?: boolean }) {
  const inner = maskable ? size * 0.62 : size;
  const bar = inner * 0.09;
  const heights = [0.4, 0.75, 1, 0.6, 0.32];
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: maskable ? '#c6f432' : 'transparent' }}>
      <div style={{ width: inner, height: inner, borderRadius: maskable ? 0 : inner * 0.27, background: '#c6f432', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: bar * 0.7 }}>
        {heights.map((h, i) => (
          <div key={i} style={{ width: bar, height: inner * 0.5 * h, borderRadius: bar, background: '#0b0b0d' }} />
        ))}
      </div>
    </div>
  );
}
