interface EpigramBlockProps {
  text: string;
  index: number;
  title?: string;
}

const EpigramBlock = ({ text, index, title }: EpigramBlockProps) => {
  return (
    <article 
      className="py-16 md:py-20 px-6 md:px-12"
      data-id={index}
    >
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
    </article>
  );
};

export default EpigramBlock;