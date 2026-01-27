import { useEffect, useState } from "react";
import Header from "@/components/Header";
import EpigramBlock from "@/components/EpigramBlock";
import LoadingBar from "@/components/LoadingBar";
import SecretBrainMode from "@/components/SecretBrainMode";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";

interface Epigram {
  id: number;
  text: string;
  thread_id: string;
  created_at: string;
  title?: string;
  image_url?: string;
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
  const { settings, loading: settingsLoading } = useSettings();
  const { isUpsideDown } = useDeviceOrientation(600);

  const handleTextSizeChange = (delta: number) => {
    setFontScale(prev => {
      const newScale = Math.max(0.6, Math.min(2, prev + delta));
      localStorage.setItem('ahmed_font_scale', newScale.toString());
      return newScale;
    });
  };

  useEffect(() => {
    loadEpigrams();
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

  if (loading) {
    return <LoadingBar color={settings.loading_bar_color} />;
  }

  return (
    <SecretBrainMode isActive={isUpsideDown}>
      <div 
        className="relative min-h-screen pt-32"
        style={{
          '--header-text': `hsl(${settings.header_text_color})`,
          '--thread-number': `hsl(${settings.thread_number_color})`,
          '--progress-bar': `hsl(${settings.progress_bar_color})`,
          '--body-text': `hsl(${settings.body_text_color})`,
        } as React.CSSProperties}
      >
        <Header currentThread={currentThread} onTextSizeChange={handleTextSizeChange} />

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
    </SecretBrainMode>
  );
};

export default Index;