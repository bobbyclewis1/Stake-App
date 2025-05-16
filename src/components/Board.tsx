import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { supabase } from '../supabase/supabase';
import { List } from './List';
import { Card } from './Card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface BoardProps {
  boardId: string;
}

interface List {
  id: string;
  title: string;
  position: number;
  cards: Card[];
}

interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  list_id: string;
}

export function Board({ boardId }: BoardProps) {
  const [lists, setLists] = useState<List[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchLists();
    subscribeToChanges();
  }, [boardId]);

  const fetchLists = async () => {
    try {
      const { data: listsData, error: listsError } = await supabase
        .from('lists')
        .select('*')
        .eq('board_id', boardId)
        .order('position');

      if (listsError) throw listsError;

      const listsWithCards = await Promise.all(
        listsData.map(async (list) => {
          const { data: cardsData, error: cardsError } = await supabase
            .from('cards')
            .select('*')
            .eq('list_id', list.id)
            .order('position');

          if (cardsError) throw cardsError;

          return {
            ...list,
            cards: cardsData || [],
          };
        })
      );

      setLists(listsWithCards);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch board data',
        variant: 'destructive',
      });
    }
  };

  const subscribeToChanges = () => {
    const listsSubscription = supabase
      .channel('lists_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          fetchLists();
        }
      )
      .subscribe();

    const cardsSubscription = supabase
      .channel('cards_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
          filter: `list_id=in.(${lists.map((l) => l.id).join(',')})`,
        },
        () => {
          fetchLists();
        }
      )
      .subscribe();

    return () => {
      listsSubscription.unsubscribe();
      cardsSubscription.unsubscribe();
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveCard = active.data.current?.type === 'card';
    const isOverCard = over.data.current?.type === 'card';

    if (isActiveCard && isOverCard) {
      setLists((lists) => {
        const activeList = lists.find((list) =>
          list.cards.some((card) => card.id === activeId)
        );
        const overList = lists.find((list) =>
          list.cards.some((card) => card.id === overId)
        );

        if (!activeList || !overList) return lists;

        const activeIndex = activeList.cards.findIndex(
          (card) => card.id === activeId
        );
        const overIndex = overList.cards.findIndex(
          (card) => card.id === overId
        );

        const newLists = [...lists];
        const [removed] = newLists
          .find((list) => list.id === activeList.id)!
          .cards.splice(activeIndex, 1);
        newLists
          .find((list) => list.id === overList.id)!
          .cards.splice(overIndex, 0, removed);

        return newLists;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveList = active.data.current?.type === 'list';
    const isOverList = over.data.current?.type === 'list';

    if (isActiveList && isOverList) {
      setLists((lists) => {
        const activeIndex = lists.findIndex((list) => list.id === activeId);
        const overIndex = lists.findIndex((list) => list.id === overId);

        const newLists = arrayMove(lists, activeIndex, overIndex);
        return newLists.map((list, index) => ({
          ...list,
          position: index,
        }));
      });

      // Update positions in the database
      try {
        const { error } = await supabase
          .from('lists')
          .update({ position: lists.findIndex((l) => l.id === overId) })
          .eq('id', activeId);

        if (error) throw error;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update list position',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAddList = async () => {
    if (!newListTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('lists')
        .insert({
          title: newListTitle,
          board_id: boardId,
          position: lists.length,
        })
        .select()
        .single();

      if (error) throw error;

      setLists([...lists, { ...data, cards: [] }]);
      setNewListTitle('');
      setIsAddingList(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create new list',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 h-full overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 min-h-full">
          <SortableContext
            items={lists.map((list) => list.id)}
            strategy={verticalListSortingStrategy}
          >
            {lists.map((list) => (
              <List
                key={list.id}
                id={list.id}
                title={list.title}
                cards={list.cards}
                boardId={boardId}
              />
            ))}
          </SortableContext>

          {isAddingList ? (
            <div className="w-72 bg-gray-100 rounded-lg p-4">
              <Input
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Enter list title..."
                className="mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <Button onClick={handleAddList}>Add List</Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsAddingList(false);
                    setNewListTitle('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-72 h-12 flex items-center justify-center gap-2 border-2 border-dashed"
              onClick={() => setIsAddingList(true)}
            >
              <Plus className="h-4 w-4" />
              Add List
            </Button>
          )}
        </div>

        <DragOverlay>
          {activeId ? (
            lists.find((list) => list.id === activeId) ? (
              <List
                id={activeId}
                title={lists.find((list) => list.id === activeId)!.title}
                cards={[]}
                boardId={boardId}
                isDragging
              />
            ) : (
              <Card
                id={activeId}
                title={
                  lists
                    .find((list) =>
                      list.cards.some((card) => card.id === activeId)
                    )
                    ?.cards.find((card) => card.id === activeId)?.title || ''
                }
                description=""
                isDragging
              />
            )
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
} 