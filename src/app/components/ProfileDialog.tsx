"use client";

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { User, Camera, Shield, Globe2, Trash2, AlertTriangle } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../lib/supabase';
import { updateUserProfile, deleteAccount } from '../lib/auth';
import ClubPicker, { Club } from './ClubPicker';
import NationPicker, { Nation } from './NationPicker';
import { toast } from 'sonner';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [clubPickerOpen, setClubPickerOpen] = useState(false);
  const [savingClub, setSavingClub] = useState(false);
  const [nationPickerOpen, setNationPickerOpen] = useState(false);
  const [savingNation, setSavingNation] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteAccountConfirmed, setDeleteAccountConfirmed] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (open) loadProfile();
  }, [open]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (response.ok) {
        setUserProfile(data.profile);
        setNameInput(data.profile?.name || '');
      } else {
        toast.error('Failed to load profile');
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
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
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload picture');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleNameBlur = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === userProfile?.name) {
      setNameInput(userProfile?.name || '');
      return;
    }
    setSavingName(true);
    try {
      await updateUserProfile({ name: trimmed });
      setUserProfile((prev: any) => ({ ...prev, name: trimmed }));
      toast.success('Name updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update name');
      setNameInput(userProfile?.name || '');
    } finally {
      setSavingName(false);
    }
  };

  const handleSelectClub = async (selected: Club) => {
    setSavingClub(true);
    try {
      await updateUserProfile({ club: selected.name, clubLogoUrl: selected.iconUrl });
      setUserProfile((prev: any) => ({ ...prev, club: selected.name, clubLogoUrl: selected.iconUrl }));
      toast.success(`Club set to ${selected.name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update club');
    } finally {
      setSavingClub(false);
    }
  };

  const handleSelectNation = async (selected: Nation) => {
    setSavingNation(true);
    try {
      await updateUserProfile({ nationality: selected.name, nationalityFlagUrl: selected.iconUrl });
      setUserProfile((prev: any) => ({ ...prev, nationality: selected.name, nationalityFlagUrl: selected.iconUrl }));
      toast.success(`Nationality set to ${selected.name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update nationality');
    } finally {
      setSavingNation(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountConfirmed) {
      toast.error('Please check the confirmation box first');
      return;
    }
    setDeletingAccount(true);
    try {
      await deleteAccount();
      toast.success('Account deleted');
      onOpenChange(false);
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="size-5" />
              Your Profile
            </DialogTitle>
            <DialogDescription>
              Update your name, photo, club and nationality.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="space-y-5">
              {/* Profile picture */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {userProfile?.profilePicUrl ? (
                    <img
                      src={userProfile.profilePicUrl}
                      alt={userProfile.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                  <label
                    htmlFor="profile-pic-upload"
                    className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground cursor-pointer shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      id="profile-pic-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePicUpload}
                      disabled={uploadingPic}
                    />
                  </label>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{userProfile?.email}</p>
                  {uploadingPic && <p className="text-xs text-muted-foreground">Uploading…</p>}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Name {savingName && <span className="text-muted-foreground font-normal">(saving…)</span>}</Label>
                <Input
                  id="profile-name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={handleNameBlur}
                  disabled={savingName}
                />
              </div>

              {/* Club */}
              <div className="space-y-1.5">
                <Label>Club</Label>
                <button
                  type="button"
                  onClick={() => setClubPickerOpen(true)}
                  disabled={savingClub}
                  className="w-full flex items-center gap-3 rounded-md border px-3 py-2 text-left hover:bg-accent transition-colors"
                >
                  {userProfile?.clubLogoUrl ? (
                    <img src={userProfile.clubLogoUrl} alt={userProfile.club} className="w-6 h-6 object-contain" />
                  ) : (
                    <Shield className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-sm truncate">
                    {savingClub ? 'Saving…' : userProfile?.club || 'Choose a club'}
                  </span>
                </button>
              </div>

              {/* Nationality */}
              <div className="space-y-1.5">
                <Label>Nationality</Label>
                <button
                  type="button"
                  onClick={() => setNationPickerOpen(true)}
                  disabled={savingNation}
                  className="w-full flex items-center gap-3 rounded-md border px-3 py-2 text-left hover:bg-accent transition-colors"
                >
                  {userProfile?.nationalityFlagUrl ? (
                    <img src={userProfile.nationalityFlagUrl} alt={userProfile.nationality} className="w-6 h-6 object-contain rounded-sm" />
                  ) : (
                    <Globe2 className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-sm truncate">
                    {savingNation ? 'Saving…' : userProfile?.nationality || 'Choose your nationality'}
                  </span>
                </button>
              </div>

              {/* Danger zone */}
              <div className="pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => setDeleteAccountOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete Account
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ClubPicker open={clubPickerOpen} onOpenChange={setClubPickerOpen} onSelect={handleSelectClub} />
      <NationPicker open={nationPickerOpen} onOpenChange={setNationPickerOpen} onSelect={handleSelectNation} />

      <AlertDialog open={deleteAccountOpen} onOpenChange={(v) => { setDeleteAccountOpen(v); if (!v) setDeleteAccountConfirmed(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account, any groups you created, and removes you from every
              group you've joined. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-start gap-2 py-2">
            <Checkbox
              id="confirm-delete"
              checked={deleteAccountConfirmed}
              onCheckedChange={(v) => setDeleteAccountConfirmed(v === true)}
            />
            <Label htmlFor="confirm-delete" className="font-normal leading-snug">
              I understand this is permanent and cannot be undone.
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={!deleteAccountConfirmed || deletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAccount ? 'Deleting…' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
