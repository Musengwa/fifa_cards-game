import { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';

function starFillAt(index: number, value: number): 'full' | 'half' | 'empty' {
  const remainder = value - index;
  if (remainder >= 1) return 'full';
  if (remainder >= 0.5) return 'half';
  return 'empty';
}

interface StarRatingDisplayProps {
  value: number;
  size?: number;
  className?: string;
  color?: string;
}

/** Read-only 5-star row supporting half-star increments (e.g. 4.5). */
export function StarRatingDisplay({ value, size = 14, className = '', color = 'text-yellow-400' }: StarRatingDisplayProps) {
  const clamped = Math.max(0, Math.min(5, Math.round(value * 2) / 2));
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = starFillAt(i, clamped);
        if (fill === 'full') {
          return <Star key={i} width={size} height={size} className={`${color} fill-current`} />;
        }
        if (fill === 'half') {
          return <StarHalf key={i} width={size} height={size} className={`${color} fill-current`} />;
        }
        return <Star key={i} width={size} height={size} className={`${color} opacity-25`} />;
      })}
    </div>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  className?: string;
  color?: string;
}

/** Interactive 5-star picker — click the left/right half of a star for half-star precision. */
export function StarRatingInput({ value, onChange, size = 28, className = '', color = 'text-yellow-400' }: StarRatingInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className={`flex items-center gap-1 ${className}`} onMouseLeave={() => setHover(null)}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = starFillAt(i, display);
        return (
          <div key={i} className="relative" style={{ width: size, height: size }}>
            {fill === 'full' ? (
              <Star width={size} height={size} className={`${color} fill-current`} />
            ) : fill === 'half' ? (
              <StarHalf width={size} height={size} className={`${color} fill-current`} />
            ) : (
              <Star width={size} height={size} className={`${color} opacity-25`} />
            )}
            <button
              type="button"
              aria-label={`Rate ${i + 0.5} stars`}
              className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
              onMouseEnter={() => setHover(i + 0.5)}
              onClick={() => onChange(i + 0.5)}
            />
            <button
              type="button"
              aria-label={`Rate ${i + 1} stars`}
              className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
              onMouseEnter={() => setHover(i + 1)}
              onClick={() => onChange(i + 1)}
            />
          </div>
        );
      })}
    </div>
  );
}
