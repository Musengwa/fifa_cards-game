import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, ChevronDown, User as UserIcon } from 'lucide-react';
import FifaCard from './FifaCard';
import { isMainAward, formatAwardName } from '../lib/awards';

const MAIN_AWARD_COLORS = ['#facc15', '#fbbf24', '#f59e0b', '#fde68a', '#ffffff'];

/** Confetti burst fired the instant the flip card lands on the winner's face — a
 * short, punchy celebration for a normal award, a longer multi-burst one (gold
 * palette, wider spread) for the headline "main" award. */
function fireAwardConfetti(main: boolean) {
  if (!main) {
    confetti({ particleCount: 70, spread: 75, startVelocity: 45, origin: { y: 0.6 }, zIndex: 200 });
    return;
  }
  const gold = { colors: MAIN_AWARD_COLORS, zIndex: 200 };
  confetti({ ...gold, particleCount: 200, spread: 130, startVelocity: 60, scalar: 1.15, origin: { y: 0.55 } });
  confetti({ ...gold, particleCount: 120, angle: 60, spread: 80, startVelocity: 55, origin: { x: 0, y: 0.65 } });
  confetti({ ...gold, particleCount: 120, angle: 120, spread: 80, startVelocity: 55, origin: { x: 1, y: 0.65 } });
  setTimeout(() => {
    confetti({ ...gold, particleCount: 150, spread: 140, scalar: 1.2, origin: { y: 0.5 } });
  }, 300);
  setTimeout(() => {
    confetti({ ...gold, particleCount: 90, angle: 60, spread: 70, origin: { x: 0.1, y: 0.5 } });
    confetti({ ...gold, particleCount: 90, angle: 120, spread: 70, origin: { x: 0.9, y: 0.5 } });
  }, 550);
}

interface Member {
  id: string;
  name: string;
  email: string;
  profilePicUrl: string | null;
}

interface WinnerInfo {
  member?: Member;
  votes: number;
}

interface TrophyRoomProps {
  members: Member[];
  attributes: Array<{ id: string; name: string }>;
  ratings: any;
  starRatings?: any;
  votes: any;
  awardCategories: Array<{ id: string; name: string }>;
}

type SegmentStatus = 'active' | 'completed';

// A different ambient accent per segment so each award reads as its own distinct
// scene rather than a continuation of the last one.
const ACCENTS = [
  'from-purple-950/50 via-black to-amber-950/30',
  'from-sky-950/50 via-black to-amber-950/30',
  'from-emerald-950/50 via-black to-amber-950/30',
  'from-rose-950/50 via-black to-amber-950/30',
];

