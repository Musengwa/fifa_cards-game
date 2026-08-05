import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Download, Upload, Plus, Trash2, Sparkles, Palette, RefreshCw } from 'lucide-react';
import FifaCard, { CardTheme, cardThemeStyles } from './FifaCard';
import { downloadElement } from '../lib/download';
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
  { key: 'whiteGold', label: 'White & Gold', preview: 'from-amber-300 to-yellow-200' },
  { key: 'blackPurple', label: 'Black & Purple', preview: 'from-purple-700 to-fuchsia-500' },
];

interface CardCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CardCreator({ open, onOpenChange }: CardCreatorProps) {
  const [name, setName] = useState('YOUR NAME');
  const [position, setPosition] = useState('CAM');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Stat[]>(DEFAULT_STATS);
  const [cardTheme, setCardTheme] = useState<CardTheme>('greenOrange');
  const [downloading, setDownloading] = useState(false);
  const cardPreviewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = cardThemeStyles[cardTheme];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const updateStat = (id: string, field: 'name' | 'value', val: string | number) => {
    setStats((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const addStat = () => {
    if (stats.length >= 6) {
      toast.info('Max 6 stats');
      return;
    }
    setStats((prev) => [
      ...prev,
      { id: Date.now().toString(), name: 'STAT', value: 70 },
    ]);
  };

  const removeStat = (id: string) => {
    if (stats.length <= 1) return;
    setStats((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDownload = async () => {
    if (!cardPreviewRef.current) return;
    setDownloading(true);
    try {
      await downloadElement(
        cardPreviewRef.current,
        `${(name || 'card').replace(/\s+/g, '-').toLowerCase()}-${cardTheme}.png`
      );
      toast.success('Card downloaded!');
    } catch (err) {
      console.error('Card creator download error:', err);
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const resetCard = () => {
    setName('YOUR NAME');
    setPosition('CAM');
    setImageUrl(null);
    setStats(DEFAULT_STATS);
    setCardTheme('greenOrange');
  };

  // Build the card user/attrs for FifaCard
  const cardUser = {
    id: 'custom',
    name: name || 'YOUR NAME',
    profilePicUrl: imageUrl,
  };
  const cardAttributes = stats.map((s) => ({ id: s.id, name: s.name }));
  const cardRatings = Object.fromEntries(stats.map((s) => [s.id, s.value]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-fuchsia-900 to-purple-900 p-4 sm:p-6 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl sm:text-2xl font-black flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              Card Creator
              <span className="text-sm font-normal text-purple-200 ml-2 hidden sm:inline">
                Design your premium collectible card
              </span>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 min-h-0">
          {/* ─── Left: Editor ─────────────────────────────────────── */}
          <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto border-r border-gray-100">

            {/* Theme selector */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                <Palette className="w-3.5 h-3.5 inline mr-1" />
                Theme
              </Label>
              <div className="flex gap-2 flex-wrap">
                {THEME_OPTIONS.map(({ key, label, preview }) => (
                  <button
                    key={key}
                    onClick={() => setCardTheme(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                      cardTheme === key
                        ? 'border-purple-500 bg-purple-50 text-purple-700 scale-105 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 text-gray-600'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${preview} shrink-0`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                Photo
              </Label>
              <div className="flex items-center gap-3">
                {imageUrl ? (
                  <div className="relative">
                    <img src={imageUrl} alt="preview" className="w-14 h-14 rounded-full object-cover border-2 border-purple-400" />
                    <button
                      onClick={() => setImageUrl(null)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                    No pic
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {imageUrl ? 'Change Photo' : 'Upload Photo'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                placeholder="YOUR NAME"
                className="font-bold text-lg uppercase tracking-wide"
                maxLength={20}
              />
            </div>

            {/* Position / sub-label */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                Position / Role
              </Label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value.toUpperCase())}
                placeholder="CAM"
                className="font-bold uppercase tracking-widest"
                maxLength={6}
              />
            </div>

            {/* Stats */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Stats
                </Label>
                <button
                  onClick={addStat}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold"
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
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={stat.name}
                        onChange={(e) => updateStat(stat.id, 'name', e.target.value.toUpperCase())}
                        className="w-20 font-bold uppercase text-sm text-center"
                        maxLength={5}
                      />
                      <Slider
                        value={[stat.value]}
                        onValueChange={([v]) => updateStat(stat.id, 'value', v)}
                        min={1}
                        max={99}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-8 text-right font-black text-sm text-gray-700">{stat.value}</span>
                      {stats.length > 1 && (
                        <button
                          onClick={() => removeStat(stat.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={resetCard}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:opacity-90"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloading ? 'Saving…' : 'Download Card'}
              </Button>
            </div>
          </div>

          {/* ─── Right: Live Preview ───────────────────────────────── */}
          <div
            className={`lg:w-80 flex flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-br ${
              cardTheme === 'greenOrange'
                ? 'from-green-950 to-emerald-900'
                : cardTheme === 'whiteGold'
                ? 'from-amber-100 to-amber-200'
                : 'from-black to-purple-950'
            } min-h-48 lg:min-h-0 gap-4`}
          >
            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${
              cardTheme === 'whiteGold' ? 'text-amber-700' : 'text-white/50'
            }`}>
              Live Preview
            </p>
            <div ref={cardPreviewRef}>
              <FifaCard
                user={cardUser}
                attributes={cardAttributes}
                ratings={cardRatings}
                cardTheme={cardTheme}
                subLabel={position}
              />
            </div>
            {/* Floating "overall" aura */}
            <p className={`text-xs text-center mt-1 ${
              cardTheme === 'whiteGold' ? 'text-amber-600' : 'text-white/40'
            }`}>
              OVR: {Math.round(stats.reduce((s, v) => s + v.value, 0) / stats.length)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
