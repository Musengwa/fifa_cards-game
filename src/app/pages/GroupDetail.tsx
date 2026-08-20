import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import {
  ArrowLeft, Share2, Settings, Users, TrendingUp, Award, Search, Copy, Check, BarChart3,
  StopCircle, Trophy, Sparkles, AlertTriangle, User as UserIcon, CheckCircle2, Trash2,
} from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { API_BASE_URL, getAuthHeaders } from '../lib/supabase';
import { getCurrentUserId } from '../lib/auth';
import { isMainAward, formatAwardName } from '../lib/awards';
import { toast } from 'sonner';
import Showroom from '../components/Showroom';
import TrophyRoomCinematic from '../components/TrophyRoomCinematic';
import { StarRatingInput } from '../components/StarRating';
import PageLoader from '../components/PageLoader';

interface Group {
  id: string;
  name: string;
  description?: string;
  groupImageUrl?: string | null;
  creatorId: string;
  attributes: Array<{ id: string; name: string }>;
  awardCategories: Array<{ id: string; name: string }>;
  cardsReleased: boolean;
  analyticsVisible: boolean;
  sessionEnded?: boolean;
  memberIds: string[];
}

interface Member {
  id: string;
  name: string;
  email: string;
  profilePicUrl: string | null;
}

/** Tappable avatar + name tile used to pick a member — for rating and for award votes. */
function MemberTile({
  member,
  onClick,
  disabled,
  selected,
  badge,
}: {
  member: Member;
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
  badge?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
        selected ? 'border-green-500 bg-green-500/10' : 'border-transparent hover:border-black/10 hover:bg-black/5'
      }`}
    >
      <div className="relative">
        {member.profilePicUrl ? (
          <img
            src={member.profilePicUrl}
            alt={member.name}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center">
            <UserIcon className="w-7 h-7 text-gray-500" />
          </div>
        )}
        {badge}
      </div>
      <span className="text-xs sm:text-sm font-medium text-center leading-tight line-clamp-2 max-w-[80px]">
        {member.name}
      </span>
    </button>
  );
}

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [ratings, setRatings] = useState<any>({});
  const [starRatings, setStarRatings] = useState<any>({});
  const [myRatings, setMyRatings] = useState<any[]>([]);
  const [votes, setVotes] = useState<any>({});
  const [myVote, setMyVote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [voteDialogOpen, setVoteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [ratingValues, setRatingValues] = useState<{ [key: string]: number }>({});
  const [overallStars, setOverallStars] = useState(0);
  const [voteSelections, setVoteSelections] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sendingInvites, setSendingInvites] = useState<string[]>([]);
  const [postSessionTab, setPostSessionTab] = useState<'showroom' | 'trophies' | 'analytics'>('showroom');
  const [endSessionDialogOpen, setEndSessionDialogOpen] = useState(false);
  const [endSessionConfirmed, setEndSessionConfirmed] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [deleteGroupConfirmed, setDeleteGroupConfirmed] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const currentUserId = getCurrentUserId();
  const isCreator = group?.creatorId === currentUserId;
  const inviteLink = `${window.location.origin}/join/${groupId}`;

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      // Load group
      const groupRes = await fetch(`${API_BASE_URL}/group/${groupId}`, {
        headers: getAuthHeaders(),
      });
      const groupData = await groupRes.json();
      
      if (!groupRes.ok) {
        toast.error(groupData.error || 'Failed to load group');
        navigate('/dashboard');
        return;
      }
      
      setGroup(groupData.group);

      // Load members
      const membersRes = await fetch(`${API_BASE_URL}/group/${groupId}/members`, {
        headers: getAuthHeaders(),
      });
      const membersData = await membersRes.json();
      if (membersRes.ok) {
        setMembers(membersData.members);
      }

      // Load ratings
      const ratingsRes = await fetch(`${API_BASE_URL}/group/${groupId}/ratings`, {
        headers: getAuthHeaders(),
      });
      const ratingsData = await ratingsRes.json();
      if (ratingsRes.ok) {
        setRatings(ratingsData.averages || {});
        setStarRatings(ratingsData.starRatings || {});
      }

      // Load my ratings
      const myRatingsRes = await fetch(`${API_BASE_URL}/group/${groupId}/my-ratings`, {
        headers: getAuthHeaders(),
      });
      const myRatingsData = await myRatingsRes.json();
      if (myRatingsRes.ok) {
        setMyRatings(myRatingsData.ratings || []);
      }

      // Load votes
      const votesRes = await fetch(`${API_BASE_URL}/group/${groupId}/votes`, {
        headers: getAuthHeaders(),
      });
      const votesData = await votesRes.json();
      if (votesRes.ok) {
        setVotes(votesData.results || {});
      }

      // Load my vote
      const myVoteRes = await fetch(`${API_BASE_URL}/group/${groupId}/my-votes`, {
        headers: getAuthHeaders(),
      });
      const myVoteData = await myVoteRes.json();
      if (myVoteRes.ok) {
        setMyVote(myVoteData.vote);
        if (myVoteData.vote?.votes) {
          setVoteSelections(myVoteData.vote.votes);
        }
      }
    } catch (error) {
      console.error('Error loading group data:', error);
      toast.error('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (cardsReleased?: boolean, analyticsVisible?: boolean, description?: string, sessionEnded?: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/group/${groupId}/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cardsReleased, analyticsVisible, description, sessionEnded }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setGroup(data.group);
      toast.success('Settings updated');
      loadGroupData(); // Reload to refresh data visibility
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings');
    }
  };

  const handleEndSession = () => {
    setEndSessionConfirmed(false);
    setEndSessionDialogOpen(true);
  };

  const confirmEndSession = async () => {
    if (!endSessionConfirmed) {
      toast.error('Please check the confirmation box first');
      return;
    }
    setEndingSession(true);
    try {
      const response = await fetch(`${API_BASE_URL}/group/${groupId}/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cardsReleased: true, analyticsVisible: true, sessionEnded: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setGroup(data.group);
      setEndSessionDialogOpen(false);
      toast.success('Session ended! Final results are now displayed to all members.');
      loadGroupData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to end session');
    } finally {
      setEndingSession(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupConfirmed) {
      toast.error('Please check the confirmation box first');
      return;
    }
    setDeletingGroup(true);
    try {
      const response = await fetch(`${API_BASE_URL}/group/${groupId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success('Group deleted');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete group');
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleGroupImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const authHeaders = getAuthHeaders();
      const headers: any = {
        'Authorization': authHeaders.Authorization
      };
      // Don't set Content-Type for FormData - browser will set it with boundary

      const response = await fetch(`${API_BASE_URL}/group/${groupId}/upload-image`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      toast.success('Group image uploaded');
      loadGroupData();
    } catch (error: any) {
      console.error('Error uploading group image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDescriptionUpdate = async (description: string) => {
    if (description === group?.description) return;
    await handleSettingsUpdate(undefined, undefined, description);
  };

  const openRateDialog = (member: Member) => {
    if (member.id === currentUserId) {
      toast.error('You cannot rate yourself');
      return;
    }

    setSelectedUser(member);
    
    // Check if already rated
    const existingRating = myRatings.find(r => r.toUserId === member.id);
    if (existingRating) {
      setRatingValues(existingRating.ratings);
      setOverallStars(existingRating.stars || 0);
    } else {
      // Initialize with 50
      const initial: any = {};
      group?.attributes.forEach(attr => {
        initial[attr.id] = 50;
      });
      setRatingValues(initial);
      setOverallStars(0);
    }

    setRateDialogOpen(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedUser) return;

    if (overallStars <= 0) {
      toast.error('Give an overall star rating first');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/rating/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          groupId,
          toUserId: selectedUser.id,
          ratings: ratingValues,
          stars: overallStars,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success(`Rated ${selectedUser.name} successfully!`);
      setRateDialogOpen(false);
      loadGroupData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit rating');
    }
  };

  const handleSubmitVotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vote/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          groupId,
          votes: voteSelections,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success('Votes submitted successfully!');
      setVoteDialogOpen(false);
      loadGroupData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit votes');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/user/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSendInvite = async (userId: string, userName: string) => {
    setSendingInvites(prev => [...prev, userId]);

    try {
      const response = await fetch(`${API_BASE_URL}/invite/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          groupId,
          toUserId: userId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Invitation sent to ${userName}!`);
      } else {
        toast.error(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setSendingInvites(prev => prev.filter(id => id !== userId));
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Invite link copied!');
    } catch (error) {
      console.warn('Clipboard API blocked, using fallback:', error);
      // Fallback: select the text for manual copy
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Invite link copied!');
      } catch (fallbackError) {
        toast.error('Could not copy link. Please copy manually: ' + inviteLink);
      }
      document.body.removeChild(textArea);
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

  const otherMembers = members.filter(m => m.id !== currentUserId);
  const hasRatedAll = myRatings.length === otherMembers.length;
  const hasVoted = !!myVote;

  // POST-SESSION MODE: Show completely different UI with Showroom, Trophy Room, and Analysis
  if (group.sessionEnded) {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Post-Session Header */}
        <div className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                    {group.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300">Session Ended • Results Showcase</p>
                </div>
              </div>
            </div>

            {/* Post-Session Navigation */}
            <div className="flex gap-2 sm:gap-4 mt-4 overflow-x-auto">
              <Button
                onClick={() => setPostSessionTab('showroom')}
                variant={postSessionTab === 'showroom' ? 'default' : 'ghost'}
                className={`flex-1 sm:flex-none ${
                  postSessionTab === 'showroom'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Showroom
              </Button>
              <Button
                onClick={() => setPostSessionTab('trophies')}
                variant={postSessionTab === 'trophies' ? 'default' : 'ghost'}
                className={`flex-1 sm:flex-none ${
                  postSessionTab === 'trophies'
                    ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Trophy Room
              </Button>
              <Button
                onClick={() => setPostSessionTab('analytics')}
                variant={postSessionTab === 'analytics' ? 'default' : 'ghost'}
                className={`flex-1 sm:flex-none ${
                  postSessionTab === 'analytics'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analysis
              </Button>
            </div>
          </div>
        </div>

        {/* Post-Session Content */}
        <div>
          {postSessionTab === 'showroom' && (
            <Showroom
              members={members}
              attributes={group.attributes}
              ratings={ratings}
              starRatings={starRatings}
              votes={votes}
              awardCategories={group.awardCategories}
            />
          )}

          {postSessionTab === 'trophies' && (
            <TrophyRoomCinematic
              members={members}
              attributes={group.attributes}
              ratings={ratings}
              starRatings={starRatings}
              votes={votes}
              awardCategories={group.awardCategories}
            />
          )}

          {postSessionTab === 'analytics' && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800">
              {/* Inline Analytics View */}
              <div className="max-w-7xl mx-auto p-3 sm:p-6">
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">Detailed Analysis</h2>
                  <p className="text-slate-300 text-sm sm:text-base">Comprehensive statistics and insights from this session</p>
                </div>
                <Button
                  onClick={() => navigate(`/group/${groupId}/analytics`)}
                  variant="outline"
                  className="mb-6 border-purple-400 text-purple-300 hover:bg-purple-900/20"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Open Full Analytics Dashboard
                </Button>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-4 sm:p-6 rounded-xl border border-purple-400/30">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{members.length}</div>
                    <div className="text-purple-200 text-sm sm:text-base">Total Members</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-600/20 to-amber-600/20 p-4 sm:p-6 rounded-xl border border-yellow-400/30">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{group.attributes.length}</div>
                    <div className="text-yellow-200 text-sm sm:text-base">Attributes Rated</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 p-4 sm:p-6 rounded-xl border border-blue-400/30">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{group.awardCategories.length}</div>
                    <div className="text-blue-200 text-sm sm:text-base">Award Categories</div>
                  </div>
                </div>

                <div className="text-center py-8 text-slate-400">
                  <p className="text-lg mb-4">Click the button above to view detailed charts and vote distributions</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-8">
          <div className="w-full sm:w-auto">
            <Button
              variant="ghost"
              className="text-white mb-3 sm:mb-4"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center gap-4">
              {group.groupImageUrl && (
                <img
                  src={group.groupImageUrl}
                  alt={group.name}
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">{group.name}</h1>
                {group.description && (
                  <p className="text-sm sm:text-base text-green-100 mb-1 sm:mb-2">{group.description}</p>
                )}
                <p className="text-sm sm:text-base text-green-100">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                  {isCreator && ' • Creator'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {isCreator && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Members</DialogTitle>
                  <DialogDescription>
                    Share the invite link or search for users to add
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Invite Link</Label>
                    <div className="flex gap-2">
                      <Input value={inviteLink} readOnly />
                      <Button onClick={copyInviteLink}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Search Users</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search by name or email"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button onClick={handleSearch}>
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                    {searchResults.length > 0 && (
                      <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                        {searchResults.map(user => {
                          const isMember = group?.memberIds.includes(user.id);
                          const isSending = sendingInvites.includes(user.id);

                          return (
                            <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100">
                              <div className="flex items-center gap-3">
                                {user.profilePicUrl ? (
                                  <img
                                    src={user.profilePicUrl}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-gray-600" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleSendInvite(user.id, user.name)}
                                disabled={isMember || isSending}
                              >
                                {isMember ? 'Already Member' : isSending ? 'Sending...' : 'Send Invite'}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            )}

            {isCreator && (
              <>
                <Button
                  onClick={() => navigate(`/group/${groupId}/analytics`)}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  <BarChart3 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Analytics</span>
                </Button>

                <Button
                  onClick={handleEndSession}
                  variant="destructive"
                  className="flex-1 sm:flex-none"
                >
                  <StopCircle className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">End Session</span>
                </Button>

                {/* End Session Confirmation Dialog */}
                <Dialog open={endSessionDialogOpen} onOpenChange={setEndSessionDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        End Session — This Cannot Be Undone
                      </DialogTitle>
                      <DialogDescription>
                        Ending the session will permanently stop all rating and voting, release cards to all members, and display final results. This action is irreversible.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 space-y-1">
                        <p>• All rating and voting will be <strong>permanently closed</strong></p>
                        <p>• Cards will be released to all members</p>
                        <p>• Full analytics will be visible to everyone</p>
                        <p>• The session cannot be reopened</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="end-session-confirm"
                          checked={endSessionConfirmed}
                          onCheckedChange={(checked) => setEndSessionConfirmed(!!checked)}
                        />
                        <label htmlFor="end-session-confirm" className="text-sm font-medium cursor-pointer">
                          I understand this action is permanent and cannot be reversed
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setEndSessionDialogOpen(false)}
                        disabled={endingSession}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={confirmEndSession}
                        disabled={!endSessionConfirmed || endingSession}
                      >
                        {endingSession ? 'Ending Session...' : 'End Session Forever'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 sm:flex-none">
                      <Settings className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Settings</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Group Settings</DialogTitle>
                    <DialogDescription>
                      Manage this group's image, description, and analytics visibility. Cards are shown
                      to members automatically once the session ends.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Group Image</Label>
                      {group.groupImageUrl && (
                        <img src={group.groupImageUrl} alt="Group" className="w-32 h-32 rounded object-cover mb-2" />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleGroupImageUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage && <p className="text-sm text-gray-500">Uploading...</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Group Description</Label>
                      <Input
                        placeholder="Describe your group"
                        defaultValue={group.description || ''}
                        onBlur={(e) => handleDescriptionUpdate(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Analytics</Label>
                        <p className="text-sm text-gray-500">
                          Display voting results and detailed statistics
                        </p>
                      </div>
                      <Switch
                        checked={group.analyticsVisible}
                        onCheckedChange={(checked) => handleSettingsUpdate(undefined, checked, undefined)}
                      />
                    </div>

                    {/* Danger zone */}
                    <div className="pt-2 border-t space-y-2">
                      <Label className="text-red-600">Danger Zone</Label>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSettingsOpen(false);
                          setDeleteGroupConfirmed(false);
                          setDeleteGroupOpen(true);
                        }}
                        className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Group
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Delete Group Confirmation Dialog */}
              <Dialog open={deleteGroupOpen} onOpenChange={setDeleteGroupOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      Delete Group — This Cannot Be Undone
                    </DialogTitle>
                    <DialogDescription>
                      Deleting this group permanently removes it, along with every rating, vote, and
                      pending invite tied to it, for all members. This action is irreversible.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="delete-group-confirm"
                        checked={deleteGroupConfirmed}
                        onCheckedChange={(checked) => setDeleteGroupConfirmed(!!checked)}
                      />
                      <label htmlFor="delete-group-confirm" className="text-sm font-medium cursor-pointer">
                        I understand this action is permanent and cannot be reversed
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setDeleteGroupOpen(false)}
                      disabled={deletingGroup}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleDeleteGroup}
                      disabled={!deleteGroupConfirmed || deletingGroup}
                    >
                      {deletingGroup ? 'Deleting…' : 'Delete Group Forever'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rate" className="space-y-4 sm:space-y-6">
          <TabsList className="bg-white/10 w-full grid grid-cols-2">
            <TabsTrigger value="rate" className="text-xs sm:text-base">
              <TrendingUp className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Rate Members</span>
            </TabsTrigger>
            <TabsTrigger value="vote" className="text-xs sm:text-base">
              <Award className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Vote Awards</span>
            </TabsTrigger>
          </TabsList>

          {/* Rate Tab */}
          <TabsContent value="rate" className="space-y-6">
            {group.sessionEnded && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <p className="text-center text-red-800 font-medium">
                    Session has ended. Rating is now closed.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-xl">Rate Your Teammates</CardTitle>
                <CardDescription className="text-sm">
                  Tap a teammate to rate them on the defined attributes (you cannot rate yourself)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasRatedAll ? (
                  <p className="text-green-600 font-medium text-sm sm:text-base">
                    You've rated all members! {!group.sessionEnded && 'You can update your ratings anytime.'}
                  </p>
                ) : (
                  <p className="text-orange-600 text-sm sm:text-base">
                    You've rated {myRatings.length} out of {otherMembers.length} members
                  </p>
                )}

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 mt-4 sm:mt-6">
                  {otherMembers.map((member) => {
                    const hasRated = myRatings.some(r => r.toUserId === member.id);
                    return (
                      <MemberTile
                        key={member.id}
                        member={member}
                        onClick={() => openRateDialog(member)}
                        disabled={group.sessionEnded}
                        badge={hasRated && (
                          <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5 border-2 border-white">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Rate Dialog */}
            <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rate {selectedUser?.name}</DialogTitle>
                  <DialogDescription>
                    Give an overall star rating, then rate from 0 to 100 for each attribute
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2 flex flex-col items-center">
                    <Label>Overall Star Rating</Label>
                    <StarRatingInput value={overallStars} onChange={setOverallStars} />
                    <span className="text-sm text-gray-500">
                      {overallStars > 0 ? `${overallStars} / 5 stars` : 'Tap a star to rate'}
                    </span>
                  </div>
                  {group.attributes.map((attr) => (
                    <div key={attr.id} className="space-y-2">
                      <div className="flex justify-between">
                        <Label>{attr.name}</Label>
                        <span className="font-bold text-lg">{ratingValues[attr.id] || 50}</span>
                      </div>
                      <Slider
                        value={[ratingValues[attr.id] || 50]}
                        onValueChange={([value]) => 
                          setRatingValues({ ...ratingValues, [attr.id]: value })
                        }
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  ))}
                  <Button onClick={handleSubmitRating} className="w-full">
                    Submit Rating
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Vote Tab */}
          <TabsContent value="vote" className="space-y-6">
            {group.sessionEnded && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <p className="text-center text-red-800 font-medium">
                    Session has ended. Voting is now closed.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-xl">Vote for Awards</CardTitle>
                <CardDescription className="text-sm">
                  Select one member for each award category (you cannot vote for yourself)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasVoted && (
                  <p className="text-green-600 font-medium mb-4 text-sm sm:text-base">
                    You've submitted your votes! {!group.sessionEnded && 'You can update them anytime.'}
                  </p>
                )}

                <div className="space-y-4 sm:space-y-6">
                  {group.awardCategories.map((award) => (
                    <div key={award.id} className="space-y-2">
                      <Label className="text-sm sm:text-base flex items-center gap-1.5">
                        {formatAwardName(award.name)}
                        {isMainAward(award.name) && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-500">Main</span>
                        )}
                      </Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {otherMembers.map((member) => (
                          <MemberTile
                            key={member.id}
                            member={member}
                            selected={voteSelections[award.id] === member.id}
                            onClick={() => setVoteSelections({ ...voteSelections, [award.id]: member.id })}
                            disabled={group.sessionEnded}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={handleSubmitVotes}
                    className="w-full"
                    size="lg"
                    disabled={group.sessionEnded}
                  >
                    {hasVoted ? 'Update Votes' : 'Submit Votes'}
                  </Button>
                </div>

                {/* Analytics */}
                {(group.analyticsVisible || isCreator) && Object.keys(votes).length > 0 && (
                  <div className="mt-8 space-y-4">
                    <h3 className="text-lg font-semibold">Voting Results</h3>
                    {group.awardCategories.map((award) => {
                      const awardVotes = votes[award.id] || {};
                      const sortedVotes = Object.entries(awardVotes)
                        .sort(([, a]: any, [, b]: any) => b - a);

                      return (
                        <Card key={award.id}>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-1.5">
                              {formatAwardName(award.name)}
                              {isMainAward(award.name) && (
                                <span className="text-[10px] font-bold uppercase tracking-wide text-amber-500">Main</span>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {sortedVotes.length === 0 ? (
                              <p className="text-gray-500">No votes yet</p>
                            ) : (
                              <div className="space-y-2">
                                {sortedVotes.map(([userId, count]: any) => {
                                  const member = members.find(m => m.id === userId);
                                  return (
                                    <div key={userId} className="flex justify-between items-center">
                                      <span>{member?.name || 'Unknown'}</span>
                                      <span className="font-bold">{count} vote{count !== 1 ? 's' : ''}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {!group.analyticsVisible && !isCreator && (
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Voting results will be visible when the creator enables analytics
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
