import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { supabase } from '../supabase/supabase';
import { useToast } from './ui/use-toast';

interface CardProps {
  id: string;
  title: string;
  description?: string;
  isDragging?: boolean;
}

export function Card({ id, title, description, isDragging }: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedDescription, setEditedDescription] = useState(description || '');
  const { toast } = useToast();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCardDragging,
  } = useSortable({
    id,
    data: {
      type: 'card',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCardDragging ? 0.5 : 1,
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('cards')
        .update({
          title: editedTitle,
          description: editedDescription,
        })
        .eq('id', id);

      if (error) throw error;

      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update card',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={`bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
            isDragging ? 'opacity-50' : ''
          }`}
        >
          <h4 className="font-medium">{title}</h4>
          {description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Card</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setIsEditing(false);
              setEditedTitle(title);
              setEditedDescription(description || '');
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 