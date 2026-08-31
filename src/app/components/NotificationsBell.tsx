"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Bell, UserPlus, Mail, PartyPopper } from "lucide-react";
import {
  AppNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../lib/notifications";

const POLL_MS = 20000;

function notificationIcon(type: string) {
  if (type === "member_joined") return <UserPlus className="size-4 text-emerald-400 shrink-0" />;
  if (type === "invite_sent") return <Mail className="size-4 text-sky-400 shrink-0" />;
  return <Bell className="size-4 text-white/60 shrink-0" />;
}

export default function NotificationsBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [autoQueue, setAutoQueue] = useState<AppNotification[]>([]);
  const knownIds = useRef<Set<string> | null>(null);

  const poll = async () => {
    try {
      const items = await fetchNotifications();
      setNotifications(items);

      if (knownIds.current === null) {
        // First load — just record what already exists, nothing to pop up for.
        knownIds.current = new Set(items.map((n) => n.id));
        return;
      }

      const fresh = items.filter((n) => !n.read && !knownIds.current!.has(n.id));
      if (fresh.length > 0) {
        setAutoQueue((prev) => [...fresh, ...prev]);
      }
      knownIds.current = new Set(items.map((n) => n.id));
    } catch {
      // Silent — notifications are a nice-to-have, don't nag the user with errors.
    }
  };

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const openList = async () => {
    setListOpen(true);
    if (unreadCount > 0) {
      try {
        await markAllNotificationsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch {
        // ignore — list still renders with whatever we have
      }
    }
  };

  const dismissAuto = async () => {
    const dismissed = autoQueue;
    setAutoQueue([]);
    try {
      await Promise.all(dismissed.map((n) => markNotificationRead(n.id)));
      setNotifications((prev) =>
        prev.map((n) => (dismissed.some((d) => d.id === n.id) ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const viewAllFromAuto = () => {
    setAutoQueue([]);
    openList();
  };

  return (
    <>
      <Button variant="ghost" size="icon" aria-label="Notifications" onClick={openList} className="relative">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500 ring-2 ring-black/20" />
        )}
      </Button>

      {/* Notifications list */}
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="size-5" />
              Notifications
            </DialogTitle>
            <DialogDescription>Group activity — joins and invites you've sent.</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto -mx-1 px-1 space-y-1">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (n.groupId) {
                      setListOpen(false);
                      navigate(`/group/${n.groupId}`);
                    }
                  }}
                  className="w-full flex items-start gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-accent transition-colors"
                >
                  {notificationIcon(n.type)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto pop-up for brand new activity */}
      <Dialog open={autoQueue.length > 0} onOpenChange={(open) => { if (!open) dismissAuto(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="size-5 text-amber-400" />
              New activity
            </DialogTitle>
            <DialogDescription>
              {autoQueue.length === 1 ? "Something just happened." : `${autoQueue.length} new updates.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {autoQueue.slice(0, 3).map((n) => (
              <div key={n.id} className="flex items-start gap-2.5 rounded-md border px-2.5 py-2">
                {notificationIcon(n.type)}
                <p className="text-sm leading-snug">{n.message}</p>
              </div>
            ))}
            {autoQueue.length > 3 && (
              <p className="text-xs text-muted-foreground">and {autoQueue.length - 3} more…</p>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={dismissAuto}>Dismiss</Button>
            <Button onClick={viewAllFromAuto}>View All</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
