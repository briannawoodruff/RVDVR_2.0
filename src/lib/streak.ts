import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { StreakState } from "./types";

export const todayKey = () => format(new Date(), "yyyy-MM-dd");

export const emptyStreak = (): StreakState => ({
  current: 0,
  longest: 0,
  lastCompletedDate: null,
  restDayActiveFor: null,
  totalDays: 0,
});

/**
 * Returns true if the user has earned a rest day (every 5 completed days).
 * Rest days don't break the streak when "used" the day after.
 */
export const isRestDayEarned = (s: StreakState) => s.current > 0 && s.current % 5 === 0;

/**
 * Call when the user has completed at least one task today.
 * Handles: same-day (idempotent), consecutive day, rest-day grace, broken streak.
 */
export function recordCompletionToday(state: StreakState, today = todayKey()): StreakState {
  const last = state.lastCompletedDate;
  if (last === today) return state; // already counted today

  if (!last) {
    const current = 1;
    return {
      ...state,
      current,
      longest: Math.max(state.longest, current),
      lastCompletedDate: today,
      totalDays: state.totalDays + 1,
      restDayActiveFor: null,
    };
  }

  const gap = differenceInCalendarDays(parseISO(today), parseISO(last));
  let current = state.current;

  if (gap === 1) {
    current += 1;
  } else if (gap === 2 && isRestDayEarned({ ...state })) {
    // missed one day but had a rest day available — preserve streak
    current += 1;
  } else if (gap <= 0) {
    // clock skew safety
    return state;
  } else {
    current = 1; // streak broken, restart
  }

  return {
    ...state,
    current,
    longest: Math.max(state.longest, current),
    lastCompletedDate: today,
    totalDays: state.totalDays + 1,
    restDayActiveFor: null,
  };
}

/**
 * Run on app load to reset a stale streak if too many days have passed.
 */
export function reconcileStreak(state: StreakState, today = todayKey()): StreakState {
  if (!state.lastCompletedDate) return state;
  const gap = differenceInCalendarDays(parseISO(today), parseISO(state.lastCompletedDate));
  if (gap <= 1) return state;
  if (gap === 2 && state.current > 0 && state.current % 5 === 0) return state; // rest grace
  if (gap > 1) return { ...state, current: 0 };
  return state;
}
