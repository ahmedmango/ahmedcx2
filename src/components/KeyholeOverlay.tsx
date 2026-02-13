import { useState, useRef, useCallback, useEffect } from 'react';

interface KeyholeOverlayProps {
  isOpen: boolean;
  quoteText: string;
  onUnlock: () => void;
  onClose: () => void;
}

const KeyholeOverlay = ({ isOpen, quoteText, onUnlock, onClose }: KeyholeOverlayProps) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasUnlocked, setHasUnlocked] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartAngle = useRef(0);
  const rotationAtDragStart = useRef(0);

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
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    let newRotation = rotationAtDragStart.current + delta;
    newRotation = Math.max(0, Math.min(185, newRotation));
    setRotation(newRotation);

    if (newRotation >= 175 && !hasUnlocked) {
      setHasUnlocked(true);
      setIsDragging(false);
      if (navigator.vibrate) navigator.vibrate(50);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => onUnlock(), 800);
      }, 400);
    }
  }, [isDragging, getAngleFromCenter, hasUnlocked, onUnlock]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!hasUnlocked && rotation < 175) setRotation(0);
  }, [isDragging, hasUnlocked, rotation]);

  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX, e.clientY);
  const onMouseUp = () => handleDragEnd();
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleDragEnd();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !hasUnlocked) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasUnlocked, onClose]);

  if (!isOpen) return null;

  const progress = Math.min(rotation / 180, 1);
  const glowIntensity = progress * 0.6;
  const textR = 255;
  const textG = Math.round(255 - (255 - 122) * progress);
  const textB = Math.round(255 - 255 * progress);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: hasUnlocked && fadeOut ? '#000000' : `rgba(0, 0, 0, ${0.92 + glowIntensity * 0.08})`,
        transition: fadeOut ? 'background 0.8s ease' : 'background 0.1s ease',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {!hasUnlocked && (
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-white/20 hover:text-white/40 transition-colors text-sm tracking-widest"
        >
          ESC
        </button>
      )}

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
          {quoteText}
        </p>
      </div>

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
    </div>
  );
};

export default KeyholeOverlay;
