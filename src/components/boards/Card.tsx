import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCardStore } from '../../lib/store'
import type { Database } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { CardDetailModal } from './CardDetailModal'

type Card = Database['public']['Tables']['cards']['Row']

interface CardProps {
  card: Card
}

export function Card({ card }: CardProps) {
  const { updateCard } = useCardStore()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleUpdateTitle = async () => {
    if (title.trim() === card.title) {
      setIsEditing(false)
      return
    }

    try {
      await updateCard(card.id, { title: title.trim() })
      setIsEditing(false)
    } catch (error) {
      // Revert title on error
      setTitle(card.title)
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
        {...attributes}
        {...listeners}
      >
        {isEditing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUpdateTitle()
              } else if (e.key === 'Escape') {
                setTitle(card.title)
                setIsEditing(false)
              }
            }}
            autoFocus
          />
        ) : (
          <div
            className="cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <p className="text-sm">{card.title}</p>
            {card.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {card.description}
              </p>
            )}
            <div className="flex items-center space-x-2 mt-2">
              {card.due_date && (
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(card.due_date), 'MMM d')}
                </div>
              )}
              {card.cover_image && (
                <div className="h-16 -mx-3 -mt-3 mb-2 rounded-t-lg bg-cover bg-center"
                  style={{ backgroundImage: `url(${card.cover_image})` }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <CardDetailModal
        card={card}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
} 