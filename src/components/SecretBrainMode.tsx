import { useEffect, useState } from 'react';

interface SecretEpigram {
  id: number;
  text: string;
  title?: string;
  display_order: number;
}

interface SecretBrainModeProps {
  isActivated: boolean;
  secretEpigrams: SecretEpigram[];
  children: React.ReactNode;
}

const SecretBrainMode = ({ isActivated, secretEpigrams, children }: SecretBrainModeProps) => {
  const [phase, setPhase] = useState<'normal' | 'falling' | 'revealed'>('normal');

  useEffect(() => {
    if (isActivated && phase === 'normal') {
      // Start falling animation
      setPhase('falling');
      
      // After fall completes, reveal dark thread
      const revealTimer = setTimeout(() => {
        setPhase('revealed');
      }, 1800);
      
      return () => clearTimeout(revealTimer);
    }
  }, [isActivated, phase]);

  return (
    <>
      {/* Dark thread layer (underneath) */}
      <section 
        className={`fixed inset-0 z-40 overflow-y-auto transition-all duration-1000 ease-out ${
          phase === 'revealed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{
          background: '#000000',
        }}
      >
        {/* Noise overlay */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.03] z-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Vignette */}
        <div 
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
          }}
        />
        
        {/* Slow parallax drift background */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.08] z-40"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, #FF7A00 50%, transparent 100%)',
            backgroundSize: '100% 200%',
            animation: 'parallaxDrift 8s ease-in-out infinite',
          }}
        />
        
        {/* Content */}
        <div 
          className="relative z-60 min-h-screen px-5 py-24"
        >
          <div 
            className="max-w-[680px] mx-auto w-full space-y-24"
            style={{
              color: '#FF7A00',
              fontFamily: '"Courier New", Courier, monospace',
              lineHeight: 1.7,
              textShadow: '0 0 12px rgba(255, 122, 0, 0.25)',
            }}
          >
            {secretEpigrams.length === 0 ? (
              <p className="text-lg opacity-50 text-center">No secret threads yet...</p>
            ) : (
              secretEpigrams.map((epigram, index) => (
                <article key={epigram.id} className="space-y-4">
                  <div className="text-xs opacity-40 font-mono">
                    #{String(index + 1).padStart(4, '0')}
                  </div>
                  {epigram.title && (
                    <h2 className="text-2xl font-bold">{epigram.title}</h2>
                  )}
                  <div 
                    className="text-lg whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: epigram.text }}
                  />
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Public content (falls away) */}
      <div 
        className={`relative z-50 transition-all ease-in ${
          phase === 'falling' || phase === 'revealed' ? 'fall-away' : ''
        }`}
        style={{
          transitionDuration: '1.8s',
          transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {children}
      </div>

      {/* Keyframe animations */}
      <style>{`
        .fall-away {
          transform: translateY(120vh) rotateX(25deg);
          opacity: 0;
        }

        @keyframes parallaxDrift {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </>
  );
};

export default SecretBrainMode;
