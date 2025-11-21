interface EpigramBlockProps {
  text: string;
  index: number;
}

const EpigramBlock = ({ text, index }: EpigramBlockProps) => {
  return (
    <article 
      className="h-screen flex items-center justify-center px-6 md:px-12 snap-start snap-always"
      data-index={index}
    >
      <div className="max-w-2xl w-full">
        <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed md:leading-relaxed lg:leading-loose text-foreground">
          {text}
        </p>
      </div>
    </article>
  );
};

export default EpigramBlock;