import { useRef, useState } from 'react';
import { User as UserIcon, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { downloadAsPng } from '../lib/download';
import { StarRatingDisplay } from './StarRating';
import { toast } from 'sonner';
const greenShieldBg = new URL('./card-images/green.png', import.meta.url).href;
const purpleShieldBg = new URL('./card-images/Clipped_image_20260805_155650.png', import.meta.url).href;
const goldShieldBg = new URL('./card-images/Clipped_image_20260805_180319.png', import.meta.url).href;

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

// Every theme is text overlaid on a pre-designed shield graphic. 'sideBadges' stacks
// the flag/club badge under the OVR block with a two-column stat grid (purple & gold
// reference cards); 'bottomBadges' runs stats in a single row with the flag/club
// centered beneath, mirroring the green & yellow reference card.
type ShieldLayout = 'sideBadges' | 'bottomBadges';

interface ShieldTheme {
  bg: string;
  aspectRatio: string;
  layout: ShieldLayout;
  ovr: string;
  pos: string;
  name: string;
  statValue: string;
  statLabel: string;
  divider: string;
  notRated: string;
  shadow: string;
  placeholderIcon: string;
  shine: string;
}

const SHIELD_THEMES: Record<CardTheme, ShieldTheme> = {
  greenOrange: {
    bg: greenShieldBg,
    aspectRatio: '955 / 1374',
    layout: 'bottomBadges',
    ovr: 'text-white',
    pos: 'text-yellow-300',
    name: 'text-white',
    statValue: 'text-white',
    statLabel: 'text-yellow-300/90',
    divider: '',
    notRated: 'text-yellow-200/50',
    shadow: 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]',
    placeholderIcon: 'text-white/20',
    shine: 'rgba(255,255,255,0.45)',
  },
  whiteGold: {
    bg: goldShieldBg,
    aspectRatio: '1022 / 1517',
    layout: 'sideBadges',
    ovr: 'text-amber-900',
    pos: 'text-amber-700/90',
    name: 'text-gray-900',
    statValue: 'text-gray-900',
    statLabel: 'text-amber-700/90',
    divider: 'divide-amber-600/30',
    notRated: 'text-amber-600/60',
    shadow: 'drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]',
    placeholderIcon: 'text-gray-400/40',
    shine: 'rgba(255,215,130,0.55)',
  },
  blackPurple: {
    bg: purpleShieldBg,
    aspectRatio: '741 / 1186',
    layout: 'sideBadges',
    ovr: 'text-fuchsia-100',
    pos: 'text-fuchsia-200/90',
    name: 'text-white',
    statValue: 'text-fuchsia-100',
    statLabel: 'text-fuchsia-200/80',
    divider: 'divide-fuchsia-400/25',
    notRated: 'text-fuchsia-300/50',
    shadow: 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]',
    placeholderIcon: 'text-white/20',
    shine: 'rgba(255,255,255,0.45)',
  },
};

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

export interface PeerRating {
  /** 0-5 in half-star steps: percentage of total possible stars voters gave, mapped back to a 5-star scale */
  average: number;
  count: number;
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
  /** Community star rating from the group's rate game, if any */
  peerRating?: PeerRating | null;
  /** Show the download-as-PNG button beneath the card */
  showDownload?: boolean;
}

