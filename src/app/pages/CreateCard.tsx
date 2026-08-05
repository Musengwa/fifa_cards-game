import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  ArrowLeft, Upload, Plus, Trash2, Sparkles, Palette,
  RefreshCw, Download, Star, User as UserIcon, Shield, Globe2,
} from 'lucide-react';
import FifaCard, { CardTheme, cardThemeStyles } from '../components/FifaCard';
import ClubPicker, { Club } from '../components/ClubPicker';
import NationPicker, { Nation } from '../components/NationPicker';
import { downloadAsPng } from '../lib/download';
import { isAuthenticated, updateUserProfile } from '../lib/auth';
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

const POSITIONS = [
  'GK', 'CB', 'LB', 'RB', 'LWB', 'RWB',
  'CDM', 'CM', 'CAM', 'RM', 'LM',
  'RW', 'LW', 'CF', 'ST',
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
  const [cardTheme, setCardTheme] = useState<CardTheme>('greenOrange');
  const [downloading, setDownloading] = useState(false);

  const t = cardThemeStyles[cardTheme];

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
  const inputStyle =
    cardTheme === 'whiteGold'
      ? ''
      : 'bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${panelBg}`}>
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Card Creator
              </h1>
              <p className="text-xs text-white/50">Design your premium collectible card</p>
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">

          {/* ─── Editor panel ─────────────────────────────────────── */}
          <div className="space-y-6">

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

            {/* Photo */}
            <section>
              <Label className={`text-xs font-bold uppercase tracking-widest ${labelColor} mb-3 block`}>
                Photo
              </Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt="preview" className="w-16 h-16 rounded-xl object-cover border-2 border-yellow-400/50" />
                      <button
                        onClick={() => setImageUrl(null)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 text-white/30">
                      <UserIcon className="w-6 h-6" />
                      <span className="text-[9px]">No photo</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className={`${inputStyle} border`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {imageUrl ? 'Change Photo' : 'Upload Photo'}
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </section>

            {/* Name & Position */}
            <section className="grid grid-cols-2 gap-4">
              <div>
                <Label className={`text-xs font-bold uppercase tracking-widest ${labelColor} mb-2 block`}>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="YOUR NAME"
                  maxLength={20}
                  className={`font-bold text-lg uppercase tracking-wide ${inputStyle}`}
                />
              </div>
              <div>
                <Label className={`text-xs font-bold uppercase tracking-widest ${labelColor} mb-2 block`}>Position</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className={inputStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* Nationality & Club */}
            <section className="grid grid-cols-2 gap-4">
              <div>
                <Label className={`text-xs font-bold uppercase tracking-widest ${labelColor} mb-2 block`}>Nationality</Label>
                <button
                  type="button"
                  onClick={() => setNationPickerOpen(true)}
                  className={`w-full h-10 px-3 rounded-md border flex items-center gap-2 text-sm ${inputStyle || 'border-gray-300'}`}
                >
                  {nationalityFlagUrl ? (
                    <img src={nationalityFlagUrl} alt="" aria-hidden className="w-6 h-4 object-cover rounded-[1px] shrink-0" />
                  ) : (
                    <Globe2 className="w-5 h-5 shrink-0 opacity-40" />
                  )}
                  <span className="truncate">{nationality || 'Select nationality…'}</span>
                </button>
              </div>
              <div>
                <Label className={`text-xs font-bold uppercase tracking-widest ${labelColor} mb-2 block`}>Club / Team</Label>
                <button
                  type="button"
                  onClick={() => setClubPickerOpen(true)}
                  className={`w-full h-10 px-3 rounded-md border flex items-center gap-2 text-sm ${inputStyle || 'border-gray-300'}`}
                >
                  {clubLogoUrl ? (
                    <img src={clubLogoUrl} alt="" aria-hidden className="w-6 h-6 object-contain shrink-0" />
                  ) : (
                    <Shield className="w-5 h-5 shrink-0 opacity-40" />
                  )}
                  <span className="truncate">{club || 'Select club…'}</span>
                </button>
              </div>
            </section>

            <ClubPicker
              open={clubPickerOpen}
              onOpenChange={setClubPickerOpen}
              onSelect={handleSelectClub}
            />
            <NationPicker
              open={nationPickerOpen}
              onOpenChange={setNationPickerOpen}
              onSelect={handleSelectNation}
            />

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

            {/* Stats */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <Label className={`text-xs font-bold uppercase tracking-widest ${labelColor} flex items-center gap-1.5`}>
                  Stats
                </Label>
                <button
                  onClick={addStat}
                  className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Stat
                </button>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {stats.map((stat) => (
                    <motion.div
                      key={stat.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3"
                    >
                      <Input
                        value={stat.name}
                        onChange={(e) => updateStat(stat.id, 'name', e.target.value.toUpperCase().slice(0, 5))}
                        className={`w-16 font-bold uppercase text-center text-sm ${inputStyle}`}
                      />
                      <div className="flex-1 flex items-center gap-3">
                        <Slider
                          value={[stat.value]}
                          onValueChange={([v]) => updateStat(stat.id, 'value', v)}
                          min={1}
                          max={99}
                          step={1}
                          className="flex-1"
                        />
                        <span className={`w-8 text-right font-black text-sm ${cardTheme === 'whiteGold' ? 'text-gray-800' : 'text-white'}`}>
                          {stat.value}
                        </span>
                      </div>
                      {stats.length > 1 && (
                        <button onClick={() => removeStat(stat.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
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

          {/* ─── Live preview panel ───────────────────────────────── */}
          <div className="flex flex-col items-center gap-4 lg:sticky lg:top-28">
            <p className={`text-xs font-bold uppercase tracking-widest ${labelColor}`}>Live Preview</p>

            <div ref={cardRef}>
              <FifaCard
                user={cardUser}
                attributes={cardAttributes}
                ratings={cardRatings}
                cardTheme={cardTheme}
              />
            </div>

            <div className={`text-center ${labelColor}`}>
              <p className="text-xs">Overall Rating</p>
              <p className={`text-4xl font-black ${cardTheme === 'whiteGold' ? 'text-amber-700' : 'text-yellow-400'}`}>{overall}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
