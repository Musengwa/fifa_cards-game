"use client";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { Menu, Trophy } from "lucide-react";
import { useNavigate } from "react-router";

export default function TopBar() {
  const navigate = useNavigate();

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="backdrop-blur-sm bg-white/6 dark:bg-black/25 border-b border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/') }>
              <Trophy className="w-6 h-6 text-yellow-400" />
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
