import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Download, Palette, Trophy, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { downloadElement } from '../lib/download';
import { toast } from 'sonner';
import FifaCard, { CardTheme } from './FifaCard';

interface Member {
  id: string;
  name: string;
  email: string;
  profilePicUrl: string | null;
}

interface MemberWithStats extends Member {
  overall: number;
  awardsWon: number;
}

const medalColors = [
  'from-yellow-400 to-amber-600', // gold
  'from-gray-300 to-gray-500',    // silver
  'from-amber-600 to-amber-900',  // bronze
];

/** Shortest signed distance from `index` to `i` around a circular deck of `total` cards. */
function circularOffset(i: number, index: number, total: number) {
  let diff = i - index;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

/** A blurred, simplified stand-in for a card sitting behind the active one in the deck. */
function GhostCard({ member, offset, onClick }: { member: Member; offset: number; onClick: () => void }) {
  const abs = Math.abs(offset);
  const scale = abs === 1 ? 0.8 : 0.62;
  const x = offset * (abs === 1 ? 100 : 170);
  const rotate = offset * 10;
  const blurPx = abs === 1 ? 2 : 5;
  const opacity = abs === 1 ? 0.55 : 0.28;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Jump to ${member.name}`}
      className="absolute w-52 sm:w-60 rounded-2xl overflow-hidden cursor-pointer"
      style={{ aspectRatio: '741 / 1186', zIndex: 10 - abs, filter: `blur(${blurPx}px)` }}
      animate={{ x, scale, rotate, opacity }}
      transition={{ type: 'spring', stiffness: 200, damping: 26 }}
    >
      <div className="w-full h-full rounded-2xl bg-gradient-to-br from-white/15 to-white/0 border border-white/10 flex items-center justify-center">
        {member.profilePicUrl ? (
          <img src={member.profilePicUrl} alt="" className="w-2/3 h-2/3 rounded-full object-cover" />
        ) : (
          <div className="w-2/3 h-2/3 rounded-full bg-white/10" />
        )}
      </div>
    </motion.button>
  );
}

/**
 * A premium, one-card-at-a-time circular deck: the active card sits front and
 * center with a flip/turn entrance, blurred "skeleton" ghosts of its neighbors
 * fan out in a stack behind it, and it settles into FifaCard's own continuous
 * hover animation once the transition finishes. Desktop gets arrow buttons;
 * touch devices swipe — both drive the same index/direction state.
 */
function MemberCarousel({
  members,
  attributes,
  ratings,
  starRatings,
  cardTheme,
  accentBg,
}: {
  members: MemberWithStats[];
  attributes: Array<{ id: string; name: string }>;
  ratings: any;
  starRatings: any;
  cardTheme: CardTheme;
  accentBg: string;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const total = members.length;

  const go = (delta: number) => {
    if (total <= 1) return;
    setDirection(delta);
    setIndex((cur) => (cur + delta + total) % total);
  };

  const jumpTo = (i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  if (total === 0) return null;
  const current = members[index];
  const rank = index + 1;

  const variants = {
    enter: (dir: number) => ({
      opacity: 0,
      scale: 0.7,
      rotateY: dir >= 0 ? 90 : -90,
      x: dir >= 0 ? 140 : -140,
    }),
    center: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      x: 0,
      transition: { type: 'spring', stiffness: 220, damping: 24 },
    },
    exit: (dir: number) => ({
      opacity: 0,
      scale: 0.7,
      rotateY: dir >= 0 ? -90 : 90,
      x: dir >= 0 ? -140 : 140,
      transition: { duration: 0.3, ease: 'easeIn' },
    }),
  };

  return (
    <div className="relative">
      {/* Rank badge */}
      <div className="flex justify-center mb-4">
        {rank === 1 ? (
          <div className="relative">
            <div className={`absolute inset-0 ${accentBg} rounded-full blur-xl opacity-60 animate-pulse`} />
            <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${medalColors[0]} flex items-center justify-center shadow-2xl`}>
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
        ) : (
          <div
            className={`w-12 h-12 rounded-full bg-gradient-to-br ${
              medalColors[Math.min(rank - 1, 2)] || 'from-slate-500 to-slate-700'
            } flex items-center justify-center text-xl font-black text-white shadow-lg`}
          >
            {rank}
          </div>
        )}
      </div>

      {/* Stage */}
      <div
        className="relative flex items-center justify-center mx-auto"
        style={{ perspective: 1400, minHeight: 480 }}
      >
        {total > 1 &&
          members.map((m, i) => {
            const offset = circularOffset(i, index, total);
            if (offset === 0 || Math.abs(offset) > 2) return null;
            return <GhostCard key={m.id} member={m} offset={offset} onClick={() => jumpTo(i)} />;
          })}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous card"
              className="hidden sm:flex absolute left-0 z-20 items-center justify-center w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next card"
              className="hidden sm:flex absolute right-0 z-20 items-center justify-center w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <AnimatePresence custom={direction} mode="popLayout" initial={false}>
          <motion.div
            key={current.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag={total > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -80 || info.velocity.x < -400) go(1);
              else if (info.offset.x > 80 || info.velocity.x > 400) go(-1);
            }}
            className={`relative z-10 scale-110 ${total > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <FifaCard
              user={current}
              attributes={attributes}
              ratings={ratings[current.id] || {}}
              peerRating={starRatings[current.id] || null}
              cardTheme={cardTheme}
              showDownload
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Info row */}
      <div className="text-center mt-6">
        <p className="text-white/60 text-sm font-semibold tracking-wide">
          {rank} / {total}
        </p>
        {current.awardsWon > 0 && (
          <div className="flex justify-center gap-1 mt-2">
            {Array(current.awardsWon).fill(null).map((_, i) => (
              <Trophy key={i} className="w-4 h-4 text-yellow-400" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ShowroomProps {
  members: Member[];
  attributes: Array<{ id: string; name: string }>;
  ratings: any;
  starRatings?: any;
  votes: any;
  awardCategories: Array<{ id: string; name: string }>;
}

type Theme = 'greenOrange' | 'whiteGold' | 'blackPurple';

const themes: Record<
  Theme,
  {
    name: string;
    cardTheme: CardTheme;
    bgGradient: string;
    textPrimary: string;
    textAccent: string;
    textSecondary: string;
    cardBorder: string;
    headerGlow: string;
    accentBg: string;
    btnActive: string;
    spotlightRing: string;
  }
> = {
  greenOrange: {
    name: 'Yellow & Green',
    cardTheme: 'greenOrange',
    bgGradient: 'from-green-950 via-emerald-900 to-green-950',
    textPrimary: 'text-white',
    textAccent: 'text-yellow-400',
    textSecondary: 'text-green-200',
    cardBorder: 'border-yellow-500/40',
    headerGlow: 'shadow-green-500/30',
    accentBg: 'bg-yellow-500',
    btnActive: 'bg-yellow-500',
    spotlightRing: 'ring-yellow-400',
  },
  whiteGold: {
    name: 'White & Gold',
    cardTheme: 'whiteGold',
    bgGradient: 'from-amber-50 via-yellow-100 to-amber-200',
    textPrimary: 'text-gray-900',
    textAccent: 'text-amber-600',
    textSecondary: 'text-amber-800',
    cardBorder: 'border-amber-400',
    headerGlow: 'shadow-amber-500/40',
    accentBg: 'bg-amber-500',
    btnActive: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    spotlightRing: 'ring-amber-400',
  },
  blackPurple: {
    name: 'Black & Purple',
    cardTheme: 'blackPurple',
    bgGradient: 'from-black via-purple-950 to-black',
    textPrimary: 'text-white',
    textAccent: 'text-purple-400',
    textSecondary: 'text-purple-200',
    cardBorder: 'border-purple-500/60',
    headerGlow: 'shadow-purple-500/40',
    accentBg: 'bg-purple-500',
    btnActive: 'bg-gradient-to-r from-purple-600 to-fuchsia-600',
    spotlightRing: 'ring-purple-500',
  },
};

export default function Showroom({ members, attributes, ratings, starRatings = {}, votes, awardCategories }: ShowroomProps) {
  const [theme, setTheme] = useState<Theme>('greenOrange');
  const [downloading, setDownloading] = useState(false);
  const showroomRef = useRef<HTMLDivElement>(null);

  const t = themes[theme];

  const membersWithStats = members
    .map((member) => {
      const memberRatings = ratings[member.id];
      let overall = 0;
      if (memberRatings) {
        const scores = Object.values(memberRatings) as number[];
        overall = scores.length > 0
          ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
          : 0;
      }
      let awardsWon = 0;
      Object.keys(votes).forEach((awardId) => {
        const awardVotes = votes[awardId];
        const top = Object.entries(awardVotes).sort(([, a]: any, [, b]: any) => b - a)[0]?.[0];
        if (top === member.id) awardsWon++;
      });
      return { ...member, overall, awardsWon };
    })
    .sort((a, b) => b.overall - a.overall);

  const handleDownloadShowroom = async () => {
    if (!showroomRef.current) return;
    setDownloading(true);
    toast.info('Generating showcase image…');
    try {
      await downloadElement(showroomRef.current, `showroom-${theme}-${Date.now()}.png`);
      toast.success('Showroom downloaded!');
    } catch (err) {
      console.error('Showroom download error:', err);
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div ref={showroomRef} className={`min-h-screen bg-gradient-to-br ${t.bgGradient} p-4 sm:p-8`}>
      <div className="max-w-7xl mx-auto">

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10">
          {/* Theme switcher */}
          <div className={`flex gap-1 sm:gap-2 p-1.5 rounded-full bg-black/20 backdrop-blur-md border ${t.cardBorder}`}>
            {(Object.keys(themes) as Theme[]).map((key) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  theme === key
                    ? `${themes[key].btnActive} text-white shadow-lg scale-105`
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                {themes[key].name}
              </button>
            ))}
          </div>

          <Button
            onClick={handleDownloadShowroom}
            disabled={downloading}
            className={`${t.btnActive} text-white shadow-lg hover:opacity-90`}
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Generating…' : 'Download Showroom'}
          </Button>
        </div>

        {/* Header */}
        <div className={`text-center mb-12 sm:mb-16 rounded-3xl p-8 backdrop-blur-sm bg-black/10 border ${t.cardBorder}`}>
          <div className="flex justify-center items-center gap-4 mb-3">
            <Sparkles className={`w-8 h-8 sm:w-12 sm:h-12 ${t.textAccent} animate-pulse`} />
            <h1 className={`text-4xl sm:text-7xl font-black ${t.textPrimary} tracking-tight`}>SHOWROOM</h1>
            <Sparkles className={`w-8 h-8 sm:w-12 sm:h-12 ${t.textAccent} animate-pulse`} />
          </div>
          <p className={`text-lg sm:text-2xl ${t.textSecondary} font-light`}>
            Official Member Gallery & Rankings
          </p>
        </div>

        {/* Roster deck — one card at a time */}
        <div className="mb-12">
          {membersWithStats.length === 0 ? (
            <p className={`text-center ${t.textSecondary}`}>No members yet</p>
          ) : (
            <MemberCarousel
              members={membersWithStats}
              attributes={attributes}
              ratings={ratings}
              starRatings={starRatings}
              cardTheme={t.cardTheme}
              accentBg={t.accentBg}
            />
          )}
        </div>

      </div>
    </div>
  );
}
