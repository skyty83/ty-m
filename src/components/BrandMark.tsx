// next/og(ImageResponse) 용 아이콘 마크업: flex + inline style 만 사용
export function BrandMark({ size, maskable = false }: { size: number; maskable?: boolean }) {
  const inner = maskable ? size * 0.62 : size * 0.86;
  const bar = inner * 0.11;
  const heights = [0.42, 0.78, 1, 0.62, 0.34];
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: maskable ? '#e2453c' : 'transparent',
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: maskable ? 0 : inner * 0.26,
          background: '#e2453c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: bar * 0.7,
        }}
      >
        {heights.map((h, i) => (
          <div
            key={i}
            style={{ width: bar, height: inner * 0.56 * h, borderRadius: bar, background: '#ffffff' }}
          />
        ))}
      </div>
    </div>
  );
}
