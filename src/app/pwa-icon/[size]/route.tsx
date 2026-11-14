import { ImageResponse } from 'next/og';
import { BrandMark } from '@/components/BrandMark';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ size: '192' }, { size: '512' }, { size: 'maskable' }];
}

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = size === '192' ? 192 : 512;
  const maskable = size === 'maskable';
  return new ImageResponse(<BrandMark size={px} maskable={maskable} />, { width: px, height: px });
}
