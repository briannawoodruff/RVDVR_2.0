export type Quadrant = "q1" | "q2" | "q3" | "q4" | null;

export interface Task {
  id: string;
  title: string;
  notes?: string;
  createdAt: number;
  completed: boolean;
  completedAt?: number;
  today: boolean;
  quadrant: Quadrant;
  order: number;
}

export interface StreakState {
  current: number;
  longest: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  restDayActiveFor: string | null; // date the rest day is being used for
  totalDays: number;
}

export interface AppState {
  tasks: Task[];
  streak: StreakState;
  hasOnboarded: boolean;
  focusMode: boolean;
  theme: "light" | "dark";
}
