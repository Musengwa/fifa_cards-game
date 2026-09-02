import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  ArrowLeft, Sparkles, Palette, RefreshCw, Download, Star,
} from 'lucide-react';
import FifaCard, { CardTheme } from '../components/FifaCard';
import ClubPicker, { Club } from '../components/ClubPicker';
import NationPicker, { Nation } from '../components/NationPicker';
import { downloadAsPng } from '../lib/download';
import { isAuthenticated, updateUserProfile } from '../lib/auth';
import { useAppTheme } from '../lib/theme';
import { toast } from 'sonner';

interface Stat {
  id: string;
  name: string;
  value: number;
}

const DEFAULT_STATS: Stat[] = [
  { id: '1', name: 'PAC', value: 75 },
  { id: '2', name: 'SHO', value: 70 },
  { id: '3', name: 'PAS', value: 65 },
  { id: '4', name: 'DRI', value: 80 },
  { id: '5', name: 'DEF', value: 55 },
  { id: '6', name: 'PHY', value: 72 },
];

const THEME_OPTIONS: { key: CardTheme; label: string; preview: string }[] = [
  { key: 'greenOrange', label: 'Yellow & Green', preview: 'from-yellow-400 from-50% to-green-700 to-50%' },
  { key: 'whiteGold', label: 'White & Gold', preview: 'from-amber-300 to-yellow-100' },
  { key: 'blackPurple', label: 'Black & Purple', preview: 'from-purple-700 to-fuchsia-400' },
];

