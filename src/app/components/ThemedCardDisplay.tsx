import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Trophy, Award, Star, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  email: string;
  profilePicUrl: string | null;
}

interface ThemedCardDisplayProps {
  members: Member[];
  attributes: Array<{ id: string; name: string }>;
  ratings: any;
  votes: any;
  awardCategories: Array<{ id: string; name: string }>;
}

type Theme = 'purple' | 'gold' | 'green';

const themes = {
  purple: {
    name: 'Royal Purple',
    gradient: 'from-purple-900 via-purple-700 to-black',
    cardBg: 'bg-gradient-to-br from-purple-800 to-purple-950',
    accent: 'text-purple-300',
    border: 'border-purple-500',
    button: 'bg-purple-600 hover:bg-purple-700',
  },
  gold: {
    name: 'Luxury Gold',
    gradient: 'from-amber-100 via-yellow-200 to-amber-300',
    cardBg: 'bg-gradient-to-br from-white to-amber-50',
    accent: 'text-amber-600',
    border: 'border-amber-400',
    button: 'bg-amber-500 hover:bg-amber-600',
  },
  green: {
    name: 'FIFA Classic',
    gradient: 'from-green-900 via-yellow-700 to-green-800',
    cardBg: 'bg-gradient-to-br from-green-700 to-yellow-600',
    accent: 'text-yellow-300',
    border: 'border-yellow-500',
    button: 'bg-green-600 hover:bg-green-700',
  },
};

