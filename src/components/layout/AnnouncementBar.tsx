import { useState, useEffect } from 'react';

export const AnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY < 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={`bg-primary text-primary-foreground py-2.5 fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container">
        <p className="text-center text-xs font-medium tracking-[0.2em] uppercase">
          Exclusive Fragrance On Sale
        </p>
      </div>
    </div>
  );
};