export default function FifaCard({
  user,
  attributes,
  ratings,
  overallRating,
  cardTheme = 'greenOrange',
  peerRating,
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

  // Split attributes into two columns (sideBadges layout only)
  const leftAttrs = attributes.filter((_, i) => i % 2 === 0);
  const rightAttrs = attributes.filter((_, i) => i % 2 === 1);

  const shield = SHIELD_THEMES[cardTheme];

  const shineSweep = (
    <motion.div
      aria-hidden
      className="card-export-exclude absolute inset-y-0 w-16 pointer-events-none"
      style={{
        left: -96,
        background: `linear-gradient(115deg, transparent 15%, ${shield.shine} 50%, transparent 85%)`,
      }}
      animate={{ x: [0, 420] }}
      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' }}
    />
  );

  const notRatedBanner = !hasRatings && attributes.length === 0 && (
    <div
      className={`absolute text-center text-[10px] italic ${shield.notRated}`}
      style={{ top: shield.layout === 'bottomBadges' ? '74%' : '70%', left: 0, width: '100%' }}
    >
      Not yet rated
    </div>
  );

  const cardFront = (
    <div
      ref={cardRef}
      className="relative w-64 select-none overflow-hidden"
      style={{
        aspectRatio: shield.aspectRatio,
        // overflow-hidden above stops the sliding shine sweep from ever widening the
        // page's scrollable area; the mask below then clips it to the shield's own
        // silhouette, so nothing is ever visible in the transparent margins either.
        WebkitMaskImage: `url(${shield.bg})`,
        maskImage: `url(${shield.bg})`,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }}
    >
      <img
        src={shield.bg}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {/* OVR + position */}
      <div
        className="absolute flex flex-col items-center text-center"
        style={{ top: shield.layout === 'bottomBadges' ? '8%' : '13%', left: '8%', width: '26%' }}
      >
        <span className={`text-5xl font-black leading-none ${shield.ovr} ${shield.shadow}`}>
          {overall || '—'}
        </span>
        {user.position && (
          <span className={`text-xs font-black uppercase tracking-wide mt-0.5 ${shield.pos} ${shield.shadow}`}>
            {user.position}
          </span>
        )}
      </div>

      {shield.layout === 'sideBadges' ? (
        <>
          {/* Nationality flag */}
          {user.nationalityFlagUrl && (
            <div className="absolute" style={{ top: '31%', left: '9%', width: '10%' }}>
              <img
                src={user.nationalityFlagUrl}
                alt=""
                aria-hidden
                crossOrigin="anonymous"
                className="w-full aspect-[3/2] object-cover rounded-[2px] shadow"
              />
            </div>
          )}

          {/* Club badge */}
          {user.clubLogoUrl && (
            <div
              className="absolute"
              style={{ top: user.nationalityFlagUrl ? '38%' : '31%', left: '9%', width: '10%' }}
            >
              <img
                src={user.clubLogoUrl}
                alt=""
                aria-hidden
                crossOrigin="anonymous"
                className="w-full aspect-square object-contain drop-shadow"
              />
            </div>
          )}

          {/* Photo — bottom fades into the shield instead of a hard rectangle edge */}
          <div
            className="absolute overflow-hidden"
            style={{
              top: '17%',
              left: '40%',
              width: '53%',
              height: '40%',
              WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)',
            }}
          >
            {user.profilePicUrl ? (
              <img
                src={user.profilePicUrl}
                alt={user.name}
                crossOrigin="anonymous"
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className={`w-16 h-16 ${shield.placeholderIcon}`} />
              </div>
            )}
          </div>

          {/* Name */}
          <div className="absolute text-center" style={{ top: '57%', left: '4%', width: '92%' }}>
            <h3
              className={`text-lg font-black uppercase tracking-widest ${shield.name} leading-tight truncate ${shield.shadow}`}
            >
              {user.name}
            </h3>
            {peerRating && peerRating.count > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <StarRatingDisplay value={peerRating.average} size={11} color={shield.pos} />
                <span className={`text-[9px] font-semibold ${shield.statLabel}`}>({peerRating.count})</span>
              </div>
            )}
          </div>

          {/* Stats — two columns split by a vertical divider, matching the reference layout */}
          {(leftAttrs.length > 0 || rightAttrs.length > 0) && (
            <div className="absolute" style={{ top: '65%', left: '10%', width: '80%', height: '27%' }}>
              <div className={`grid grid-cols-2 divide-x h-full ${shield.divider}`}>
                <div className="flex flex-col justify-center gap-1.5 pr-3">
                  {leftAttrs.map((attr) => (
                    <div key={attr.id} className="flex items-baseline gap-1.5">
                      <span className={`text-base font-black ${shield.statValue} ${shield.shadow}`}>
                        {hasRatings && ratings[attr.id] ? Math.round(ratings[attr.id]) : '—'}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${shield.statLabel}`}>
                        {attr.name.slice(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col justify-center gap-1.5 pl-3">
                  {rightAttrs.map((attr) => (
                    <div key={attr.id} className="flex items-baseline gap-1.5">
                      <span className={`text-base font-black ${shield.statValue} ${shield.shadow}`}>
                        {hasRatings && ratings[attr.id] ? Math.round(ratings[attr.id]) : '—'}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${shield.statLabel}`}>
                        {attr.name.slice(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Photo — large, fading into the shield instead of a hard rectangle edge */}
          <div
            className="absolute overflow-hidden"
            style={{
              padding: '2%',
              top: '19%',
              left: '25%',
              width: '53%',
              height: '40%',
              WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)',
            }}
          >
            {user.profilePicUrl ? (
              <img
                src={user.profilePicUrl}
                alt={user.name}
                crossOrigin="anonymous"
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className={`w-16 h-16 ${shield.placeholderIcon}`} />
              </div>
            )}
          </div>

          {/* Name */}
          <div className="absolute text-center" style={{ top: '62%', left: '4%', width: '92%' }}>
            <h3
              className={`text-xl font-black uppercase tracking-wide ${shield.name} leading-tight truncate ${shield.shadow}`}
            >
              {user.name}
            </h3>
            {peerRating && peerRating.count > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <StarRatingDisplay value={peerRating.average} size={11} color={shield.pos} />
                <span className={`text-[9px] font-semibold ${shield.statLabel}`}>({peerRating.count})</span>
              </div>
            )}
          </div>

          {/* Stats — single row, label above value, matching the reference layout */}
          {attributes.length > 0 && (
            <div className="absolute" style={{ top: '71%', left: '6%', width: '88%', height: '13%' }}>
              <div
                className="grid h-full"
                style={{ gridTemplateColumns: `repeat(${attributes.length}, minmax(0, 1fr))` }}
              >
                {attributes.map((attr) => (
                  <div key={attr.id} className="flex flex-col items-center justify-center gap-0.5">
                    <span className={`text-[9px] font-bold uppercase tracking-wide ${shield.statLabel}`}>
                      {attr.name.slice(0, 3)}
                    </span>
                    <span className={`text-sm font-black ${shield.statValue} ${shield.shadow}`}>
                      {hasRatings && ratings[attr.id] ? Math.round(ratings[attr.id]) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nationality flag + club badge, centered under the stats */}
          {(user.nationalityFlagUrl || user.clubLogoUrl) && (
            <div
              className="absolute flex items-center justify-center gap-3"
              style={{ top: '87%', left: 0, width: '100%' }}
            >
              {user.nationalityFlagUrl && (
                <div style={{ width: '9%' }}>
                  <img
                    src={user.nationalityFlagUrl}
                    alt=""
                    aria-hidden
                    crossOrigin="anonymous"
                    className="w-full aspect-[3/2] object-cover rounded-[2px] shadow"
                  />
                </div>
              )}
              {user.clubLogoUrl && (
                <div style={{ width: '9%' }}>
                  <img
                    src={user.clubLogoUrl}
                    alt=""
                    aria-hidden
                    crossOrigin="anonymous"
                    className="w-full aspect-square object-contain drop-shadow"
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {notRatedBanner}

      {/* Shine sweep — clipped to the shield shape by the mask above, and excluded
          from PNG exports so it never freezes mid-sweep in the file. */}
      {shineSweep}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {cardFront}
      </motion.div>

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