export default function ThemedCardDisplay({ members, attributes, ratings, votes, awardCategories }: ThemedCardDisplayProps) {
  const [theme, setTheme] = useState<Theme>('purple');
  const [downloading, setDownloading] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  const currentTheme = themes[theme];

  const handleDownload = async () => {
    if (!displayRef.current) return;

    setDownloading(true);
    toast.info('Generating image...');

    try {
      const canvas = await html2canvas(displayRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `fifa-rankings-${theme}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    } finally {
      setDownloading(false);
    }
  };

  // Calculate overall scores
  const membersWithScores = members.map(member => {
    const memberRatings = ratings[member.id];
    let overall = 0;

    if (memberRatings) {
      const scores = Object.values(memberRatings) as number[];
      overall = scores.length > 0
        ? Math.round(scores.reduce((sum, val) => sum + val, 0) / scores.length)
        : 0;
    }

    // Count awards won
    let awardsWon = 0;
    Object.keys(votes).forEach(awardId => {
      const awardVotes = votes[awardId];
      const topVotedUserId = Object.entries(awardVotes)
        .sort(([, a]: any, [, b]: any) => b - a)[0]?.[0];
      if (topVotedUserId === member.id) awardsWon++;
    });

    return { ...member, overall, awardsWon };
  }).sort((a, b) => b.overall - a.overall);

  return (
    <div ref={displayRef} className={`min-h-screen bg-gradient-to-br ${currentTheme.gradient} p-3 sm:p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Theme Selector */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <Button
              onClick={() => setTheme('purple')}
              className={`${themes.purple.button} text-white text-sm sm:text-base px-3 sm:px-6`}
              variant={theme === 'purple' ? 'default' : 'outline'}
            >
              Royal Purple
            </Button>
            <Button
              onClick={() => setTheme('gold')}
              className={`${themes.gold.button} text-white text-sm sm:text-base px-3 sm:px-6`}
              variant={theme === 'gold' ? 'default' : 'outline'}
            >
              Luxury Gold
            </Button>
            <Button
              onClick={() => setTheme('green')}
              className={`${themes.green.button} text-white text-sm sm:text-base px-3 sm:px-6`}
              variant={theme === 'green' ? 'default' : 'outline'}
            >
              FIFA Classic
            </Button>
          </div>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Generating...' : 'Download Image'}
          </Button>
        </div>

        {/* Session Ended Banner */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md rounded-full px-4 sm:px-8 py-2 sm:py-4 border-2 border-white/20">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
            <h1 className="text-2xl sm:text-5xl font-bold text-white">Session Ended</h1>
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
          </div>
          <p className="text-base sm:text-xl text-white/80 mt-3 sm:mt-4">Final Results & Rankings</p>
        </div>

        {/* Top 3 Podium */}
        {membersWithScores.length >= 3 && (
          <div className="flex flex-col sm:flex-row justify-center items-end gap-3 sm:gap-6 mb-8 sm:mb-12 px-2">
            {/* 2nd Place */}
            <div className="w-full sm:w-auto flex-1 max-w-xs mx-auto order-2 sm:order-1">
              <div className="text-center mb-2 sm:mb-4">
                <div className="inline-block bg-gray-400 text-white rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-xl sm:text-3xl font-bold">
                  2
                </div>
              </div>
              <Card className={`${currentTheme.cardBg} ${currentTheme.border} border-2 p-3 sm:p-6 text-center h-32 sm:h-48 flex flex-col justify-center`}>
                <h3 className="text-base sm:text-2xl font-bold ${theme === 'gold' ? 'text-gray-800' : 'text-white'} mb-1 sm:mb-2">
                  {membersWithScores[1].name}
                </h3>
                <p className={`text-2xl sm:text-4xl font-bold ${currentTheme.accent}`}>
                  {membersWithScores[1].overall}
                </p>
              </Card>
            </div>

            {/* 1st Place */}
            <div className="w-full sm:w-auto flex-1 max-w-xs mx-auto order-1 sm:order-2">
              <div className="text-center mb-2 sm:mb-4">
                <div className="inline-block bg-yellow-400 text-white rounded-full w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center text-2xl sm:text-4xl font-bold shadow-lg">
                  <Trophy className="w-7 h-7 sm:w-10 sm:h-10" />
                </div>
              </div>
              <Card className={`${currentTheme.cardBg} ${currentTheme.border} border-4 p-4 sm:p-8 text-center h-40 sm:h-64 flex flex-col justify-center shadow-2xl`}>
                <h3 className={`text-xl sm:text-3xl font-bold ${theme === 'gold' ? 'text-gray-800' : 'text-white'} mb-2 sm:mb-4`}>
                  {membersWithScores[0].name}
                </h3>
                <p className={`text-3xl sm:text-6xl font-bold ${currentTheme.accent}`}>
                  {membersWithScores[0].overall}
                </p>
                <p className="text-xs sm:text-sm text-white/70 mt-1 sm:mt-2">
                  {membersWithScores[0].awardsWon} Awards
                </p>
              </Card>
            </div>

            {/* 3rd Place */}
            <div className="w-full sm:w-auto flex-1 max-w-xs mx-auto order-3">
              <div className="text-center mb-2 sm:mb-4">
                <div className="inline-block bg-amber-700 text-white rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-xl sm:text-3xl font-bold">
                  3
                </div>
              </div>
              <Card className={`${currentTheme.cardBg} ${currentTheme.border} border-2 p-3 sm:p-6 text-center h-28 sm:h-40 flex flex-col justify-center`}>
                <h3 className={`text-base sm:text-2xl font-bold ${theme === 'gold' ? 'text-gray-800' : 'text-white'} mb-1 sm:mb-2`}>
                  {membersWithScores[2].name}
                </h3>
                <p className={`text-2xl sm:text-4xl font-bold ${currentTheme.accent}`}>
                  {membersWithScores[2].overall}
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Award Winners */}
        <div className="mb-8 sm:mb-12">
          <h2 className={`text-2xl sm:text-4xl font-bold text-center ${theme === 'gold' ? 'text-gray-800' : 'text-white'} mb-4 sm:mb-8`}>
            <Award className="inline w-6 h-6 sm:w-8 sm:h-8 mr-2" />
            Award Winners
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {awardCategories.map(award => {
              const awardVotes = votes[award.id] || {};
              const winner = Object.entries(awardVotes)
                .sort(([, a]: any, [, b]: any) => b - a)[0];

              if (!winner) return null;

              const winnerMember = members.find(m => m.id === winner[0]);
              const voteCount = winner[1] as number;

              return (
                <Card
                  key={award.id}
                  className={`${currentTheme.cardBg} ${currentTheme.border} border-2 p-3 sm:p-6 text-center transform hover:scale-105 transition-transform`}
                >
                  <div className="mb-2 sm:mb-4">
                    <Star className={`w-8 h-8 sm:w-12 sm:h-12 mx-auto ${currentTheme.accent}`} />
                  </div>
                  <h3 className={`text-sm sm:text-lg font-bold ${theme === 'gold' ? 'text-gray-600' : 'text-white/70'} mb-1 sm:mb-2`}>
                    {award.name}
                  </h3>
                  <p className={`text-xl sm:text-3xl font-bold ${theme === 'gold' ? 'text-gray-800' : 'text-white'}`}>
                    {winnerMember?.name}
                  </p>
                  <p className={`text-xs sm:text-sm ${currentTheme.accent} mt-1 sm:mt-2`}>
                    {voteCount} vote{voteCount !== 1 ? 's' : ''}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* All Rankings */}
        <div>
          <h2 className={`text-2xl sm:text-4xl font-bold text-center ${theme === 'gold' ? 'text-gray-800' : 'text-white'} mb-4 sm:mb-8`}>
            Complete Rankings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {membersWithScores.map((member, idx) => (
              <Card
                key={member.id}
                className={`${currentTheme.cardBg} ${currentTheme.border} border p-3 sm:p-4`}
              >
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className={`text-2xl sm:text-3xl font-bold ${currentTheme.accent} w-8 sm:w-10`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base sm:text-xl font-bold ${theme === 'gold' ? 'text-gray-800' : 'text-white'} truncate`}>
                      {member.name}
                    </h3>
                    <p className={`text-lg sm:text-2xl ${currentTheme.accent}`}>
                      {member.overall} pts
                    </p>
                  </div>
                  {member.awardsWon > 0 && (
                    <div className="flex gap-1">
                      {Array(member.awardsWon).fill(null).map((_, i) => (
                        <span key={i} className="text-yellow-400 font-bold text-xs">+1 Award</span>
                      )).slice(0, 1)}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
