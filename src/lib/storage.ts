import { supabase } from './supabase'

export async function uploadCardCover(cardId: string, file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${cardId}/${Date.now()}.${fileExt}`
  const filePath = `card-covers/${fileName}`

  const { data, error } = await supabase.storage
    .from('card-attachments')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('card-attachments')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function deleteCardCover(url: string) {
  const path = url.split('/').pop()
  if (!path) return

  const { error } = await supabase.storage
    .from('card-attachments')
    .remove([`card-covers/${path}`])

  if (error) throw error
} 