export interface LrcLine { time: number; text: string }

// "[00:12.34]가사" 와 플러그인의 "[12.34]가사"(초 단위) 형식을 모두 처리
export function parseLrc(raw: string): LrcLine[] {
  const lines: LrcLine[] = [];
  for (const row of raw.split(/\r?\n/)) {
    const tags = [...row.matchAll(/\[(\d+(?::\d+)?(?:\.\d+)?)\]/g)];
    if (!tags.length) continue;
    const text = row.replace(/\[[^\]]*\]/g, '').trim();
    if (!text) continue;
    for (const t of tags) {
      const parts = t[1].split(':');
      const time = parts.length === 2 ? Number(parts[0]) * 60 + Number(parts[1]) : Number(parts[0]);
      if (!Number.isNaN(time)) lines.push({ time, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export function activeLine(lines: LrcLine[], t: number): number {
  let lo = 0, hi = lines.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= t + 0.25) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}
