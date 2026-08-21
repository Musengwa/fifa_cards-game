import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { ArrowLeft, Trophy, Lock, BarChart2 } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../lib/supabase';
import { formatAwardName } from '../lib/awards';
import { useAppTheme } from '../lib/theme';
import PageLoader from '../components/PageLoader';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar,
} from 'recharts';

interface Group {
  id: string;
  name: string;
  sessionEnded?: boolean;
  attributes: Array<{ id: string; name: string }>;
  awardCategories: Array<{ id: string; name: string }>;
}

interface Member { id: string; name: string; }

interface VoteRecord {
  groupId: string;
  voterId: string;
  votes: { [awardId: string]: string };
  timestamp: string;
}

export default function Analytics() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { tokens } = useAppTheme();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [ratings, setRatings] = useState<any>({});
  const [votes, setVotes] = useState<any>({});
  const [allVoteRecords, setAllVoteRecords] = useState<VoteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalyticsData(); }, [groupId]);

  const loadAnalyticsData = async () => {
    try {
      const groupRes = await fetch(`${API_BASE_URL}/group/${groupId}`, { headers: getAuthHeaders() });
      const groupData = await groupRes.json();
      if (!groupRes.ok) { toast.error('Failed to load group'); navigate('/dashboard'); return; }
      setGroup(groupData.group);

      const membersRes = await fetch(`${API_BASE_URL}/group/${groupId}/members`, { headers: getAuthHeaders() });
      const membersData = await membersRes.json();
      if (membersRes.ok) setMembers(membersData.members);

      const ratingsRes = await fetch(`${API_BASE_URL}/group/${groupId}/ratings`, { headers: getAuthHeaders() });
      const ratingsData = await ratingsRes.json();
      if (ratingsRes.ok) setRatings(ratingsData.averages || {});

      const votesRes = await fetch(`${API_BASE_URL}/group/${groupId}/votes`, { headers: getAuthHeaders() });
      const votesData = await votesRes.json();
      if (votesRes.ok) { setVotes(votesData.results || {}); setAllVoteRecords(votesData.votes || []); }
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Group not found</div>
      </div>
    );
  }

  const ratingChartData = group.attributes.map(attr => {
    const dataPoint: any = { attribute: attr.name };
    members.forEach(member => {
      const mr = ratings[member.id];
      if (mr && mr[attr.id]) dataPoint[member.name] = Math.round(mr[attr.id]);
    });
    return dataPoint;
  });

  const overallRatingsData = members.map(member => {
    const mr = ratings[member.id];
    if (!mr) return { name: member.name, overall: 0 };
    const scores = Object.values(mr) as number[];
    return {
      name: member.name,
      overall: scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0,
    };
  }).sort((a, b) => b.overall - a.overall);

  const voteChartData = group.awardCategories.map(award => {
    const awardVotes = votes[award.id] || {};
    const topVotes = Object.entries(awardVotes)
      .map(([userId, count]) => ({
        userId,
        count: count as number,
        name: members.find(m => m.id === userId)?.name || 'Unknown',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { award: formatAwardName(award.name), awardId: award.id, votes: topVotes };
  });

  const chartTooltipStyle = {
    contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' },
    labelStyle: { color: '#94a3b8' },
  };

  const axisStyle = { fill: '#94a3b8', fontSize: 11 };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${tokens.bgGradient} p-3 sm:p-6 -mt-20 pt-20`}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button
            onClick={() => navigate(`/group/${groupId}`)}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-7 h-7 text-blue-400" />
              Analytics
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-0.5">{group.name}</p>
          </div>
        </div>

        {/* Session-ended banner */}
        {group.sessionEnded && (
          <div className="mb-6 bg-gradient-to-r from-purple-900/60 to-fuchsia-900/60 border border-purple-500/30 rounded-xl px-5 py-4 flex items-center gap-3">
            <Lock className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <p className="text-purple-200 font-semibold text-sm">Session Ended — Final Results</p>
              <p className="text-purple-300/70 text-xs mt-0.5">These are the definitive analytics. No further changes can be made.</p>
            </div>
          </div>
        )}

        {/* Overall Rankings */}
        <div className="mb-6 bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
          <h2 className="text-lg font-bold text-white mb-4">Overall Rankings</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overallRatingsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} tick={axisStyle} />
              <YAxis domain={[0, 100]} tick={axisStyle} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="overall" fill="#10b981" name="Overall Score" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attribute Comparison */}
        <div className="mb-6 bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
          <h2 className="text-lg font-bold text-white mb-4">Attribute Comparison</h2>
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={ratingChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="attribute" angle={-35} textAnchor="end" height={80} tick={axisStyle} />
                <YAxis domain={[0, 100]} tick={axisStyle} />
                <Tooltip {...chartTooltipStyle} />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                {members.slice(0, 6).map((member, idx) => (
                  <Bar key={member.id} dataKey={member.name} fill={`hsl(${idx * 60}, 70%, 55%)`} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        {members.length > 0 && (
          <div className="mb-6 bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
            <h2 className="text-lg font-bold text-white mb-4">Top 3 — Skill Radar</h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={ratingChartData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="attribute" tick={axisStyle} />
                <PolarRadiusAxis domain={[0, 100]} tick={axisStyle} />
                <Tooltip {...chartTooltipStyle} />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                {overallRatingsData.slice(0, 3).map((player, idx) => (
                  <Radar
                    key={player.name}
                    name={player.name}
                    dataKey={player.name}
                    stroke={`hsl(${idx * 120}, 70%, 60%)`}
                    fill={`hsl(${idx * 120}, 70%, 60%)`}
                    fillOpacity={0.25}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Vote Results */}
        {voteChartData.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Award Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {voteChartData.map((awardData) => (
                <div key={awardData.award} className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
                  <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">{awardData.award}</h3>
                  {awardData.votes.length === 0 ? (
                    <p className="text-slate-500 text-sm">No votes submitted</p>
                  ) : (
                    <div className="space-y-2">
                      {awardData.votes.map((vote, idx) => (
                        <div
                          key={vote.userId}
                          className={`flex justify-between items-center p-3 rounded-lg ${
                            idx === 0
                              ? 'bg-yellow-500/10 border border-yellow-500/30'
                              : 'bg-slate-700/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {idx === 0 && <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />}
                            <span className={`font-medium text-sm ${idx === 0 ? 'text-yellow-200' : 'text-slate-300'}`}>
                              {idx + 1}. {vote.name}
                            </span>
                          </div>
                          <span className={`font-bold text-sm ${idx === 0 ? 'text-yellow-400' : 'text-slate-400'}`}>
                            {vote.count} vote{vote.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vote Distribution */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
          <h2 className="text-lg font-bold text-white mb-4">Vote Distribution</h2>
          {allVoteRecords.length === 0 ? (
            <p className="text-slate-500 text-sm">No votes submitted yet</p>
          ) : (
            <div className="space-y-6">
              {group.awardCategories.map((award) => (
                <div key={award.id} className="border-b border-slate-700/50 pb-4 last:border-b-0">
                  <h4 className="font-semibold text-slate-300 text-sm uppercase tracking-wide mb-3">{formatAwardName(award.name)}</h4>
                  <div className="space-y-2">
                    {allVoteRecords.map((record) => {
                      const votedFor = record.votes[award.id];
                      if (!votedFor) return null;
                      const voter = members.find(m => m.id === record.voterId);
                      const votedMember = members.find(m => m.id === votedFor);
                      return (
                        <div
                          key={`${record.voterId}-${award.id}`}
                          className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg text-sm"
                        >
                          <span className="text-slate-400">
                            <span className="font-semibold text-slate-200">{voter?.name || 'Unknown'}</span>
                            {' voted for '}
                          </span>
                          <span className="font-bold text-emerald-400">{votedMember?.name || 'Unknown'}</span>
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
