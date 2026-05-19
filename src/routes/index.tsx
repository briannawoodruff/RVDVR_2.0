import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { HelpCircle, Moon, Sun, Focus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { MissionPanel } from "@/components/MissionPanel";
import { TodayPanel } from "@/components/TodayPanel";
import { EisenhowerMatrix } from "@/components/EisenhowerMatrix";
import { StreakBadge } from "@/components/StreakBadge";
import { HelpDialog } from "@/components/HelpDialog";
import { TaskCardOverlay } from "@/components/TaskCard";
import type { Quadrant } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { state, hydrated, actions } = useAppStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const activeTask = useMemo(
    () => state.tasks.find((t) => t.id === activeId) ?? null,
    [activeId, state.tasks],
  );

  // First-load help
  if (hydrated && !state.hasOnboarded && !helpOpen) {
    setHelpOpen(true);
    actions.setOnboarded();
  }

  const todayTasks = state.tasks.filter((t) => t.today);
  const missionTasks = state.tasks.filter((t) => !t.today);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const over = e.over?.id ? String(e.over.id) : null;
    if (!over) return;

    if (over === "today") {
      actions.moveToToday(id, true);
    } else if (over === "mission") {
      actions.moveToToday(id, false);
      actions.setQuadrant(id, null);
    } else if (over.startsWith("quad-")) {
      const q = over.replace("quad-", "") as Quadrant;
      actions.setQuadrant(id, q);
    }
  }

  if (!hydrated) {
    return <div className="min-h-dvh" />;
  }

  return (
    <div className="topo-bg min-h-dvh">
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <header className="sticky top-0 z-30 border-b bg-background/60 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="hidden text-xs text-muted-foreground sm:inline">
                small progress, real momentum
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StreakBadge streak={state.streak} />
              <IconBtn
                onClick={actions.toggleFocus}
                label="Focus mode"
                active={state.focusMode}
              >
                <Focus className="h-4 w-4" />
              </IconBtn>
              <IconBtn onClick={actions.toggleTheme} label="Toggle theme">
                {state.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </IconBtn>
              <IconBtn onClick={() => setHelpOpen(true)} label="Help">
                <HelpCircle className="h-4 w-4" />
              </IconBtn>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
          <div
            className={cn(
              "grid gap-4",
              collapsed
                ? "grid-cols-[3rem_1fr]"
                : "grid-cols-1 lg:grid-cols-[20rem_1fr]",
            )}
          >
            <div className={cn(!collapsed && "min-h-[60dvh] lg:min-h-[calc(100dvh-7rem)]")}>
              <MissionPanel
                tasks={missionTasks}
                collapsed={collapsed}
                onToggleCollapsed={() => setCollapsed((c) => !c)}
                onAdd={actions.addTask}
                onToggle={actions.toggleComplete}
                onDelete={actions.deleteTask}
                onEdit={(id, title) => actions.updateTask(id, { title })}
              />
            </div>

            <div className="flex flex-col gap-4">
              <TodayPanel
                tasks={todayTasks}
                onToggle={actions.toggleComplete}
                onDelete={actions.deleteTask}
                onEdit={(id, title) => actions.updateTask(id, { title })}
              />
              {!state.focusMode && (
                <EisenhowerMatrix
                  tasks={todayTasks}
                  onToggle={actions.toggleComplete}
                  onDelete={actions.deleteTask}
                  onEdit={(id, title) => actions.updateTask(id, { title })}
                />
              )}
            </div>
          </div>

          <footer className="mx-auto mt-8 max-w-3xl text-center text-xs text-muted-foreground">
            Rest is part of the work. You are doing better than you think.
          </footer>
        </main>

        <DragOverlay dropAnimation={{ duration: 180 }}>
          {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-1 font-display text-xl font-bold tracking-tight">
      <span>RVD</span>
      <span className="text-primary">Λ</span>
      <span>R</span>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "rounded-full border p-2 transition-colors",
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card/70 hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