/** Small circular headshot used for the floating/hovering candidate cloud. */
function CandidateAvatar({
  member,
  size,
  dimmed,
  highlighted,
}: {
  member: Member;
  size: string;
  dimmed?: boolean;
  highlighted?: boolean;
}) {
  return (
    <div
      title={member.name}
      className={`rounded-full overflow-hidden border-2 shadow-lg ${size} ${
        highlighted ? 'border-yellow-400 ring-2 ring-yellow-400/60' : 'border-white/30'
      } ${dimmed ? 'opacity-85' : ''}`}
    >
      {member.profilePicUrl ? (
        <img src={member.profilePicUrl} alt={member.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
          <UserIcon className="w-1/2 h-1/2 text-gray-400" />
        </div>
      )}
    </div>
  );
}

/**
 * One "show segment" per award — the only one on screen at a time. Its whole
 * reveal sequence (floating candidates, a 5s wait, the card flip, candidates
 * settling) only ever plays the first time it becomes active, driven purely by
 * the Next button; segments already finished stay statically resolved if the
 * side dots are used to look back at them, so nothing replays unintentionally.
 */
function AwardSegment({
  index,
  total,
  award,
  winner,
  runnerUp,
  thirdPlace,
  candidates,
  attributes,
  ratings,
  starRatings,
  status,
  onNext,
}: {
  index: number;
  total: number;
  award: { id: string; name: string };
  winner: WinnerInfo | null;
  runnerUp: WinnerInfo | null;
  thirdPlace: WinnerInfo | null;
  candidates: Member[];
  attributes: Array<{ id: string; name: string }>;
  ratings: any;
  starRatings?: any;
  status: SegmentStatus;
  onNext: () => void;
}) {
  const [revealed, setRevealed] = useState(status === 'completed');
  const [showNext, setShowNext] = useState(false);
  const main = isMainAward(award.name);
  const displayName = formatAwardName(award.name);

  // The reveal only ever starts in response to this segment becoming the active
  // one — never in response to scroll position — so "Next" is what makes the
  // whole show play, once, for that award.
  useEffect(() => {
    if (status !== 'active') return;
    if (!winner) {
      setRevealed(true);
      return;
    }
    const timer = setTimeout(() => setRevealed(true), 5000);
    return () => clearTimeout(timer);
  }, [status, winner]);

  // Confetti fires the moment the card lands on its winner face — only for the
  // segment actually playing its reveal for the first time, never when the side
  // dots are used to look back at an already-finished award.
  const confettiFired = useRef(false);
  useEffect(() => {
    if (!revealed || status !== 'active' || !winner?.member || confettiFired.current) return;
    confettiFired.current = true;
    fireAwardConfetti(main);
  }, [revealed, status, winner, main]);

  useEffect(() => {
    if (!revealed || status !== 'active') return;
    const timer = setTimeout(() => setShowNext(true), 1000);
    return () => clearTimeout(timer);
  }, [revealed, status]);

  // Randomized once per segment so the scattered avatars don't jump around on re-render.
  const [positions] = useState(() =>
    candidates.map(() => ({
      top: 8 + Math.random() * 74,
      left: 4 + Math.random() * 86,
      front: Math.random() > 0.45,
      duration: 3.5 + Math.random() * 3,
      dx: 30 + Math.random() * 50,
      dy: 20 + Math.random() * 40,
      delay: Math.random() * 1.5,
    }))
  );

  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <section
      className={`relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4 py-10 bg-gradient-to-br ${accent}`}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[24rem] h-[24rem] sm:w-[32rem] sm:h-[32rem] bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Heading */}
      <div className="relative z-20 text-center mb-4 sm:mb-6">
        <p className="text-amber-300/80 text-xs sm:text-sm font-bold uppercase tracking-[0.35em] mb-2">
          Award {index + 1} of {total}
        </p>
        {main && (
          <p className="inline-flex items-center gap-1.5 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-2 px-3 py-1 rounded-full border border-amber-400/40 bg-amber-400/10">
            <Sparkles className="w-3 h-3" /> Main Award
          </p>
        )}
        {!revealed ? (
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`font-black text-white tracking-tight ${main ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-5xl'}`}
          >
            Who is it going to be?
          </motion.h2>
        ) : (
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 ${
              main ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-4xl'
            }`}
          >
            {displayName}
          </motion.h2>
        )}
      </div>

      {/* Stage: floating candidates + the flip card share this stacking context */}
      <div className="relative z-10 w-full max-w-3xl flex-1 flex items-center justify-center min-h-[380px] sm:min-h-[440px]">
        {!revealed &&
          candidates.map((member, i) => (
            <motion.div
              key={member.id}
              className="absolute"
              style={{
                top: `${positions[i].top}%`,
                left: `${positions[i].left}%`,
                zIndex: positions[i].front ? 30 : 0,
              }}
              animate={{
                x: [0, positions[i].dx, -positions[i].dx * 0.6, 0],
                y: [0, -positions[i].dy, positions[i].dy * 0.5, 0],
                rotate: [0, 8, -8, 0],
              }}
              transition={{
                duration: positions[i].duration,
                delay: positions[i].delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <CandidateAvatar member={member} size="w-10 h-10 sm:w-12 sm:h-12" dimmed />
            </motion.div>
          ))}

        {/* Flip card: mystery back → winner's FIFA card front — bigger stage for the main award */}
        <div className="relative z-10" style={{ perspective: 1500 }}>
          <motion.div
            className={`relative ${main ? 'w-64 sm:w-80' : 'w-48 sm:w-56'}`}
            style={{ transformStyle: 'preserve-3d', aspectRatio: '741 / 1186' }}
            animate={{ rotateY: revealed ? 180 : 0 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          >
            <div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-zinc-900 via-black to-zinc-900 shadow-2xl flex flex-col items-center justify-center px-4 text-center ${
                main ? 'border-4 border-amber-300' : 'border-4 border-amber-400/50'
              }`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <Trophy className={`text-amber-400 mb-4 animate-pulse ${main ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-12 sm:h-12'}`} />
              <p className="text-amber-300/70 text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] mb-2">
                {main ? 'Main Award' : 'Award'}
              </p>
              <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-wide leading-tight">
                {displayName}
              </h3>
              <p className="mt-6 text-5xl font-black text-amber-400/30 select-none">?</p>
            </div>

            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              {winner?.member ? (
                <FifaCard
                  user={winner.member}
                  attributes={attributes}
                  ratings={ratings[winner.member.id] || {}}
                  peerRating={starRatings?.[winner.member.id] || null}
                  cardTheme="whiteGold"
                />
              ) : (
                <div className={`aspect-[741/1186] rounded-2xl bg-gradient-to-br from-zinc-800 to-black border-4 border-white/10 flex items-center justify-center px-6 text-center ${main ? 'w-64 sm:w-80' : 'w-48 sm:w-56'}`}>
                  <p className="text-white/50 text-sm">No votes were cast for this award</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Settled candidates hover along the card's bottom edge once revealed */}
        {revealed && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-2 sm:bottom-4 z-30 flex flex-wrap justify-center gap-2 max-w-full px-4">
            {candidates.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: [0, -5, 0] }}
                transition={{
                  opacity: { duration: 0.5 },
                  y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <CandidateAvatar
                  member={member}
                  size="w-8 h-8 sm:w-10 sm:h-10"
                  highlighted={member.id === winner?.member?.id}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Winner + runner-up summary */}
      {revealed && winner?.member && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-20 text-center mt-4 sm:mt-6"
        >
          <p className="inline-block bg-yellow-400 text-black px-4 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg mb-2">
            Winner
          </p>
          <h3 className="text-2xl sm:text-4xl font-black text-white drop-shadow-lg">{winner.member.name}</h3>
          <p className="text-amber-300 text-base sm:text-lg font-semibold mt-1">
            {winner.votes} vote{winner.votes !== 1 ? 's' : ''}
          </p>
          {(runnerUp?.member || thirdPlace?.member) && (
            <div className="flex justify-center gap-6 mt-3 text-xs sm:text-sm text-white/60">
              {runnerUp?.member && (
                <span>2nd — {runnerUp.member.name} ({runnerUp.votes})</span>
              )}
              {thirdPlace?.member && (
                <span>3rd — {thirdPlace.member.name} ({thirdPlace.votes})</span>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Advance to the next segment — only the currently-active segment offers this */}
      {status === 'active' &&
        showNext &&
        (index < total - 1 ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onNext}
            className="relative z-20 mt-6 sm:mt-8 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded-full border border-white/20 backdrop-blur-md transition-colors"
          >
            Next Award
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </motion.button>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-20 mt-6 sm:mt-8 text-amber-300/80 text-sm sm:text-base flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> That's every award — champions forever <Sparkles className="w-4 h-4" />
          </motion.p>
        ))}
    </section>
  );
}

export default function TrophyRoomCinematic({
  members,
  attributes,
  ratings,
  starRatings,
  votes,
  awardCategories,
}: TrophyRoomProps) {
  // The highest segment reached so far. Segment 0 auto-plays on load; every later
  // segment only starts once Next explicitly advances to it.
  const [activeIndex, setActiveIndex] = useState(0);
  // Which segment is currently on screen — lets the side dots look back at an
  // already-finished award without touching activeIndex (so Next still resumes
  // from where the show actually is, not from wherever you were browsing).
  const [viewingIndex, setViewingIndex] = useState(0);

  const awardWinners = awardCategories.map((award) => {
    const awardVotes = votes[award.id] || {};
    const sortedVotes = Object.entries(awardVotes).sort(([, a]: any, [, b]: any) => b - a);

    return {
      award,
      winner: sortedVotes[0]
        ? { member: members.find((m) => m.id === sortedVotes[0][0]), votes: sortedVotes[0][1] as number }
        : null,
      runnerUp: sortedVotes[1]
        ? { member: members.find((m) => m.id === sortedVotes[1][0]), votes: sortedVotes[1][1] as number }
        : null,
      thirdPlace: sortedVotes[2]
        ? { member: members.find((m) => m.id === sortedVotes[2][0]), votes: sortedVotes[2][1] as number }
        : null,
    };
  });

  const goToNext = () => {
    setActiveIndex((cur) => {
      const next = Math.min(cur + 1, awardWinners.length - 1);
      setViewingIndex(next);
      return next;
    });
  };

  const viewSegment = (i: number) => {
    if (i <= activeIndex) setViewingIndex(i);
  };

  if (awardWinners.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white/60">
        No award categories in this group
      </div>
    );
  }

  const current = awardWinners[viewingIndex];

  return (
    <div className="relative w-full h-screen overflow-y-auto bg-black">
      {/* Side dots — only awards already reached are selectable; scrolling never
          reveals what's ahead since nothing beyond the current segment is mounted. */}
      <div className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2.5 sm:gap-3">
        {awardWinners.map((data, i) => (
          <button
            key={data.award.id}
            onClick={() => viewSegment(i)}
            disabled={i > activeIndex}
            title={i <= activeIndex ? formatAwardName(data.award.name) : `Locked — finish award ${activeIndex + 1} first`}
            aria-label={`View ${formatAwardName(data.award.name)}`}
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${
              i === viewingIndex
                ? 'bg-amber-400 scale-125'
                : i <= activeIndex
                ? 'bg-white/30 hover:bg-amber-300 cursor-pointer'
                : 'bg-white/10 cursor-not-allowed'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.award.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <AwardSegment
            index={viewingIndex}
            total={awardWinners.length}
            award={current.award}
            winner={current.winner}
            runnerUp={current.runnerUp}
            thirdPlace={current.thirdPlace}
            candidates={members}
            attributes={attributes}
            ratings={ratings}
            starRatings={starRatings}
            status={viewingIndex < activeIndex ? 'completed' : 'active'}
            onNext={goToNext}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
