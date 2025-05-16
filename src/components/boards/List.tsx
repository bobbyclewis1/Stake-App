import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCardStore } from '../../lib/store'
import type { Database } from '../../lib/supabase'
import { Card } from './Card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Plus } from 'lucide-react'
import { useToast } from '../ui/use-toast'

type List = Database['public']['Tables']['lists']['Row']
type Card = Database['public']['Tables']['cards']['Row']

interface ListProps {
  list: List
  cards: Card[]
}

export function List({ list, cards }: ListProps) {
  const { createCard } = useCardStore()
  const [isCreatingCard, setIsCreatingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const { toast } = useToast()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleCreateCard = async () => {
    if (!newCardTitle.trim()) return

    try {
      await createCard(newCardTitle, list.id, cards.length)
      setNewCardTitle('')
      setIsCreatingCard(false)
      toast({
        title: 'Card created',
        description: 'Your new card has been created successfully.',
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
    <div
      ref={setNodeRef}
      style={style}
      className="w-72 bg-gray-100 rounded-lg p-4 flex flex-col"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{list.title}</h3>
        <span className="text-sm text-gray-500">{cards.length}</span>
      </div>

      <div className="flex-1 space-y-2 min-h-0 overflow-y-auto">
        {cards.map((card) => (
          <Card key={card.id} card={card} />
        ))}
      </div>

      {isCreatingCard ? (
        <div className="mt-4">
          <Input
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="Enter card title..."
            className="mb-2"
            autoFocus
          />
          <div className="flex space-x-2">
            <Button onClick={handleCreateCard}>Add Card</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreatingCard(false)
                setNewCardTitle('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="w-full justify-start mt-4"
          onClick={() => setIsCreatingCard(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      )}
    </div>
  )
} 