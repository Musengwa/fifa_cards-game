import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, ChevronDown, User as UserIcon } from 'lucide-react';
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
  const [lights] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      left: 8 + i * 11 + (i % 2 === 0 ? 2 : -2),
      top: 12 + ((i * 17) % 64),
      duration: 4 + (i % 5) * 1.2,
      dx: 10 + (i % 4) * 12,
      dy: 12 + (i % 3) * 14,
      delay: i * 0.6,
      size: 36 + (i % 4) * 18,
      opacity: 0.22 + (i % 3) * 0.14,
      color: ['#facc15', '#f59e0b', '#60a5fa', '#f472b6', '#a78bfa', '#34d399'][i % 6],
    }))
  );

  // Built once and embedded in two different spots below — grouped into the
  // side column on desktop (next to the stage) but placed after the stage on
  // mobile (where there's no room for a side column), without duplicating JSX.
  const winnerSummaryNode = revealed && winner?.member && (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-center lg:text-left"
    >
      <p className="inline-block bg-yellow-400 text-black px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg mb-1.5">
        Winner
      </p>
      <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white drop-shadow-lg leading-tight">{winner.member.name}</h3>
    </motion.div>
  );

  const nextControlNode = status === 'active' && showNext && (
    index < total - 1 ? (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onNext}
        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full border border-white/20 backdrop-blur-md transition-colors"
      >
        Next Award
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </motion.button>
    ) : (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-amber-300/80 text-xs sm:text-sm flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" /> That's every award — champions forever <Sparkles className="w-4 h-4" />
      </motion.p>
    )
  );

  return (
    <section
      className="relative h-full w-full overflow-hidden bg-black"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(96,165,250,0.12),_transparent_30%)]" />
      {lights.map((light, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-md pointer-events-none"
          style={{
            left: `${light.left}%`,
            top: `${light.top}%`,
            width: `${light.size}px`,
            height: `${light.size}px`,
            opacity: light.opacity,
            background: `radial-gradient(circle, ${light.color} 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
          }}
          animate={{
            x: [0, light.dx, -light.dx * 0.8, 0],
            y: [0, -light.dy, light.dy * 0.8, 0],
            opacity: [light.opacity, light.opacity + 0.28, light.opacity],
            scale: [1, 1.35, 1],
          }}
          transition={{
            duration: light.duration,
            delay: light.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[24rem] h-[24rem] sm:w-[32rem] sm:h-[32rem] bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 h-full w-full flex flex-col lg:flex-row items-center justify-center gap-2 sm:gap-3 lg:gap-10 px-4 sm:px-6 lg:px-12 py-3 sm:py-4">
        {/* Info column: label, heading, and — on desktop only — the winner summary
            and next control, grouped beside the stage instead of stacked below it. */}
        <div className="z-20 shrink-0 flex flex-col items-center lg:items-start text-center lg:text-left gap-2 lg:w-72 xl:w-80">
          <div>
            <p className="text-amber-300/80 text-xs sm:text-sm font-bold uppercase tracking-[0.35em] mb-1.5">
              Award {index + 1} of {total}
            </p>
            {main && (
              <p className="inline-flex items-center gap-1.5 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-1.5 px-3 py-1 rounded-full border border-amber-400/40 bg-amber-400/10">
                <Sparkles className="w-3 h-3" /> Main Award
              </p>
            )}
            {!revealed ? (
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`font-black text-white tracking-tight ${main ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-2xl sm:text-3xl lg:text-4xl'}`}
              >
                Who is it going to be?
              </motion.h2>
            ) : (
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 ${
                  main ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-xl sm:text-2xl lg:text-3xl'
                }`}
              >
                {displayName}
              </motion.h2>
            )}
          </div>

          <div className="hidden lg:flex flex-col items-start gap-4">
            {winnerSummaryNode}
            {nextControlNode}
          </div>
        </div>

        {/* Stage: floating candidates + the flip card share this stacking context */}
        <div className="relative z-10 flex-1 min-h-0 w-full max-w-xl lg:max-w-none h-full flex items-center justify-center">
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

        {/* Winner showcase: black stage with moving light accents, a trophy, and a stylised profile panel instead of a FIFA card. */}
        <div className="relative z-10" style={{ perspective: 1500 }}>
          <motion.div
            className={`relative ${main ? 'w-56 sm:w-64 lg:w-72' : 'w-44 sm:w-48 lg:w-52'}`}
            style={{ transformStyle: 'preserve-3d', aspectRatio: '741 / 1186' }}
            animate={{ rotateY: revealed ? 180 : 0 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          >
            <div
              className={`absolute inset-0 rounded-[2rem] border ${main ? 'border-amber-300/60' : 'border-amber-400/30'} bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_rgba(8,8,8,0.96)_38%,_#020202_100%)] shadow-[0_0_50px_rgba(250,204,21,0.12)] flex flex-col items-center justify-center px-4 text-center`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="relative mb-5 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl" />
                <div className="relative flex items-center justify-center rounded-full border border-amber-400/40 bg-black/80 p-4">
                  <Trophy className={`text-amber-400 ${main ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-12 sm:h-12'}`} />
                </div>
              </div>
              <p className="text-amber-300/70 text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] mb-2">
                {main ? 'Main Award' : 'Award'}
              </p>
              <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-wide leading-tight max-w-[11rem]">
                {displayName}
              </h3>
              <p className="mt-6 text-5xl font-black text-amber-400/30 select-none">?</p>
            </div>

            <div
              className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.2),_rgba(17,17,17,0.92)_32%,_#020202_100%)] border border-white/10 shadow-[0_0_40px_rgba(250,204,21,0.12)] flex items-center justify-center px-5"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              {winner?.member ? (
                <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden rounded-[2rem] pt-6 pb-5">
                  <div className="absolute inset-x-6 top-3 h-20 rounded-full bg-amber-400/15 blur-3xl" />
                  <div className="relative mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-amber-400/25 blur-xl" />
                    <div className="relative flex items-center justify-center rounded-full border border-amber-300/60 bg-black/70 p-2 shadow-[0_0_25px_rgba(250,204,21,0.25)]">
                      <Trophy className="w-8 h-8 sm:w-9 sm:h-9 text-amber-300" />
                    </div>
                  </div>

                  <div className="relative mb-3">
                    <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-2xl" />
                    <div className="relative overflow-hidden rounded-full border-4 border-yellow-400/65 shadow-[0_0_30px_rgba(250,204,21,0.35)] w-24 h-24 sm:w-28 sm:h-28">
                      {winner.member.profilePicUrl ? (
                        <img src={winner.member.profilePicUrl} alt={winner.member.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                          <UserIcon className="w-1/2 h-1/2 text-slate-300" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.38em] text-amber-200/80">Winner</p>
                    <h3 className="mt-2 text-xl sm:text-2xl font-black text-white tracking-tight">{winner.member.name}</h3>
                    <p className="mt-2 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/50">{displayName}</p>
                  </div>
                </div>
              ) : (
                <div className={`rounded-[2rem] bg-black/80 border border-white/10 flex items-center justify-center px-6 text-center ${main ? 'w-full h-full' : 'w-full h-full'}`}>
                  <div className="flex flex-col items-center gap-3 text-white/70">
                    <Trophy className="w-8 h-8 text-amber-300" />
                    <p className="text-sm">No votes were cast for this award</p>
                  </div>
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

        {/* Winner summary + next control, mobile only — desktop renders these in the side column instead */}
        <div className="lg:hidden z-20 shrink-0 flex flex-col items-center gap-2">
          {winnerSummaryNode}
          {nextControlNode}
        </div>
      </div>
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
      <div className="h-full flex items-center justify-center text-white/60">
        No award categories in this group
      </div>
    );
  }

  const current = awardWinners[viewingIndex];

  return (
    <div className="relative w-full h-full overflow-y-auto">
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
          className="h-full"
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
