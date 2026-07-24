import { motion } from 'framer-motion';

interface ScentNotesVisualProps {
  scentNotes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  accentColor?: string;
  noteImages?: Record<string, string>;
}

const NoteSection = ({ 
  label, 
  notes, 
  delay,
  accentColor,
  noteImages,
}: { 
  label: string; 
  notes: string[]; 
  delay: number;
  accentColor?: string;
  noteImages?: Record<string, string>;
}) => {
  const hasImages = noteImages && notes.some(n => noteImages[n]);

  const labelStyle = accentColor
    ? { color: `${accentColor}99` }
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      className="space-y-3"
    >
      <p
        className="text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-muted-foreground"
        style={labelStyle}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-3 md:gap-4">
        {notes.map((note) => {
          const img = noteImages?.[note];
          if (img) {
            return (
              <div
                key={note}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-secondary/50 border border-border/40 p-1.5 transition-all duration-200 group-hover:scale-105 group-hover:shadow-md">
                  <img
                    src={img}
                    alt={note}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-muted-foreground text-center leading-tight">
                  {note}
                </span>
              </div>
            );
          }

          // Fallback to pill style
          const pillStyle = accentColor
            ? {
                borderColor: accentColor,
                backgroundColor: `${accentColor}15`,
                color: accentColor,
              }
            : undefined;

          return (
            <span
              key={note}
              className="px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-medium tracking-wide border border-border/60 bg-background/50 rounded-full transition-all duration-200 hover:scale-105"
              style={pillStyle}
            >
              {note}
            </span>
          );
        })}
      </div>
    </motion.div>
  );
};

export const ScentNotesVisual = ({ scentNotes, accentColor, noteImages }: ScentNotesVisualProps) => {
  const hasTop = scentNotes.top?.length > 0;
  const hasHeart = scentNotes.heart?.length > 0;
  const hasBase = scentNotes.base?.length > 0;

  if (!hasTop && !hasHeart && !hasBase) return null;

  const titleStyle = accentColor ? { color: accentColor } : undefined;

  return (
    <div className="space-y-6">
      <h3
        className="text-sm md:text-base font-semibold tracking-[0.15em] uppercase text-foreground"
        style={titleStyle}
      >
        Fragrance Notes
      </h3>
      <div className="space-y-5">
        {hasTop && <NoteSection label="Top" notes={scentNotes.top} delay={0} accentColor={accentColor} noteImages={noteImages} />}
        {hasHeart && <NoteSection label="Heart" notes={scentNotes.heart} delay={0.08} accentColor={accentColor} noteImages={noteImages} />}
        {hasBase && <NoteSection label="Base" notes={scentNotes.base} delay={0.16} accentColor={accentColor} noteImages={noteImages} />}
      </div>
    </div>
  );
};
