import { useEffect, useState, useRef, useCallback } from "react";
import Header from "@/components/Header";
import EpigramBlock from "@/components/EpigramBlock";
import LoadingBar from "@/components/LoadingBar";
import KeyholeOverlay from "@/components/KeyholeOverlay";
import ThresholdGate from "@/components/ThresholdGate";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";

interface Epigram {
  id: number;
  text: string;
  thread_id: string;
  created_at: string;
  title?: string;
  image_url?: string;
}

interface SecretEpigram {
  id: number;
  text: string;
  title?: string;
  display_order: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [epigrams, setEpigrams] = useState<Epigram[]>([]);
  const [currentThread, setCurrentThread] = useState("#0000");
  const [loading, setLoading] = useState(true);
  const [fontScale, setFontScale] = useState(() => {
    const saved = localStorage.getItem('ahmed_font_scale');
    return saved ? parseFloat(saved) : 1;
  });
  const [secretEpigrams, setSecretEpigrams] = useState<SecretEpigram[]>([]);
  const { settings, loading: settingsLoading } = useSettings();

  // Easter egg state
  const [tapCount, setTapCount] = useState(0);
  const [showSecretButton, setShowSecretButton] = useState(false);
  const [keyholeOpen, setKeyholeOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [requireScrollReset, setRequireScrollReset] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Swipe-to-dismiss tracking
  const touchStartY = useRef<number | null>(null);
  const [dismissProgress, setDismissProgress] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);

  const handleTextSizeChange = (delta: number) => {
    setFontScale(prev => {
      const newScale = Math.max(0.6, Math.min(2, prev + delta));
      localStorage.setItem('ahmed_font_scale', newScale.toString());
      return newScale;
    });
  };

