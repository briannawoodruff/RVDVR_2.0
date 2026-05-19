import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const quadrantStyle: Record<string, string> = {
  q1: "bg-q1 text-q1-foreground border-current/40",
  q2: "bg-q2 text-q2-foreground border-current/40",
  q3: "bg-q3 text-q3-foreground border-current/40",
  q4: "bg-q4 text-q4-foreground border-current/40",
};

interface Props {
  task: Task;
  /** Stable id used by the sortable context this card lives in. */
  dndId?: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  compact?: boolean;
}

// Stop drag-start when interacting with a control inside the card.
const stop = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation();

export function TaskCard({ task, dndId, onToggle, onDelete, onEdit, compact }: Props) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: dndId ?? task.id,
    data: { taskId: task.id },
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



  const accent = task.quadrant
    ? quadrantStyle[task.quadrant]
    : "bg-card border-l-primary/40";

  return (
    <div
      ref={setNodeRef}
      data-testid="task-card"
      data-task-id={task.id}
      data-completed={task.completed ? "true" : "false"}
      data-quadrant={task.quadrant ?? ""}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className={cn(
        "group relative flex items-center gap-2 rounded-xl border border-l-[5px] px-2.5 py-2 shadow-sm",
        "select-none",
        "hover:shadow-md hover:-translate-y-px transition-[box-shadow,transform]",
        accent,
        task.completed && "opacity-60",
        compact && "py-1.5 text-sm",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="Drag task"
        data-testid="task-drag-handle"
        className="touch-none cursor-grab rounded-md p-0.5 opacity-40 active:cursor-grabbing group-hover:opacity-70"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 shrink-0" />
      </button>

      <button
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        data-testid="task-toggle"
        onClick={(e) => {
          stop(e);
          onToggle(task.id);
        }}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          task.completed
            ? "border-current bg-current/20"
            : "border-current/40 hover:border-current",
        )}
      >
        {task.completed && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          data-testid="task-edit-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onPointerDown={stop}
          onClick={stop}
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
        <span
          data-testid="task-title"
          className={cn(
            "flex-1 text-left text-sm leading-snug",
            task.completed && "line-through",
          )}
        >
          {task.title}
        </span>
      )}



      <div className="flex items-center gap-0.5 opacity-60 transition-opacity hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            console.log("[TaskCard] edit click", task.id, "editing was", editing);
            setEditing(true);
          }}

          aria-label="Edit task"
          data-testid="task-edit"
          className="rounded-md p-1.5 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            stop(e);
            onDelete(task.id);
          }}
          aria-label="Delete task"
          data-testid="task-delete"
          className="rounded-md p-1.5 hover:bg-destructive/20 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function TaskCardOverlay({ task }: { task: Task }) {
  const accent = task.quadrant
    ? quadrantStyle[task.quadrant]
    : "bg-card border-l-primary/40";
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-l-[5px] px-2.5 py-2 shadow-xl ring-2 ring-primary/30",
        accent,
      )}
    >
      <GripVertical className="h-4 w-4 opacity-60" />
      <div className="h-5 w-5 rounded-full border-2 border-current/40" />
      <span className="text-sm">{task.title}</span>
    </div>
  );
}
