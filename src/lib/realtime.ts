import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from './supabase'

type Comment = Database['public']['Tables']['comments']['Row']

export function subscribeToComments(
  cardId: string,
  onComment: (comment: Comment) => void,
  onDelete: (commentId: string) => void
): RealtimeChannel {
  return supabase
    .channel(`comments:${cardId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `card_id=eq.${cardId}`,
      },
      (payload) => {
        onComment(payload.new as Comment)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'comments',
        filter: `card_id=eq.${cardId}`,
      },
      (payload) => {
        onDelete(payload.old.id)
      }
    )
    .subscribe()
}

export function subscribeToCardUpdates(
  cardId: string,
  onUpdate: (card: Database['public']['Tables']['cards']['Row']) => void
): RealtimeChannel {
  return supabase
    .channel(`card:${cardId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'cards',
        filter: `id=eq.${cardId}`,
      },
      (payload) => {
        onUpdate(payload.new as Database['public']['Tables']['cards']['Row'])
      }
    )
    .subscribe()
} 