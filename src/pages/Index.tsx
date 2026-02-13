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

interface Epigram { id: number; text: string; thread_id: string; created_at: string; title?: string; image_url?: string; }
interface SecretEpigram { id: number; text: string; title?: string; display_order: number; }
interface DepthContent { id: number; text: string; title?: string; display_order: number; }

const DeltaCorner = ({ position, rotation, onDoubleTap }: { position: string; rotation: number; onDoubleTap: () => void; }) => {
  const lastTapRef = useRef(0);
  const pos: Record<string, React.CSSProperties> = {
    'top-left': { top: 20, left: 20 }, 'top-right': { top: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 }, 'bottom-right': { bottom: 20, right: 20 },
  };
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) { onDoubleTap(); lastTapRef.current = 0; }
    else lastTapRef.current = now;
  };
  const isFlipped = rotation >= 180;
  return (
    <div className="fixed z-[96] select-none cursor-pointer" style={{ ...pos[position], transform: `rotate(-${rotation}deg)`, transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }} onClick={handleTap}>
      <span className="font-mono text-sm tracking-wider" style={{ color: isFlipped ? '#FF7A00' : 'rgba(255, 122, 0, 0.15)', textShadow: isFlipped ? '0 0 12px rgba(255, 122, 0, 0.4)' : 'none', transition: 'color 0.6s ease, text-shadow 0.6s ease' }}>ΔV</span>
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [epigrams, setEpigrams] = useState<Epigram[]>([]);
  const [currentThread, setCurrentThread] = useState("#0000");
  const [loading, setLoading] = useState(true);
  const [fontScale, setFontScale] = useState(() => { const s = localStorage.getItem('ahmed_font_scale'); return s ? parseFloat(s) : 1; });
  const [secretEpigrams, setSecretEpigrams] = useState<SecretEpigram[]>([]);
  const [depthContent, setDepthContent] = useState<DepthContent[]>([]);
  const { settings } = useSettings();

  const [tapCount, setTapCount] = useState(0);
  const [showSecretButton, setShowSecretButton] = useState(false);
  const [keyholeOpen, setKeyholeOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [requireScrollReset, setRequireScrollReset] = useState(false);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [deltaRotations, setDeltaRotations] = useState([0, 0, 0, 0]);
  const [depthUnlocked, setDepthUnlocked] = useState(false);
  const [depthFadeIn, setDepthFadeIn] = useState(false);

  const touchStartY = useRef<number | null>(null);
  const [dismissProgress, setDismissProgress] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);

  const handleTextSizeChange = (delta: number) => {
    setFontScale(prev => { const n = Math.max(0.6, Math.min(2, prev + delta)); localStorage.setItem('ahmed_font_scale', n.toString()); return n; });
  };

  useEffect(() => {
    if (deltaRotations.every(r => r >= 180) && !depthUnlocked) {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
      setTimeout(() => { setDepthUnlocked(true); setTimeout(() => setDepthFadeIn(true), 50); }, 600);
    }
  }, [deltaRotations, depthUnlocked]);

  const handleDeltaDoubleTap = (index: number) => {
    setDeltaRotations(prev => { const next = [...prev]; next[index] = Math.min(prev[index] + 90, 180); return next; });
  };

  useEffect(() => {
    if (!requireScrollReset) return;
    const h = () => {
      const d = document.documentElement; const st = d.scrollTop || document.body.scrollTop; const sh = d.scrollHeight - d.clientHeight;
      if (sh > 0 && st / sh > 0.95) { setRequireScrollReset(false); setShowSecretButton(true); }
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [requireScrollReset]);

  const handleSecretTap = useCallback(() => {
    if (showSecretButton || requireScrollReset) return;
    setTapCount(prev => {
      const next = prev + 1;
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = setTimeout(() => setTapCount(0), 3000);
      if (next >= 5) { setShowSecretButton(true); if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current); }
      return next;
    });
  }, [showSecretButton, requireScrollReset]);

  const handleSecretActivate = useCallback(() => setKeyholeOpen(true), []);
  const handleKeyholeUnlock = useCallback(() => { setKeyholeOpen(false); setGateOpen(true); }, []);
  const handleKeyholeClose = useCallback(() => setKeyholeOpen(false), []);
  const handleGatePass = useCallback(() => { setGateOpen(false); setSecretUnlocked(true); setDeltaRotations([0,0,0,0]); setDepthUnlocked(false); setDepthFadeIn(false); window.scrollTo(0,0); }, []);
  const handleGateFail = useCallback(() => { setGateOpen(false); setShowSecretButton(false); setTapCount(0); setRequireScrollReset(true); }, []);

  const handleSecretTouchStart = useCallback((e: React.TouchEvent) => { if (secretUnlocked) touchStartY.current = e.touches[0].clientY; }, [secretUnlocked]);
  const handleSecretTouchMove = useCallback((e: React.TouchEvent) => { if (!secretUnlocked || touchStartY.current === null) return; const d = e.touches[0].clientY - touchStartY.current; if (d > 0) setDismissProgress(Math.min(d / 250, 1)); }, [secretUnlocked]);
  const handleSecretTouchEnd = useCallback(() => {
    if (!secretUnlocked) return;
    if (dismissProgress > 0.4) { setIsDismissing(true); setTimeout(() => { setSecretUnlocked(false); setDepthUnlocked(false); setDepthFadeIn(false); setIsDismissing(false); setDismissProgress(0); setShowSecretButton(false); setTapCount(0); }, 500); }
    else setDismissProgress(0);
    touchStartY.current = null;
  }, [secretUnlocked, dismissProgress]);

  const handleDesktopClose = useCallback(() => {
    if (depthUnlocked) { setDepthFadeIn(false); setTimeout(() => { setDepthUnlocked(false); setDeltaRotations([0,0,0,0]); }, 500); return; }
    setIsDismissing(true);
    setTimeout(() => { setSecretUnlocked(false); setIsDismissing(false); setDismissProgress(0); setShowSecretButton(false); setTapCount(0); }, 500);
  }, [depthUnlocked]);

  useEffect(() => { loadEpigrams(); loadSecretEpigrams(); loadDepthContent(); }, []);

  useEffect(() => {
    if (epigrams.length === 0) return;
    let ticking = false;
    const update = () => {
      const articles = document.querySelectorAll<HTMLElement>('article[data-id]');
      if (!articles.length) return;
      const vc = window.innerHeight / 2; let bestId: number | null = null; let sd = Infinity;
      articles.forEach(a => { const r = a.getBoundingClientRect(); const d = Math.abs(r.top + r.height/2 - vc); if (d < sd) { sd = d; bestId = parseInt(a.getAttribute('data-id')||'0',10); } });
      if (bestId !== null && !Number.isNaN(bestId)) { const nt = `#${String(bestId).padStart(4,'0')}`; setCurrentThread(p => p === nt ? p : nt); }
      ticking = false;
    };
    const h = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', h, { passive: true }); update();
    return () => window.removeEventListener('scroll', h);
  }, [epigrams]);

  const loadEpigrams = async () => { try { const { data, error } = await supabase.from('epigrams').select('*').order('display_order', { ascending: true }); if (error) throw error; setEpigrams(data || []); } catch (e) { console.error(e); } finally { setLoading(false); } };
  const loadSecretEpigrams = async () => { try { const { data, error } = await supabase.from('secret_epigrams').select('*').order('display_order', { ascending: true }); if (error) throw error; setSecretEpigrams(data || []); } catch (e) { console.error(e); } };
  const loadDepthContent = async () => { try { const { data, error } = await supabase.from('depth_content').select('*').order('display_order', { ascending: true }); if (error) throw error; setDepthContent(data || []); } catch (e) { console.error(e); } };

  if (loading) return <LoadingBar color={settings.loading_bar_color} />;

  const keyholeQuote = (settings as any).keyhole_quote || 'the most entertaining satisfying outcome is most likely';

  return (
    <>
      <KeyholeOverlay isOpen={keyholeOpen} quoteText={keyholeQuote} onUnlock={handleKeyholeUnlock} onClose={handleKeyholeClose} />
      <ThresholdGate isOpen={gateOpen} onPass={handleGatePass} onFail={handleGateFail} />

      {secretUnlocked && (
        <div className="fixed inset-0 z-[90] overflow-y-auto" style={{ background: '#000', opacity: isDismissing ? 0 : 1 - dismissProgress * 0.5, transform: `translateY(${dismissProgress * 80}px)`, transition: isDismissing ? 'opacity 0.5s, transform 0.5s' : dismissProgress > 0 ? 'none' : 'opacity 0.8s' }}
          onTouchStart={handleSecretTouchStart} onTouchMove={handleSecretTouchMove} onTouchEnd={handleSecretTouchEnd}>
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[91]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
          <div className="fixed inset-0 pointer-events-none z-[91]" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)' }} />
          <div className="fixed top-6 left-0 right-0 z-[95] flex justify-center pointer-events-none"><div className="w-10 h-1 rounded-full bg-orange-500/30" style={{ animation: 'breathe 3s ease-in-out infinite' }} /></div>
          <button onClick={handleDesktopClose} className="fixed top-8 right-8 z-[95] text-orange-500/20 hover:text-orange-500/50 transition-colors text-xs tracking-[0.3em] uppercase">CLOSE</button>

          <DeltaCorner position="top-left" rotation={deltaRotations[0]} onDoubleTap={() => handleDeltaDoubleTap(0)} />
          <DeltaCorner position="top-right" rotation={deltaRotations[1]} onDoubleTap={() => handleDeltaDoubleTap(1)} />
          <DeltaCorner position="bottom-left" rotation={deltaRotations[2]} onDoubleTap={() => handleDeltaDoubleTap(2)} />
          <DeltaCorner position="bottom-right" rotation={deltaRotations[3]} onDoubleTap={() => handleDeltaDoubleTap(3)} />

          <div className="relative z-[92] min-h-screen px-5 py-24">
            <div className="max-w-[680px] mx-auto w-full space-y-24" style={{ color: '#FF7A00', fontFamily: '"Courier New", Courier, monospace', lineHeight: 1.7, textShadow: '0 0 12px rgba(255, 122, 0, 0.25)' }}>
              {secretEpigrams.length === 0 ? <p className="text-lg opacity-50 text-center">No secret threads yet...</p> :
                secretEpigrams.map((ep, i) => (
                  <article key={ep.id} className="space-y-4">
                    <div className="text-xs opacity-40 font-mono">#{String(i+1).padStart(4,'0')}</div>
                    {ep.title && <h2 className="text-2xl font-bold">{ep.title}</h2>}
                    <div className="text-lg whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: ep.text }} />
                  </article>
                ))}
            </div>
          </div>

          {depthUnlocked && (
            <div className="fixed inset-0 z-[97] overflow-y-auto" style={{ background: '#000', opacity: depthFadeIn ? 1 : 0, transition: 'opacity 0.8s ease' }}>
              <button onClick={handleDesktopClose} className="fixed top-8 right-8 z-[99] text-white/20 hover:text-white/40 transition-colors text-xs tracking-[0.3em] uppercase">CLOSE</button>
              <div className="relative z-[98] min-h-screen flex items-center justify-center px-5 py-24">
                <div className="max-w-[680px] mx-auto w-full space-y-16 text-center">
                  <div className="space-y-4">
                    <h1 className="font-mono text-4xl tracking-[0.3em]" style={{ color: '#FFF', textShadow: '0 0 30px rgba(255,255,255,0.2)' }}>ΔV</h1>
                    <div className="w-16 h-[1px] bg-white/20 mx-auto" />
                  </div>
                  <div className="space-y-16 text-left" style={{ color: '#FFF', fontFamily: '"Courier New", Courier, monospace', lineHeight: 1.8, opacity: 0.8 }}>
                    {depthContent.length === 0 ? <p className="text-lg opacity-30 text-center font-mono">This space awaits.</p> :
                      depthContent.map(item => (
                        <article key={item.id} className="space-y-4">
                          {item.title && <h2 className="text-xl font-bold text-white">{item.title}</h2>}
                          <div className="text-base whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: item.text }} />
                        </article>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <style>{`@keyframes breathe { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }`}</style>
        </div>
      )}

      <div style={{ opacity: secretUnlocked ? 0 : 1, pointerEvents: secretUnlocked ? 'none' : 'auto', transition: 'opacity 0.5s ease' }}>
        <div className="relative min-h-screen pt-32" style={{ '--header-text': `hsl(${settings.header_text_color})`, '--thread-number': `hsl(${settings.thread_number_color})`, '--progress-bar': `hsl(${settings.progress_bar_color})`, '--body-text': `hsl(${settings.body_text_color})` } as React.CSSProperties}>
          <Header currentThread={currentThread} onTextSizeChange={handleTextSizeChange} showSecretButton={showSecretButton} onSecretTap={handleSecretTap} onSecretActivate={handleSecretActivate} />
          {epigrams.length === 0 ? (
            <div className="h-screen flex items-center justify-center px-6"><div className="text-center space-y-4"><p className="text-xl text-muted-foreground">No epigrams yet.</p><Button onClick={() => navigate("/admin")}>Go to Admin</Button></div></div>
          ) : epigrams.map((ep, i) => <EpigramBlock key={ep.id} text={ep.text} title={ep.title} index={i+1} fontScale={fontScale} imageUrl={ep.image_url} />)}
        </div>
      </div>
    </>
  );
};

export default Index;
