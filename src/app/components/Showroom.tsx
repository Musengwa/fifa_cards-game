import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Download, Palette, Trophy, Sparkles } from 'lucide-react';
import { downloadElement } from '../lib/download';
import { toast } from 'sonner';
import FifaCard, { CardTheme } from './FifaCard';

interface Member {
  id: string;
  name: string;
  email: string;
  profilePicUrl: string | null;
}

interface ShowroomProps {
  members: Member[];
  attributes: Array<{ id: string; name: string }>;
  ratings: any;
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
    name: 'Green & Orange',
    cardTheme: 'greenOrange',
    bgGradient: 'from-emerald-900 via-green-800 to-orange-900',
    textPrimary: 'text-white',
    textAccent: 'text-orange-400',
    textSecondary: 'text-green-200',
    cardBorder: 'border-orange-500/40',
    headerGlow: 'shadow-green-500/30',
    accentBg: 'bg-orange-500',
    btnActive: 'bg-gradient-to-r from-green-600 to-orange-600',
    spotlightRing: 'ring-orange-400',
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

export default function Showroom({ members, attributes, ratings, votes, awardCategories }: ShowroomProps) {
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

  const medalColors = [
    'from-yellow-400 to-amber-600', // gold
    'from-gray-300 to-gray-500',    // silver
    'from-amber-600 to-amber-900',  // bronze
  ];

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

        {/* Top 3 Spotlight */}
        {membersWithStats.length >= 3 && (
          <div className="mb-16 sm:mb-24">
            <h2 className={`text-3xl sm:text-5xl font-bold ${t.textPrimary} text-center mb-10 flex items-center justify-center gap-3`}>
              <Trophy className={`w-8 h-8 sm:w-12 sm:h-12 ${t.textAccent}`} />
              Top 3 Champions
            </h2>

            {/* Podium layout: 2nd | 1st | 3rd */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto items-end">
              {/* 2nd place */}
              <div className="order-2 sm:order-1 flex flex-col items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${medalColors[1]} flex items-center justify-center text-2xl font-black text-white shadow-lg`}>2</div>
                <FifaCard
                  user={membersWithStats[1]}
                  attributes={attributes}
                  ratings={ratings[membersWithStats[1].id] || {}}
                  cardTheme={t.cardTheme}
                  showDownload
                />
                {membersWithStats[1].awardsWon > 0 && (
                  <div className="flex gap-1">
                    {Array(membersWithStats[1].awardsWon).fill(null).map((_, i) => (
                      <Trophy key={i} className={`w-5 h-5 ${t.textAccent}`} />
                    ))}
                  </div>
                )}
              </div>

              {/* 1st place */}
              <div className="order-1 sm:order-2 flex flex-col items-center gap-4">
                <div className="relative">
                  <div className={`absolute inset-0 ${t.accentBg} rounded-full blur-xl opacity-60 animate-pulse`} />
                  <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${medalColors[0]} flex items-center justify-center shadow-2xl`}>
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className={`ring-4 ${t.spotlightRing} ring-offset-2 ring-offset-transparent rounded-2xl`}>
                  <FifaCard
                    user={membersWithStats[0]}
                    attributes={attributes}
                    ratings={ratings[membersWithStats[0].id] || {}}
                    cardTheme={t.cardTheme}
                    showDownload
                  />
                </div>
                {membersWithStats[0].awardsWon > 0 && (
                  <div className="flex gap-1">
                    {Array(membersWithStats[0].awardsWon).fill(null).map((_, i) => (
                      <Trophy key={i} className={`w-6 h-6 ${t.textAccent} animate-bounce`} style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                  </div>
                )}
              </div>

              {/* 3rd place */}
              <div className="order-3 flex flex-col items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${medalColors[2]} flex items-center justify-center text-2xl font-black text-white shadow-lg`}>3</div>
                <FifaCard
                  user={membersWithStats[2]}
                  attributes={attributes}
                  ratings={ratings[membersWithStats[2].id] || {}}
                  cardTheme={t.cardTheme}
                  showDownload
                />
                {membersWithStats[2].awardsWon > 0 && (
                  <div className="flex gap-1">
                    {Array(membersWithStats[2].awardsWon).fill(null).map((_, i) => (
                      <Trophy key={i} className={`w-5 h-5 ${t.textAccent}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Complete Roster — full FIFA cards */}
        <div className="mb-12">
          <h2 className={`text-3xl sm:text-5xl font-bold ${t.textPrimary} text-center mb-10`}>
            Complete Roster
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
            {membersWithStats.map((member, idx) => (
              <div key={member.id} className="w-full max-w-xs">
                <div className={`${t.textAccent} text-center text-sm font-bold mb-2`}>#{idx + 1}</div>
                <FifaCard
                  user={member}
                  attributes={attributes}
                  ratings={ratings[member.id] || {}}
                  cardTheme={t.cardTheme}
                  showDownload
                />
                {member.awardsWon > 0 && (
                  <div className="flex justify-center gap-1 mt-2">
                    {Array(member.awardsWon).fill(null).map((_, i) => (
                      <Trophy key={i} className={`w-4 h-4 ${t.textAccent}`} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
