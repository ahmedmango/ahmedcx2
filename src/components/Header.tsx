import { useEffect, useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  currentThread?: string;
  onTextSizeChange?: (delta: number) => void;
  showSecretButton?: boolean;
  onSecretTap?: () => void;
  onSecretActivate?: () => void;
}

const Header = ({ 
  currentThread = "#0000", 
  onTextSizeChange,
  showSecretButton = false,
  onSecretTap,
  onSecretActivate,
}: HeaderProps) => {
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let rafId: number | null = null;

    const updateScrollProgress = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const scrollTop = doc.scrollTop || document.body.scrollTop;
        const scrollHeight = doc.scrollHeight - doc.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${progress}%`;
        }
      });
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="px-6 py-8">
        <div className="max-w-3xl mx-auto flex justify-between items-start">
          <div className="space-y-1">
            <h1 
              className="text-sm tracking-[0.2em] uppercase select-none"
              style={{ color: 'var(--header-text)', cursor: 'default' }}
              onClick={onSecretTap}
            >
              AHMED
            </h1>
            <div className="text-lg font-normal tracking-tight" style={{ color: 'var(--thread-number)' }}>
              {currentThread}
            </div>
          </div>
          
          {onTextSizeChange && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onTextSizeChange(-0.1)}
                aria-label="Decrease text size"
              >
                <Minus className="h-4 w-4" style={{ color: 'var(--header-text)' }} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onTextSizeChange(0.1)}
                aria-label="Increase text size"
              >
                <Plus className="h-4 w-4" style={{ color: 'var(--header-text)' }} />
              </Button>

              {/* Secret ? button — fades in after 5 taps on AHMED */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 transition-all duration-700"
                style={{ 
                  color: 'var(--thread-number)',
                  opacity: showSecretButton ? 0.8 : 0,
                  pointerEvents: showSecretButton ? 'auto' : 'none',
                  transform: showSecretButton ? 'scale(1)' : 'scale(0.5)',
                }}
                onClick={onSecretActivate}
                aria-label="Secret"
              >
                <span className="text-sm font-serif">?</span>
              </Button>
            </div>
          )}
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
            transition: 'width 0.12s ease-out'
          }}
        />
      </div>
    </header>
  );
};

export default Header;
