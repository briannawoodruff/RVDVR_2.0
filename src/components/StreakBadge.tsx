import { Flame, Leaf } from "lucide-react";
import type { StreakState } from "@/lib/types";
import { isRestDayEarned } from "@/lib/streak";

export function StreakBadge({ streak }: { streak: StreakState }) {
  const rest = isRestDayEarned(streak);
  const toNext = streak.current === 0 ? 5 : 5 - (streak.current % 5);

  return (
    <div data-testid="streak-badge" data-streak={streak.current} className="flex items-center gap-3 rounded-full border bg-card/70 px-3 py-1.5 text-sm glass">
      {rest ? (
        <Leaf className="h-4 w-4 text-rest" />
      ) : (
        <Flame className="h-4 w-4 text-streak" />
      )}
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-base font-semibold tabular-nums">
          {streak.current}
        </span>
        <span className="text-xs text-muted-foreground">
          {streak.current === 1 ? "day" : "days"}
        </span>
      </div>
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {rest ? "rest day earned" : `${toNext} to rest`}
      </span>
    </div>
  );
}
