import { Lightbulb, Shield, Trophy, type LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import { useAppTheme } from '../lib/theme';

type SessionResultsView = 'showroom' | 'trophies' | 'analysis';

interface SessionResultsNavProps {
  activeView: SessionResultsView;
  onShowroom: () => void;
  onTrophies: () => void;
  onAnalysis?: () => void;
}

export default function SessionResultsNav({
  activeView,
  onShowroom,
  onTrophies,
  onAnalysis,
}: SessionResultsNavProps) {
  const { theme, tokens } = useAppTheme();

  // The trophy room always paints its own black stage, so treat it as a dark
  // background whatever the app theme is.
  const onLight = theme === 'whiteGold' && activeView !== 'trophies';
  const iconColor = onLight ? tokens.navText : 'text-white';
  const boxColor = onLight
    ? 'bg-white/40 border-yellow-500/40 hover:bg-white/60'
    : 'bg-white/10 border-white/20 hover:bg-white/15';

  const items: Array<{ view: SessionResultsView; label: string; Icon: LucideIcon; onClick?: () => void }> = [
    { view: 'showroom', label: 'Showroom', Icon: Shield, onClick: onShowroom },
    { view: 'trophies', label: 'Trophy Room', Icon: Trophy, onClick: onTrophies },
    { view: 'analysis', label: 'Analysis', Icon: Lightbulb, onClick: onAnalysis },
  ];

  return (
    <nav
      data-keep-colors
      aria-label="Session results"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 flex justify-center gap-6"
    >
      {items.map(({ view, label, Icon, onClick }) => {
        const active = activeView === view;
        return (
          <Button
            key={view}
            onClick={onClick}
            variant="ghost"
            size="icon"
            aria-label={label}
            title={label}
            aria-current={active ? 'page' : undefined}
            className={`h-14 w-14 rounded-xl border-2 backdrop-blur-md shadow-lg shadow-black/20 transition-colors ${boxColor} ${
              active
                ? 'border-primary text-primary hover:text-primary'
                : `${iconColor} ${onLight ? 'hover:text-gray-900' : 'hover:text-white'}`
            }`}
          >
            <Icon className="size-7" strokeWidth={2.5} />
          </Button>
        );
      })}
    </nav>
  );
}
