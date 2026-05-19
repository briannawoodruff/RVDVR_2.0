import { X } from "lucide-react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function HelpDialog({ open, onClose }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border bg-card p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="font-display text-2xl font-semibold">Welcome to RVDΛR</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Small achievable progress over toxic productivity.
        </p>

        <div className="mt-6 space-y-5 text-sm">
          <section>
            <h3 className="font-semibold">1 · Brain dump into Mission</h3>
            <p className="text-muted-foreground">
              Add every task — big, small, vague. Nothing is too small to write down.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">2 · Drag what matters into Today</h3>
            <p className="text-muted-foreground">
              Choose just a few. Overwhelm shrinks when the day has edges.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">3 · Sort with the Priority Matrix</h3>
            <p className="text-muted-foreground">
              Drop tasks into a quadrant to see what truly deserves your energy.
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              <li><b>Do first</b> — urgent & important</li>
              <li><b>Schedule</b> — important, not urgent (the growth zone)</li>
              <li><b>Delegate</b> — urgent, not important</li>
              <li><b>Let go</b> — neither (release without guilt)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold">4 · Streaks & rest days</h3>
            <p className="text-muted-foreground">
              Finish one task on a day to keep your streak. Every 5 days you earn a
              <b> rest day</b> — skip a day without breaking the chain. Rest is part of the work.
            </p>
          </section>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          I'm ready
        </button>
      </div>
    </div>
  );
}
