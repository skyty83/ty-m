export function Page({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[1480px] px-4 pt-[calc(env(safe-area-inset-top)+16px)] sm:px-6 lg:px-10 lg:pt-10 ${className}`}>
      {children}
    </div>
  );
}

// 页面大标题: 超大粗体 + 可选右侧操作
export function PageTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <h1 className="text-[44px] font-black leading-[1.05] tracking-[-0.03em] sm:text-6xl lg:text-7xl">{children}</h1>
      {aside}
    </div>
  );
}
