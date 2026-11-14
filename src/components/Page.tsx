export function Page({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[1400px] px-4 pt-[calc(env(safe-area-inset-top)+20px)] sm:px-6 lg:px-8 lg:pt-9 ${className}`}>
      {children}
    </div>
  );
}
