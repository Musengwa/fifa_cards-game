"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Menu, Trophy, Palette, Check, Settings, LayoutDashboard, Plus, CreditCard,
  Bell, User, LogOut,
} from "lucide-react";
import { useNavigate } from "react-router";
import { APP_THEMES, useAppTheme, type AppTheme } from "../lib/theme";
import { API_BASE_URL, getAuthHeaders } from "../lib/supabase";
import { signOut } from "../lib/auth";
import { toast } from "sonner";
import ProfileDialog from "./ProfileDialog";
import NotificationsBell from "./NotificationsBell";

export default function TopBar() {
  const navigate = useNavigate();
  const { theme, tokens, setTheme } = useAppTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadPendingInvites = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/invite/pending`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!cancelled && response.ok) setPendingInviteCount(data.invites?.length || 0);
      } catch {
        // ignore — the green dot just won't show
      }
    };
    loadPendingInvites();
    const interval = setInterval(loadPendingInvites, 20000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleSignOut = async () => {
    try { await signOut(); navigate('/'); }
    catch { toast.error('Sign out failed'); }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="backdrop-blur-sm bg-white/6 dark:bg-black/25 border-b border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/') }>
              <Trophy className={`w-6 h-6 ${tokens.accentText}`} />
              <span className="text-lg font-black text-white">FIFA Card Rank</span>
            </div>

            <div className="flex items-center gap-1">
              <NotificationsBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu" className="relative">
                    <Menu className="w-5 h-5" />
                    {pendingInviteCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500 ring-2 ring-black/20" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/create-group')}>
                    <Plus className="size-4" />
                    Create Group
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/create-card')}>
                    <CreditCard className="size-4" />
                    Create Card
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/invites')} className="relative">
                    <Bell className="size-4" />
                    Invites
                    {pendingInviteCount > 0 && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-green-500" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                    <User className="size-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                    <Settings className="size-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="size-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="size-5" />
              App Theme
            </DialogTitle>
            <DialogDescription>
              Choose the color theme for the whole app — cards, showroom, and trophy room all follow it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(APP_THEMES) as AppTheme[]).map((id) => {
              const t = APP_THEMES[id];
              const active = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all bg-gradient-to-br ${t.bgGradient} ${
                    active ? `${t.border} ring-2 ${t.ring}` : 'border-transparent hover:border-white/20'
                  }`}
                >
                  {active && (
                    <span className={`absolute top-2 right-2 rounded-full ${t.accentBg} p-0.5`}>
                      <Check className="size-3 text-black" />
                    </span>
                  )}
                  <span className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.gradientBtn}`} />
                  <span className="text-xs font-semibold text-white text-center">{t.name}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
}
