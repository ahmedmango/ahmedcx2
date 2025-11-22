import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface Epigram {
  id?: number;
  text: string;
  thread_id: string;
  created_at?: string;
  title?: string;
}

interface SortableEpigramCardProps {
  epigram: Epigram;
  displayNumber: number;
  editingId: number | null;
  editText: string;
  editThreadId: string;
  editTitle: string;
  loading: boolean;
  onEdit: (epigram: Epigram) => void;
  onDelete: (id: number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  setEditText: (text: string) => void;
  setEditThreadId: (id: string) => void;
  setEditTitle: (title: string) => void;
}

export const SortableEpigramCard = ({
  epigram,
  displayNumber,
  editingId,
  editText,
  editThreadId,
  editTitle,
  loading,
  onEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  setEditText,
  setEditThreadId,
  setEditTitle,
}: SortableEpigramCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: epigram.id || 0 });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="overflow-hidden"
    >
      {editingId === epigram.id ? (
        <div className="p-6 space-y-4 bg-muted/20">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-muted-foreground">
              Editing #{String(displayNumber).padStart(4, '0')}
            </label>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">
              Thread ID
            </label>
            <Input
              value={editThreadId}
              onChange={(e) => setEditThreadId(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">
              Title <span className="text-xs">(Optional)</span>
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Optional title..."
              className="font-serif text-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">
              Text
            </label>
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={10}
              className="font-serif text-lg resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={onSaveEdit} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={onCancelEdit}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex items-center gap-3 flex-1">
              <button
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-5 w-5" />
              </button>
              <div className="text-xs text-muted-foreground">
                #{String(displayNumber).padStart(4, '0')} • Thread: {epigram.thread_id}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(epigram)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => epigram.id && onDelete(epigram.id)}
                disabled={loading}
              >
                Delete
              </Button>
            </div>
          </div>
          {epigram.title && (
            <h3 className="text-2xl font-bold mb-4 text-center">
              {epigram.title}
            </h3>
          )}
          <p className="text-lg leading-relaxed font-serif whitespace-pre-wrap">
            {epigram.text}
          </p>
        </div>
      )}
    </Card>
  );
};
