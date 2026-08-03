import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

export interface PickerItem {
  name: string;
  iconUrl: string;
}

interface IconGridPickerProps<T extends PickerItem> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: T[];
  title: string;
  searchPlaceholder?: string;
  onSelect: (item: T) => void;
  iconClassName?: string;
}

export default function IconGridPicker<T extends PickerItem>({
  open,
  onOpenChange,
  items,
  title,
  searchPlaceholder = 'Search…',
  onSelect,
  iconClassName = 'object-contain',
}: IconGridPickerProps<T>) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, query]);

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
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="relative shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No results found</p>
          ) : (
            <div className="flex flex-wrap gap-2 py-2">
              {filtered.map((item) => (
                <button
                  key={item.iconUrl}
                  type="button"
                  title={item.name}
                  aria-label={item.name}
                  onClick={() => {
                    onSelect(item);
                    onOpenChange(false);
                    setQuery('');
                  }}
                  className="w-12 h-12 shrink-0 rounded-lg border border-gray-200 bg-white hover:border-purple-400 hover:shadow-md flex items-center justify-center p-1.5 transition-all hover:scale-110 overflow-hidden"
                >
                  <img src={item.iconUrl} alt="" aria-hidden className={`w-full h-full ${iconClassName}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
