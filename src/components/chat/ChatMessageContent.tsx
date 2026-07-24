import { Link } from 'react-router-dom';
import { useState } from 'react';

const BUTTON_REGEX = /\[button:(.+?)\]\((.+?)\)/;
const LINK_REGEX = /\[link:(.+?):(.+?)\]/g;
const IMG_REGEX = /\[img:(.+?)\]/g;

interface ChatMessageContentProps {
  message: string;
}

const ImageWithLightbox = ({ src }: { src: string }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <img
        src={src}
        alt="Shared photo"
        className="rounded-lg max-w-[180px] max-h-[220px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => setExpanded(true)}
        loading="lazy"
      />
      {expanded && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <img
            src={src}
            alt="Shared photo"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
};

const ChatMessageContent = ({ message }: ChatMessageContentProps) => {
  // Check for button syntax
  const buttonMatch = message.match(BUTTON_REGEX);
  if (buttonMatch) {
    const [, label, url] = buttonMatch;
    return (
      <Link
        to={url}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary-foreground font-medium text-xs hover:bg-primary/30 transition-colors underline underline-offset-2"
      >
        📋 {label}
      </Link>
    );
  }

  // Check for images
  const hasImages = IMG_REGEX.test(message);
  if (hasImages) {
    IMG_REGEX.lastIndex = 0; // Reset regex
    const parts: (string | { type: 'img'; src: string })[] = [];
    let lastIndex = 0;
    let match;

    while ((match = IMG_REGEX.exec(message)) !== null) {
      if (match.index > lastIndex) {
        parts.push(message.slice(lastIndex, match.index));
      }
      parts.push({ type: 'img', src: match[1] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < message.length) {
      parts.push(message.slice(lastIndex));
    }

    const textParts = parts.filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
    const imageParts = parts.filter((p): p is { type: 'img'; src: string } => typeof p !== 'string');

    return (
      <div className="space-y-2">
        {textParts.map((text, i) => (
          <p key={`t-${i}`} className="whitespace-pre-wrap">{text.trim()}</p>
        ))}
        {imageParts.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {imageParts.map((img, i) => (
              <ImageWithLightbox key={`i-${i}`} src={img.src} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Check for inline links [link:/path:Label]
  const hasLinks = LINK_REGEX.test(message);
  if (hasLinks) {
    LINK_REGEX.lastIndex = 0;
    const parts: (string | { type: 'link'; url: string; label: string })[] = [];
    let lastIndex = 0;
    let match;
    while ((match = LINK_REGEX.exec(message)) !== null) {
      if (match.index > lastIndex) parts.push(message.slice(lastIndex, match.index));
      parts.push({ type: 'link', url: match[1], label: match[2] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < message.length) parts.push(message.slice(lastIndex));

    return (
      <div className="space-y-2">
        {parts.map((p, i) =>
          typeof p === 'string' ? (
            <span key={i} className="whitespace-pre-wrap">{p}</span>
          ) : (
            <Link
              key={i}
              to={p.url}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground font-medium text-xs hover:opacity-80 transition-opacity mt-1"
            >
              📋 {p.label}
            </Link>
          )
        )}
      </div>
    );
  }

  return <span className="whitespace-pre-wrap">{message}</span>;
};

export default ChatMessageContent;
