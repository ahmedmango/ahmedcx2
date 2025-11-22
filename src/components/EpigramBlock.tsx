import { useEffect, useRef, useState } from "react";

interface EpigramBlockProps {
  text: string;
  index: number;
  title?: string;
  isNew?: boolean;
}

const EpigramBlock = ({ text, index, title, isNew = false }: EpigramBlockProps) => {
  const articleRef = useRef<HTMLElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;

      const rect = articleRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate parallax offset based on element position
      // Only apply when element is near or in viewport
      if (rect.top < windowHeight && rect.bottom > 0) {
        const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
        const offset = Math.max(0, Math.min(1, progress)) * 30 - 15;
        setParallaxOffset(offset);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <article 
      ref={articleRef}
      className={`py-16 md:py-20 px-6 md:px-12 transition-opacity duration-700 ${isNew ? 'animate-fade-in' : ''}`}
      data-id={index}
      style={{
        transform: `translateY(${parallaxOffset}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      <div className="max-w-2xl mx-auto">
        {title && (
          <h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 md:mb-12"
            style={{ color: 'var(--body-text)' }}
          >
            {title}
          </h2>
        )}
        <p 
          className="text-xl md:text-2xl lg:text-3xl leading-relaxed md:leading-relaxed lg:leading-loose whitespace-pre-wrap"
          style={{ color: 'var(--body-text)' }}
        >
          {text}
        </p>
      </div>
    </article>
  );
};

export default EpigramBlock;