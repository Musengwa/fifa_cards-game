import { useEffect, useMemo, useRef, useState } from 'react';
import { Globe2, Shield as ShieldIcon } from 'lucide-react';

const MAX_RETRIES = 3;

interface CardIconProps {
  /** URLs to try in order; empty/duplicate entries are ignored. */
  sources: Array<string | null | undefined>;
  kind: 'flag' | 'club';
}

/**
 * Flag / club badge for a card. Shows a pulsing placeholder until the image has
 * actually loaded, retries a failed load a few times (cache-busted, with a short
 * back-off), then falls through to the next source before giving up.
 */
export default function CardIcon({ sources, kind }: CardIconProps) {
  const candidates = useMemo(
    () => Array.from(new Set(sources.filter((s): s is string => !!s))),
    // join so a new array with the same URLs doesn't restart loading
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sources.join('|')]
  );

  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const imgRef = useRef<HTMLImageElement>(null);
  const retryTimer = useRef<number>();

  // Start over whenever the set of URLs changes (e.g. a new club picked).
  useEffect(() => {
    setIndex(0);
    setAttempt(0);
    setStatus(candidates.length ? 'loading' : 'failed');
  }, [candidates]);

  useEffect(() => () => window.clearTimeout(retryTimer.current), []);

  const base = candidates[index];
  const src = base && attempt > 0 ? `${base}${base.includes('?') ? '&' : '?'}retry=${attempt}` : base;

  // An already-cached image can finish before React wires up onLoad.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setStatus('loaded');
  }, [src]);

  const handleError = () => {
    if (attempt < MAX_RETRIES) {
      retryTimer.current = window.setTimeout(() => setAttempt((a) => a + 1), 400 * (attempt + 1));
    } else if (index < candidates.length - 1) {
      setIndex((i) => i + 1);
      setAttempt(0);
    } else {
      setStatus('failed');
    }
  };

  const shapeClass =
    kind === 'flag' ? 'aspect-[3/2] rounded-[2px]' : 'aspect-square rounded-full';

  if (status === 'failed' || !src) {
    const Icon = kind === 'flag' ? Globe2 : ShieldIcon;
    return (
      <span className={`flex w-full items-center justify-center border border-dashed border-current opacity-50 ${shapeClass}`}>
        <Icon className="w-3 h-3" />
      </span>
    );
  }

  return (
    <span className={`relative block w-full ${shapeClass}`}>
      {status === 'loading' && (
        <span
          aria-hidden
          className={`card-export-exclude absolute inset-0 animate-pulse bg-gray-400/50 ${shapeClass}`}
        />
      )}
      <img
        ref={imgRef}
        key={src}
        src={src}
        alt=""
        aria-hidden
        crossOrigin="anonymous"
        onLoad={() => setStatus('loaded')}
        onError={handleError}
        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        } ${kind === 'flag' ? 'object-cover rounded-[2px] shadow' : 'object-contain drop-shadow'}`}
      />
    </span>
  );
}
