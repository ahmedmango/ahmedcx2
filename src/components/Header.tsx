import { memo, useEffect, useRef } from "react";

interface HeaderProps {
  currentThread?: string;
}

const Header = memo(({ currentThread = "#0000" }: HeaderProps) => {
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${progress}%`;
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateScrollProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="px-6 py-8">
        <div className="max-w-3xl mx-auto flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-sm tracking-[0.2em] uppercase" style={{ color: 'var(--header-text)' }}>
              AHMED
            </h1>
            <div className="text-lg font-normal tracking-tight" style={{ color: 'var(--thread-number)' }}>
              {currentThread}
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] md:h-[1px] bg-transparent">
        <div 
          ref={progressBarRef}
          className="h-full"
          style={{ 
            width: 0,
            backgroundColor: 'var(--progress-bar)',
            willChange: 'width'
          }}
        />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;