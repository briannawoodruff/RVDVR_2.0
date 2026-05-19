import { useEffect, useState, useCallback } from "react";
import type { AppState, Task, Quadrant } from "./types";
import { emptyStreak, recordCompletionToday, reconcileStreak, todayKey } from "./streak";

const KEY = "rvdar.state.v1";

const initialState = (): AppState => ({
  tasks: [],
  streak: emptyStreak(),
  hasOnboarded: false,
  focusMode: false,
  theme: "light",
});

function load(): AppState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    const parsed = { ...initialState(), ...JSON.parse(raw) } as AppState;
    parsed.streak = reconcileStreak(parsed.streak);
    return parsed;
  } catch {
    return initialState();
  }
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme, hydrated]);

  const addTask = useCallback((title: string) => {
    if (!title.trim()) return;
    setState((s) => ({
      ...s,
      tasks: [
        ...s.tasks,
        {
          id: crypto.randomUUID(),
          title: title.trim(),
          createdAt: Date.now(),
          completed: false,
          today: false,
          quadrant: null,
          order: s.tasks.length,
        },
      ],
    }));
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setState((s) => {
      const task = s.tasks.find((t) => t.id === id);
      if (!task) return s;
      const nowCompleted = !task.completed;
      const tasks = s.tasks.map((t) =>
        t.id === id ? { ...t, completed: nowCompleted, completedAt: nowCompleted ? Date.now() : undefined } : t,
      );
      const streak = nowCompleted ? recordCompletionToday(s.streak) : s.streak;
      return { ...s, tasks, streak };
    });
  }, []);

  const moveToToday = useCallback((id: string, today: boolean) => {
    setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, today } : t)) }));
  }, []);

  const setQuadrant = useCallback((id: string, quadrant: Quadrant) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, quadrant, today: quadrant ? true : t.today } : t)),
    }));
  }, []);

  const clearCompleted = useCallback(() => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => !t.completed) }));
  }, []);

  const reorderRelative = useCallback((activeTaskId: string, overTaskId: string) => {
    if (activeTaskId === overTaskId) return;
    setState((s) => {
      const from = s.tasks.findIndex((t) => t.id === activeTaskId);
      const to = s.tasks.findIndex((t) => t.id === overTaskId);
      if (from === -1 || to === -1) return s;
      const next = s.tasks.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...s, tasks: next };
    });
  }, []);

  const setOnboarded = useCallback(
    () => setState((s) => ({ ...s, hasOnboarded: true })),
    [],
  );
  const toggleFocus = useCallback(() => setState((s) => ({ ...s, focusMode: !s.focusMode })), []);
  const toggleTheme = useCallback(
    () => setState((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" })),
    [],
  );

  return {
    state,
    hydrated,
    today: todayKey(),
    actions: {
      addTask,
      updateTask,
      deleteTask,
      toggleComplete,
      moveToToday,
      setQuadrant,
      clearCompleted,
      reorderRelative,
      setOnboarded,
      toggleFocus,
      toggleTheme,
    },
  };
}
