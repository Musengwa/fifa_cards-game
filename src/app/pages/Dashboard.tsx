import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Plus, LogOut, Users, Calendar, User, Bell,
  CheckCircle2, Clock, CreditCard, Check, Lock,
} from 'lucide-react';
import { motion } from 'motion/react';
import { API_BASE_URL, getAuthHeaders } from '../lib/supabase';
import { signOut, getSession, isAuthenticated } from '../lib/auth';
import { toast } from 'sonner';

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
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const session = await getSession();
      if (!session) { navigate('/'); return; }

      const profileRes = await fetch(`${API_BASE_URL}/user/profile`, { headers: getAuthHeaders() });
      if (profileRes.status === 401) { navigate('/'); return; }
      const profileData = await profileRes.json();
      if (profileRes.ok) setUserProfile(profileData.profile);

      const groupsRes = await fetch(`${API_BASE_URL}/user/groups`, { headers: getAuthHeaders() });
      const groupsData = await groupsRes.json();
      if (groupsRes.ok) setGroups(groupsData.groups || []);
      else toast.error('Failed to load groups');

      try {
        const invitesRes = await fetch(`${API_BASE_URL}/invite/pending`, { headers: getAuthHeaders() });
        const invitesData = await invitesRes.json();
        if (invitesRes.ok) setPendingInviteCount(invitesData.invites?.length || 0);
      } catch { /* non-fatal */ }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try { await signOut(); navigate('/'); }
    catch { toast.error('Sign out failed'); }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { Authorization } = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/user/upload-profile-pic`, {
        method: 'POST',
        headers: { Authorization },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to upload picture');
      toast.success('Profile picture uploaded');
      loadData();
      setProfileDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload picture');
    } finally {
      setUploadingPic(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading…</div>
      </div>
    );
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
              <p className="text-sm sm:text-base text-green-100 truncate">Welcome back, {userProfile?.name || 'User'}!</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Invites bell */}
            <div className="relative">
              <Button onClick={() => navigate('/invites')} variant="outline" size="sm">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {pendingInviteCount > 0 && <span className="ml-1 sm:hidden text-xs">{pendingInviteCount}</span>}
              </Button>
              {pendingInviteCount > 0 && (
                <div className="hidden sm:flex absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 items-center justify-center">
                  {pendingInviteCount}
                </div>
              )}
            </div>

            {/* Profile */}
            <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Your Profile</DialogTitle>
                  <DialogDescription>Update your profile picture</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    {userProfile?.profilePicUrl ? (
                      <img src={userProfile.profilePicUrl} alt={userProfile.name} className="w-32 h-32 rounded-full object-cover" />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="w-16 h-16 text-gray-600" />
                      </div>
                    )}
                    <div className="text-center">
                      <h3 className="font-semibold text-lg">{userProfile?.name}</h3>
                      <p className="text-gray-500 text-sm">{userProfile?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Upload Profile Picture</Label>
                    <Input type="file" accept="image/*" onChange={handleProfilePicUpload} disabled={uploadingPic} />
                    {uploadingPic && <p className="text-sm text-gray-500">Uploading…</p>}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create Card — full page */}
            <Button
              onClick={() => navigate('/create-card')}
              size="sm"
              variant="outline"
              className="border-purple-400/60 text-purple-200 hover:bg-purple-900/20 hover:text-purple-100"
            >
              <CreditCard className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Card</span>
            </Button>

            {/* Create Group */}
            <Button onClick={() => navigate('/create-group')} size="sm" className="flex-1 sm:flex-none">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Group</span>
              <span className="sm:hidden">Create</span>
            </Button>

            {/* Sign Out */}
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
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
