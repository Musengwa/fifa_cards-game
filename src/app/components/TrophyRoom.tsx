import { useState } from 'react';
import { Trophy, Crown, Star, Award, Sparkles, Zap } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  profilePicUrl: string | null;
}

interface TrophyRoomProps {
  members: Member[];
  votes: any;
  awardCategories: Array<{ id: string; name: string }>;
}

export default function TrophyRoom({ members, votes, awardCategories }: TrophyRoomProps) {
  const [hoveredAward, setHoveredAward] = useState<string | null>(null);

  // Calculate award winners
  const awardWinners = awardCategories.map(award => {
    const awardVotes = votes[award.id] || {};
    const sortedVotes = Object.entries(awardVotes)
      .sort(([, a]: any, [, b]: any) => b - a);

    const winner = sortedVotes[0];
    const runnerUp = sortedVotes[1];
    const thirdPlace = sortedVotes[2];

    return {
      award,
      winner: winner ? {
        member: members.find(m => m.id === winner[0]),
        votes: winner[1] as number
      } : null,
      runnerUp: runnerUp ? {
        member: members.find(m => m.id === runnerUp[0]),
        votes: runnerUp[1] as number
      } : null,
      thirdPlace: thirdPlace ? {
        member: members.find(m => m.id === thirdPlace[0]),
        votes: thirdPlace[1] as number
      } : null
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Trophy className="w-10 h-10 sm:w-16 sm:h-16 text-yellow-400 animate-pulse" />
            <h1 className="text-3xl sm:text-6xl font-bold text-white">Trophy Room</h1>
            <Trophy className="w-10 h-10 sm:w-16 sm:h-16 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-base sm:text-2xl text-purple-200 font-light">
            Hall of Champions & Award Winners
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-bounce" style={{ animationDelay: '0ms' }} />
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-bounce" style={{ animationDelay: '150ms' }} />
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        {/* Awards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {awardWinners.map((awardData, idx) => (
            <Card
              key={awardData.award.id}
              className="bg-gradient-to-br from-purple-800/40 to-pink-800/40 backdrop-blur-lg border-2 border-purple-400/30 hover:border-yellow-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20"
              onMouseEnter={() => setHoveredAward(awardData.award.id)}
              onMouseLeave={() => setHoveredAward(null)}
            >
              <CardContent className="p-4 sm:p-8">
                {/* Award Title */}
                <div className="text-center mb-4 sm:mb-6">
                  <div className="inline-flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <Star className={`w-6 h-6 sm:w-8 sm:h-8 ${hoveredAward === awardData.award.id ? 'text-yellow-400 animate-spin' : 'text-yellow-500'}`} />
                    <h2 className="text-xl sm:text-3xl font-bold text-white">{awardData.award.name}</h2>
                    <Star className={`w-6 h-6 sm:w-8 sm:h-8 ${hoveredAward === awardData.award.id ? 'text-yellow-400 animate-spin' : 'text-yellow-500'}`} />
                  </div>
                </div>

                {!awardData.winner ? (
                  <p className="text-center text-purple-200">No votes recorded</p>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Winner */}
                    <div className="relative">
                      <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4">
                        <Crown className="w-10 h-10 sm:w-16 sm:h-16 text-yellow-400 drop-shadow-lg animate-pulse" />
                      </div>
                      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-xl p-4 sm:p-6 border-2 border-yellow-400">
                        <div className="flex items-center gap-3 sm:gap-4">
                          {awardData.winner.member?.profilePicUrl ? (
                            <img
                              src={awardData.winner.member.profilePicUrl}
                              alt={awardData.winner.member.name}
                              className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-yellow-400 shadow-lg"
                            />
                          ) : (
                            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-yellow-400 flex items-center justify-center border-4 border-yellow-300">
                              <Trophy className="w-7 h-7 sm:w-10 sm:h-10 text-yellow-900" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-yellow-400 font-bold text-sm sm:text-base flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>WINNER</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white truncate">
                              {awardData.winner.member?.name || 'Unknown'}
                            </h3>
                            <p className="text-yellow-200 font-medium text-sm sm:text-base">
                              {awardData.winner.votes} vote{awardData.winner.votes !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Runner-up and Third Place */}
                    {(awardData.runnerUp || awardData.thirdPlace) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Runner-up */}
                        {awardData.runnerUp && (
                          <div className="bg-gradient-to-r from-gray-400/10 to-gray-500/10 rounded-lg p-3 sm:p-4 border border-gray-400/30">
                            <div className="flex items-center gap-2 sm:gap-3">
                              {awardData.runnerUp.member?.profilePicUrl ? (
                                <img
                                  src={awardData.runnerUp.member.profilePicUrl}
                                  alt={awardData.runnerUp.member.name}
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-400"
                                />
                              ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-400 flex items-center justify-center">
                                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-300 text-xs sm:text-sm font-medium">2nd Place</p>
                                <p className="font-bold text-white text-sm sm:text-base truncate">
                                  {awardData.runnerUp.member?.name || 'Unknown'}
                                </p>
                                <p className="text-gray-400 text-xs sm:text-sm">
                                  {awardData.runnerUp.votes} vote{awardData.runnerUp.votes !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Third Place */}
                        {awardData.thirdPlace && (
                          <div className="bg-gradient-to-r from-amber-700/10 to-amber-800/10 rounded-lg p-3 sm:p-4 border border-amber-700/30">
                            <div className="flex items-center gap-2 sm:gap-3">
                              {awardData.thirdPlace.member?.profilePicUrl ? (
                                <img
                                  src={awardData.thirdPlace.member.profilePicUrl}
                                  alt={awardData.thirdPlace.member.name}
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-amber-700"
                                />
                              ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-700 flex items-center justify-center">
                                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-900" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-amber-300 text-xs sm:text-sm font-medium">3rd Place</p>
                                <p className="font-bold text-white text-sm sm:text-base truncate">
                                  {awardData.thirdPlace.member?.name || 'Unknown'}
                                </p>
                                <p className="text-amber-400 text-xs sm:text-sm">
                                  {awardData.thirdPlace.votes} vote{awardData.thirdPlace.votes !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 sm:mt-16 pb-8">
          <div className="inline-flex items-center gap-2 text-purple-300">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <p className="text-sm sm:text-lg">Congratulations to all our winners!</p>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
