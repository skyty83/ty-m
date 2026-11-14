// next/og(ImageResponse) 아이콘: 라임 정사각형 + 검정 이퀄라이저 바 (flex + inline style 만 사용)
export function BrandMark({ size, maskable = false }: { size: number; maskable?: boolean }) {
  const inner = maskable ? size * 0.6 : size;
  const bar = inner * 0.1;
  const heights = [0.45, 0.8, 1, 0.6, 0.35];
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d4ff3a' }}>
      <div style={{ width: inner, height: inner, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: bar * 0.6, paddingBottom: inner * 0.22 }}>
        {heights.map((h, i) => (
          <div key={i} style={{ width: bar, height: inner * 0.52 * h, background: '#0e0e0e' }} />
        ))}
      </div>
    </div>
  );
}
