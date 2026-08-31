import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Users, Calendar, User, Clock, Check, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { API_BASE_URL, getAuthHeaders } from '../lib/supabase';
import { getSession, isAuthenticated } from '../lib/auth';
import PageLoader from '../components/PageLoader';
import { toast } from 'sonner';
import { useAppTheme } from '../lib/theme';

interface Group {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  memberIds: string[];
  cardsReleased: boolean;
  sessionEnded?: boolean;
  groupImageUrl?: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { tokens } = useAppTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Try to refresh the SDK/session, but timeout if the network/backend is unresponsive.
      const withTimeout = <T,>(p: Promise<T>, ms = 8000) =>
        new Promise<T>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error('timeout')), ms);
          p.then((v) => (clearTimeout(t), resolve(v))).catch((e) => (clearTimeout(t), reject(e)));
        });

      await withTimeout(getSession(), 8000).catch((err) => {
        console.warn('getSession timed out or failed:', err);
      });

      // Fire both requests concurrently but guard against a hung network.
      const profilePromise = fetch(`${API_BASE_URL}/user/profile`, { headers: getAuthHeaders() });
      const groupsPromise = fetch(`${API_BASE_URL}/user/groups`, { headers: getAuthHeaders() });

      const [profileRes, groupsRes] = await Promise.all([
        withTimeout(profilePromise, 8000),
        withTimeout(groupsPromise, 8000),
      ]);

      if (profileRes.status === 401) { navigate('/'); return; }
      const profileData = await profileRes.json();
      if (profileRes.ok) setUserProfile(profileData.profile);

      const groupsData = await groupsRes.json();
      if (groupsRes.ok) setGroups(groupsData.groups || []);
      else toast.error('Failed to load groups');
    } catch {
      toast.error('Failed to load data (server timeout or network error)');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {userProfile?.profilePicUrl ? (
              <img src={userProfile.profilePicUrl} alt={userProfile.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1">Dashboard</h1>
              <p className={`text-sm sm:text-base truncate ${tokens.accentTextSecondary}`}>Welcome back, {userProfile?.name || 'User'}!</p>
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <Card className="text-center py-12 bg-white/10 border-white/20 text-white">
            <CardContent className="space-y-4">
              <Users className="w-16 h-16 mx-auto text-white/40" />
              <h3 className="text-xl font-semibold">No groups yet</h3>
              <p className="text-white/60">Create your first group or join one using an invite link</p>
              <Button onClick={() => navigate('/create-group')}>
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Group
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {groups.map((group) => (
              <Card
                key={group.id}
                className={`hover:shadow-lg transition-all cursor-pointer overflow-hidden bg-white/10 border-white/20 text-white hover:bg-white/15 ${
                  group.sessionEnded ? 'border-purple-400/40' : ''
                }`}
                onClick={() => navigate(`/group/${group.id}`)}
              >
                {/* Session status banner */}
                {group.sessionEnded ? (
                  <div className="bg-gradient-to-r from-purple-700 to-fuchsia-700 text-white text-xs font-semibold px-3 py-1 flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    Session Ended — Results Available
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-green-700 to-emerald-700 text-white text-xs font-semibold px-3 py-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Active Session
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base sm:text-lg truncate text-white">{group.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-white/60">
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {group.memberIds.length} member{group.memberIds.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {new Date(group.createdAt).toLocaleDateString()}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-white/50">Cards:</span>
                        <span className={`font-semibold flex items-center gap-1 ${group.cardsReleased ? 'text-green-400' : 'text-amber-400'}`}>
                          {group.cardsReleased ? (
                            <><Check className="w-3 h-3" /> Released</>
                          ) : (
                            <><Clock className="w-3 h-3" /> Pending</>
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </div>

                  {/* Group image — fade in from right */}
                  {group.groupImageUrl && (
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="shrink-0 m-3 mt-4"
                    >
                      <img
                        src={group.groupImageUrl}
                        alt={group.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shadow-md"
                      />
                    </motion.div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
