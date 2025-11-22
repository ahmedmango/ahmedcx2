import { useEffect, useState } from "react";
import Header from "@/components/Header";
import EpigramBlock from "@/components/EpigramBlock";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";

interface Epigram {
  id: number;
  text: string;
  thread_id: string;
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [epigrams, setEpigrams] = useState<Epigram[]>([]);
  const [currentThread, setCurrentThread] = useState("#0000");
  const [loading, setLoading] = useState(true);
  const { settings, loading: settingsLoading } = useSettings();

  useEffect(() => {
    loadEpigrams();
  }, []);

  useEffect(() => {
    if (epigrams.length === 0) return;

    const articles = document.querySelectorAll<HTMLElement>('article[data-index]');

    const observer = new IntersectionObserver(
      (entries) => {
        let bestEntry: IntersectionObserverEntry | null = null;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
            bestEntry = entry;
          }
        }

        if (!bestEntry) return;

        const indexAttr = (bestEntry.target as HTMLElement).getAttribute('data-index') || '0';
        const index = parseInt(indexAttr, 10);

        setCurrentThread(`#${String(index).padStart(4, '0')}`);
      },
      {
        threshold: [0.2, 0.4, 0.6],
      }
    );

    articles.forEach((article) => observer.observe(article));

    return () => {
      observer.disconnect();
    };
  }, [epigrams]);

  const loadEpigrams = async () => {
    try {
      const { data, error } = await supabase
        .from('epigrams')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setEpigrams(data || []);
    } catch (error) {
      console.error('Error loading epigrams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="relative min-h-screen"
      style={{
        '--header-text': `hsl(${settings.header_text_color})`,
        '--thread-number': `hsl(${settings.thread_number_color})`,
        '--progress-bar': `hsl(${settings.progress_bar_color})`,
        '--body-text': `hsl(${settings.body_text_color})`,
      } as React.CSSProperties}
    >
      <Header currentThread={currentThread} />

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
            index={index}
          />
        ))
      )}
    </div>
  );
};

export default Index;