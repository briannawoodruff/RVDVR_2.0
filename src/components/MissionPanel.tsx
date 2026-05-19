import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import type { Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onAdd: (title: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
}

export function MissionPanel({
  tasks,
  collapsed,
  onToggleCollapsed,
  onAdd,
  onToggle,
  onDelete,
  onEdit,
}: Props) {
  const [draft, setDraft] = useState("");
  const { setNodeRef, isOver } = useDroppable({ id: "mission" });
  const items = tasks.map((t) => `mission:${t.id}`);

  const submit = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  };

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapsed}
        data-testid="mission-expand"
        className="flex h-full w-12 flex-col items-center gap-3 rounded-2xl border bg-card/70 py-4 glass hover:bg-card"
        aria-label="Expand mission panel"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="[writing-mode:vertical-rl] text-xs font-medium tracking-widest text-muted-foreground">
          MISSION PANEL · {tasks.filter((t) => !t.completed).length}
        </span>
      </button>
    );
  }

  return (
    <aside
      ref={setNodeRef}
      data-testid="mission-panel"
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-card/70 glass transition-colors",
        isOver && "ring-2 ring-primary/40 bg-accent/40",
      )}
    >
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Mission Panel</h2>
          <p className="text-xs text-muted-foreground">
            All your tasks. Drag what matters today →
          </p>
        </div>
        <button
          onClick={onToggleCollapsed}
          aria-label="Collapse mission panel"
          data-testid="mission-collapse"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </header>

      <div className="border-b p-3">
        <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring/40">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Add a task — small is fine"
            data-testid="mission-add-input"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <div data-testid="mission-list" className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {tasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                dndId={`mission:${t.id}`}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </aside>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <div className="h-12 w-12 rounded-full bg-accent/60" />
      <p className="text-sm font-medium">Your radar is clear.</p>
      <p className="text-xs text-muted-foreground">
        Add one small task. Tiny counts.
      </p>
    </div>
  );
}
