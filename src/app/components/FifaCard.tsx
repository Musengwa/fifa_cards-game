import { useRef, useState } from 'react';
import { User as UserIcon, Download, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { downloadAsPng } from '../lib/download';
import { toast } from 'sonner';

export type CardTheme = 'greenOrange' | 'whiteGold' | 'blackPurple';

export interface CardThemeStyles {
  outerGradient: string;
  innerBg: string;
  overallText: string;
  ovrText: string;
  photoBorder: string;
  nameText: string;
  attrsBg: string;
  attrNameText: string;
  attrValueText: string;
  notRatedText: string;
  dividerColor: string;
  metaText: string;
}

export const cardThemeStyles: Record<CardTheme, CardThemeStyles> = {
  greenOrange: {
    // Classic FIFA-style: golden border, deep green interior
    outerGradient: 'from-yellow-400 via-amber-300 to-yellow-500',
    innerBg: 'from-green-800 via-green-900 to-emerald-950',
    overallText: 'text-yellow-300',
    ovrText: 'text-yellow-400',
    photoBorder: 'border-yellow-400',
    nameText: 'text-white',
    attrsBg: 'bg-black/40',
    attrNameText: 'text-yellow-300',
    attrValueText: 'text-white',
    notRatedText: 'text-yellow-300/60',
    dividerColor: 'border-yellow-400/40',
    metaText: 'text-yellow-200/80',
  },
  whiteGold: {
    outerGradient: 'from-amber-300 via-yellow-100 to-amber-400',
    innerBg: 'from-amber-50 via-white to-amber-50',
    overallText: 'text-amber-700',
    ovrText: 'text-amber-600',
    photoBorder: 'border-amber-500',
    nameText: 'text-gray-900',
    attrsBg: 'bg-amber-100/80',
    attrNameText: 'text-amber-700',
    attrValueText: 'text-gray-900',
    notRatedText: 'text-amber-400',
    dividerColor: 'border-amber-300',
    metaText: 'text-amber-600/80',
  },
  blackPurple: {
    outerGradient: 'from-purple-600 via-fuchsia-400 to-purple-700',
    innerBg: 'from-gray-950 via-purple-950 to-black',
    overallText: 'text-purple-300',
    ovrText: 'text-purple-400',
    photoBorder: 'border-purple-500',
    nameText: 'text-white',
    attrsBg: 'bg-purple-950/60',
    attrNameText: 'text-purple-300',
    attrValueText: 'text-white',
    notRatedText: 'text-purple-400/60',
    dividerColor: 'border-purple-500/40',
    metaText: 'text-purple-300/70',
  },
};

function StarRating({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-2.5 h-2.5 ${i < value ? color + ' fill-current' : 'text-current opacity-20'}`}
        />
      ))}
    </div>
  );
}

export interface FifaCardData {
  id: string;
  name: string;
  profilePicUrl: string | null;
  /** Position label shown below OVR (e.g. ST, CAM) */
  position?: string;
  /** Country / nationality */
  nationality?: string;
  /** Flag icon URL for the nationality */
  nationalityFlagUrl?: string | null;
  /** Club or team name */
  club?: string;
  /** Badge icon URL for the club */
  clubLogoUrl?: string | null;
  /** Weak foot rating 1-5 */
  weakFoot?: number;
  /** Skill moves rating 1-5 */
  skillMoves?: number;
}

interface Attribute {
  id: string;
  name: string;
}

interface FifaCardProps {
  user: FifaCardData;
  attributes: Attribute[];
  ratings: { [attributeId: string]: number };
  overallRating?: number;
  cardTheme?: CardTheme;
  /** Show the download-as-PNG button beneath the card */
  showDownload?: boolean;
}

export default function FifaCard({
  user,
  attributes,
  ratings,
  overallRating,
  cardTheme = 'greenOrange',
  showDownload = false,
}: FifaCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const hasRatings = Object.keys(ratings).length > 0;
  const overall =
    overallRating ||
    (hasRatings
      ? Math.round(
          Object.values(ratings).reduce((a, b) => a + b, 0) /
            Object.values(ratings).length
        )
      : 0);

  const t = cardThemeStyles[cardTheme];

  const slug = (user.name || 'card').replace(/\s+/g, '-').toLowerCase();

  const handleDownloadPng = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      await downloadAsPng(cardRef.current, `${slug}.png`);
      toast.success('Card saved as PNG');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  // Split attributes into two columns
  const leftAttrs = attributes.filter((_, i) => i % 2 === 0);
  const rightAttrs = attributes.filter((_, i) => i % 2 === 1);

  const cardFront = (
    <div
      ref={cardRef}
      className={`relative w-64 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br ${t.innerBg} border-0`}
    >
      {/* Golden outer glow border rendered as a box-shadow */}
      <div
        className={`absolute inset-0 rounded-2xl pointer-events-none`}
        style={{ boxShadow: 'inset 0 0 0 3px rgba(250,204,21,0.6)' }}
      />

      {/* Top section */}
      <div className="flex items-start gap-3 p-4 pb-2">
        {/* Left: OVR + position + nationality */}
        <div className="flex flex-col items-center min-w-[44px]">
          <span className={`text-4xl font-black leading-none ${t.overallText}`}>
            {overall || '—'}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${t.ovrText}`}>OVR</span>
          {user.position && (
            <span className={`text-[11px] font-black uppercase tracking-wide mt-0.5 ${t.ovrText}`}>
              {user.position}
            </span>
          )}
          {user.nationality && (
            <div className="flex items-center gap-1 mt-1">
              {user.nationalityFlagUrl && (
                <img
                  src={user.nationalityFlagUrl}
                  alt=""
                  aria-hidden
                  className="w-4 h-3 object-cover rounded-[1px] shrink-0"
                  crossOrigin="anonymous"
                />
              )}
              <span className={`text-[9px] ${t.metaText} font-semibold uppercase tracking-wider text-center`}>
                {user.nationality}
              </span>
            </div>
          )}
        </div>

        {/* Right: Photo */}
        <div className="flex-1 flex justify-center">
          <div
            className={`w-28 h-28 rounded-xl overflow-hidden border-2 ${t.photoBorder} bg-gray-800 shadow-lg`}
          >
            {user.profilePicUrl ? (
              <img
                src={user.profilePicUrl}
                alt={user.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-gray-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Name & club */}
      <div className={`text-center px-4 pb-2 border-b ${t.dividerColor}`}>
        <h3 className={`text-base font-black uppercase tracking-widest ${t.nameText} leading-tight`}>
          {user.name}
        </h3>
        {user.club && (
          <div className="flex items-center justify-center gap-1 mt-0.5">
            {user.clubLogoUrl && (
              <img
                src={user.clubLogoUrl}
                alt=""
                aria-hidden
                className="w-3.5 h-3.5 object-contain shrink-0"
                crossOrigin="anonymous"
              />
            )}
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${t.metaText}`}>
              {user.club}
            </p>
          </div>
        )}
      </div>

      {/* Stats grid */}
      {(leftAttrs.length > 0 || rightAttrs.length > 0) && (
        <div className={`mx-3 my-2 rounded-lg ${t.attrsBg} p-2`}>
          <div className="grid grid-cols-2 gap-x-3">
            <div className="space-y-1">
              {leftAttrs.map((attr) => (
                <div key={attr.id} className="flex items-center justify-between gap-1">
                  <span className={`text-[10px] font-bold uppercase ${t.attrNameText}`}>
                    {attr.name.slice(0, 3)}
                  </span>
                  <span className={`text-sm font-black ${t.attrValueText}`}>
                    {hasRatings && ratings[attr.id] ? Math.round(ratings[attr.id]) : '—'}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              {rightAttrs.map((attr) => (
                <div key={attr.id} className="flex items-center justify-between gap-1">
                  <span className={`text-[10px] font-bold uppercase ${t.attrNameText}`}>
                    {attr.name.slice(0, 3)}
                  </span>
                  <span className={`text-sm font-black ${t.attrValueText}`}>
                    {hasRatings && ratings[attr.id] ? Math.round(ratings[attr.id]) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WF / SM row */}
      {(user.weakFoot || user.skillMoves) && (
        <div className={`flex justify-around px-4 pb-3 pt-1 ${t.metaText}`}>
          {user.weakFoot && (
            <div className="flex flex-col items-center gap-0.5">
              <span className={`text-[8px] font-bold uppercase ${t.attrNameText}`}>WF</span>
              <StarRating value={user.weakFoot} color={t.attrNameText} />
            </div>
          )}
          {user.skillMoves && (
            <div className="flex flex-col items-center gap-0.5">
              <span className={`text-[8px] font-bold uppercase ${t.attrNameText}`}>SM</span>
              <StarRating value={user.skillMoves} color={t.attrNameText} />
            </div>
          )}
        </div>
      )}

      {!hasRatings && attributes.length === 0 && (
        <div className={`text-center text-[10px] ${t.notRatedText} italic pb-3`}>
          Not yet rated
        </div>
      )}

      {/* Shine sweep — a soft diagonal highlight that loops across the card.
          Excluded from PNG exports so it never freezes mid-sweep in the file. */}
      <motion.div
        aria-hidden
        className="card-export-exclude absolute inset-y-0 w-16 pointer-events-none"
        style={{
          left: -96,
          background:
            'linear-gradient(115deg, transparent 15%, rgba(255,255,255,0.45) 50%, transparent 85%)',
        }}
        animate={{ x: [0, 420] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' }}
      />
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {cardFront}

      {showDownload && (
        <button
          onClick={handleDownloadPng}
          disabled={downloading}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 disabled:opacity-40"
        >
          <Download className="w-3 h-3" />
          {downloading ? 'Saving…' : 'Download Card'}
        </button>
      )}
    </div>
  );
}
