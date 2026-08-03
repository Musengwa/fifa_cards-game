import IconGridPicker, { PickerItem } from './IconGridPicker';

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

export type Club = PickerItem;

export const CLUBS: Club[] = Object.entries(clubModules)
  .map(([path, url]) => ({ name: filenameToClubName(path), iconUrl: url }))
  .sort((a, b) => a.name.localeCompare(b.name));

interface ClubPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (club: Club) => void;
}

export default function ClubPicker({ open, onOpenChange, onSelect }: ClubPickerProps) {
  return (
    <IconGridPicker
      open={open}
      onOpenChange={onOpenChange}
      items={CLUBS}
      title="Choose a Club"
      searchPlaceholder="Search clubs…"
      onSelect={onSelect}
    />
  );
}
