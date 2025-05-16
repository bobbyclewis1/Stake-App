import { useState, useEffect } from 'react'
import { useCardStore } from '../../lib/store'
import { useAuth } from '../../lib/auth'
import type { Database } from '../../lib/supabase'
import { uploadCardCover, deleteCardCover } from '../../lib/storage'
import { subscribeToComments, subscribeToCardUpdates } from '../../lib/realtime'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Calendar as CalendarIcon, Paperclip, Tag, User, MessageSquare, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '../../lib/utils'
import { CardComments } from './CardComments'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/use-toast'
import { BoardMembers } from './BoardMembers'

type Card = Database['public']['Tables']['cards']['Row']
type Comment = Database['public']['Tables']['comments']['Row']

interface CardDetailModalProps {
  card: Card
  isOpen: boolean
  onClose: () => void
}

const LABEL_COLORS = [
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Yellow', value: 'bg-yellow-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Purple', value: 'bg-purple-500' },
]

export function CardDetailModal({ card, isOpen, onClose }: CardDetailModalProps) {
  const { updateCard } = useCardStore()
  const { user } = useAuth()
  const { toast } = useToast()
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [dueDate, setDueDate] = useState<Date | undefined>(
    card.due_date ? new Date(card.due_date) : undefined
  )
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [activeTab, setActiveTab] = useState('details')
  const [currentUserRole, setCurrentUserRole] = useState<string>('member')

  useEffect(() => {
    if (isOpen) {
      // Fetch initial comments
      const fetchComments = async () => {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('card_id', card.id)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Failed to fetch comments:', error)
          return
        }
        
        setComments(data)
      }

      fetchComments()

      // Subscribe to real-time updates
      const commentsSubscription = subscribeToComments(
        card.id,
        (newComment) => {
          setComments((prev) => [newComment, ...prev])
        },
        (deletedCommentId) => {
          setComments((prev) => prev.filter((c) => c.id !== deletedCommentId))
        }
      )

      const cardSubscription = subscribeToCardUpdates(card.id, (updatedCard) => {
        setTitle(updatedCard.title)
        setDescription(updatedCard.description || '')
        setDueDate(updatedCard.due_date ? new Date(updatedCard.due_date) : undefined)
      })

      // Fetch current user's role
      const fetchUserRole = async () => {
        const { data, error } = await supabase
          .from('board_members')
          .select('role')
          .eq('board_id', card.board_id)
          .eq('user_id', user?.id)
          .single()

        if (error) {
          console.error('Failed to fetch user role:', error)
          return
        }

        setCurrentUserRole(data.role)
      }

      fetchUserRole()

      return () => {
        commentsSubscription.unsubscribe()
        cardSubscription.unsubscribe()
      }
    }
  }, [isOpen, card.id])

  const handleUpdateCard = async () => {
    try {
      await updateCard(card.id, {
        title,
        description,
        due_date: dueDate?.toISOString() || null,
      })
    } catch (error) {
      console.error('Failed to update card:', error)
      toast({
        title: 'Error',
        description: 'Failed to update card. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Delete old cover if exists
      if (card.cover_image) {
        await deleteCardCover(card.cover_image)
      }

      // Upload new cover
      const publicUrl = await uploadCardCover(card.id, file)
      
      await updateCard(card.id, {
        cover_image: publicUrl,
      })

      toast({
        title: 'Success',
        description: 'Cover image uploaded successfully.',
      })
    } catch (error) {
      console.error('Failed to upload file:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload cover image. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddComment = async (content: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            card_id: card.id,
            content,
            user_email: user?.email,
            user_avatar_url: user?.user_metadata?.avatar_url,
          },
        ])
        .select()
      
      if (error) throw error
      
      setComments((prev) => [data[0], ...prev])
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleDeleteCover = async () => {
    try {
      await deleteCardCover(card.cover_image)
      await updateCard(card.id, {
        cover_image: null,
      })
      toast({
        title: 'Success',
        description: 'Cover image removed successfully.',
      })
    } catch (error) {
      console.error('Failed to delete cover:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove cover image. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Card Details</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleUpdateCard}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleUpdateCard}
                    className="min-h-[200px]"
                  />
                </div>

                <div>
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !dueDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, 'PPP') : 'Set due date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={(date) => {
                          setDueDate(date)
                          handleUpdateCard()
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-4">
                <Tabs defaultValue="labels">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="labels">
                      <Tag className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="attachments">
                      <Paperclip className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="members">
                      <User className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="labels" className="space-y-2">
                    {LABEL_COLORS.map((color) => (
                      <Button
                        key={color.name}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedLabels((prev) =>
                            prev.includes(color.value)
                              ? prev.filter((c) => c !== color.value)
                              : [...prev, color.value]
                          )
                        }}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full mr-2',
                            color.value,
                            selectedLabels.includes(color.value) && 'ring-2 ring-offset-2'
                          )}
                        />
                        {color.name}
                      </Button>
                    ))}
                  </TabsContent>

                  <TabsContent value="attachments">
                    <div className="space-y-2">
                      <Label>Cover Image</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      {card.cover_image && (
                        <div className="relative aspect-video rounded-lg overflow-hidden group">
                          <img
                            src={card.cover_image}
                            alt="Cover"
                            className="object-cover w-full h-full"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleDeleteCover}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="members">
                    <div className="space-y-2">
                      <Label>Assign Members</Label>
                      {/* TODO: Implement member assignment */}
                      <p className="text-sm text-muted-foreground">
                        Member assignment coming soon...
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comments">
            <CardComments
              cardId={card.id}
              comments={comments}
              onAddComment={handleAddComment}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 