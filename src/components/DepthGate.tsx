import { useState, useCallback, useRef, useEffect } from 'react';

interface DepthGateProps {
  onUnlock: () => void;
}

interface CornerState {
  rotation: number; // 0, 90, 180, 270
  lastTap: number;
}

const DOUBLE_TAP_THRESHOLD = 400; // ms

const DepthGate = ({ onUnlock }: DepthGateProps) => {
  const [corners, setCorners] = useState<Record<string, CornerState>>({
    topLeft: { rotation: 0, lastTap: 0 },
    topRight: { rotation: 0, lastTap: 0 },
    bottomLeft: { rotation: 0, lastTap: 0 },
    bottomRight: { rotation: 0, lastTap: 0 },
  });
  const [unlocked, setUnlocked] = useState(false);
  const unlockCheckedRef = useRef(false);

  // Check if all corners are at 180°
  useEffect(() => {
    if (unlockCheckedRef.current) return;
    const allFlipped = Object.values(corners).every(c => c.rotation === 180);
    if (allFlipped) {
      unlockCheckedRef.current = true;
      setUnlocked(true);
      // Haptic
      if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
      setTimeout(() => onUnlock(), 1200);
    }
  }, [corners, onUnlock]);

  const handleTap = useCallback((corner: string) => {
    if (unlocked) return;
    
    setCorners(prev => {
      const now = Date.now();
      const state = prev[corner];
      
      if (now - state.lastTap < DOUBLE_TAP_THRESHOLD) {
        // Double tap — rotate 90° CCW
        const newRotation = (state.rotation + 90) % 360;
        return {
          ...prev,
          [corner]: { rotation: newRotation, lastTap: 0 },
        };
      } else {
        // First tap — record time
        return {
          ...prev,
          [corner]: { ...state, lastTap: now },
        };
      }
    });
  }, [unlocked]);

  const cornerPositions: Record<string, { top?: string; bottom?: string; left?: string; right?: string }> = {
    topLeft: { top: '24px', left: '24px' },
    topRight: { top: '24px', right: '24px' },
    bottomLeft: { bottom: '24px', left: '24px' },
    bottomRight: { bottom: '24px', right: '24px' },
  };

  return (
    <>
      {Object.entries(corners).map(([key, state]) => (
        <button
          key={key}
          onClick={() => handleTap(key)}
          className="fixed z-[94] select-none"
          style={{
            ...cornerPositions[key],
            transform: `rotate(${-state.rotation}deg)`,
            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
            opacity: state.rotation === 180 ? 0.8 : 0.15,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: '12px',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span
            style={{
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '14px',
              color: state.rotation === 180 ? '#FF7A00' : '#FF7A00',
              letterSpacing: '0.05em',
              textShadow: state.rotation === 180 ? '0 0 12px rgba(255, 122, 0, 0.4)' : 'none',
            }}
          >
            ΔV
          </span>
        </button>
      ))}

      {/* Unlock flash */}
      {unlocked && (
        <div
          className="fixed inset-0 z-[96] pointer-events-none"
          style={{
            background: 'rgba(255, 122, 0, 0.05)',
            animation: 'depthFlash 1.2s ease forwards',
          }}
        />
      )}

      <style>{`
        @keyframes depthFlash {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
};

export default DepthGate;
