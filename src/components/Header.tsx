import { useState, useEffect } from "react";

interface HeaderProps {
  currentThread?: string;
}

const Header = ({ currentThread = "#0000" }: HeaderProps) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const body = document.body;

        const scrollTop = doc.scrollTop || body.scrollTop || 0;
        const scrollHeight = (doc.scrollHeight || body.scrollHeight || 0) - (doc.clientHeight || window.innerHeight);

        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        const clampedProgress = Math.min(Math.max(progress, 0), 100);

        setScrollProgress(clampedProgress);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
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
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-border">
        <div 
          className="h-full"
          style={{ 
            width: `${scrollProgress}%`,
            backgroundColor: 'var(--progress-bar)',
            transition: 'width 0.12s ease-out'
          }}
        />
      </div>
    </header>
  );
};

export default Header;