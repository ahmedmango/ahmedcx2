import { useState, useCallback, useRef } from 'react';

interface DepthPageProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
}

const DepthPage = ({ isOpen, content, onClose }: DepthPageProps) => {
  const [dismissProgress, setDismissProgress] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      setDismissProgress(Math.min(deltaY / 250, 1));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dismissProgress > 0.4) {
      setIsDismissing(true);
      setTimeout(() => {
        onClose();
        setIsDismissing(false);
        setDismissProgress(0);
      }, 500);
    } else {
      setDismissProgress(0);
    }
    touchStartY.current = null;
  }, [dismissProgress, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[98] overflow-y-auto"
      style={{
        background: '#000000',
        opacity: isDismissing ? 0 : 1 - dismissProgress * 0.5,
        transform: `translateY(${dismissProgress * 80}px)`,
        transition: isDismissing
          ? 'opacity 0.5s ease, transform 0.5s ease'
          : dismissProgress > 0 ? 'none' : 'opacity 0.8s ease',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe indicator */}
      <div className="fixed top-6 left-0 right-0 z-[99] flex justify-center pointer-events-none">
        <div
          className="w-10 h-1 rounded-full"
          style={{
            backgroundColor: 'rgba(255, 122, 0, 0.5)',
            animation: 'depthBreathe 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* Desktop close */}
      <button
        onClick={() => {
          setIsDismissing(true);
          setTimeout(() => {
            onClose();
            setIsDismissing(false);
            setDismissProgress(0);
          }, 500);
        }}
        className="fixed top-8 right-8 z-[99] text-orange-500/30 hover:text-orange-500/60 transition-colors text-xs tracking-[0.3em] uppercase"
      >
        CLOSE
      </button>

      {/* ΔV watermark */}
      <div 
        className="fixed inset-0 z-[97] flex items-center justify-center pointer-events-none"
        style={{ opacity: 0.03 }}
      >
        <span
          style={{
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '20vw',
            color: '#FF7A00',
            letterSpacing: '0.1em',
          }}
        >
          ΔV
        </span>
      </div>

      {/* Content */}
      <div className="relative z-[98] min-h-screen px-5 py-24">
        <div
          className="max-w-[680px] mx-auto w-full"
          style={{
            color: '#FF7A00',
            fontFamily: '"Courier New", Courier, monospace',
            lineHeight: 1.8,
            textShadow: '0 0 15px rgba(255, 122, 0, 0.3)',
          }}
        >
          {content ? (
            <div
              className="text-lg whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="text-center space-y-8 pt-32">
              <p className="text-2xl font-bold tracking-wider">ΔV</p>
              <p className="text-lg opacity-50">
                You found the depth.
              </p>
              <p className="text-sm opacity-30">
                What belongs here hasn't been written yet.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes depthBreathe {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default DepthPage;
