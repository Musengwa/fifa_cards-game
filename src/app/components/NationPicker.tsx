import IconGridPicker, { PickerItem } from './IconGridPicker';

// flag-icons ships one SVG per ISO 3166-1 territory, plus a few UK home
// nations and supranational symbols we don't want in a "pick your country" list.
const flagModules = import.meta.glob('../../../node_modules/flag-icons/flags/4x3/*.svg', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const NAME_OVERRIDES: Record<string, string> = {
  'gb-eng': 'England',
  'gb-sct': 'Scotland',
  'gb-wls': 'Wales',
  'gb-nir': 'Northern Ireland',
  xk: 'Kosovo',
};

const EXCLUDED_CODES = new Set([
  'eu', 'un', 'arab', 'asean', 'cefta', 'eac', 'xx', 'pc', 'cp',
  'es-ct', 'es-ga', 'es-pv', 'sh-ac', 'sh-hl', 'sh-ta',
]);

const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

function codeToName(code: string): string | null {
  if (NAME_OVERRIDES[code]) return NAME_OVERRIDES[code];
  if (EXCLUDED_CODES.has(code) || code.includes('-')) return null;
  if (!regionNames) return null;
  try {
    const name = regionNames.of(code.toUpperCase());
    return name && name.toUpperCase() !== code.toUpperCase() ? name : null;
  } catch {
    return null;
  }
}

export type Nation = PickerItem;

export const NATIONS: Nation[] = Object.entries(flagModules)
  .map(([path, url]) => {
    const code = (path.split('/').pop() || '').replace(/\.svg$/i, '');
    const name = codeToName(code);
    return name ? { name, iconUrl: url } : null;
  })
  .filter((n): n is Nation => n !== null)
  .sort((a, b) => a.name.localeCompare(b.name));

interface NationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (nation: Nation) => void;
}

export default function NationPicker({ open, onOpenChange, onSelect }: NationPickerProps) {
  return (
    <IconGridPicker
      open={open}
      onOpenChange={onOpenChange}
      items={NATIONS}
      title="Choose a Nation"
      searchPlaceholder="Search countries…"
      onSelect={onSelect}
    />
  );
}
