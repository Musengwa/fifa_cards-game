import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Calendar, Image as ImageIcon } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../lib/supabase';
import { isAuthenticated } from '../lib/auth';
import { toast } from 'sonner';

export default function JoinGroup() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      // Store the group ID to redirect after login
      sessionStorage.setItem('pendingGroupJoin', groupId || '');
      toast.info('Please sign in to join a group');
      navigate('/');
      return;
    }

    loadGroup();
  }, [groupId, navigate]);

  const loadGroup = async () => {
    try {
      // Use the new preview endpoint that doesn't require membership
      const response = await fetch(`${API_BASE_URL}/group/${groupId}/preview`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.ok) {
        setGroup(data.group);
        
        // Check if already a member
        if (data.group.isMember) {
          toast.info('You are already a member of this group');
          navigate(`/group/${groupId}`);
        }
      } else {
        toast.error(data.error || 'Group not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading group:', error);
      toast.error('Failed to load group');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);

    try {
      const response = await fetch(`${API_BASE_URL}/group/${groupId}/join`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join group');
      }

      toast.success('Successfully joined the group!');
      navigate(`/group/${groupId}`);
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast.error(error.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Group</CardTitle>
          <CardDescription>
            You've been invited to join this ranking group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {group && (
            <div className="space-y-4">
              {/* Group Image */}
              {group.imageUrl && (
                <div className="flex justify-center">
                  <img
                    src={group.imageUrl}
                    alt={group.name}
                    className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
                  />
                </div>
              )}
              
              {/* Group Name */}
              <div className="text-center">
                <h3 className="text-2xl font-bold">{group.name}</h3>
              </div>

              {/* Group Description */}
              {group.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{group.description}</p>
                </div>
              )}

              {/* Group Stats */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
                </div>
                {group.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                <Button
                  onClick={handleJoin}
                  className="w-full"
                  size="lg"
                  disabled={joining}
                >
                  {joining ? 'Joining...' : 'Join Group'}
                </Button>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}