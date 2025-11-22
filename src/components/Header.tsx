import { useState, useEffect } from "react";

interface HeaderProps {
  currentThread?: string;
}

const Header = ({ currentThread = "#0000" }: HeaderProps) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const container = document.querySelector('.scroll-container');
    if (!container) return;

    let rafId: number;

    const handleScroll = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const windowHeight = window.innerHeight;
        const documentHeight = container.scrollHeight;
        const scrollTop = container.scrollTop;
        
        const scrollableHeight = documentHeight - windowHeight;
        const progress = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;
        const newProgress = Math.min(progress, 100);
        
        setScrollProgress(newProgress);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
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