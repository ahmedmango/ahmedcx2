import { useEffect, useState } from 'react';

interface SecretBrainModeProps {
  isActive: boolean;
  children: React.ReactNode;
}

const SecretBrainMode = ({ isActive, children }: SecretBrainModeProps) => {
  const [phase, setPhase] = useState<'normal' | 'falling' | 'transitioning' | 'secret'>('normal');
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    if (isActive && phase === 'normal') {
      // Start falling animation
      setPhase('falling');
      
      // After falling completes, start transition
      const transitionTimer = setTimeout(() => {
        setShowContent(false);
        setPhase('transitioning');
        
        // After transition, enter secret mode
        const secretTimer = setTimeout(() => {
          setPhase('secret');
          setShowContent(true);
        }, 600);
        
        return () => clearTimeout(secretTimer);
      }, 1000);
      
      return () => clearTimeout(transitionTimer);
    } else if (!isActive && phase !== 'normal') {
      // Exit secret mode - fade out and reset
      setPhase('transitioning');
      setShowContent(false);
      
      const resetTimer = setTimeout(() => {
        setPhase('normal');
        setShowContent(true);
      }, 500);
      
      return () => clearTimeout(resetTimer);
    }
  }, [isActive, phase]);

  return (
    <>
      {/* Secret brain mode background overlay */}
      <div 
        className={`fixed inset-0 z-40 pointer-events-none transition-opacity duration-700 ${
          phase === 'secret' || phase === 'transitioning' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: phase === 'secret' ? '#000000' : 'transparent',
        }}
      >
        {/* Subtle animated background for secret mode */}
        {phase === 'secret' && (
          <>
            {/* Slow pulsing gradient */}
            <div 
              className="absolute inset-0 animate-pulse"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(255, 122, 24, 0.03) 0%, transparent 70%)',
                animationDuration: '4s',
              }}
            />
            {/* Subtle noise texture */}
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />
            {/* Organic neural curves */}
            <svg 
              className="absolute inset-0 w-full h-full opacity-[0.04]"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M0,50 Q25,30 50,50 T100,50"
                fill="none"
                stroke="#ff7a18"
                strokeWidth="0.2"
                className="animate-[neuralPulse_8s_ease-in-out_infinite]"
              />
              <path
                d="M0,30 Q35,50 50,30 T100,30"
                fill="none"
                stroke="#ff7a18"
                strokeWidth="0.15"
                className="animate-[neuralPulse_10s_ease-in-out_infinite_reverse]"
              />
              <path
                d="M0,70 Q30,90 50,70 T100,70"
                fill="none"
                stroke="#ff7a18"
                strokeWidth="0.15"
                className="animate-[neuralPulse_12s_ease-in-out_infinite]"
              />
            </svg>
          </>
        )}
      </div>

      {/* Content wrapper */}
      <div 
        className={`relative z-50 transition-opacity duration-500 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          // Apply falling animation to content
          ...(phase === 'falling' ? {
            animation: 'contentFall 1s ease-in forwards',
          } : {}),
          // Apply secret mode styling
          ...(phase === 'secret' ? {
            '--body-text': '#ff7a18',
            '--header-text': '#ff7a18',
            '--thread-number': '#ff7a18',
            '--progress-bar': '#ff7a18',
          } as React.CSSProperties : {}),
        }}
      >
        {children}
      </div>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes contentFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(120vh) rotate(3deg);
            opacity: 0;
          }
        }

        @keyframes neuralPulse {
          0%, 100% {
            opacity: 0.04;
            transform: translateY(0);
          }
          50% {
            opacity: 0.08;
            transform: translateY(2px);
          }
        }

        /* Individual falling elements with variation */
        .falling-text {
          animation: textFall var(--fall-duration, 1s) ease-in forwards;
          animation-delay: var(--fall-delay, 0s);
        }

        @keyframes textFall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(120vh) translateX(var(--drift-x, 0px)) rotate(var(--drift-rotate, 0deg));
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default SecretBrainMode;
