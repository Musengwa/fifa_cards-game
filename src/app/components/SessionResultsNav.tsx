import { Lightbulb, Shield, Trophy } from 'lucide-react';
import { Button } from './ui/button';

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
  return (
    <nav
      aria-label="Session results"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 flex justify-center gap-3"
    >
      <Button
        onClick={onShowroom}
        variant="ghost"
        size="icon"
        aria-label="Showroom"
        title="Showroom"
        aria-current={activeView === 'showroom' ? 'page' : undefined}
        className={`h-12 w-12 rounded-full border bg-white/5 text-white shadow-lg backdrop-blur-md hover:bg-white/10 ${
          activeView === 'showroom'
            ? 'border-primary text-primary ring-1 ring-primary/40'
            : 'border-white/40'
        }`}
      >
        <Shield className="h-5 w-5" />
      </Button>
      <Button
        onClick={onTrophies}
        variant="ghost"
        size="icon"
        aria-label="Trophy Room"
        title="Trophy Room"
        aria-current={activeView === 'trophies' ? 'page' : undefined}
        className={`h-12 w-12 rounded-full border bg-white/5 text-white shadow-lg backdrop-blur-md hover:bg-white/10 ${
          activeView === 'trophies'
            ? 'border-primary text-primary ring-1 ring-primary/40'
            : 'border-white/40'
        }`}
      >
        <Trophy className="h-5 w-5" />
      </Button>
      <Button
        onClick={onAnalysis}
        variant="ghost"
        size="icon"
        aria-label="Analysis"
        title="Analysis"
        aria-current={activeView === 'analysis' ? 'page' : undefined}
        className={`h-12 w-12 rounded-full border bg-white/5 text-white shadow-lg backdrop-blur-md hover:bg-white/10 ${
          activeView === 'analysis'
            ? 'border-primary text-primary ring-1 ring-primary/40'
            : 'border-white/40'
        }`}
      >
        <Lightbulb className="h-5 w-5" />
      </Button>
    </nav>
  );
}
