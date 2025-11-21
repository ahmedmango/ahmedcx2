interface EpigramBlockProps {
  text: string;
  index: number;
}

const EpigramBlock = ({ text, index }: EpigramBlockProps) => {
  return (
    <article 
      className="py-32 md:py-40 px-6 md:px-12 snap-start"
      data-index={index}
    >
      <div className="max-w-2xl mx-auto">
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