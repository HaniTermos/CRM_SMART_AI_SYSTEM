import { RotateCcw, FastForward } from 'lucide-react';

export function ControlsOverlay() {
  const handleSkipIntro = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReplayHero = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 hidden sm:flex items-center gap-2 pointer-events-auto">
      <button
        onClick={handleReplayHero}
        className="white-glass-panel px-3.5 py-2 rounded-full text-xs font-mono font-semibold text-[#190E85] border border-white hover:bg-white shadow-sm flex items-center gap-1.5 transition-all"
        title="Replay Hero timeline"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Replay Hero</span>
      </button>

      <button
        onClick={handleSkipIntro}
        className="white-glass-panel px-3.5 py-2 rounded-full text-xs font-mono font-semibold text-slate-600 border border-white hover:text-[#190E85] hover:bg-white shadow-sm flex items-center gap-1.5 transition-all"
        title="Skip to Features"
      >
        <FastForward className="w-3.5 h-3.5" />
        <span>Skip Intro</span>
      </button>
    </div>
  );
}
