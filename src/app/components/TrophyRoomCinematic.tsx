import { useState } from 'react';
import { Trophy, Crown, Star, Sparkles, Zap, Medal } from 'lucide-react';

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

export default function TrophyRoomCinematic({ members, votes, awardCategories }: TrophyRoomProps) {
  const [selectedAward, setSelectedAward] = useState<string | null>(null);

  // Calculate award winners with runner-ups
  const awardWinners = awardCategories.map(award => {
    const awardVotes = votes[award.id] || {};
    const sortedVotes = Object.entries(awardVotes)
      .sort(([, a]: any, [, b]: any) => b - a);

    return {
      award,
      winner: sortedVotes[0] ? {
        member: members.find(m => m.id === sortedVotes[0][0]),
        votes: sortedVotes[0][1] as number,
      } : null,
      runnerUp: sortedVotes[1] ? {
        member: members.find(m => m.id === sortedVotes[1][0]),
        votes: sortedVotes[1][1] as number,
      } : null,
      thirdPlace: sortedVotes[2] ? {
        member: members.find(m => m.id === sortedVotes[2][0]),
        votes: sortedVotes[2][1] as number,
      } : null,
    };
  });

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-amber-900/20"></div>
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-8">
        {/* Cinematic Header */}
        <div className="text-center mb-16 sm:mb-24 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 sm:w-96 sm:h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
          </div>
          <div className="relative">
            <div className="flex justify-center mb-6">
              <Trophy className="w-20 h-20 sm:w-32 sm:h-32 text-yellow-400 animate-bounce drop-shadow-2xl" />
            </div>
            <h1 className="text-5xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 mb-4 animate-pulse">
              TROPHY ROOM
            </h1>
            <div className="flex justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <Sparkles className="w-8 h-8 text-yellow-300 animate-bounce" style={{ animationDelay: '150ms' }} />
              <Sparkles className="w-6 h-6 text-yellow-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xl sm:text-3xl text-amber-200 font-light tracking-wide">
              Celebrating Our Champions
            </p>
          </div>
        </div>

        {/* Awards Showcase */}
        <div className="space-y-16 sm:space-y-24">
          {awardWinners.map((awardData, idx) => {
            if (!awardData.winner) return null;

            return (
              <div
                key={awardData.award.id}
                className="relative"
                onMouseEnter={() => setSelectedAward(awardData.award.id)}
                onMouseLeave={() => setSelectedAward(null)}
              >
                {/* Award Title */}
                <div className="text-center mb-8 sm:mb-12">
                  <div className="inline-flex items-center gap-3 sm:gap-4 mb-4">
                    <Zap className={`w-8 h-8 sm:w-12 sm:h-12 ${selectedAward === awardData.award.id ? 'text-yellow-400 animate-ping' : 'text-amber-500'}`} />
                    <h2 className="text-3xl sm:text-6xl font-bold text-white">
                      {awardData.award.name}
                    </h2>
                    <Zap className={`w-8 h-8 sm:w-12 sm:h-12 ${selectedAward === awardData.award.id ? 'text-yellow-400 animate-ping' : 'text-amber-500'}`} />
                  </div>
                </div>

                {/* Winner Spotlight */}
                <div className="relative mb-8">
                  {/* Spotlight Effect */}
                  <div className="absolute inset-0 flex justify-center">
                    <div className={`w-full h-full max-w-2xl bg-gradient-radial from-yellow-500/20 via-yellow-500/5 to-transparent blur-2xl ${selectedAward === awardData.award.id ? 'animate-pulse' : ''}`}></div>
                  </div>

                  {/* Winner Card */}
                  <div className="relative max-w-2xl mx-auto">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-3xl blur opacity-75 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-yellow-900/40 via-amber-900/40 to-yellow-900/40 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border-4 border-yellow-400/50">
                      {/* Crown */}
                      <div className="absolute -top-8 sm:-top-12 left-1/2 transform -translate-x-1/2">
                        <Crown className="w-16 h-16 sm:w-24 sm:h-24 text-yellow-400 drop-shadow-2xl animate-bounce" />
                      </div>

                      {/* Winner Content */}
                      <div className="text-center mt-8 sm:mt-12">
                        {/* Profile Picture */}
                        {awardData.winner.member?.profilePicUrl ? (
                          <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                            <img
                              src={awardData.winner.member.profilePicUrl}
                              alt={awardData.winner.member.name}
                              className="relative w-32 h-32 sm:w-48 sm:h-48 rounded-full object-cover border-8 border-yellow-400 shadow-2xl"
                            />
                          </div>
                        ) : (
                          <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                            <div className="relative w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center border-8 border-yellow-300">
                              <Trophy className="w-16 h-16 sm:w-24 sm:h-24 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Winner Badge */}
                        <div className="mb-4">
                          <span className="inline-block bg-yellow-400 text-black px-6 py-2 rounded-full text-sm sm:text-lg font-black uppercase tracking-wider shadow-lg">
                            Winner
                          </span>
                        </div>

                        {/* Winner Name */}
                        <h3 className="text-4xl sm:text-6xl font-black text-white mb-4 drop-shadow-lg">
                          {awardData.winner.member?.name || 'Unknown'}
                        </h3>

                        {/* Vote Count */}
                        <div className="flex justify-center items-center gap-3 mb-6">
                          <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
                          <p className="text-2xl sm:text-4xl font-bold text-yellow-300">
                            {awardData.winner.votes} vote{awardData.winner.votes !== 1 ? 's' : ''}
                          </p>
                          <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
                        </div>

                        {/* Decorative Stars */}
                        <div className="flex justify-center gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 fill-yellow-400 animate-pulse"
                              style={{ animationDelay: `${i * 100}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Runner-up & Third Place */}
                {(awardData.runnerUp || awardData.thirdPlace) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
                    {/* Second Place */}
                    {awardData.runnerUp && (
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-400 to-gray-600 rounded-2xl blur opacity-40 group-hover:opacity-70 transition"></div>
                        <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md rounded-2xl p-6 border-2 border-gray-400/30">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg">
                              2
                            </div>
                            {awardData.runnerUp.member?.profilePicUrl ? (
                              <img
                                src={awardData.runnerUp.member.profilePicUrl}
                                alt={awardData.runnerUp.member.name}
                                className="w-16 h-16 rounded-full object-cover border-4 border-gray-400"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center">
                                <Medal className="w-8 h-8 text-gray-700" />
                              </div>
                            )}
                          </div>
                          <h4 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">
                            {awardData.runnerUp.member?.name || 'Unknown'}
                          </h4>
                          <p className="text-gray-300 text-lg">
                            {awardData.runnerUp.votes} vote{awardData.runnerUp.votes !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Third Place */}
                    {awardData.thirdPlace && (
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-700 to-amber-900 rounded-2xl blur opacity-40 group-hover:opacity-70 transition"></div>
                        <div className="relative bg-gradient-to-br from-amber-900/40 to-amber-950/60 backdrop-blur-md rounded-2xl p-6 border-2 border-amber-700/30">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg">
                              3
                            </div>
                            {awardData.thirdPlace.member?.profilePicUrl ? (
                              <img
                                src={awardData.thirdPlace.member.profilePicUrl}
                                alt={awardData.thirdPlace.member.name}
                                className="w-16 h-16 rounded-full object-cover border-4 border-amber-700"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-amber-700 flex items-center justify-center">
                                <Medal className="w-8 h-8 text-amber-900" />
                              </div>
                            )}
                          </div>
                          <h4 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">
                            {awardData.thirdPlace.member?.name || 'Unknown'}
                          </h4>
                          <p className="text-amber-300 text-lg">
                            {awardData.thirdPlace.votes} vote{awardData.thirdPlace.votes !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-24 pb-12">
          <div className="inline-flex items-center gap-3 text-amber-300/80">
            <Sparkles className="w-5 h-5" />
            <p className="text-lg sm:text-2xl font-light">
              Champions Forever
            </p>
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
