import { useDroppable } from "@dnd-kit/core";
import type { Quadrant, Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

interface QuadProps {
  id: Quadrant;
  label: string;
  hint: string;
  tone: string;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
}

function Quadrant({ id, label, hint, tone, tasks, onToggle, onDelete, onEdit }: QuadProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `quad-${id}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-3 transition-all",
        tone,
        isOver && "ring-2 ring-primary/40 scale-[1.01]",
      )}
    >
      <div>
        <h3 className="text-sm font-semibold">{label}</h3>
        <p className="text-[11px] opacity-70">{hint}</p>
      </div>
      <div className="flex-1 space-y-1.5 min-h-20">
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-current/20 p-3 text-center text-[11px] opacity-50">
            Drop a task
          </div>
        ) : (
          tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              compact
            />
          ))
        )}
      </div>
    </div>
  );
}

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
}

export function EisenhowerMatrix({ tasks, onToggle, onDelete, onEdit }: Props) {
  const by = (q: Quadrant) => tasks.filter((t) => t.quadrant === q);
  return (
    <section className="rounded-2xl border bg-card/70 p-4 glass">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">Priority Matrix</h2>
          <p className="text-xs text-muted-foreground">Sort by urgency & importance</p>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Quadrant
          id="q1"
          label="Do first"
          hint="Urgent · Important"
          tone="bg-q1 text-q1-foreground"
          tasks={by("q1")}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
        <Quadrant
          id="q2"
          label="Schedule"
          hint="Important · Not urgent"
          tone="bg-q2 text-q2-foreground"
          tasks={by("q2")}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
        <Quadrant
          id="q3"
          label="Delegate"
          hint="Urgent · Not important"
          tone="bg-q3 text-q3-foreground"
          tasks={by("q3")}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
        <Quadrant
          id="q4"
          label="Let go"
          hint="Not urgent · Not important"
          tone="bg-q4 text-q4-foreground"
          tasks={by("q4")}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>
    </section>
  );
}
