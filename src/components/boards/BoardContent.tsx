import { useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useListStore, useCardStore } from '../../lib/store'
import type { Database } from '../../lib/supabase'
import { List } from './List'
import { Card } from './Card'
import { Button } from '../ui/button'
import { Plus } from 'lucide-react'
import { Input } from '../ui/input'
import { useToast } from '../ui/use-toast'

type Board = Database['public']['Tables']['boards']['Row']
type List = Database['public']['Tables']['lists']['Row']
type Card = Database['public']['Tables']['cards']['Row']

interface BoardContentProps {
  board: Board
}

export function BoardContent({ board }: BoardContentProps) {
  const { lists, fetchLists, createList, reorderLists } = useListStore()
  const { cards, fetchCards, moveCard } = useCardStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  useEffect(() => {
    fetchLists(board.id)
  }, [board.id, fetchLists])

  useEffect(() => {
    lists.forEach((list) => {
      fetchCards(list.id)
    })
  }, [lists, fetchCards])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    if (active.id !== over.id) {
      const oldIndex = lists.findIndex((list) => list.id === active.id)
      const newIndex = lists.findIndex((list) => list.id === over.id)

      const newLists = arrayMove(lists, oldIndex, newIndex)
      await reorderLists(newLists)
    }

    setActiveId(null)
  }

  const handleCreateList = async () => {
    if (!newListTitle.trim()) return

    try {
      await createList(newListTitle, board.id, lists.length)
      setNewListTitle('')
      setIsCreatingList(false)
      toast({
        title: 'List created',
        description: 'Your new list has been created successfully.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Board Header */}
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">{board.title}</h1>
        {board.description && (
          <p className="text-gray-500 mt-1">{board.description}</p>
        )}
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex space-x-4 h-full">
            <SortableContext
              items={lists.map((list) => list.id)}
              strategy={horizontalListSortingStrategy}
            >
              {lists.map((list) => (
                <List
                  key={list.id}
                  list={list}
                  cards={cards.filter((card) => card.list_id === list.id)}
                />
              ))}
            </SortableContext>

            {isCreatingList ? (
              <div className="w-72 bg-gray-100 rounded-lg p-4">
                <Input
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="Enter list title..."
                  className="mb-2"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Button onClick={handleCreateList}>Add List</Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsCreatingList(false)
                      setNewListTitle('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                className="w-72 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-500"
                onClick={() => setIsCreatingList(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add List
              </button>
            )}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="w-72 bg-white rounded-lg shadow-lg p-4">
                {lists.find((list) => list.id === activeId)?.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
} 