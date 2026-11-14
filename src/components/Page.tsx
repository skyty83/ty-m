// 页面容器与大标题 (与 vod-site 一致的 wrap 与标题尺度)
export function Page({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`wrap pt-8 lg:pt-14 ${className}`}>{children}</div>;
}

export function PageTitle({ title, kicker, aside, sub }: { title: string; kicker?: string; aside?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 lg:mb-12">
      <div className="min-w-0">
        {kicker && <p className="font-wide mb-2 text-sm font-extrabold text-pop sm:text-base">{kicker}</p>}
        <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.045em] sm:text-7xl">{title}</h1>
        {sub && <div className="mt-4 text-sm text-sub">{sub}</div>}
      </div>
      {aside}
    </header>
  );
}
