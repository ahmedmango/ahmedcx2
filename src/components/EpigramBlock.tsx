import { memo, useEffect, useRef, useState } from "react";

interface EpigramBlockProps {
  text: string;
  index: number;
  title?: string;
}

const EpigramBlock = memo(({ text, index, title }: EpigramBlockProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (articleRef.current) {
      observer.observe(articleRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <article 
      ref={articleRef}
      className="py-16 md:py-20 px-6 md:px-12"
      data-id={index}
    >
      {isVisible ? (
        <div className="max-w-2xl mx-auto">
          {title && (
            <h2 
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-center mb-8 md:mb-12"
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
      ) : (
        <div className="max-w-2xl mx-auto min-h-[200px]" />
      )}
    </article>
  );
});

EpigramBlock.displayName = 'EpigramBlock';

export default EpigramBlock;