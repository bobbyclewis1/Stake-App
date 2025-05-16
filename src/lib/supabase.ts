import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      boards: {
        Row: {
          id: string
          title: string
          description: string | null
          created_at: string
          updated_at: string
          owner_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          created_at?: string
          updated_at?: string
          owner_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          owner_id?: string
        }
      }
      lists: {
        Row: {
          id: string
          title: string
          position: number
          board_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          position: number
          board_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          position?: number
          board_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      cards: {
        Row: {
          id: string
          title: string
          description: string | null
          position: number
          list_id: string
          created_at: string
          updated_at: string
          due_date: string | null
          cover_image: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          position: number
          list_id: string
          created_at?: string
          updated_at?: string
          due_date?: string | null
          cover_image?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          position?: number
          list_id?: string
          created_at?: string
          updated_at?: string
          due_date?: string | null
          cover_image?: string | null
        }
      }
    }
  }
} 