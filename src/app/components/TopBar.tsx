"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Menu, Trophy, Palette, Check, Settings } from "lucide-react";
import { useNavigate } from "react-router";
import { APP_THEMES, useAppTheme, type AppTheme } from "../lib/theme";

export default function TopBar() {
  const navigate = useNavigate();
  const { theme, tokens, setTheme } = useAppTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="backdrop-blur-sm bg-white/6 dark:bg-black/25 border-b border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/') }>
              <Trophy className={`w-6 h-6 ${tokens.accentText}`} />
              <span className="text-lg font-black text-white">FIFA Card Rank</span>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>Dashboard</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/create-group')}>Create Group</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/create-card')}>Create Card</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                    <Settings className="size-4" />
                    Settings
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
    </header>
  );
}
