import { appCredits } from "../constants/appCredits";

export default function AppWatermark() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 px-6 py-3 text-center text-xs font-medium text-slate-400">
      {appCredits.display}
    </footer>
  );
}
