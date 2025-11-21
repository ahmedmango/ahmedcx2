import { useEffect, useState } from "react";
import Header from "@/components/Header";
import EpigramBlock from "@/components/EpigramBlock";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    loadEpigrams();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      const articles = document.querySelectorAll('article[data-index]');
      
      articles.forEach((article) => {
        const rect = article.getBoundingClientRect();
        const articleTop = window.scrollY + rect.top;
        const articleBottom = articleTop + rect.height;
        
        if (scrollPosition >= articleTop && scrollPosition < articleBottom) {
          const index = parseInt(article.getAttribute('data-index') || '0');
          setCurrentThread(`#${String(index).padStart(4, '0')}`);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
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
    <div className="relative">
      <Header currentThread={currentThread} />
      
      {/* Admin button - subtle and fixed */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin")}
        className="fixed bottom-6 right-6 z-40 opacity-30 hover:opacity-100 transition-opacity"
      >
        Admin
      </Button>

      {epigrams.length === 0 ? (
        <div className="min-h-screen flex items-center justify-center px-6">
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