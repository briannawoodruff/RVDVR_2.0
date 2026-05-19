import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Sunrise } from "lucide-react";
import type { Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
}

export function TodayPanel({ tasks, onToggle, onDelete, onEdit }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: "today" });
  const done = tasks.filter((t) => t.completed).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const items = tasks.map((t) => `today:${t.id}`);

  return (
    <section
      ref={setNodeRef}
      data-testid="today-panel"
      className={cn(
        "flex flex-col rounded-2xl border bg-card/70 glass transition-colors",
        isOver && "ring-2 ring-primary/50 bg-accent/40",
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sunrise className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-lg font-semibold">Today</h2>
            <p className="text-xs text-muted-foreground">
              {tasks.length === 0 ? "Pick something small to start" : `${done} of ${tasks.length} done`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
        </div>
      </header>
      <div className="flex-1 space-y-1.5 p-3 min-h-32">
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-background/40 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Drag a task here to commit to it today.
            </p>
          </div>
        ) : (
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {tasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                dndId={`today:${t.id}`}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </section>
  );
}
