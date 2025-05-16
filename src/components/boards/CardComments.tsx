import { useState } from 'react'
import { useAuth } from '../../lib/auth'
import type { Database } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { format } from 'date-fns'

type Comment = Database['public']['Tables']['comments']['Row']

interface CardCommentsProps {
  cardId: string
  comments: Comment[]
  onAddComment: (content: string) => Promise<void>
}

export function CardComments({ cardId, comments, onAddComment }: CardCommentsProps) {
  const { user } = useAuth()
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onAddComment(newComment.trim())
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[100px]"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
          >
            Comment
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-3">
            <Avatar>
              <AvatarImage src={comment.user_avatar_url} />
              <AvatarFallback>
                {comment.user_email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">
                  {comment.user_email}
                </p>
                <span className="text-xs text-gray-500">
                  {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 