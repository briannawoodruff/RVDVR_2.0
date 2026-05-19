import { useDraggable } from "@dnd-kit/core";
import { Check, GripVertical, Pencil, Trash2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const quadrantRing: Record<string, string> = {
  q1: "border-l-q1-foreground/60",
  q2: "border-l-q2-foreground/60",
  q3: "border-l-q3-foreground/60",
  q4: "border-l-q4-foreground/60",
};

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  compact?: boolean;
}

export function TaskCard({ task, onToggle, onDelete, onEdit, compact }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const t = draft.trim();
    if (t && t !== task.title) onEdit(task.id, t);
    setEditing(false);
  };

  const accent = task.quadrant ? quadrantRing[task.quadrant] : "border-l-border";

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.4 : 1,
      }}
      className={cn(
        "group relative flex items-center gap-2 rounded-xl border border-l-[3px] bg-card px-2.5 py-2 shadow-sm transition-all",
        "hover:shadow-md hover:-translate-y-px",
        accent,
        task.completed && "opacity-60",
        compact && "py-1.5 text-sm",
      )}
    >
      <button
        aria-label="Drag task"
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        onClick={() => onToggle(task.id)}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          task.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border hover:border-primary",
        )}
      >
        {task.completed && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(task.title);
              setEditing(false);
            }
          }}
          className="flex-1 bg-transparent text-sm outline-none"
        />
      ) : (
        <button
          onDoubleClick={() => setEditing(true)}
          className={cn(
            "flex-1 text-left text-sm leading-snug",
            task.completed && "line-through",
          )}
        >
          {task.title}
        </button>
      )}

      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          onClick={() => setEditing(true)}
          aria-label="Edit task"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-card px-2.5 py-2 shadow-lg ring-2 ring-primary/20">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <div className="h-5 w-5 rounded-full border-2 border-border" />
      <span className="text-sm">{task.title}</span>
    </div>
  );
}
