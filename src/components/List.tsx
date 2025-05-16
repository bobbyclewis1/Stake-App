import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from './Card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus } from 'lucide-react';
import { supabase } from '../supabase/supabase';
import { useToast } from './ui/use-toast';

interface ListProps {
  id: string;
  title: string;
  cards: Array<{
    id: string;
    title: string;
    description?: string;
    position: number;
    list_id: string;
  }>;
  boardId: string;
  isDragging?: boolean;
}

export function List({ id, title, cards, boardId, isDragging }: ListProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const { toast } = useToast();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isListDragging,
  } = useSortable({
    id,
    data: {
      type: 'list',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isListDragging ? 0.5 : 1,
  };

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('cards')
        .insert({
          title: newCardTitle,
          list_id: id,
          position: cards.length,
        })
        .select()
        .single();

      if (error) throw error;

      setNewCardTitle('');
      setIsAddingCard(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create new card',
        variant: 'destructive',
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`w-72 bg-gray-100 rounded-lg p-4 flex flex-col ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsAddingCard(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-2">
        {cards.map((card) => (
          <Card
            key={card.id}
            id={card.id}
            title={card.title}
            description={card.description}
          />
        ))}

        {isAddingCard && (
          <div className="bg-white rounded-lg p-2">
            <Input
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Enter card title..."
              className="mb-2"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCard}>
                Add Card
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 