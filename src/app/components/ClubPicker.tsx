import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

const clubModules = import.meta.glob('./A to Z_ All Teams/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function filenameToClubName(path: string) {
  const file = path.split('/').pop() || '';
  const base = file.replace(/\.png$/i, '').replace(/^imgi_\d+_/, '');
  const withAmpersand = base.replace(/___/g, ' & ');
  const spaced = withAmpersand.replace(/[_-]+/g, ' ').trim();
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface Club {
  name: string;
  logoUrl: string;
}

export const CLUBS: Club[] = Object.entries(clubModules)
  .map(([path, url]) => ({ name: filenameToClubName(path), logoUrl: url }))
  .sort((a, b) => a.name.localeCompare(b.name));

interface ClubPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (club: Club) => void;
}

export default function ClubPicker({ open, onOpenChange, onSelect }: ClubPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CLUBS;
    return CLUBS.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setQuery('');
      }}
    >
      <DialogContent className="max-w-2xl w-[92vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose a Club</DialogTitle>
        </DialogHeader>

        <div className="relative shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clubs…"
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No clubs found</p>
          ) : (
            <div className="flex flex-wrap gap-2 py-2">
              {filtered.map((club) => (
                <button
                  key={club.logoUrl}
                  type="button"
                  title={club.name}
                  aria-label={club.name}
                  onClick={() => {
                    onSelect(club);
                    onOpenChange(false);
                    setQuery('');
                  }}
                  className="w-12 h-12 shrink-0 rounded-lg border border-gray-200 bg-white hover:border-purple-400 hover:shadow-md flex items-center justify-center p-1.5 transition-all hover:scale-110"
                >
                  <img src={club.logoUrl} alt="" aria-hidden className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