function StarPicker({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)}>
          <Star
            className={`w-5 h-5 transition-colors ${
              i < value ? color + ' fill-current' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function CreateCard() {
  const navigate = useNavigate();
  const { tokens } = useAppTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('YOUR NAME');
  const [position, setPosition] = useState('ST');
  const [nationality, setNationality] = useState('');
  const [nationalityFlagUrl, setNationalityFlagUrl] = useState<string | null>(null);
  const [nationPickerOpen, setNationPickerOpen] = useState(false);
  const [club, setClub] = useState('');
  const [clubLogoUrl, setClubLogoUrl] = useState<string | null>(null);
  const [clubPickerOpen, setClubPickerOpen] = useState(false);
  const [weakFoot, setWeakFoot] = useState(3);
  const [skillMoves, setSkillMoves] = useState(3);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Stat[]>(DEFAULT_STATS);
  const [cardTheme, setCardTheme] = useState<CardTheme>(tokens.cardTheme);
  const [downloading, setDownloading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const updateStat = (id: string, field: 'name' | 'value', val: string | number) => {
    setStats((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
  };

  const addStat = () => {
    if (stats.length >= 6) { toast.info('Maximum 6 stats'); return; }
    setStats((prev) => [...prev, { id: Date.now().toString(), name: 'STAT', value: 70 }]);
  };

  const removeStat = (id: string) => {
    if (stats.length <= 1) return;
    setStats((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDownloadPng = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      await downloadAsPng(cardRef.current, `${name.replace(/\s+/g, '-').toLowerCase()}.png`);
      toast.success('Card saved as PNG');
    } catch { toast.error('Download failed'); }
    finally { setDownloading(false); }
  };

  const resetCard = () => {
    setName('YOUR NAME'); setPosition('ST');
    setNationality(''); setNationalityFlagUrl(null);
    setClub(''); setClubLogoUrl(null);
    setWeakFoot(3); setSkillMoves(3); setImageUrl(null); setStats(DEFAULT_STATS);
    setCardTheme('greenOrange');
  };

  const handleSelectClub = async (selected: Club) => {
    setClub(selected.name);
    setClubLogoUrl(selected.iconUrl);

    if (isAuthenticated()) {
      try {
        await updateUserProfile({ club: selected.name, clubLogoUrl: selected.iconUrl });
        toast.success(`Club set to ${selected.name}`);
      } catch {
        toast.error('Saved to card, but failed to update your profile');
      }
    }
  };

  const handleSelectNation = async (selected: Nation) => {
    setNationality(selected.name.toUpperCase());
    setNationalityFlagUrl(selected.iconUrl);

    if (isAuthenticated()) {
      try {
        await updateUserProfile({ nationality: selected.name, nationalityFlagUrl: selected.iconUrl });
        toast.success(`Nationality set to ${selected.name}`);
      } catch {
        toast.error('Saved to card, but failed to update your profile');
      }
    }
  };

  const cardUser = {
    id: 'custom',
    name: name || 'YOUR NAME',
    profilePicUrl: imageUrl,
    position,
    nationality,
    nationalityFlagUrl,
    club,
    clubLogoUrl,
    weakFoot,
    skillMoves,
  };
  const cardAttributes = stats.map((s) => ({ id: s.id, name: s.name }));
  const cardRatings = Object.fromEntries(stats.map((s) => [s.id, s.value]));
  const overall = Math.round(stats.reduce((s, v) => s + v.value, 0) / stats.length);

  const panelBg =
    cardTheme === 'whiteGold'
      ? 'from-amber-50 via-yellow-50 to-amber-100'
      : cardTheme === 'blackPurple'
      ? 'from-black via-purple-950 to-black'
      : 'from-green-900 via-emerald-900 to-green-950';

  const labelColor =
    cardTheme === 'whiteGold' ? 'text-amber-700' : 'text-white/60';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${panelBg}`}>
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(isAuthenticated() ? '/dashboard' : '/')}
              className="text-white hover:bg-white/10"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Card Creator
              </h1>
              <p className="text-xs text-white/50">Tap the card to design it</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetCard}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 flex flex-col items-center gap-6">

        <p className={`text-xs text-center leading-relaxed ${labelColor}`}>
          Tap the photo, name, position, flag or club badge to change them.
          Scroll (or drag) a stat number up/down to adjust it.
        </p>

        {/* ─── The card itself is the form ──────────────────────── */}
        <div ref={cardRef}>
          <FifaCard
            user={cardUser}
            attributes={cardAttributes}
            ratings={cardRatings}
            cardTheme={cardTheme}
            edit={{
              onPhotoTap: () => fileInputRef.current?.click(),
              onNameChange: setName,
              onPositionChange: setPosition,
              onNationTap: () => setNationPickerOpen(true),
              onClubTap: () => setClubPickerOpen(true),
              onAttrNameChange: (id, attrName) => updateStat(id, 'name', attrName),
              onAttrValueChange: (id, value) => updateStat(id, 'value', value),
              onAttrRemove: stats.length > 1 ? removeStat : undefined,
              onAttrAdd: addStat,
              canAddAttr: stats.length < 6,
            }}
          />
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <ClubPicker open={clubPickerOpen} onOpenChange={setClubPickerOpen} onSelect={handleSelectClub} />
        <NationPicker open={nationPickerOpen} onOpenChange={setNationPickerOpen} onSelect={handleSelectNation} />

        <div className={`text-center ${labelColor}`}>
          <p className="text-xs">Overall Rating</p>
          <p className={`text-4xl font-black ${cardTheme === 'whiteGold' ? 'text-amber-700' : 'text-yellow-400'}`}>{overall}</p>
        </div>

        {/* ─── The few things that don't live on the card face ──── */}
        <div className="w-full space-y-6">

          {/* Theme */}
          <section>
            <Label className={`text-xs font-bold uppercase tracking-widest ${labelColor} mb-3 flex items-center gap-1.5`}>
              <Palette className="w-3.5 h-3.5" />
              Theme
            </Label>
            <div className="flex gap-3 flex-wrap">
              {THEME_OPTIONS.map(({ key, label, preview }) => (
                <button
                  key={key}
                  onClick={() => setCardTheme(key)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    cardTheme === key
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300 scale-105 shadow-lg shadow-yellow-400/20'
                      : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-gradient-to-br ${preview} shrink-0 shadow`} />
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Weak Foot & Skill Moves */}
          <section className="grid grid-cols-2 gap-6">
            <div>
              <Label className={`text-xs font-bold uppercase tracking-widest ${labelColor} mb-2 block`}>
                Weak Foot (WF)
              </Label>
              <StarPicker value={weakFoot} onChange={setWeakFoot} color="text-yellow-400" />
            </div>
            <div>
              <Label className={`text-xs font-bold uppercase tracking-widest ${labelColor} mb-2 block`}>
                Skill Moves (SM)
              </Label>
              <StarPicker value={skillMoves} onChange={setSkillMoves} color="text-yellow-400" />
            </div>
          </section>

          {/* Download action */}
          <section className="flex gap-3 pt-2">
            <Button
              onClick={handleDownloadPng}
              disabled={downloading}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold shadow-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Saving…' : 'Download Card'}
            </Button>
          </section>

        </div>
      </div>
    </div>
  );
}
