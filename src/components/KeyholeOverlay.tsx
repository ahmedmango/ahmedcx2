import { useState, useRef, useCallback, useEffect } from 'react';

interface KeyholeOverlayProps {
  isOpen: boolean;
  onUnlock: () => void;
  onClose: () => void;
}

const KeyholeOverlay = ({ isOpen, onUnlock, onClose }: KeyholeOverlayProps) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasUnlocked, setHasUnlocked] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartAngle = useRef(0);
  const rotationAtDragStart = useRef(0);

  // Reset state when overlay opens
  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setHasUnlocked(false);
      setFadeOut(false);
    }
  }, [isOpen]);

  const getAngleFromCenter = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  }, []);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (hasUnlocked) return;
    setIsDragging(true);
    dragStartAngle.current = getAngleFromCenter(clientX, clientY);
    rotationAtDragStart.current = rotation;
  }, [getAngleFromCenter, rotation, hasUnlocked]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || hasUnlocked) return;
    const currentAngle = getAngleFromCenter(clientX, clientY);
    let delta = currentAngle - dragStartAngle.current;
    
    // Normalize delta to avoid jumps
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    
    let newRotation = rotationAtDragStart.current + delta;
    // Clamp between 0 and 185 (slight overshoot allowed)
    newRotation = Math.max(0, Math.min(185, newRotation));
    setRotation(newRotation);

    // Unlock at 180
    if (newRotation >= 175 && !hasUnlocked) {
      setHasUnlocked(true);
      setIsDragging(false);
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Brief pause then transition
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          onUnlock();
        }, 800);
      }, 400);
    }
  }, [isDragging, getAngleFromCenter, hasUnlocked, onUnlock]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Snap back if not unlocked
    if (!hasUnlocked && rotation < 175) {
      setRotation(0);
    }
  }, [isDragging, hasUnlocked, rotation]);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX, e.clientY);
  const onMouseUp = () => handleDragEnd();

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };
  const onTouchEnd = () => handleDragEnd();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !hasUnlocked) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasUnlocked, onClose]);

  if (!isOpen) return null;

  // How "unlocked" the rotation feels (0 to 1)
  const progress = Math.min(rotation / 180, 1);
  // Glow intensifies as you approach 180
  const glowIntensity = progress * 0.6;
  // Text color shifts from white to orange as you rotate
  const textR = Math.round(255);
  const textG = Math.round(255 - (255 - 122) * progress);
  const textB = Math.round(255 - 255 * progress);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: hasUnlocked && fadeOut
          ? '#000000'
          : `rgba(0, 0, 0, ${0.92 + glowIntensity * 0.08})`,
        transition: fadeOut ? 'background 0.8s ease' : 'background 0.1s ease',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Close hint */}
      {!hasUnlocked && (
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-white/20 hover:text-white/40 transition-colors text-sm tracking-widest"
        >
          ESC
        </button>
      )}

      {/* Rotating quote */}
      <div
        ref={containerRef}
        className="select-none"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          cursor: hasUnlocked ? 'default' : 'grab',
          opacity: fadeOut ? 0 : 1,
          transitionProperty: isDragging ? 'none' : 'transform, opacity',
          transitionDuration: fadeOut ? '0.8s' : isDragging ? '0s' : '0.6s',
        }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <p
          className="text-center font-serif leading-relaxed px-8 max-w-lg mx-auto"
          style={{
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            color: `rgb(${textR}, ${textG}, ${textB})`,
            textShadow: hasUnlocked 
              ? '0 0 30px rgba(255, 122, 0, 0.8)' 
              : `0 0 ${glowIntensity * 20}px rgba(255, 122, 0, ${glowIntensity * 0.5})`,
            letterSpacing: '0.02em',
            transition: 'text-shadow 0.3s ease',
          }}
        >
          the most entertaining satisfying outcome is most likely
        </p>
      </div>

      {/* Rotation indicator — subtle arc */}
      {!hasUnlocked && (
        <svg
          className="absolute pointer-events-none"
          width="280"
          height="280"
          style={{
            opacity: isDragging ? 0.3 : 0.08,
            transition: 'opacity 0.3s ease',
          }}
        >
          <circle
            cx="140"
            cy="140"
            r="130"
            fill="none"
            stroke="white"
            strokeWidth="1"
            strokeDasharray={`${(progress * 408).toFixed(1)} 817`}
            transform="rotate(-90 140 140)"
          />
        </svg>
      )}

      {/* Drag hint */}
      {!hasUnlocked && rotation === 0 && !isDragging && (
        <p
          className="absolute bottom-16 text-white/15 text-xs tracking-[0.3em] uppercase"
          style={{
            animation: 'breathe 3s ease-in-out infinite',
          }}
        >
          drag to turn
        </p>
      )}

      <style>{`
        @keyframes breathe {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default KeyholeOverlay;