  // Track scroll to bottom (for reset requirement)
  useEffect(() => {
    if (!requireScrollReset) return;

    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      
      if (progress > 0.95) {
        setHasScrolledToBottom(true);
        setRequireScrollReset(false);
        setShowSecretButton(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [requireScrollReset]);

  // Tap counter for AHMED header
  const handleSecretTap = useCallback(() => {
    if (showSecretButton) return;
    if (requireScrollReset) return;
    
    setTapCount(prev => {
      const next = prev + 1;
      
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = setTimeout(() => setTapCount(0), 3000);
      
      if (next >= 5) {
        setShowSecretButton(true);
        if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      }
      
      return next;
    });
  }, [showSecretButton, requireScrollReset]);

  const handleSecretActivate = useCallback(() => {
    setKeyholeOpen(true);
  }, []);

  const handleKeyholeUnlock = useCallback(() => {
    setKeyholeOpen(false);
    setGateOpen(true);
  }, []);

  const handleKeyholeClose = useCallback(() => {
    setKeyholeOpen(false);
  }, []);

  const handleGatePass = useCallback(() => {
    setGateOpen(false);
    setSecretUnlocked(true);
    window.scrollTo(0, 0);
  }, []);

  const handleGateFail = useCallback(() => {
    setGateOpen(false);
    setShowSecretButton(false);
    setTapCount(0);
    setRequireScrollReset(true);
    setHasScrolledToBottom(false);
  }, []);

  const handleSecretTouchStart = useCallback((e: React.TouchEvent) => {
    if (!secretUnlocked) return;
    touchStartY.current = e.touches[0].clientY;
  }, [secretUnlocked]);

  const handleSecretTouchMove = useCallback((e: React.TouchEvent) => {
    if (!secretUnlocked || touchStartY.current === null) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      setDismissProgress(Math.min(deltaY / 250, 1));
    }
  }, [secretUnlocked]);

  const handleSecretTouchEnd = useCallback(() => {
    if (!secretUnlocked) return;
    if (dismissProgress > 0.4) {
      setIsDismissing(true);
      setTimeout(() => {
        setSecretUnlocked(false);
        setIsDismissing(false);
        setDismissProgress(0);
        setShowSecretButton(false);
        setTapCount(0);
      }, 500);
    } else {
      setDismissProgress(0);
    }
    touchStartY.current = null;
  }, [secretUnlocked, dismissProgress]);

  const handleDesktopClose = useCallback(() => {
    setIsDismissing(true);
    setTimeout(() => {
      setSecretUnlocked(false);
      setIsDismissing(false);
      setDismissProgress(0);
      setShowSecretButton(false);
      setTapCount(0);
    }, 500);
  }, []);

  useEffect(() => {
    loadEpigrams();
    loadSecretEpigrams();
  }, []);

  useEffect(() => {
    if (epigrams.length === 0) return;

    let ticking = false;

    const updateCurrentThreadFromScroll = () => {
      const articles = document.querySelectorAll<HTMLElement>('article[data-id]');
      if (!articles.length) return;

      const viewportCenter = window.innerHeight / 2;
      let bestId: number | null = null;
      let smallestDistance = Infinity;

      articles.forEach((article) => {
        const rect = article.getBoundingClientRect();
        const articleCenter = rect.top + rect.height / 2;
        const distance = Math.abs(articleCenter - viewportCenter);

        if (distance < smallestDistance) {
          smallestDistance = distance;
          const idAttr = article.getAttribute('data-id') || '0';
          bestId = parseInt(idAttr, 10);
        }
      });

      if (bestId !== null && !Number.isNaN(bestId)) {
        const nextThread = `#${String(bestId).padStart(4, '0')}`;
        setCurrentThread((prev) => (prev === nextThread ? prev : nextThread));
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateCurrentThreadFromScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateCurrentThreadFromScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [epigrams]);

  const loadEpigrams = async () => {
    try {
      const { data, error } = await supabase
        .from('epigrams')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setEpigrams(data || []);
    } catch (error) {
      console.error('Error loading epigrams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecretEpigrams = async () => {
    try {
      const { data, error } = await supabase
        .from('secret_epigrams')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSecretEpigrams(data || []);
    } catch (error) {
      console.error('Error loading secret epigrams:', error);
    }
  };

  if (loading) {
    return <LoadingBar color={settings.loading_bar_color} />;
  }

  return (
    <>
      <KeyholeOverlay
        isOpen={keyholeOpen}
        onUnlock={handleKeyholeUnlock}
        onClose={handleKeyholeClose}
      />

      <ThresholdGate
        isOpen={gateOpen}
        onPass={handleGatePass}
        onFail={handleGateFail}
      />

      {secretUnlocked && (
        <div
          className="fixed inset-0 z-[90] overflow-y-auto"
          style={{
            background: '#000000',
            opacity: isDismissing ? 0 : 1 - dismissProgress * 0.5,
            transform: `translateY(${dismissProgress * 80}px)`,
            transition: isDismissing 
              ? 'opacity 0.5s ease, transform 0.5s ease' 
              : dismissProgress > 0 ? 'none' : 'opacity 0.8s ease',
          }}
          onTouchStart={handleSecretTouchStart}
          onTouchMove={handleSecretTouchMove}
          onTouchEnd={handleSecretTouchEnd}
        >
          <div 
            className="fixed inset-0 pointer-events-none opacity-[0.03] z-[91]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
          <div 
            className="fixed inset-0 pointer-events-none z-[91]"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
            }}
          />
          <div className="fixed top-6 left-0 right-0 z-[95] flex justify-center pointer-events-none">
            <div 
              className="w-10 h-1 rounded-full bg-orange-500/30"
              style={{ animation: 'breathe 3s ease-in-out infinite' }}
            />
          </div>
          <button
            onClick={handleDesktopClose}
            className="fixed top-8 right-8 z-[95] text-orange-500/20 hover:text-orange-500/50 transition-colors text-xs tracking-[0.3em] uppercase"
          >
            CLOSE
          </button>
          <div className="relative z-[92] min-h-screen px-5 py-24">
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
          <style>{`
            @keyframes breathe {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.6; }
            }
          `}</style>
        </div>
      )}

      <div
        style={{
          opacity: secretUnlocked ? 0 : 1,
          pointerEvents: secretUnlocked ? 'none' : 'auto',
          transition: 'opacity 0.5s ease',
        }}
      >
        <div 
          className="relative min-h-screen pt-32"
          style={{
            '--header-text': `hsl(${settings.header_text_color})`,
            '--thread-number': `hsl(${settings.thread_number_color})`,
            '--progress-bar': `hsl(${settings.progress_bar_color})`,
            '--body-text': `hsl(${settings.body_text_color})`,
          } as React.CSSProperties}
        >
          <Header 
            currentThread={currentThread} 
            onTextSizeChange={handleTextSizeChange}
            showSecretButton={showSecretButton}
            onSecretTap={handleSecretTap}
            onSecretActivate={handleSecretActivate}
          />

          {epigrams.length === 0 ? (
            <div className="h-screen flex items-center justify-center px-6">
              <div className="text-center space-y-4">
                <p className="text-xl text-muted-foreground">No epigrams yet.</p>
                <Button onClick={() => navigate("/admin")}>
                  Go to Admin
                </Button>
              </div>
            </div>
          ) : (
            epigrams.map((epigram, index) => (
              <EpigramBlock
                key={epigram.id}
                text={epigram.text}
                title={epigram.title}
                index={index + 1}
                fontScale={fontScale}
                imageUrl={epigram.image_url}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Index;
