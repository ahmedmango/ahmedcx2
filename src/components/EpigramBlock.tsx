interface EpigramBlockProps {
  text: string;
  index: number;
  title?: string;
  fontScale?: number;
  imageUrl?: string;
}

const EpigramBlock = ({ text, index, title, fontScale = 1, imageUrl }: EpigramBlockProps) => {
  return (
    <article 
      className="py-16 md:py-20 px-6 md:px-12"
      data-id={index}
    >
      <div className="max-w-2xl mx-auto">
        {title && (
          <h2 
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-center mb-8 md:mb-12"
            style={{ 
              color: 'var(--body-text)',
              fontSize: `calc(3rem * ${fontScale})`,
            }}
          >
            {title}
          </h2>
        )}
        {imageUrl ? (
          <div className="flex justify-center">
            <img 
              src={imageUrl} 
              alt={title || 'Epigram image'}
              className="max-w-full h-auto rounded-lg"
              style={{ maxWidth: '600px' }}
            />
          </div>
        ) : (
          <p 
            className="text-xl md:text-2xl lg:text-3xl leading-relaxed md:leading-relaxed lg:leading-loose whitespace-pre-wrap"
            style={{ 
              color: 'var(--body-text)',
              fontSize: `calc(1.5rem * ${fontScale})`,
              lineHeight: `calc(2.25rem * ${fontScale})`
            }}
          >
            {text}
          </p>
        )}
      </div>
    </article>
  );
};

export default EpigramBlock;