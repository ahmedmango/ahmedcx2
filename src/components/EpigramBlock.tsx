interface EpigramBlockProps {
  text: string;
  index: number;
}

const EpigramBlock = ({ text, index }: EpigramBlockProps) => {
  return (
    <article 
      className="min-h-screen flex items-center justify-center px-6 py-24"
      data-index={index}
    >
      <p className="max-w-2xl text-xl md:text-2xl leading-relaxed text-foreground">
        {text}
      </p>
    </article>
  );
};

export default EpigramBlock;