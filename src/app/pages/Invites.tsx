import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Check, X, Users, Mail } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../lib/supabase';
import { isAuthenticated } from '../lib/auth';
import PageLoader from '../components/PageLoader';
import { toast } from 'sonner';

interface Invite {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  status: string;
  createdAt: string;
  groupName: string;
  groupDescription: string;
  groupImageUrl: string | null;
  memberCount: number;
  senderName: string;
  senderEmail: string;
}

export default function Invites() {
  const navigate = useNavigate();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingInvites, setProcessingInvites] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
      return;
    }

    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/invite/pending`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.ok) {
        setInvites(data.invites || []);
      } else {
        toast.error('Failed to load invitations');
        setInvites([]);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast.error('Failed to load invitations');
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (groupId: string) => {
    setProcessingInvites(prev => [...prev, groupId]);

    try {
      const response = await fetch(`${API_BASE_URL}/invite/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ groupId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Invitation accepted!');
        loadInvites();
        // Optionally navigate to the group
        setTimeout(() => navigate(`/group/${groupId}`), 1000);
      } else {
        toast.error(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    } finally {
      setProcessingInvites(prev => prev.filter(id => id !== groupId));
    }
  };

  const handleDecline = async (groupId: string) => {
    setProcessingInvites(prev => [...prev, groupId]);

    try {
      const response = await fetch(`${API_BASE_URL}/invite/decline`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ groupId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Invitation declined');
        loadInvites();
      } else {
        toast.error(data.error || 'Failed to decline invitation');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    } finally {
      setProcessingInvites(prev => prev.filter(id => id !== groupId));
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            size="icon"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-white">Invitations</h1>
            <p className="text-green-100 mt-1">
              {invites.length} pending invitation{invites.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Invitations List */}
        {invites.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <Mail className="w-16 h-16 mx-auto text-gray-400" />
              <h3 className="text-xl font-semibold">No pending invitations</h3>
              <p className="text-gray-500">
                When someone invites you to a group, it will appear here
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => (
              <Card key={invite.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {invite.groupImageUrl ? (
                        <img
                          src={invite.groupImageUrl}
                          alt={invite.groupName}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div>
                        <CardTitle>{invite.groupName}</CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex items-center gap-2">
                            <span>Invited by <strong>{invite.senderName}</strong></span>
                          </div>
                          {invite.groupDescription && (
                            <p className="mt-2">{invite.groupDescription}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Users className="w-4 h-4" />
                            {invite.memberCount} member{invite.memberCount !== 1 ? 's' : ''}
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAccept(invite.groupId)}
                      disabled={processingInvites.includes(invite.groupId)}
                      className="flex-1"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      {processingInvites.includes(invite.groupId) ? 'Accepting...' : 'Accept'}
                    </Button>
                    <Button
                      onClick={() => handleDecline(invite.groupId)}
                      disabled={processingInvites.includes(invite.groupId)}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="w-5 h-5 mr-2" />
                      {processingInvites.includes(invite.groupId) ? 'Declining...' : 'Decline'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
