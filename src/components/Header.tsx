import { useState, useEffect } from "react";

interface HeaderProps {
  currentThread?: string;
}

const Header = ({ currentThread = "#0000" }: HeaderProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-8 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="max-w-3xl mx-auto flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-sm tracking-[0.2em] text-muted-foreground uppercase">
            AHMED
          </h1>
          <div className="text-lg font-normal text-accent tracking-tight">
            {currentThread}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;